"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { balasDiskusi, hapusDiskusi } from "@/features/admin/discussion-actions";

/** Form balasan admin untuk satu diskusi (L.2.8). */
export function DiscussionReplyForm({ discussionId }: { discussionId: string }) {
  const router = useRouter();
  const id = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(undefined);
          const r = await balasDiskusi({ discussionId, body });
          if (!r.ok) return setError(r.fieldErrors?.body ?? r.error);
          toast.success("Balasan terkirim. Siswa mendapat notifikasi.");
          setBody("");
          router.refresh();
        });
      }}
    >
      <label htmlFor={id} className="text-sm font-semibold">
        Balasan admin
      </label>
      <Textarea id={id} rows={3} value={body} onChange={(e) => setBody(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending || body.trim().length < 3} className="self-start">
        {pending ? "Mengirim…" : "Kirim balasan"}
      </Button>
    </form>
  );
}

export function DeleteDiscussionButton({ id, kind }: { id: string; kind: "diskusi" | "balasan" }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
          <Trash2 data-icon="inline-start" />
          Hapus{kind === "balasan" ? " balasan" : ""}
        </Button>
      }
      title={kind === "diskusi" ? "Hapus diskusi ini?" : "Hapus balasan ini?"}
      description={kind === "diskusi" ? "Pertanyaan beserta semua balasannya dihapus permanen." : "Balasan dihapus permanen."}
      confirmLabel="Hapus"
      destructive
      onConfirm={async () => {
        const r = await hapusDiskusi({ id, kind });
        if (!r.ok) return void toast.error(r.error);
        toast.success(kind === "diskusi" ? "Diskusi dihapus." : "Balasan dihapus.");
        router.refresh();
      }}
    />
  );
}
