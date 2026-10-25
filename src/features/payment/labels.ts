import type { StatusTone } from "@/components/shared/status-badge";

// Label dan nada status pesanan, dipakai detail transaksi dan tabel dashboard (K.3).
export type OrderStatusCode = "MENUNGGU" | "BERHASIL" | "GAGAL" | "KEDALUWARSA" | "DIKEMBALIKAN";

export const statusTone: Record<OrderStatusCode, StatusTone> = {
  MENUNGGU: "menunggu",
  BERHASIL: "berhasil",
  GAGAL: "gagal",
  KEDALUWARSA: "netral",
  DIKEMBALIKAN: "netral",
};

export const statusLabel: Record<OrderStatusCode, string> = {
  MENUNGGU: "Menunggu pembayaran",
  BERHASIL: "Berhasil",
  GAGAL: "Gagal",
  KEDALUWARSA: "Kedaluwarsa",
  DIKEMBALIKAN: "Dikembalikan",
};
