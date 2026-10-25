import { z } from "zod";

import { isDriveUrl } from "./rules";

// Skema bersama client/server untuk sertifikat, batch, dan tugas praktik (tanpa Prisma).

export const submitPracticalSchema = z.object({
  courseId: z.string().min(1),
  driveUrl: z
    .string()
    .trim()
    .max(500, "Link terlalu panjang")
    .refine(isDriveUrl, "Masukkan link Google Drive atau Google Docs yang diawali https://"),
  note: z.string().trim().max(1000, "Catatan maksimal 1.000 karakter").optional(),
});
export type SubmitPracticalInput = z.input<typeof submitPracticalSchema>;

export const REVIEW_DECISIONS = ["SETUJUI", "REVISI", "TOLAK"] as const;
export const reviewPracticalSchema = z
  .object({
    submissionId: z.string().min(1),
    decision: z.enum(REVIEW_DECISIONS),
    note: z.string().trim().max(2000, "Catatan maksimal 2.000 karakter").optional(),
  })
  .refine((v) => v.decision === "SETUJUI" || (v.note ?? "").length >= 5, {
    path: ["note"],
    message: "Tulis alasan minimal 5 karakter agar siswa tahu yang perlu diperbaiki",
  });
export type ReviewPracticalInput = z.input<typeof reviewPracticalSchema>;

const dateField = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} wajib diisi`);

/** Tanggal batch dalam WIB: mulai 00.00, selesai 23.59. */
export const batchSchema = z
  .object({
    id: z.string().optional(),
    courseId: z.string().min(1),
    name: z.string().trim().min(3, "Nama batch minimal 3 karakter").max(80, "Nama batch terlalu panjang"),
    startsOn: dateField("Tanggal mulai"),
    endsOn: dateField("Tanggal selesai"),
  })
  .refine((v) => v.endsOn > v.startsOn, { path: ["endsOn"], message: "Tanggal selesai harus setelah tanggal mulai" });
export type BatchInput = z.input<typeof batchSchema>;

export const certificateSettingsSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(120, "Judul terlalu panjang"),
  minScore: z.coerce.number({ error: "Nilai minimal harus angka" }).int("Nilai minimal harus bilangan bulat").min(0, "Minimal 0").max(100, "Maksimal 100"),
  practicalInstructions: z.string().trim().max(5000, "Instruksi maksimal 5.000 karakter"),
  practicalTemplateId: z.string().nullable(),
});
export type CertificateSettingsInput = z.input<typeof certificateSettingsSchema>;

export const participantStatusLabel = {
  BERJALAN: "Sedang belajar",
  MENUNGGU_PENILAIAN: "Menunggu penilaian",
  REVISI: "Perlu revisi",
  LULUS: "Lulus",
  GAGAL: "Belum lulus",
} as const;

export const submissionStatusLabel = {
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  REVISI: "Diminta revisi",
  DITOLAK: "Ditolak",
} as const;
