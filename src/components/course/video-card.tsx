import { CircleCheck, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";

import { TopicCover } from "@/components/shared/product-cover";
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
      <Link href={`/video/${video.slug}`} tabIndex={-1} aria-hidden="true" className="block">
        <TopicCover subject={video.subject}>
          {locked ? (
            <span className="absolute inset-0 grid place-items-center bg-foreground/40">
              <Lock className="size-9" aria-hidden="true" />
            </span>
          ) : (
            <PlayCircle
              className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 opacity-90 transition-transform duration-150 group-hover:scale-105"
              aria-hidden="true"
            />
          )}
          <span className="absolute right-2 bottom-2 rounded-md bg-background px-1.5 py-0.5 text-[0.8125rem] font-semibold text-foreground tabular-nums">
            {formatClock(video.durationSec)}
          </span>
          {video.progressPercent > 0 && (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
              <span className="block h-full bg-leaf" style={{ width: `${video.progressPercent}%` }} />
            </span>
          )}
        </TopicCover>
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
