import { CircleCheck, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";

import type { VideoCardData } from "@/features/video/queries";
import { DIFFICULTY_LABELS } from "@/features/video/schemas";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Kartu video di pustaka (H.1): durasi, tingkat kesulitan, status tonton, gembok. */
export function VideoCard({ video }: { video: VideoCardData }) {
  // Tamu juga melihat gembok untuk video dari bab berbayar, bukan hanya pengguna tanpa langganan.
  const locked = video.access === "perlu-langganan" || (video.access === "perlu-masuk" && !video.free);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border transition-colors duration-150 hover:border-primary/40">
      <Link href={`/video/${video.slug}`} tabIndex={-1} aria-hidden="true" className="relative grid aspect-video place-items-center bg-secondary">
        {locked ? (
          <Lock className="size-10 text-muted-foreground" aria-hidden="true" />
        ) : (
          <PlayCircle className="size-12 text-primary transition-transform duration-150 group-hover:scale-105" aria-hidden="true" />
        )}
        <span className="absolute right-2 bottom-2 rounded-md bg-foreground px-1.5 py-0.5 text-[0.8125rem] font-semibold text-white tabular-nums">
          {formatClock(video.durationSec)}
        </span>
        {video.progressPercent > 0 && (
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-muted">
            <span className="block h-full bg-leaf" style={{ width: `${video.progressPercent}%` }} />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">{video.subject}</span>, {DIFFICULTY_LABELS[video.difficulty].toLowerCase()}
        </p>
        <h2 className="text-base leading-snug font-bold">
          <Link href={`/video/${video.slug}`} className="hover:text-primary">
            {video.title}
          </Link>
        </h2>
        <p className={cn("mt-auto flex items-center gap-1.5 pt-1 text-sm", video.watched ? "text-success" : "text-muted-foreground")}>
          {video.watched ? (
            <>
              <CircleCheck className="size-4" aria-hidden="true" />
              Sudah ditonton
            </>
          ) : locked ? (
            <>
              <Lock className="size-4" aria-hidden="true" />
              Untuk pelanggan
            </>
          ) : video.progressPercent > 0 ? (
            <span className="tabular-nums">{video.progressPercent}% ditonton</span>
          ) : video.free ? (
            <span className="font-semibold text-primary">Gratis setelah masuk</span>
          ) : (
            "Belum ditonton"
          )}
        </p>
      </div>
    </article>
  );
}
