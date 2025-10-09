import { createOpenAI } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const openRouterHeaders: Record<string, string> = {};

if (process.env.OPENROUTER_SITE_URL) {
  openRouterHeaders["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
}

if (process.env.OPENROUTER_SITE_NAME) {
  openRouterHeaders["X-Title"] = process.env.OPENROUTER_SITE_NAME;
}

const openRouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  name: "openrouter",
  headers: openRouterHeaders,
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": openRouter.chat("mistralai/mistral-7b-instruct:deepinfra/bf16"),
        "chat-model-reasoning": wrapLanguageModel({
          model: openRouter.chat("deepseek/deepseek-reasoner"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": openRouter.chat(
          "mistralai/mistral-7b-instruct:deepinfra/bf16"
        ),
        "artifact-model": openRouter.chat("openai/gpt-4.1-mini"),
        "chat-model-mistral-7b":
          openRouter.chat("mistralai/mistral-7b-instruct:deepinfra/bf16"),
        "chat-model-gemma-3n-e2b":
          openRouter.chat("google/gemma-3n-e2b-it"),
        "chat-model-gpt-oss-20b":
          openRouter.chat("openai/gpt-oss-20b"),
        "chat-model-deepseek-v31":
          openRouter.chat("deepseek/deepseek-chat-v3.1"),
        "chat-model-longcat-flash":
          openRouter.chat("meituan/longcat-flash-chat"),
        "chat-model-llama-3_3-70b":
          openRouter.chat("meta-llama/llama-3.3-70b-instruct"),
      },
    });
