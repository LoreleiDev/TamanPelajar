import { Download, FileUp, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { QuestionTable } from "@/components/admin/questions/question-table";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { publishLabel } from "@/features/admin/labels";
import { getQuestionMeta, listQuestions } from "@/features/admin/questions/queries";
import { difficultyLabel, QUESTION_TYPES, questionFilterSchema, questionTypeLabel } from "@/features/admin/questions/schemas";

export const metadata: Metadata = { title: "Bank soal", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");

async function Content({ searchParams }: { searchParams: PageProps<"/admin/bank-soal">["searchParams"] }) {
  await adminPage("/admin/bank-soal");
  const filter = questionFilterSchema.parse(await searchParams);
  const [data, meta] = await Promise.all([listQuestions(filter), getQuestionMeta()]);
  const { page: _p, ...exportFilter } = filter;
  const exportQs = new URLSearchParams(Object.entries(exportFilter).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  return (
    <>
      <FilterBar
        action="/admin/bank-soal"
        q={filter.q}
        searchLabel="Cari soal"
        placeholder="Isi soal, topik, atau mata pelajaran"
        selects={[
          { name: "category", label: "Kategori", value: filter.category, options: meta.categories.map((c) => ({ value: c.slug, label: c.shortName })) },
          { name: "subject", label: "Mata pelajaran", value: filter.subject, options: meta.subjects.map((s) => ({ value: s, label: s })) },
          { name: "type", label: "Jenis", value: filter.type, options: QUESTION_TYPES.map((t) => ({ value: t, label: questionTypeLabel[t] })) },
          { name: "difficulty", label: "Kesulitan", value: filter.difficulty, options: Object.entries(difficultyLabel).map(([value, label]) => ({ value, label })) },
          { name: "status", label: "Status", value: filter.status, options: Object.entries(publishLabel).map(([value, label]) => ({ value, label })) },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {nf.format(data.total)} soal
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export/bank-soal?format=csv${exportQs ? `&${exportQs}` : ""}`} download>
              <Download data-icon="inline-start" />
              Ekspor CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/export/bank-soal?format=xlsx${exportQs ? `&${exportQs}` : ""}`} download>
              <Download data-icon="inline-start" />
              Ekspor XLSX
            </a>
          </Button>
        </div>
      </div>
      {data.rows.length === 0 ? (
        <EmptyState title="Tidak ada soal yang cocok" description="Ubah kata kunci atau filter, atau tambahkan soal baru." />
      ) : (
        <QuestionTable rows={data.rows} />
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/bank-soal", filter, p)} />
    </>
  );
}

// Bank soal (M.5, L.2.5).
export default function QuestionBankPage({ searchParams }: PageProps<"/admin/bank-soal">) {
  return (
    <>
      <DashboardHeading
        title="Bank soal"
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/bank-soal/impor">
                <FileUp data-icon="inline-start" />
                Impor
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/bank-soal/baru">
                <Plus data-icon="inline-start" />
                Tambah soal
              </Link>
            </Button>
          </div>
        }
      >
        Semua soal tryout dan kuis. Centang beberapa soal untuk menerbitkan atau menghapus sekaligus.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
