import { promises as fs } from "node:fs";
import path from "node:path";
import { Metadata } from "next";
import { formatInstructionTimestamp } from "@/lib/date-format";
import { parseBillingData, readBillingFile } from "@/lib/billing";
import { DataPesertaForm } from "./data-form";

export const metadata: Metadata = {
  title: "Data Peserta",
  description: "Kelola data peserta berdasarkan catatan tagihan.",
};

const FALLBACK_CONTENT = `{
  "data_tagihan": []
}
`;

export default async function DataPesertaPage() {
  let initialValue = FALLBACK_CONTENT;
  let lastUpdatedAt: string | undefined;
  let lastUpdatedLabel: string | undefined;

  try {
    const raw = await readBillingFile();
    parseBillingData(raw);
    initialValue = raw;

    try {
      const filePath = path.join(
        process.cwd(),
        "app/data/billing-data.json"
      );
      const stats = await fs.stat(filePath);
      lastUpdatedAt = stats.mtime.toISOString();
      lastUpdatedLabel =
        formatInstructionTimestamp(lastUpdatedAt) ?? lastUpdatedAt;
    } catch (statError) {
      console.warn("Unable to read billing data metadata:", statError);
    }
  } catch (error) {
    console.warn("Unable to load billing data:", error);
  }

  return (
    <div className="flex h-full flex-1 flex-col p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Data Peserta
          </h1>
          <p className="text-sm text-muted-foreground">
            Edit berkas billing-data.json yang menyimpan catatan tagihan
            peserta BPJS Kesehatan. Pastikan format JSON tetap valid sebelum
            menyimpan.
          </p>
        </div>

        <div className="flex flex-1 flex-col rounded-lg border bg-card p-4 shadow-sm">
          <DataPesertaForm
            initialValue={initialValue}
            lastUpdatedAt={lastUpdatedAt}
            lastUpdatedLabel={lastUpdatedLabel}
          />
        </div>
      </div>
    </div>
  );
}
