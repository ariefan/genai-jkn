"use server";

import { revalidatePath } from "next/cache";
import {
  parseBillingData,
  writeBillingFile,
} from "@/lib/billing";

export async function saveBillingData({
  content,
}: {
  content: string;
}) {
  try {
    const parsed = parseBillingData(content);
    const formatted = `${JSON.stringify(parsed, null, 2)}\n`;

    await writeBillingFile(formatted);
    const updatedAt = new Date().toISOString();

    revalidatePath("/data-peserta");
    revalidatePath("/api/participants");

    return {
      success: true as const,
      content: formatted,
      updatedAt,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Tidak dapat menyimpan data peserta.";

    return {
      success: false as const,
      error: message,
    };
  }
}

