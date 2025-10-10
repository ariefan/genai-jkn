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
  jumlah_iuran: number;
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

export function getBillingDataByParticipant(nomorPeserta: string): BillingRecord[] {
  const billingData = readBillingDataSync();
  return billingData.data_tagihan.filter(
    (record) => record.nomor_peserta === nomorPeserta
  );
}

export function formatBillingDataForPrompt(records: BillingRecord[]): string {
  if (records.length === 0) {
    return "Tidak ada data tagihan ditemukan untuk peserta ini.";
  }

  const firstRecord = records[0];

  // Format participant info
  let result = `Nama: ${firstRecord.nama_peserta}\nNomor Peserta: ${firstRecord.nomor_peserta}\nTanggal Lahir: ${firstRecord.tanggal_lahir}\nJenis Kelamin: ${firstRecord.jenis_kelamin}\nKota Domisili: ${firstRecord.kota_domisili}\n\n`;

  // Format billing records
  result += "Riwayat Tagihan:\n";
  records.forEach((record) => {
    const status = record.status_pembayaran === "lunas" ? "✅ LUNAS" : "❌ BELUM BAYAR";
    const paymentInfo = record.kanal_pembayaran
      ? ` (Dibayar via: ${record.kanal_pembayaran})`
      : record.tanggal_pembayaran
      ? ` (Dibayar: ${record.tanggal_pembayaran})`
      : "";

    result += `• ${record.bulan} ${record.tahun}: ${status} - Jatuh tempo: ${record.jatuh_tempo}, Jumlah: Rp${record.jumlah_iuran.toLocaleString("id-ID")}${paymentInfo}\n`;
  });

  // Summary
  const unpaidRecords = records.filter(r => r.status_pembayaran !== "lunas");
  const totalUnpaid = unpaidRecords.reduce((sum, r) => sum + r.jumlah_iuran, 0);

  if (unpaidRecords.length > 0) {
    result += `\n\n⚠️ PERHATIAN:\n`;
    result += `• Ada ${unpaidRecords.length} bulan belum dibayar\n`;
    result += `• Total tunggakan: Rp${totalUnpaid.toLocaleString("id-ID")}\n`;

    // Show next due date
    const nextDue = unpaidRecords
      .map(r => new Date(r.jatuh_tempo))
      .filter(d => d >= new Date())
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (nextDue) {
      result += `• Jatuh tempo terdekat: ${nextDue.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\n`;
    }
  } else {
    result += "\n\n✅ Semua tagihan telah lunas.";
  }

  return result;
}
