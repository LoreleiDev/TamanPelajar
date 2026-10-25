"use client";

import { Bookmark, BookmarkCheck, CircleCheck, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markComplete, toggleBookmark } from "@/features/course/actions";

/** Tandai selesai (G.2.5) dan simpan materi (G.4.8). */
export function LessonActions({
  lessonId,
  completed,
  bookmarked,
}: {
  lessonId: string;
  completed: boolean;
  bookmarked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(bookmarked);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={completed ? "secondary" : "default"}
        disabled={pending}
        aria-pressed={completed}
        onClick={() =>
          startTransition(async () => {
            const r = await markComplete({ lessonId, completed: !completed });
            if (!r.ok) return void toast.error(r.error);
            toast.success(completed ? "Tanda selesai dibatalkan." : "Materi ditandai selesai.");
            if (r.data.courseDone) toast.success("Semua materi selesai. Cek syarat sertifikat di panel kelas.");
            router.refresh();
          })
        }
      >
        {completed ? <CircleCheck data-icon="inline-start" /> : <Circle data-icon="inline-start" />}
        {completed ? "Sudah selesai" : "Tandai selesai"}
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        aria-pressed={saved}
        onClick={() =>
          startTransition(async () => {
            const r = await toggleBookmark({ lessonId });
            if (!r.ok) return void toast.error(r.error);
            setSaved(r.data.bookmarked);
            toast.success(r.data.bookmarked ? "Materi disimpan ke daftar simpanan." : "Materi dihapus dari simpanan.");
          })
        }
      >
        {saved ? <BookmarkCheck data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}
        {saved ? "Tersimpan" : "Simpan materi"}
      </Button>
    </div>
  );
}
