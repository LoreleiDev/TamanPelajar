import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SaveCourseButton } from "@/components/course/save-course-button";
import { StudentTestimonialDialog } from "@/components/course/student-testimonial-dialog";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Button } from "@/components/ui/button";
import { getCourseProgress, getPrograms } from "@/features/dashboard/queries";
import { formatTanggal, formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Kelas saya", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/kelas");
  const [courses, programs] = await Promise.all([getCourseProgress(user.id), getPrograms(user.id)]);
  return (
    <>
      <DashboardHeading title="Kelas saya">
        Kelas dari paket yang kamu beli, kelas yang kamu tambahkan dengan tombol &ldquo;Tambah kelas&rdquo;, dan kelas yang pernah kamu buka.
      </DashboardHeading>
      {programs.length > 0 && (
        <section aria-labelledby="program-judul" className="flex flex-col gap-3">
          <h2 id="program-judul" className="text-lg font-bold">
            Program
          </h2>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
            {programs.map((p) => (
              <li key={p.productSlug} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/paket/${p.productSlug}`} className="font-semibold hover:text-primary">
                  {p.productName}
                </Link>
                <span className={p.active ? "text-sm text-primary" : "text-sm text-muted-foreground"}>
                  {p.active ? `Aktif sampai ${formatTanggal(p.expiresAt)}` : `Berakhir ${formatTanggal(p.expiresAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {courses.length === 0 ? (
        <EmptyState
          title="Belum ada kelas"
          description="Buka bab 1 kelas mana pun untuk mulai belajar. Bab 1 dan 2 gratis."
          action={
            <Button asChild>
              <Link href="/kelas">Lihat daftar kelas</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.slug} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/kelas/${c.slug}`} className="text-lg font-bold hover:text-primary">
                  {c.title}
                </Link>
                <span className={c.enrolled ? "text-sm font-semibold text-primary" : "text-sm text-muted-foreground"}>
                  {c.enrolled ? "Akses penuh" : c.saved ? "Ditambahkan, bab gratis" : "Bab gratis"}
                </span>
              </div>
              <GrowthProgress value={c.percent} label={`${c.completed} dari ${c.total} materi`} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {c.lastAccessAt ? `Terakhir dibuka ${formatTanggalJam(c.lastAccessAt)}` : "Belum dibuka"}
                </span>
                {c.nextLesson ? (
                  <Button asChild size="sm">
                    <Link href={`/kelas/${c.slug}/${c.nextLesson.slug}`}>{c.completed ? "Lanjutkan" : "Mulai"}</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/kelas/${c.slug}`}>{c.percent === 100 ? "Ulas lagi" : "Lihat kurikulum"}</Link>
                  </Button>
                )}
              </div>
              {(c.percent === 100 || (c.saved && !c.enrolled)) && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                  {c.percent === 100 &&
                    (c.testimonial === "belum" ? (
                      <StudentTestimonialDialog
                        courseId={c.id}
                        courseTitle={c.title}
                        trigger={
                          <Button size="sm" variant="outline">
                            Tulis testimoni
                          </Button>
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground">
                        {c.testimonial === "menunggu" ? "Testimonimu menunggu tinjauan admin." : "Testimonimu tampil di beranda."}
                      </span>
                    ))}
                  {c.saved && !c.enrolled && <SaveCourseButton courseId={c.id} courseTitle={c.title} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Kelas Saya (F.1).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
