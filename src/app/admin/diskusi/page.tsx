import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { DeleteDiscussionButton, DiscussionReplyForm } from "@/components/admin/discussion-reply";
import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { listDiscussions } from "@/features/admin/discussions";
import { adminPage } from "@/features/admin/guard";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Diskusi", robots: { index: false } };

const filterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["belum", "sudah"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

async function Content({ searchParams }: { searchParams: PageProps<"/admin/diskusi">["searchParams"] }) {
  await adminPage("/admin/diskusi");
  const filter = filterSchema.parse(await searchParams);
  const data = await listDiscussions(filter);
  return (
    <>
      <FilterBar
        action="/admin/diskusi"
        q={filter.q}
        searchLabel="Cari diskusi"
        placeholder="Isi pertanyaan atau nama siswa"
        selects={[{ name: "status", label: "Status", value: filter.status, options: [{ value: "belum", label: "Belum dijawab" }, { value: "sudah", label: "Sudah dijawab" }] }]}
      />
      {data.rows.length === 0 ? (
        <EmptyState title="Tidak ada diskusi" description="Pertanyaan siswa dari kolom diskusi materi muncul di sini." />
      ) : (
        <ol className="flex flex-col gap-4">
          {data.rows.map((d) => {
            const answered = d.replies.some((r) => r.user.role === "ADMIN");
            const course = d.lesson?.section.course;
            return (
              <li key={d.id}>
                <article className="flex flex-col gap-3 rounded-xl border border-border p-5" aria-label={`Diskusi dari ${d.user.name}`}>
                  <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link href={`/admin/pengguna/${d.user.id}`} className="font-semibold hover:text-primary">
                      {d.user.name}
                    </Link>
                    {d.lesson && course && (
                      <Link href={`/kelas/${course.slug}/${d.lesson.slug}#diskusi`} className="text-sm text-muted-foreground hover:text-primary">
                        {course.title}: {d.lesson.title}
                      </Link>
                    )}
                    <StatusBadge tone={answered ? "berhasil" : "menunggu"} className="text-sm">
                      {answered ? "Sudah dijawab" : "Belum dijawab"}
                    </StatusBadge>
                    <time dateTime={d.createdAt.toISOString()} className="ml-auto text-sm text-muted-foreground">
                      {formatTanggalJam(d.createdAt)}
                    </time>
                  </header>
                  <p className="max-w-[75ch] whitespace-pre-wrap">{d.body}</p>
                  {d.replies.length > 0 && (
                    <ol className="flex flex-col gap-2 border-l-2 border-leaf pl-4">
                      {d.replies.map((r) => (
                        <li key={r.id} className="flex flex-col gap-0.5">
                          <p className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold">{r.user.name}</span>
                            {r.user.role === "ADMIN" && (
                              <span className="inline-flex items-center gap-1 text-primary">
                                <ShieldCheck aria-hidden="true" className="size-3.5" />
                                Admin
                              </span>
                            )}
                            <span className="text-muted-foreground">{formatTanggalJam(r.createdAt)}</span>
                            <DeleteDiscussionButton id={r.id} kind="balasan" />
                          </p>
                          <p className="max-w-[75ch] whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                  <DiscussionReplyForm discussionId={d.id} />
                  <div>
                    <DeleteDiscussionButton id={d.id} kind="diskusi" />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/diskusi", filter, p)} />
    </>
  );
}

// Menjawab diskusi (L.2.8).
export default function AdminDiscussionsPage({ searchParams }: PageProps<"/admin/diskusi">) {
  return (
    <>
      <DashboardHeading title="Diskusi">Pertanyaan siswa di materi kelas. Balasan admin ditandai khusus dan siswa mendapat notifikasi.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
