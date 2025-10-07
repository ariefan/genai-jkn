import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BILLING_DATA_PATH = path.join(
  process.cwd(),
  "app/data/billing-data.json"
);

export type BillingRecord = {
  nomor_peserta: string;
  nama_peserta: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  kota_domisili: string;
  bulan: string;
  tahun: number;
  jatuh_tempo: string;
  mulai_denda: string;
  status_pembayaran: string;
  tanggal_pembayaran: string | null;
  kanal_pembayaran: string | null;
};

export type BillingData = {
  data_tagihan: BillingRecord[];
};

export async function readBillingFile(): Promise<string> {
  return readFile(BILLING_DATA_PATH, "utf8");
}

export function readBillingFileSync(): string {
  return readFileSync(BILLING_DATA_PATH, "utf8");
}

export async function readBillingData(): Promise<BillingData> {
  const raw = await readBillingFile();
  return parseBillingData(raw);
}

export function readBillingDataSync(): BillingData {
  const raw = readBillingFileSync();
  return parseBillingData(raw);
}

export function parseBillingData(raw: string): BillingData {
  const parsed = JSON.parse(raw) as unknown;

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { data_tagihan?: unknown }).data_tagihan)
  ) {
    throw new Error("Struktur data_tagihan tidak valid.");
  }

  return parsed as BillingData;
}

export async function writeBillingFile(content: string): Promise<void> {
  await writeFile(BILLING_DATA_PATH, content, "utf8");
}

export type ParticipantSummary = {
  nomorPeserta: string;
  namaPeserta: string;
  tanggalLahir: string;
  jenisKelamin: string;
  kotaDomisili: string;
};

export function getParticipantSummaries(
  billingData: BillingData
): ParticipantSummary[] {
  const seen = new Map<string, ParticipantSummary>();

  for (const record of billingData.data_tagihan) {
    if (seen.has(record.nomor_peserta)) {
      continue;
    }

    seen.set(record.nomor_peserta, {
      nomorPeserta: record.nomor_peserta,
      namaPeserta: record.nama_peserta,
      tanggalLahir: record.tanggal_lahir,
      jenisKelamin: record.jenis_kelamin,
      kotaDomisili: record.kota_domisili,
    });
  }

  return Array.from(seen.values()).sort((a, b) =>
    a.namaPeserta.localeCompare(b.namaPeserta, "id-ID")
  );
}
