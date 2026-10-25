import { Download } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { QuestionImport } from "@/components/admin/questions/question-import";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { CSV_COLUMNS } from "@/features/admin/questions/csv";
import { getQuestionMeta } from "@/features/admin/questions/queries";

export const metadata: Metadata = { title: "Impor soal", robots: { index: false } };

const columnHelp: Record<(typeof CSV_COLUMNS)[number], string> = {
  kategori: "Slug kategori (lihat daftar di bawah)",
  mata_pelajaran: "Mis. Penalaran Umum",
  topik: "Mis. Logika",
  kesulitan: "mudah, sedang, atau sulit",
  jenis: "pg_tunggal, pg_jamak, benar_salah, isian_singkat, numerik, essay",
  pertanyaan: "Teks atau HTML sederhana",
  opsi_a: "Wajib untuk pilihan ganda",
  opsi_b: "Wajib untuk pilihan ganda",
  opsi_c: "Opsional",
  opsi_d: "Opsional",
  opsi_e: "Opsional",
  kunci: "Huruf (B), beberapa huruf (A,C), benar/salah, teks isian (rendah|pendek), atau angka",
  toleransi: "Untuk numerik, opsional",
  pembahasan: "Wajib",
  bobot: "Opsional, bawaan 1",
  status: "draf, terbit, atau arsip; bawaan draf",
};

async function Categories() {
  await adminPage("/admin/bank-soal/impor");
  const { categories } = await getQuestionMeta();
  return (
    <ul className="flex flex-wrap gap-2 text-sm">
      {categories.map((c) => (
        <li key={c.id} className="rounded-md bg-secondary px-2 py-1">
          <code className="font-semibold">{c.slug}</code> <span className="text-muted-foreground">{c.shortName}</span>
        </li>
      ))}
    </ul>
  );
}

// Impor soal CSV/XLSX (M.5.2).
export default function ImportQuestionsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Bank soal", href: "/admin/bank-soal" }, { label: "Impor" }]} />
      <DashboardHeading
        title="Impor soal"
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href="/api/export/bank-soal?template=1&format=xlsx" download>
                <Download data-icon="inline-start" />
                Template XLSX
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export/bank-soal?template=1&format=csv" download>
                <Download data-icon="inline-start" />
                Template CSV
              </a>
            </Button>
          </div>
        }
      >
        Periksa file dulu; baris yang bermasalah ditunjukkan nomornya dan dilewati saat impor.
      </DashboardHeading>
      <QuestionImport />
      <DashboardSection title="Kolom file">
        <dl className="grid max-w-3xl grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
          {CSV_COLUMNS.map((c) => (
            <div key={c} className="contents">
              <dt>
                <code className="font-semibold">{c}</code>
              </dt>
              <dd className="text-muted-foreground">{columnHelp[c]}</dd>
            </div>
          ))}
        </dl>
      </DashboardSection>
      <DashboardSection title="Slug kategori">
        <Suspense fallback={<DashboardSkeleton />}>
          <Categories />
        </Suspense>
      </DashboardSection>
    </>
  );
}
