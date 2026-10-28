"use client";

import { BookmarkCheck, CircleCheck, Plus } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { useRequireLogin } from "@/components/shared/require-login";
import { Button } from "@/components/ui/button";
import { hapusKelasSaya, statusKelasSaya, tambahKelasSaya } from "@/features/course/my-courses-actions";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

// Tombol "Tambah kelas" (revisi RMED). Halaman kelas publik statis, jadi status Kelas Saya
// dibaca di client satu kali per halaman dan dibagi ke semua tombol lewat store kecil ini.

type Status = { saved: Set<string>; enrolled: Set<string> };
let status: Status | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(force = false) {
  if (loading && !force) return loading;
  loading = statusKelasSaya().then((r) => {
    status = { saved: new Set(r.saved), enrolled: new Set(r.enrolled) };
    emit();
  });
  return loading;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function SaveCourseButton({ courseId, courseTitle, size = "sm", className }: { courseId: string; courseTitle: string; size?: "sm" | "default"; className?: string }) {
  const { isAuthenticated, isAdmin, requireLogin } = useRequireLogin();
  const hydrated = useHydrated();
  const current = useSyncExternalStore(subscribe, () => status, () => null);
  const [pending, start] = useTransition();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated && !isAdmin) void load();
  }, [hydrated, isAuthenticated, isAdmin]);

  // Admin tidak punya Kelas Saya.
  if (hydrated && isAdmin) return null;

  const enrolled = current?.enrolled.has(courseId) ?? false;
  const saved = current?.saved.has(courseId) ?? false;

  if (enrolled) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold text-primary", className)}>
        <CircleCheck aria-hidden="true" className="size-4" />
        Terdaftar lewat paket
      </span>
    );
  }

  const run = (fn: typeof tambahKelasSaya, message: string) =>
    start(async () => {
      const r = await fn({ courseId });
      if (!r.ok) return void toast.error(r.error);
      toast.success(message);
      await load(true);
    });

  if (saved) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        className={className}
        disabled={pending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => run(hapusKelasSaya, `${courseTitle} dikeluarkan dari Kelas Saya.`)}
        aria-label={`${courseTitle} sudah di Kelas Saya. Tekan untuk mengeluarkan.`}
      >
        <BookmarkCheck data-icon="inline-start" aria-hidden="true" />
        {hover ? "Keluarkan dari Kelas Saya" : "Sudah di Kelas Saya"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      className={className}
      disabled={pending}
      onClick={() =>
        requireLogin(`Untuk menambahkan ${courseTitle} ke Kelas Saya, masuk ke akunmu.`, () =>
          run(tambahKelasSaya, `${courseTitle} ditambahkan ke Kelas Saya.`),
        )
      }
    >
      <Plus data-icon="inline-start" aria-hidden="true" />
      {pending ? "Menambahkan…" : "Tambah kelas"}
      <span className="sr-only"> {courseTitle}</span>
    </Button>
  );
}
