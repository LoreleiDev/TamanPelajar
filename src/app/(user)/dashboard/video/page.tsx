import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Button } from "@/components/ui/button";
import { getSaved } from "@/features/dashboard/queries";
import { formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Video saya", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/video");
  const { bookmarks, watched } = await getSaved(user.id);
  return (
    <>
      <DashboardHeading title="Video saya">Video dan materi yang kamu simpan, serta riwayat tontonan.</DashboardHeading>
      <DashboardSection title="Disimpan">
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground">
            Belum ada yang disimpan. Tekan <strong>Simpan materi</strong> atau <strong>Simpan video</strong> untuk menandainya.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
            {bookmarks.map((b, i) => {
              const href = b.lesson ? `/kelas/${b.lesson.section.course.slug}/${b.lesson.slug}` : `/video/${b.video!.slug}`;
              return (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <Link href={href} className="font-semibold hover:text-primary">
                    {b.lesson?.title ?? b.video?.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">{b.lesson ? b.lesson.section.course.title : b.video?.subject}</span>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>
      <DashboardSection title="Riwayat tontonan">
        {watched.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground">Belum ada video yang ditonton dari pustaka video.</p>
            <Button asChild variant="outline">
              <Link href="/video">Buka pustaka video</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
            {watched.map((w) => (
              <li key={w.video.slug} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/video/${w.video.slug}`} className="font-semibold hover:text-primary">
                  {w.video.title}
                </Link>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                  {w.completedAt ? (
                    <>
                      <CircleCheck className="size-4 text-success" aria-hidden="true" /> Selesai
                    </>
                  ) : (
                    `${Math.min(99, Math.round((w.watchedSec / Math.max(1, w.video.durationSec)) * 100))}% ditonton`
                  )}
                  , {formatTanggalJam(w.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </>
  );
}

// Video Saya (F.1).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
