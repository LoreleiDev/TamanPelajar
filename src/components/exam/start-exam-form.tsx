"use client";

import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";
import { mulaiTryout } from "@/features/exam/actions";

/**
 * Persetujuan aturan + "Mulai Tryout" (I.2). Tamu melihat dialog masuk (C.5.3); server tetap
 * memeriksa paket, jadwal, dan batas percobaan saat percobaan dibuat.
 */
export function StartExamForm({ slug, title, guest }: { slug: string; title: string; guest: boolean }) {
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
  const [agree, setAgree] = useState(false);
  const [pending, startTransition] = useTransition();
  const id = useId();

  return (
    <form
      method="post"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (guest) return requireLogin(`Untuk mengerjakan ${title}, masuk ke akunmu.`);
        startTransition(async () => {
          const r = await mulaiTryout({ slug, agree });
          if (!r.ok) return void toast.error(r.error);
          router.push(`/ujian/${r.data.attemptId}`);
        });
      }}
    >
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-1 size-4.5 shrink-0 accent-primary"
        />
        <label htmlFor={id} className="leading-relaxed">
          Saya sudah membaca petunjuk dan bersedia mengikuti aturan tryout. Waktu mulai berjalan setelah tombol di bawah
          ditekan.
        </label>
      </div>
      <Button type="submit" size="lg" className="self-start" disabled={!agree || pending}>
        <PlayCircle aria-hidden="true" data-icon="inline-start" />
        {pending ? "Menyiapkan soal…" : "Mulai Tryout"}
      </Button>
    </form>
  );
}
