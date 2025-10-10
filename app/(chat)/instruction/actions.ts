"use server";

import { revalidatePath } from "next/cache";
import { writeInstructionFile } from "@/lib/instruction";

export async function saveInstructionPrompt({
  content,
}: {
  content: string;
}) {
  try {
    await writeInstructionFile(content);
    revalidatePath("/instruction");

    return {
      success: true as const,
      content,
      updatedAt: new Date().toISOString(),
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

