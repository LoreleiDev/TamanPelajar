import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DeleteButton } from "@/components/admin/delete-button";
import { CourseForm } from "@/components/admin/courses/course-form";
import { CurriculumEditor } from "@/components/admin/courses/curriculum-editor";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hapusKelas } from "@/features/admin/courses/actions";
import { getAdminCourse, getCourseParticipants } from "@/features/admin/courses/queries";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { formatStudyTime, formatTanggal, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah kelas", robots: { index: false } };

async function Participants({ courseId }: { courseId: string }) {
  const { lessonTotal, rows } = await getCourseParticipants(courseId);
  if (rows.length === 0) return <EmptyState title="Belum ada peserta" description="Siswa muncul di sini setelah membeli paket yang memuat kelas ini atau membuka bab gratis." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-176 text-left">
        <caption className="sr-only">Peserta kelas dan progresnya</caption>
        <thead className="bg-secondary text-sm">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Siswa</th>
            <th scope="col" className="w-64 px-4 py-3 font-semibold">Progres</th>
            <th scope="col" className="px-4 py-3 font-semibold">Waktu tonton</th>
            <th scope="col" className="px-4 py-3 font-semibold">Akses paket</th>
            <th scope="col" className="px-4 py-3 font-semibold">Aktivitas terakhir</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <Link href={`/admin/pengguna/${p.id}`} className="font-semibold hover:text-primary">
                  {p.name}
                </Link>
                <span className="block text-sm break-all text-muted-foreground">{p.email}</span>
              </th>
              <td className="px-4 py-3">
                <GrowthProgress value={lessonTotal ? (p.done / lessonTotal) * 100 : 0} label={`${p.done}/${lessonTotal} materi`} />
              </td>
              <td className="px-4 py-3">{formatStudyTime(p.watchedSec)}</td>
              <td className="px-4 py-3 text-sm">
                {p.access ? (
                  <StatusBadge tone={p.access === "Aktif" ? "berhasil" : "netral"}>
                    {p.access}
                    {p.expiresAt && `, s.d. ${formatTanggal(p.expiresAt)}`}
                  </StatusBadge>
                ) : (
                  <span className="text-muted-foreground">Bab gratis saja</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{p.last ? formatTanggalJam(p.last) : "Belum membuka materi"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function Content({ params, searchParams }: { params: PageProps<"/admin/kelas/[id]">["params"]; searchParams: PageProps<"/admin/kelas/[id]">["searchParams"] }) {
  const { id } = await params;
  const { tab } = await searchParams;
  await adminPage(`/admin/kelas/${id}`);
  const [c, categories] = await Promise.all([getAdminCourse(id), getExamCategories()]);
  if (!c) notFound();
  const lessonCount = c.sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <>
      <Breadcrumb items={[{ label: "Kelas", href: "/admin/kelas" }, { label: c.title }]} />
      <DashboardHeading
        title={c.title}
        action={
          <div className="flex flex-wrap gap-2">
            {c.status === "TERBIT" && (
              <Button asChild variant="outline">
                <Link href={`/kelas/${c.slug}`}>
                  <ExternalLink data-icon="inline-start" />
                  Halaman publik
                </Link>
              </Button>
            )}
            <DeleteButton
              label="Hapus kelas"
              title={`Hapus kelas ${c.title}?`}
              description="Kelas hilang dari katalog dan paket. Progres dan sertifikat siswa tetap tersimpan."
              action={hapusKelas.bind(null, { id: c.id })}
              redirectTo="/admin/kelas"
              successMessage="Kelas dihapus."
            />
          </div>
        }
      >
        {c.category.name}, {c.sections.length} bab, {lessonCount} materi, {formatStudyTime(c.estimatedMinutes * 60)}
        {c.certificate && `, ${c.certificate._count.issued} sertifikat terbit`}
      </DashboardHeading>
      <StatusBadge tone={publishTone[c.status]} variant="box">
        {publishLabel[c.status]}
      </StatusBadge>

      <Tabs defaultValue={tab === "kurikulum" || tab === "peserta" ? tab : "pengaturan"}>
        <TabsList>
          <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
          <TabsTrigger value="kurikulum">Kurikulum</TabsTrigger>
          <TabsTrigger value="peserta">Peserta</TabsTrigger>
        </TabsList>
        <TabsContent value="pengaturan" className="pt-4">
          <CourseForm
            categories={categories}
            defaults={{
              id: c.id,
              title: c.title,
              slug: c.slug,
              summary: c.summary,
              description: c.description,
              categoryId: c.categoryId,
              subject: c.subject,
              level: c.level,
              status: c.status,
              sequentialLock: c.sequentialLock,
              thumbnailId: c.thumbnailId,
              certificate: Boolean(c.certificate),
            }}
          />
        </TabsContent>
        <TabsContent value="kurikulum" className="pt-4">
          <CurriculumEditor
            courseId={c.id}
            sections={c.sections.map((s) => ({
              id: s.id,
              title: s.title,
              isFree: s.isFree,
              lessons: s.lessons.map((l) => ({
                id: l.id,
                title: l.title,
                type: l.type,
                durationSec: l.durationSec,
                progress: l._count.progress,
                detail: [
                  l.video?.title && `video: ${l.video.title}`,
                  l.quiz && `${l.quiz._count.questions} soal`,
                  l._count.materials > 0 && `${l._count.materials} PDF`,
                ]
                  .filter(Boolean)
                  .join(", "),
              })),
            }))}
          />
        </TabsContent>
        <TabsContent value="peserta" className="pt-4">
          <Suspense fallback={<DashboardSkeleton />}>
            <Participants courseId={c.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Ubah kelas (L.2.1–L.2.2, L.2.6, L.2.10).
export default function EditCoursePage({ params, searchParams }: PageProps<"/admin/kelas/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}
