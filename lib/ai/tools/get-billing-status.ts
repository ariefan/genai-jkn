import { tool } from "ai";
import { z } from "zod";
import {
  readBillingData,
  type BillingRecord,
} from "@/lib/billing";

type CreateGetBillingStatusToolParams = {
  selectedParticipantId: string | null;
};

const inputSchema = z.object({
  nomorPeserta: z.string().optional(),
  bulan: z.string().optional(),
  tahun: z.number().optional(),
});

function filterByBulan(records: BillingRecord[], bulan?: string | null) {
  if (!bulan) {
    return records;
  }

  const normalized = bulan.toLowerCase();
  return records.filter(
    (record) => record.bulan.toLowerCase() === normalized
  );
}

function filterByTahun(records: BillingRecord[], tahun?: number | null) {
  if (tahun === undefined || tahun === null) {
    return records;
  }

  return records.filter((record) => record.tahun === tahun);
}

export function createGetBillingStatusTool(
  params: CreateGetBillingStatusToolParams
) {
  const { selectedParticipantId } = params;

  return tool({
    description:
      "Mengambil riwayat tagihan BPJS Kesehatan untuk peserta yang dipilih.",
    inputSchema,
    execute: async ({ nomorPeserta, bulan, tahun }) => {
      const billingData = await readBillingData();

      const targetParticipantId =
        nomorPeserta ?? selectedParticipantId ?? null;

      if (!targetParticipantId) {
        return {
          status: "error",
          message:
            "Peserta belum dipilih. Mohon pilih nama peserta terlebih dahulu.",
        };
      }

      const participantRecords = billingData.data_tagihan.filter(
        (record) => record.nomor_peserta === targetParticipantId
      );

      if (participantRecords.length === 0) {
        return {
          status: "not_found",
          nomorPeserta: targetParticipantId,
          message: "Tidak ditemukan data tagihan untuk peserta tersebut.",
        };
      }

      const [firstRecord] = participantRecords;

      const filteredByBulan = filterByBulan(participantRecords, bulan);
      const filteredRecords = filterByTahun(filteredByBulan, tahun);

      const riwayatTagihan = filteredRecords.map((record) => ({
        bulan: record.bulan,
        tahun: record.tahun,
        jatuhTempo: record.jatuh_tempo,
        mulaiDenda: record.mulai_denda,
        statusPembayaran: record.status_pembayaran,
        tanggalPembayaran: record.tanggal_pembayaran,
        kanalPembayaran: record.kanal_pembayaran,
      }));

      const totalLunas = participantRecords.filter(
        (record) => record.status_pembayaran === "lunas"
      ).length;
      const totalBelumBayar = participantRecords.length - totalLunas;

      return {
        status: "ok",
        peserta: {
          nomorPeserta: firstRecord.nomor_peserta,
          namaPeserta: firstRecord.nama_peserta,
          tanggalLahir: firstRecord.tanggal_lahir,
          jenisKelamin: firstRecord.jenis_kelamin,
          kotaDomisili: firstRecord.kota_domisili,
        },
        ringkasan: {
          totalTagihan: participantRecords.length,
          totalLunas,
          totalBelumBayar,
          filterBulan: bulan ?? null,
          filterTahun: tahun ?? null,
        },
        riwayatTagihan,
      };
    },
  });
}

