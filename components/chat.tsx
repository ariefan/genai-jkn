"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "@/components/chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";

function getCookieValue(cookieName: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split("=");
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const [chatError, setChatError] = useState<string | null>(null);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Clear error when user starts typing a new message
  useEffect(() => {
    if (input.trim() && chatError) {
      setChatError(null);
    }
  }, [input, chatError]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const selectedParticipantId = getCookieValue(
          "selected-participant-id"
        );

        return {
          body: {
            ...request.body,
            id: request.id,
            message: request.messages.at(-1),
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: visibilityType,
            selectedParticipantId: selectedParticipantId ?? undefined,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data);
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error("Chat error:", error);

      // Clear any previous error when new error occurs
      setChatError(null);

      if (error instanceof ChatSDKError) {
        if (error.surface === "activate_gateway") {
          setShowCreditCardAlert(true);
        } else {
          setChatError(error.message);
          toast({
            type: "error",
            description: error.message,
          });
        }
      } else {
        // Handle enhanced error types from fetchWithErrorHandlers
        let errorMessage = "An unexpected error occurred. Please try again.";

        // Check for custom error flags
        if ((error as any).isRateLimit) {
          errorMessage = "⚠️ **Rate Limit Exceeded**\n\nYou've reached the daily request limit for this AI model. Please switch to a different model using the dropdown selector above.\n\nAlternative models available:\n• DeepSeek V3.1 (recommended)\n• Gemma 3n 2B\n• GPT-OSS 20B\n• LongCat Flash Chat";
        } else if ((error as any).isServiceUnavailable) {
          errorMessage = "⚠️ **Service Unavailable**\n\nThe AI service is temporarily unavailable. Please try again in a few moments or switch to a different model.";
        } else if (error.message) {
          if (error.message.includes("Rate limit exceeded")) {
            errorMessage = "⚠️ **Rate Limit Exceeded**\n\nYou've reached the daily request limit for this AI model. Please switch to a different model using the dropdown selector above.\n\nAlternative models available:\n• DeepSeek V3.1 (recommended)\n• Gemma 3n 2B\n• GPT-OSS 20B\n• LongCat Flash Chat";
          } else if (error.message.includes("429")) {
            errorMessage = "⚠️ **Too Many Requests**\n\nPlease wait a moment before sending another message, or try switching to a different AI model.";
          } else if (error.message.includes("503")) {
            errorMessage = "⚠️ **Service Unavailable**\n\nThe AI service is temporarily unavailable. Please try again in a few moments or switch to a different model.";
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "⚠️ **Network Error**\n\nUnable to connect to the AI service. Please check your internet connection and try again.";
          } else {
            errorMessage = `⚠️ **Error**\n\n${error.message}`;
          }
        }

        setChatError(errorMessage);
        toast({
          type: "error",
          description: errorMessage.includes("**") ? errorMessage.replace(/\*\*/g, "") : errorMessage,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      // Clear any existing errors when sending a new message
      setChatError(null);
      sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: query }],
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={votes}
          chatError={chatError}
          onClearError={() => setChatError(null)}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={attachments}
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={setCurrentModelId}
              selectedModelId={currentModelId}
              selectedVisibilityType={visibilityType}
              sendMessage={sendMessage}
              setAttachments={setAttachments}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={stop}
              usage={usage}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={attachments}
        chatId={id}
        chatError={chatError}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        onClearError={() => setChatError(null)}
        regenerate={regenerate}
        selectedModelId={currentModelId}
        selectedVisibilityType={visibilityType}
        sendMessage={sendMessage}
        setAttachments={setAttachments}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={stop}
        votes={votes}
      />

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate OpenRouter</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              configure a valid OpenRouter API key and billing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://openrouter.ai/keys",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
