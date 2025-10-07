import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type InstructionPrompt = {
  system: string;
  name?: string;
  generated_at?: string;
  few_shots?: unknown;
  [key: string]: unknown;
};

const INSTRUCTION_PROMPT_PATH = path.join(
  process.cwd(),
  "app/data/instruction-prompt.json"
);

export async function readInstructionFile() {
  return readFile(INSTRUCTION_PROMPT_PATH, "utf8");
}

export function readInstructionFileSync() {
  return readFileSync(INSTRUCTION_PROMPT_PATH, "utf8");
}

export async function writeInstructionFile(content: string) {
  await writeFile(INSTRUCTION_PROMPT_PATH, content, "utf8");
}

export function parseInstructionPrompt(content: string): InstructionPrompt {
  const parsed = JSON.parse(content) as unknown;

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Instruction prompt must be a JSON object.");
  }

  if (typeof (parsed as Record<string, unknown>).system !== "string") {
    throw new Error("Instruction prompt must include a `system` string.");
  }

  return parsed as InstructionPrompt;
}

export function loadInstructionSystemSync(): string | null {
  try {
    const raw = readInstructionFileSync();
    const parsed = parseInstructionPrompt(raw);
    return parsed.system;
  } catch (error) {
    console.warn("Unable to load instruction system prompt:", error);
    return null;
  }
}

