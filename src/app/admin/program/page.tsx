import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DeleteProgramButton, ProgramDialog } from "@/components/admin/program-dialog";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { listPrograms } from "@/features/admin/programs";

export const metadata: Metadata = { title: "Program", robots: { index: false } };

async function Content() {
  await adminPage("/admin/program");
  const rows = await listPrograms();
  return (
    // relative: teks sr-only (position absolute) di kolom terakhir tetap terpotong wadah geser.
    <div className="relative overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-176 text-left">
        <caption className="sr-only">Daftar program</caption>
        <thead className="bg-secondary text-sm">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Program</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Urutan</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Paket</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Kelas</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Tryout</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
            <th scope="col" className="px-4 py-3 font-semibold">
              <span className="sr-only">Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-3 font-normal">
                <span className="font-semibold">{c.name}</span>{" "}
                <span className="text-sm text-muted-foreground">({c.shortName})</span>
                <span className="block text-sm text-muted-foreground">
                  <Link href={`/program?kategori=${c.slug}`} className="hover:text-primary">
                    /{c.slug}
                  </Link>{" "}
                  · {c.audience}
                </span>
              </th>
              <td className="px-4 py-3 text-right">{c.order}</td>
              <td className="px-4 py-3 text-right">{c.counts.products}</td>
              <td className="px-4 py-3 text-right">{c.counts.courses}</td>
              <td className="px-4 py-3 text-right">{c.counts.exams}</td>
              <td className="px-4 py-3 text-right">{c.counts.questions}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <ProgramDialog
                    trigger={
                      <Button size="sm" variant="ghost">
                        Ubah
                      </Button>
                    }
                    defaults={{ id: c.id, name: c.name, shortName: c.shortName, slug: c.slug, description: c.description, audience: c.audience, order: String(c.order) }}
                  />
                  {c.used === 0 && <DeleteProgramButton id={c.id} name={c.name} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Program / kategori ujian (M.1).
export default function AdminProgramsPage() {
  return (
    <>
      <DashboardHeading
        title="Program"
        action={
          <ProgramDialog
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Tambah program
              </Button>
            }
            defaults={{ name: "", shortName: "", slug: "", description: "", audience: "", order: "0" }}
          />
        }
      >
        Kelompok ujian seperti UTBK/SNBT atau SKD CPNS. Program yang masih dipakai tidak bisa dihapus.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
