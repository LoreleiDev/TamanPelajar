import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { DeleteSubjectButton, SubjectDialog } from "@/components/admin/subject-dialog";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { listSubjects } from "@/features/admin/subjects";

export const metadata: Metadata = { title: "Mata pelajaran", robots: { index: false } };

async function Content() {
  await adminPage("/admin/mata-pelajaran");
  const rows = await listSubjects();
  if (rows.length === 0) {
    return <EmptyState title="Belum ada mata pelajaran" description="Tambahkan mata pelajaran agar bisa dipilih di form kelas, video, dan bank soal." />;
  }
  return (
    <div
      className="relative overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      tabIndex={0}
      role="region"
      aria-label="Tabel, geser ke samping bila perlu"
    >
      <table className="w-full min-w-144 text-left">
        <caption className="sr-only">Daftar mata pelajaran</caption>
        <thead className="bg-secondary text-sm">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Mata pelajaran</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Urutan</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Kelas</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Video</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <th scope="row" className="px-4 py-3 font-semibold">
                {s.name}
              </th>
              <td className="px-4 py-3 text-right">{s.order}</td>
              <td className="px-4 py-3 text-right">{s.courses}</td>
              <td className="px-4 py-3 text-right">{s.videos}</td>
              <td className="px-4 py-3 text-right">{s.questions}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <SubjectDialog
                    defaults={{ id: s.id, name: s.name, order: String(s.order) }}
                    trigger={
                      <Button size="sm" variant="ghost">
                        Ubah<span className="sr-only"> {s.name}</span>
                      </Button>
                    }
                  />
                  {s.courses + s.videos + s.questions === 0 && <DeleteSubjectButton id={s.id} name={s.name} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mata pelajaran (revisi RMED): dipilih di form kelas, video, dan bank soal.
export default function AdminSubjectsPage() {
  return (
    <>
      <DashboardHeading
        title="Mata pelajaran"
        action={
          <SubjectDialog
            defaults={{ name: "", order: "0" }}
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Tambah mata pelajaran
              </Button>
            }
          />
        }
      >
        Daftar ini menjadi pilihan mata pelajaran di form kelas, video, dan bank soal. Mengganti nama ikut memperbarui semua yang memakainya.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
