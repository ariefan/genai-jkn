import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 10000,
    availableChatModelIds: [
      "chat-model",
      "chat-model-reasoning",
      "chat-model-mistral-7b",
      "chat-model-gemma-3n-e2b",
      "chat-model-gpt-oss-20b",
      "chat-model-deepseek-v31",
      "chat-model-longcat-flash",
      "chat-model-llama-3_3-70b",
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 10000,
    availableChatModelIds: [
      "chat-model",
      "chat-model-reasoning",
      "chat-model-mistral-7b",
      "chat-model-gemma-3n-e2b",
      "chat-model-gpt-oss-20b",
      "chat-model-deepseek-v31",
      "chat-model-longcat-flash",
      "chat-model-llama-3_3-70b",
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
