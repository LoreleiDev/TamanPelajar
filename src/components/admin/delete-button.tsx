"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

/** Tombol hapus dengan konfirmasi (P.2.6), toast hasil, lalu pindah halaman atau muat ulang. */
export function DeleteButton({
  label,
  title,
  description,
  action,
  redirectTo,
  successMessage,
  size = "default",
}: {
  label: string;
  title: string;
  description: string;
  action: () => Promise<ActionResult<unknown>>;
  /** Tujuan setelah berhasil; tanpa ini halaman dimuat ulang. */
  redirectTo?: string;
  successMessage: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size={size} className="text-destructive hover:text-destructive">
          <Trash2 data-icon="inline-start" />
          {label}
        </Button>
      }
      title={title}
      description={description}
      confirmLabel={label}
      destructive
      onConfirm={async () => {
        const r = await action();
        if (!r.ok) return void toast.error(r.error);
        toast.success(successMessage);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      }}
    />
  );
}
