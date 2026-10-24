"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { saveProgress } from "@/features/course/actions";
import { formatClock } from "@/lib/format";

type Video = { provider: "YOUTUBE" | "VIMEO" | "EKSTERNAL"; url: string; durationSec: number };

const SAVE_EVERY_SEC = 15;

function embedUrl(video: Video, startSec: number) {
  if (video.provider === "YOUTUBE") {
    const id = video.url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/)?.[1] ?? "";
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&start=${startSec}`;
  }
  const id = video.url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? "";
  return `https://player.vimeo.com/video/${id}#t=${startSec}s`;
}

/**
 * Pemutar video materi (G.2.1, H.2.1): melanjutkan dari posisi terakhir (G.4.2) dan
 * menyimpan posisi serta waktu tonton secara berkala (G.4.1). Video YouTube/Vimeo
 * diputar lewat embed; progresnya ditandai manual dengan tombol selesai.
 */
export function VideoPlayer({
  lessonId,
  title,
  video,
  initialPositionSec,
}: {
  lessonId: string;
  title: string;
  video: Video;
  initialPositionSec: number;
}) {
  const router = useRouter();
  const ref = useRef<HTMLVideoElement>(null);
  const watched = useRef(0);
  const lastTime = useRef(initialPositionSec);
  const sinceSave = useRef(0);
  const [resumeFrom] = useState(initialPositionSec > 5 && initialPositionSec < video.durationSec - 5 ? initialPositionSec : 0);

  const flush = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    const delta = Math.min(120, Math.round(watched.current));
    watched.current -= delta;
    sinceSave.current = 0;
    const result = await saveProgress({ lessonId, positionSec: Math.floor(el.currentTime), watchedDeltaSec: delta });
    if (result.ok && result.data.certificate) {
      toast.success("Semua materi selesai. Sertifikatmu sudah terbit.");
    }
    if (result.ok && result.data.completed) router.refresh();
  }, [lessonId, router]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  if (video.provider !== "EKSTERNAL") {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-foreground">
        <iframe
          src={embedUrl(video, Math.floor(resumeFrom))}
          title={title}
          className="size-full"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <video
        ref={ref}
        src={video.url}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-foreground"
        aria-label={`Video: ${title}`}
        onLoadedMetadata={(e) => {
          if (resumeFrom) e.currentTarget.currentTime = resumeFrom;
          lastTime.current = resumeFrom;
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          const step = t - lastTime.current;
          lastTime.current = t;
          // Hanya hitung tontonan maju yang wajar, bukan lompatan seek.
          if (step > 0 && step < 2 && !e.currentTarget.paused) {
            watched.current += step;
            sinceSave.current += step;
            if (sinceSave.current >= SAVE_EVERY_SEC) void flush();
          }
        }}
        onPause={() => void flush()}
        onEnded={() => void flush()}
      >
        <track kind="captions" />
      </video>
      {resumeFrom > 0 && (
        <p className="text-sm text-muted-foreground">
          Dilanjutkan dari menit <span className="tabular-nums">{formatClock(resumeFrom)}</span>, posisi terakhir yang kamu tonton.
        </p>
      )}
    </div>
  );
}
