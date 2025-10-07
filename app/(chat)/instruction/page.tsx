import { Metadata } from "next";
import { formatInstructionTimestamp } from "@/lib/date-format";
import { parseInstructionPrompt, readInstructionFile } from "@/lib/instruction";
import { InstructionForm } from "./instruction-form";

export const metadata: Metadata = {
  title: "Instruction Editor",
  description: "Kelola instruksi dasar untuk chatbot.",
};

const FALLBACK_CONTENT = `{
  "system": "You are a friendly assistant!",
  "few_shots": []
}
`;

export default async function InstructionPage() {
  let initialValue = FALLBACK_CONTENT;
  let lastUpdatedAt: string | undefined;
  let lastUpdatedLabel: string | undefined;

  try {
    const raw = await readInstructionFile();
    initialValue = raw;

    try {
      const parsed = parseInstructionPrompt(raw);
      lastUpdatedAt = parsed.generated_at;
      if (lastUpdatedAt) {
        lastUpdatedLabel =
          formatInstructionTimestamp(lastUpdatedAt) ?? lastUpdatedAt;
      }
    } catch (error) {
      console.warn("Unable to parse instruction prompt metadata:", error);
    }
  } catch (error) {
    console.warn("Unable to read instruction prompt, using fallback:", error);
  }

  return (
    <div className="flex h-full flex-1 flex-col p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Instruction
          </h1>
          <p className="text-sm text-muted-foreground">
            Ubah isi berkas instruksi yang digunakan sebagai sistem prompt
            chatbot. Pastikan format JSON tetap valid sebelum menyimpan.
          </p>
        </div>

        <div className="flex flex-1 flex-col rounded-lg border bg-card p-4 shadow-sm">
          <InstructionForm
            initialValue={initialValue}
            lastUpdatedAt={lastUpdatedAt}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        </div>
      </div>
    </div>
  );
}

