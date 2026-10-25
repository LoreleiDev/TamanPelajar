import type { StatusTone } from "@/components/shared/status-badge";
import { formatRupiah } from "@/lib/format";

import type { VoucherState } from "./schemas";

export const voucherStateView: Record<VoucherState, { label: string; tone: StatusTone }> = {
  aktif: { label: "Aktif", tone: "berhasil" },
  nonaktif: { label: "Nonaktif", tone: "netral" },
  "belum-mulai": { label: "Belum mulai", tone: "menunggu" },
  berakhir: { label: "Berakhir", tone: "netral" },
  "kuota-habis": { label: "Kuota habis", tone: "gagal" },
};

export const discountText = (v: { discountType: "PERSEN" | "NOMINAL"; value: number; maxDiscount: number | null }) =>
  v.discountType === "PERSEN" ? `${v.value}%${v.maxDiscount ? `, maks. ${formatRupiah(v.maxDiscount)}` : ""}` : formatRupiah(v.value);
