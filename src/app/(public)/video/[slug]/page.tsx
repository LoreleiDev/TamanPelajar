import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LoginToWatch } from "@/components/course/login-to-watch";
import { Breadcrumb } from "@/components/shared/page-header";
import { NoteEditor } from "@/components/course/note-editor";
import { SubscribeDialog } from "@/components/course/subscribe-dialog";
import { VideoPlayer } from "@/components/course/video-player";
import { VideoSaveButton } from "@/components/course/video-save-button";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getVideoMeta, getVideoPage, listVideoSlugs } from "@/features/video/queries";
import { DIFFICULTY_LABELS } from "@/features/video/schemas";
import { formatClock } from "@/lib/format";
import { currentUser } from "@/lib/rbac";

export async function generateStaticParams() {
  return (await listVideoSlugs()).map((slug) => ({ slug }));
}

// Slug lain dirender blocking agar video yang tidak ada tetap mengembalikan 404 (bukan 200).
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/video/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVideoMeta(slug);
  if (!v) return { title: "Video tidak ditemukan" };
  return { title: v.title, description: v.description, alternates: { canonical: `/video/${slug}` } };
}

async function VideoContent({ params }: { params: PageProps<"/video/[slug]">["params"] }) {
  const { slug } = await params;
  const user = await currentUser();
  const v = await getVideoPage(slug, user);
  if (!v) notFound();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-14">
      <article className="flex min-w-0 flex-col gap-6">
        <Breadcrumb items={[{ label: "Video belajar", href: "/video" }, { label: v.subject }]} />
        <h1 className="text-heading">{v.title}</h1>
        <p className="-mt-3 text-sm text-muted-foreground tabular-nums">
          {v.category}, tingkat {DIFFICULTY_LABELS[v.difficulty].toLowerCase()}, durasi {formatClock(v.durationSec)}
        </p>

        {v.access === "perlu-masuk" ? (
          <LoginToWatch title={v.title} />
        ) : v.access !== "terbuka" || !v.player ? (
          <div className="flex aspect-video flex-col items-start justify-center gap-4 rounded-xl bg-secondary p-6">
            <Lock className="size-8 text-primary" aria-hidden="true" />
            <p className="text-lead max-w-md">Video ini ada di bab untuk pelanggan.</p>
            <SubscribeDialog
              courseTitle={v.course?.title ?? v.subject}
              products={v.products}
              trigger={<Button size="lg">Lihat paket berlangganan</Button>}
            />
          </div>
        ) : (
          <VideoPlayer key={`video-${v.id}`} target={{ kind: "video", id: v.id }} title={v.title} video={v.player} initialPositionSec={v.lastPositionSec} />
        )}

        {v.access === "terbuka" && (
          <div className="flex flex-wrap items-center gap-4">
            <VideoSaveButton key={`simpan-${v.id}`} videoId={v.id} bookmarked={v.bookmarked} />
            <GrowthProgress value={v.progressPercent} label={v.watched ? "Sudah ditonton" : "Progres tontonan"} className="min-w-56 flex-1" />
          </div>
        )}

        <p className="text-lead max-w-[70ch]">{v.description}</p>

        {v.transcript && (
          <section aria-labelledby="transkrip-judul" className="flex flex-col gap-3">
            <h2 id="transkrip-judul" className="text-lg font-bold">
              Transkrip
            </h2>
            <div className="flex max-w-[70ch] flex-col gap-3 rounded-xl bg-secondary p-5 leading-relaxed">
              {v.transcript.split(/\n{2,}/).map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="Video sebelumnya dan berikutnya" className="grid grid-cols-2 gap-3 pt-2">
          {v.prev ? (
            <Button asChild variant="outline" className="h-auto justify-start py-3 text-left whitespace-normal">
              <Link href={`/video/${v.prev.slug}`}>
                <ChevronLeft data-icon="inline-start" />
                <span className="flex flex-col">
                  <span className="text-sm font-normal text-muted-foreground">Sebelumnya</span>
                  {v.prev.title}
                </span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {v.next && (
            <Button asChild variant="outline" className="h-auto justify-end py-3 text-right whitespace-normal">
              <Link href={`/video/${v.next.slug}`}>
                <span className="flex flex-col">
                  <span className="text-sm font-normal text-muted-foreground">Berikutnya</span>
                  {v.next.title}
                </span>
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          )}
        </nav>

        {v.access === "terbuka" && (
          <section aria-labelledby="catatan-video-judul" className="flex flex-col gap-3">
            <h2 id="catatan-video-judul" className="text-lg font-bold">
              Catatan
            </h2>
            <NoteEditor key={`catatan-${v.id}`} target={{ kind: "video", id: v.id }} initial={v.note} />
          </section>
        )}
      </article>

      <aside aria-label="Materi terkait" className="flex flex-col gap-6">
        {v.course && (
          <section className="flex flex-col gap-2 rounded-xl bg-secondary p-4">
            <h2 className="font-bold">Bagian dari kelas</h2>
            <p>{v.course.title}</p>
            <Button asChild variant="outline" size="sm" className="self-start bg-background">
              <Link href={`/kelas/${v.course.slug}/${v.course.lessonSlug}`}>Buka di ruang belajar</Link>
            </Button>
          </section>
        )}
        {v.related.length > 0 && (
          <section aria-labelledby="terkait-judul" className="flex flex-col gap-2">
            <h2 id="terkait-judul" className="font-bold">
              Video terkait
            </h2>
            <ul className="flex flex-col">
              {v.related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/video/${r.slug}`} className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary">
                    <span>{r.title}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{formatClock(r.durationSec)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat video">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="aspect-video max-w-4xl rounded-xl" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

// Halaman video (H.2). Tamu bisa membuka halaman, tetapi tidak bisa memutar (C.5).
export default async function VideoDetailPage({ params }: PageProps<"/video/[slug]">) {
  // Cek keberadaan sebelum Suspense supaya status 404 terkirim dengan benar.
  if (!(await getVideoMeta((await params).slug))) notFound();
  return (
    <main className="page-container py-10 md:py-12">
      <Suspense fallback={<VideoSkeleton />}>
        <VideoContent params={params} />
      </Suspense>
    </main>
  );
}
