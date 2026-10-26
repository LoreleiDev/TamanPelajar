"use client";

import type { SweetAlertIcon } from "sweetalert2";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// SweetAlert2 bertema Taman Pelajar (P.2.6): dipakai untuk konfirmasi aksi berisiko dan
// pemberitahuan penting. Tombol memakai kelas yang sama dengan komponen Button agar tidak
// ada varian baru; tampilan popup diatur di globals.css (.swal2-*).

// SweetAlert2 (±80 KB) baru dimuat saat popup pertama dibuka, tidak ikut bundle awal halaman.
let loading: Promise<typeof import("sweetalert2").default> | null = null;
const loadSwal = () => (loading ??= import("sweetalert2").then((m) => m.default));
/** Muat SweetAlert lebih dulu (mis. saat tombol pemicu disorot) agar popup tidak tertunda. */
export const preloadAlert = () => void loadSwal();
const themed = async () => (await loadSwal()).mixin({ buttonsStyling: false, reverseButtons: true, focusCancel: false });

// customClass tidak digabung dalam oleh mixin, jadi selalu dibuat lengkap per popup.
const classes = (destructive: boolean) => ({
  popup: "tp-swal",
  title: "tp-swal-title",
  htmlContainer: "tp-swal-text",
  actions: "tp-swal-actions",
  confirmButton: cn(buttonVariants({ variant: "default", size: "lg" }), destructive && "tp-swal-danger"),
  cancelButton: cn(buttonVariants({ variant: "outline", size: "lg" })),
});

export interface ConfirmOptions {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: SweetAlertIcon;
  /** Dijalankan saat tombol konfirmasi ditekan; popup menampilkan loader sampai selesai. */
  onConfirm?: () => void | Promise<void>;
}

/**
 * SweetAlert menyimpan aria-hidden elemen lain saat dibuka lalu mengembalikannya saat
 * ditutup. Bila dibuka ketika menu dropdown Radix masih menutup, aria-hidden milik Radix ikut
 * dikembalikan dan header jadi tersembunyi dari pembaca layar. Tunggu menu benar-benar hilang.
 */
async function waitForMenusClosed(maxMs = 600) {
  const start = performance.now();
  while (document.querySelector("[data-radix-menu-content]") && performance.now() - start < maxMs) {
    await new Promise((r) => requestAnimationFrame(r));
  }
}

/** Popup konfirmasi. Mengembalikan true bila pengguna menekan tombol konfirmasi. */
export async function confirmAlert({
  title,
  text,
  confirmLabel,
  cancelLabel = "Batal",
  destructive = false,
  icon,
  onConfirm,
}: ConfirmOptions): Promise<boolean> {
  const [Swal] = await Promise.all([loadSwal(), waitForMenusClosed()]);
  const result = await (await themed()).fire({
    title,
    text,
    icon: icon ?? (destructive ? "warning" : "question"),
    showCancelButton: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    customClass: classes(destructive),
    showLoaderOnConfirm: Boolean(onConfirm),
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: onConfirm
      ? async () => {
          await onConfirm();
          return true;
        }
      : undefined,
  });
  return result.isConfirmed;
}

/** Pemberitahuan satu tombol untuk hasil penting (bukan pengganti toast biasa). */
export async function noticeAlert(title: string, text: string, icon: SweetAlertIcon = "success") {
  await (await themed()).fire({
    title,
    text,
    icon,
    confirmButtonText: "Mengerti",
    customClass: classes(false),
  });
}
