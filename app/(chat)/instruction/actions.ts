"use server";

import { revalidatePath } from "next/cache";
import {
  parseInstructionPrompt,
  writeInstructionFile,
} from "@/lib/instruction";

export async function saveInstructionPrompt({
  content,
}: {
  content: string;
}) {
  try {
    const parsed = parseInstructionPrompt(content);

    const updated = {
      ...parsed,
      generated_at: new Date().toISOString(),
    };

    const formatted = `${JSON.stringify(updated, null, 2)}\n`;

    await writeInstructionFile(formatted);
    revalidatePath("/instruction");

    return {
      success: true as const,
      content: formatted,
      updatedAt: updated.generated_at,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Tidak dapat menyimpan instruksi.";

    return {
      success: false as const,
      error: message,
    };
  }
}

