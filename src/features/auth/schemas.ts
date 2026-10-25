import { z } from "zod";

// Skema Zod dipakai bersama oleh form (React Hook Form) dan server action (E.2, E.3.1–E.3.2).

export const EDUCATION_OPTIONS = [
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA/MA" },
  { value: "SMK", label: "SMK" },
  { value: "D3", label: "D3" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "UMUM", label: "Umum / sudah bekerja" },
] as const;

export const EXAM_TARGETS = [
  "UTBK/SNBT",
  "Seleksi Mandiri PTN",
  "SKD CPNS",
  "SKD Sekolah Kedinasan",
  "Tes BUMN",
  "Tes Potensi Akademik",
  "Tes Kompetensi",
] as const;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi")
  .pipe(z.email("Format email belum benar, contoh: nama@domain.com"));

const phone = z
  .string()
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi")
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor WhatsApp diawali 08 atau +628, 10–15 digit"));

export const passwordRule = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter")
  .regex(/[a-zA-Z]/, "Password harus memuat huruf")
  .regex(/\d/, "Password harus memuat angka");

const educationLevel = z.enum(["SMP", "SMA", "SMK", "D3", "S1", "S2", "UMUM"], {
  error: "Pilih jenjang pendidikan",
});
const examTarget = z.enum(EXAM_TARGETS, { error: "Pilih target ujian" });

export const daftarSchema = z
  .object({
    name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(80, "Nama terlalu panjang"),
    email,
    phone,
    password: passwordRule,
    confirmPassword: z.string().min(1, "Ulangi password"),
    educationLevel,
    examTarget,
    terms: z.literal(true, { error: "Centang persetujuan syarat dan ketentuan untuk melanjutkan" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const masukSchema = z.object({
  email,
  password: z.string().min(1, "Password wajib diisi"),
});

export const lupaPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Tautan reset tidak valid"),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Ulangi password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const lengkapiProfilSchema = z.object({
  phone,
  educationLevel,
  examTarget,
  school: z.string().trim().max(120, "Nama sekolah terlalu panjang").optional(),
  city: z.string().trim().max(80, "Nama kota terlalu panjang").optional(),
});

/** Aturan email dan WhatsApp dipakai ulang form admin. */
export { email as emailRule, phone as phoneRule };

export type DaftarInput = z.input<typeof daftarSchema>;
export type MasukInput = z.input<typeof masukSchema>;
export type LupaPasswordInput = z.input<typeof lupaPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type LengkapiProfilInput = z.input<typeof lengkapiProfilSchema>;

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** Indikator kekuatan password (E.3.3). Murni agar bisa diuji dan dipakai di client. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Belum diisi" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;
  if (password.length < 8) score = Math.min(score, 1);
  const labels = ["Sangat lemah", "Lemah", "Cukup", "Kuat", "Sangat kuat"];
  const s = Math.min(score, 4) as PasswordStrength["score"];
  return { score: s, label: labels[s] };
}
