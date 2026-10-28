"use client";

import { detectProvider } from "./video-schema";

// Durasi video otomatis di form admin (revisi RMED). Dibaca di browser dari penyedianya:
// YouTube lewat IFrame Player API (tanpa API key), Vimeo lewat oEmbed, berkas MP4/WebM lewat
// metadata elemen <video>. Mengembalikan null bila gagal; admin tetap bisa mengisi manual.

const TIMEOUT_MS = 12_000;

type YouTubePlayer = { getDuration(): number; destroy(): void };
type YouTubeNamespace = { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YouTubePlayer };
declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApi: Promise<YouTubeNamespace> | null = null;
function loadYouTubeApi() {
  ytApi ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      ytApi = null;
      reject(new Error("YouTube API gagal dimuat"));
    };
    document.head.appendChild(script);
  });
  return ytApi;
}

const youtubeId = (url: string) => url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/)?.[1] ?? null;

async function youtubeDuration(url: string): Promise<number | null> {
  const id = youtubeId(url);
  if (!id) return null;
  const YT = await loadYouTubeApi();
  // Player sementara di luar layar, dihapus lagi setelah durasi terbaca.
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:200px;height:120px;";
  const target = document.createElement("div");
  host.appendChild(target);
  document.body.appendChild(host);
  let player: YouTubePlayer | null = null;
  try {
    return await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), TIMEOUT_MS);
      player = new YT.Player(target, {
        videoId: id,
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          // getDuration kadang 0 sesaat setelah siap; coba beberapa kali.
          onReady: () => {
            let tries = 0;
            const poll = () => {
              const d = player?.getDuration() ?? 0;
              if (d > 0 || tries++ > 20) {
                clearTimeout(timer);
                resolve(d > 0 ? Math.round(d) : null);
              } else setTimeout(poll, 250);
            };
            poll();
          },
          onError: () => {
            clearTimeout(timer);
            resolve(null);
          },
        },
      });
    });
  } finally {
    try {
      (player as YouTubePlayer | null)?.destroy();
    } catch {
      // Player belum sempat dibuat.
    }
    host.remove();
  }
}

async function vimeoDuration(url: string): Promise<number | null> {
  const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;
  const data = (await res.json()) as { duration?: number };
  return data.duration && data.duration > 0 ? Math.round(data.duration) : null;
}

function fileDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const done = (v: number | null) => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(v);
    };
    const timer = setTimeout(() => done(null), TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

/** Durasi video dalam detik dari URL YouTube, Vimeo, atau berkas; null bila tidak terbaca. */
export async function detectVideoDuration(url: string): Promise<number | null> {
  try {
    const provider = detectProvider(url.trim());
    if (provider === "YOUTUBE") return await youtubeDuration(url.trim());
    if (provider === "VIMEO") return await vimeoDuration(url.trim());
    if (provider === "EKSTERNAL") return await fileDuration(url.trim());
    return null;
  } catch {
    return null;
  }
}
