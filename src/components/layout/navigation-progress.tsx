"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Bar loading tipis di atas layar saat pindah halaman, dengan tunas kecil di ujungnya yang
// "tumbuh" bersama bar. App Router tidak punya event navigasi, jadi bar dimulai saat tautan
// internal diklik dan diselesaikan saat path atau query berubah.

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selesai: halaman baru sudah dirender.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reaksi terhadap perubahan rute
    setProgress((p) => (p === null ? null : 100));
    const done = setTimeout(() => setProgress(null), 250);
    return () => clearTimeout(done);
  }, [pathname, searchParams]);

  // Mulai: klik tautan internal ke halaman lain.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setProgress(8);
      if (timer.current) clearInterval(timer.current);
      // Mendekati 90% secara melambat sampai halaman baru tiba.
      timer.current = setInterval(() => setProgress((p) => (p === null ? null : p + (90 - p) * 0.12)), 200);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  if (progress === null) return null;
  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        className="relative h-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="absolute top-0 -right-1.5 size-3.5 text-leaf motion-safe:animate-[tunas_1.2s_ease-in-out_infinite]"
        >
          <path d="M8 15V8" stroke="var(--brand-bark)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 9C8 5.5 5.5 3.5 2.5 3.5 2.5 6.5 4.5 9 8 9Z" fill="currentColor" />
          <path d="M8 8C8 4.5 10.5 2.5 13.5 2.5 13.5 5.5 11.5 8 8 8Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
