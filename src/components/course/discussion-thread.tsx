"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { initials } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";
import { postDiscussion } from "@/features/course/actions";
import { formatTanggalJam } from "@/lib/format";
import { cn } from "@/lib/utils";

type Author = { name: string; isAdmin: boolean; isMe: boolean };
export type DiscussionItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: Author;
  replies: { id: string; body: string; createdAt: Date; author: Author }[];
};

function Message({ author, body, createdAt, reply }: { author: Author; body: string; createdAt: Date; reply?: boolean }) {
  return (
    <div className={cn("flex gap-3", reply && "ml-6 border-l-2 border-leaf pl-4")}>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
          author.isAdmin ? "bg-primary text-white" : "bg-accent text-primary",
        )}
      >
        {initials(author.name)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-bold text-foreground">{author.isMe ? `${author.name} (kamu)` : author.name}</span>
          {author.isAdmin && <span className="font-semibold text-primary">Admin</span>}
          <time dateTime={new Date(createdAt).toISOString()} className="text-muted-foreground">
            {formatTanggalJam(new Date(createdAt))}
          </time>
        </p>
        <p className="leading-relaxed break-words whitespace-pre-line">{body}</p>
      </div>
    </div>
  );
}

/** Kolom diskusi per materi (G.2.7). Admin menjawab dari panel admin (L.2.8). */
export function DiscussionThread({ lessonId, items }: { lessonId: string; items: DiscussionItem[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <form
        method="post"
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const r = await postDiscussion({ lessonId, body });
            if (!r.ok) return setError(r.fieldErrors?.body ?? r.error);
            setError(undefined);
            setBody("");
            toast.success("Pertanyaan terkirim. Admin akan menjawab di sini.");
            router.refresh();
          });
        }}
      >
        <label htmlFor="diskusi" className="font-semibold">
          Tanyakan sesuatu tentang materi ini
        </label>
        <textarea
          id="diskusi"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={3}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "diskusi-error" : undefined}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        {error && (
          <p id="diskusi-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="self-start" disabled={pending || body.trim().length === 0}>
          {pending ? "Mengirim…" : "Kirim pertanyaan"}
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-muted-foreground">Belum ada pertanyaan di materi ini. Jadilah yang pertama bertanya.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {items.map((d) => (
            <li key={d.id} className="flex flex-col gap-4">
              <Message author={d.author} body={d.body} createdAt={d.createdAt} />
              {d.replies.map((r) => (
                <Message key={r.id} author={r.author} body={r.body} createdAt={r.createdAt} reply />
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
