export const DEFAULT_CHAT_MODEL: string = "chat-model-llama-3_3-70b";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model-llama-3_3-70b",
    name: "Llama 3.3 70B (OpenRouter)",
    description:
      "Meta Llama 3.3 70B instruct model routed through OpenRouter",
  },
  {
    id: "chat-model-deepseek-v31",
    name: "DeepSeek V3.1 (OpenRouter)",
    description:
      "Latest DeepSeek general chat model with fast responses on OpenRouter",
  },
  {
    id: "chat-model-gemma-3n-e2b",
    name: "Gemma 3n 2B (OpenRouter)",
    description: "Efficient Google Gemma 3n chat tuned model via OpenRouter",
  },
  {
    id: "chat-model-gpt-oss-20b",
    name: "GPT-OSS 20B (OpenRouter)",
    description: "OpenAI community 20B parameter model served on OpenRouter",
  },
  {
    id: "chat-model-longcat-flash",
    name: "LongCat Flash Chat (OpenRouter)",
    description:
      "Meituan LongCat Flash model optimized for lightweight conversations",
  },
];
