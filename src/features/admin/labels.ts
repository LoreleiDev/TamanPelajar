import type { StatusTone } from "@/components/shared/status-badge";

// Label tampilan panel admin.

export const roleLabel = { ADMIN: "Administrator", USER: "Siswa" } as const;

export const publishLabel = { DRAF: "Draf", TERBIT: "Terbit", ARSIP: "Arsip" } as const;
export const publishTone: Record<keyof typeof publishLabel, StatusTone> = { DRAF: "menunggu", TERBIT: "berhasil", ARSIP: "netral" };

export const enrollmentLabel = { AKTIF: "Aktif", KEDALUWARSA: "Kedaluwarsa", DIBATALKAN: "Dibatalkan" } as const;
export const enrollmentTone: Record<keyof typeof enrollmentLabel, StatusTone> = { AKTIF: "berhasil", KEDALUWARSA: "netral", DIBATALKAN: "gagal" };

export const attemptLabel = { BERLANGSUNG: "Berlangsung", SELESAI: "Selesai", KEDALUWARSA: "Kedaluwarsa" } as const;
