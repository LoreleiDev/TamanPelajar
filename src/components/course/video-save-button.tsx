"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleVideoBookmark } from "@/features/video/actions";

/** Tombol simpan video (H.2.6). */
export function VideoSaveButton({ videoId, bookmarked }: { videoId: string; bookmarked: boolean }) {
  const [saved, setSaved] = useState(bookmarked);
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      aria-pressed={saved}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleVideoBookmark({ videoId });
          if (!r.ok) return void toast.error(r.error);
          setSaved(r.data.bookmarked);
          toast.success(r.data.bookmarked ? "Video disimpan." : "Video dihapus dari simpanan.");
        })
      }
    >
      {saved ? <BookmarkCheck data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}
      {saved ? "Tersimpan" : "Simpan video"}
    </Button>
  );
}
