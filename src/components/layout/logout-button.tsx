"use client";

import { Slot } from "radix-ui";
import type { ReactNode } from "react";

import { keluar } from "@/features/auth/actions";
import { confirmAlert } from "@/lib/alert";

/**
 * Membungkus tombol "Keluar": minta konfirmasi lewat SweetAlert, lalu jalankan signOut di
 * server. Popup langsung ditutup saat disetujui, tanpa loader.
 */
export function LogoutButton({ children }: { children: ReactNode }) {
  return (
    <Slot.Root
      onClick={async () => {
        // Tidak memanggil preventDefault agar menu dropdown menutup seperti biasa saat item dipilih.
        const ok = await confirmAlert({
          title: "Keluar dari akun?",
          text: "Progres belajar dan jawaban tryout tetap tersimpan. Kamu bisa masuk lagi kapan saja.",
          confirmLabel: "Ya, keluar",
          icon: "question",
        });
        if (ok) await keluar();
      }}
    >
      {children}
    </Slot.Root>
  );
}
