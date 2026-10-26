"use client";

import { Slot } from "radix-ui";
import type { ReactNode } from "react";

import { confirmAlert, preloadAlert } from "@/lib/alert";

/**
 * Konfirmasi sebelum aksi berisiko (P.2.6) lewat SweetAlert bertema brand (lib/alert.ts).
 * Tombol konfirmasi menyebut aksinya; popup menampilkan loader sampai onConfirm selesai.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Slot.Root
      aria-haspopup="dialog"
      onPointerEnter={preloadAlert}
      onFocus={preloadAlert}
      onClick={() => void confirmAlert({ title, text: description, confirmLabel, destructive, onConfirm })}
    >
      {trigger}
    </Slot.Root>
  );
}
