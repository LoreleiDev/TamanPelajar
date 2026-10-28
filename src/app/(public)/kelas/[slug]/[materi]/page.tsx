import { ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StudentTestimonialDialog } from "@/components/course/student-testimonial-dialog";
import { CurriculumNav } from "@/components/course/curriculum-nav";
import { Breadcrumb } from "@/components/shared/page-header";
import { DiscussionThread } from "@/components/course/discussion-thread";
import { LessonActions } from "@/components/course/lesson-actions";
import { NoteEditor } from "@/components/course/note-editor";
import { QuizRunner } from "@/components/course/quiz-runner";
import { SubscribeDialog } from "@/components/course/subscribe-dialog";
import { VideoPlayer } from "@/components/course/video-player";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateTrackSummary } from "@/features/certificate/components/certificate-track";
import { syncCertificateTrack } from "@/features/certificate/service";
import { getCourseOutline, getLearnerState, getLessonContent, hasCourseTestimonial } from "@/features/course/queries";
import { formatStudyTime, formatTanggal } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Ruang belajar", robots: { index: false } };

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

async function LessonRoom({ params }: { params: PageProps<"/kelas/[slug]/[materi]">["params"] }) {
  const { slug, materi } = await params;
  const user = await requireUserPage(`/kelas/${slug}/${materi}`);
  const outline = await getCourseOutline(slug);
  if (!outline) notFound();
  // Sinkron batch lebih dulu: memulai ulang batch gratis bisa mengosongkan progres lama.
  const track = user.role === "USER" ? await syncCertificateTrack(user.id, outline.id) : null;
  const state = await getLearnerState(outline, user);
  const index = state.lessons.findIndex((l) => l.slug === materi);
  if (index < 0) notFound();
  const lesson = state.lessons[index];
  const prev = state.lessons[index - 1];
  const next = state.lessons[index + 1];
  const [content, reviewed] = await Promise.all([
    lesson.access === "terbuka" ? getLessonContent(lesson.id, user.id) : null,
    user.role === "USER" && state.percent === 100 ? hasCourseTestimonial(user.id, outline.id) : true,
  ]);

  const byId = new Map(state.lessons.map((l) => [l.id, l]));
  const navSections = outline.sections.map((s) => ({
    id: s.id,
    title: s.title,
    isFree: s.isFree,
    lessons: s.lessons.map((l) => {
      const st = byId.get(l.id)!;
      return { slug: l.slug, title: l.title, type: l.type, durationSec: l.durationSec, access: st.access, completed: st.completed };
    }),
  }));

  const sidebar = (
    <div className="flex flex-col gap-6">
      {/* Panel progres (G.3) */}
      <section aria-labelledby="progres-judul" className="flex flex-col gap-3 rounded-xl bg-secondary p-4">
        <h2 id="progres-judul" className="font-bold">
          Progres kelas
        </h2>
        <GrowthProgress value={state.percent} label={`${state.completedCount} dari ${state.totalCount} materi`} />
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Waktu belajar</dt>
            <dd className="font-semibold tabular-nums">{formatStudyTime(state.studySeconds)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Target selesai</dt>
            <dd className="font-semibold">
              {state.enrollment ? formatTanggal(state.enrollment.expiresAt) : "Bab gratis tanpa batas"}
            </dd>
          </div>
        </dl>
      </section>
      {/* Sertifikat berbasis batch; tidak tampil bila kelas belum punya batch. */}
      {track && <CertificateTrackSummary track={track} />}
      {/* Kelas 100% selesai: minta testimoni sekali (revisi RMED). */}
      {!reviewed && <StudentTestimonialDialog autoOpen courseId={outline.id} courseTitle={outline.title} />}
      {/* Riwayat belajar (G.4.9) */}
      {state.recent.length > 0 && (
        <section aria-labelledby="riwayat-judul" className="flex flex-col gap-2">
          <h2 id="riwayat-judul" className="text-sm font-bold">
            Terakhir diselesaikan
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {state.recent.map((r) => (
              <li key={r.slug} className="flex justify-between gap-3">
                <Link href={`/kelas/${slug}/${r.slug}`} className="truncate hover:text-primary">
                  {r.title}
                </Link>
                <span className="shrink-0 text-muted-foreground">{formatTanggal(r.completedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <CurriculumNav courseSlug={slug} courseTitle={outline.title} currentSlug={materi} sections={navSections} products={outline.products} />
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] xl:gap-12">
      {/* Dirender sekali agar id tidak ganda; di mobile tampil di bawah konten materi. */}
      <aside aria-label="Kurikulum dan progres" className="order-2 lg:order-1">
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:pr-2">{sidebar}</div>
      </aside>

      <article className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
        <Breadcrumb items={[{ label: "Kelas online", href: "/kelas" }, { label: outline.title, href: `/kelas/${slug}` }, { label: lesson.sectionTitle }]} />
        <h1 className="text-heading">{lesson.title}</h1>

        {lesson.access !== "terbuka" || !content ? (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-border p-6">
            <Lock className="size-8 text-primary" aria-hidden="true" />
            {lesson.access === "terkunci-urutan" ? (
              <p className="text-lead">Selesaikan materi sebelumnya dulu. Kelas ini dibuka berurutan.</p>
            ) : (
              <>
                <p className="text-lead">
                  Materi ini ada di bab untuk pelanggan. Bab 1 dan 2 tetap bisa kamu buka gratis.
                </p>
                <SubscribeDialog courseTitle={outline.title} products={outline.products} trigger={<Button size="lg">Lihat paket berlangganan</Button>} />
              </>
            )}
          </div>
        ) : (
          <>
            {content.video && (
              <VideoPlayer
                key={`video-${content.id}`}
                target={{ kind: "lesson", id: content.id }}
                title={content.title}
                video={content.video}
                initialPositionSec={lesson.lastPositionSec}
              />
            )}
            {content.summary && <p className="text-lead">{content.summary}</p>}
            {content.html && (
              <div
                className="flex max-w-[70ch] flex-col gap-3 leading-relaxed [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:font-semibold [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: content.html }}
              />
            )}
            {content.quiz && (
              <QuizRunner
                key={`kuis-${content.id}`}
                lessonId={content.id}
                passingScore={content.quiz.passingScore}
                questions={content.quiz.questions}
                lastAttempt={content.quiz.lastAttempt}
              />
            )}
            {content.materials.length > 0 && (
              <section aria-labelledby="lampiran-judul" className="flex flex-col gap-2">
                <h2 id="lampiran-judul" className="font-bold">
                  Lampiran materi
                </h2>
                <ul className="flex flex-col gap-2">
                  {content.materials.map((m) => (
                    <li key={m.id}>
                      <a
                        href={`/api/materi/${m.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:border-primary hover:text-primary"
                      >
                        <Download aria-hidden="true" className="size-4" />
                        {m.title}
                        <span className="text-sm text-muted-foreground uppercase">
                          {m.format}, {kb(m.bytes)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <LessonActions key={`aksi-${content.id}`} lessonId={content.id} completed={lesson.completed} bookmarked={content.bookmarked} />
          </>
        )}

        {/* Materi sebelumnya/berikutnya (G.2.4) */}
        <nav aria-label="Materi sebelumnya dan berikutnya" className="grid grid-cols-2 gap-3 pt-4">
          {prev ? (
            <Button asChild variant="outline" className="h-auto justify-start py-3 text-left whitespace-normal">
              <Link href={`/kelas/${slug}/${prev.slug}`}>
                <ChevronLeft data-icon="inline-start" />
                <span className="flex flex-col">
                  <span className="text-sm font-normal text-muted-foreground">Sebelumnya</span>
                  {prev.title}
                </span>
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild variant="outline" className="h-auto justify-end py-3 text-right whitespace-normal">
              <Link href={`/kelas/${slug}/${next.slug}`}>
                <span className="flex flex-col">
                  <span className="text-sm font-normal text-muted-foreground">Berikutnya</span>
                  {next.title}
                </span>
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="h-auto justify-end py-3">
              <Link href={`/kelas/${slug}`}>Kembali ke ringkasan kelas</Link>
            </Button>
          )}
        </nav>

        {content && (
          <>
            <section aria-labelledby="catatan-judul" className="flex flex-col gap-3">
              <h2 id="catatan-judul" className="text-lg font-bold">
                Catatan pribadi
              </h2>
              <NoteEditor key={`catatan-${content.id}`} target={{ kind: "lesson", id: content.id }} initial={content.note} />
            </section>
            <section aria-labelledby="diskusi-judul" className="flex flex-col gap-3">
              <h2 id="diskusi-judul" className="text-lg font-bold">
                Diskusi
              </h2>
              <DiscussionThread lessonId={content.id} items={content.discussions} />
            </section>
          </>
        )}
      </article>
    </div>
  );
}

function RoomSkeleton() {
  return (
    // Setinggi layar agar footer tidak tampil lalu terdorong saat materi tiba (CLS).
    <div className="grid min-h-svh gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]" aria-busy="true" aria-label="Memuat materi">
      <Skeleton className="hidden h-[32rem] rounded-xl lg:block" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// Ruang belajar (G.1–G.4). Hanya untuk pengguna yang sudah masuk; akses tiap materi
// diperiksa di server lewat lib/access-rules.
export default function MateriPage({ params }: PageProps<"/kelas/[slug]/[materi]">) {
  return (
    <main className="page-container py-8 md:py-10">
      <Suspense fallback={<RoomSkeleton />}>
        <LessonRoom params={params} />
      </Suspense>
    </main>
  );
}
