import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DeleteButton } from "@/components/admin/delete-button";
import { PublishTestimonialButton, TestimonialDialog } from "@/components/admin/testimonial-dialog";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { listAdminTestimonials } from "@/features/admin/site";
import { hapusTestimoni } from "@/features/admin/site-actions";

export const metadata: Metadata = { title: "Testimoni", robots: { index: false } };

async function Content() {
  await adminPage("/admin/testimoni");
  const rows = await listAdminTestimonials();
  if (rows.length === 0) return <EmptyState title="Belum ada testimoni" description="Testimoni yang ditampilkan muncul di beranda dalam urutan yang diatur di sini." />;
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((t) => (
        <li key={t.id} className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm text-muted-foreground tabular-nums">#{t.order}</span>
            <span className="font-semibold">{t.name}</span>
            <span className="text-sm text-muted-foreground">{t.program}</span>
            {t.isPending ? (
              <StatusBadge tone="menunggu" className="text-sm">
                Menunggu tinjauan
              </StatusBadge>
            ) : (
              <StatusBadge tone={t.isPublished ? "berhasil" : "netral"} className="text-sm">
                {t.isPublished ? "Tampil" : "Disembunyikan"}
              </StatusBadge>
            )}
            {t.user && (
              <span className="text-sm text-muted-foreground">
                dikirim siswa{" "}
                <Link href={`/admin/pengguna/${t.user.id}`} className="font-semibold text-primary hover:underline">
                  {t.user.email}
                </Link>
              </span>
            )}
          </div>
          <p className="font-semibold">“{t.opening}”</p>
          <p className="max-w-[75ch] text-muted-foreground">{t.body}</p>
          <div className="flex flex-wrap gap-2">
            {t.isPending && <PublishTestimonialButton id={t.id} />}
            <TestimonialDialog
              trigger={
                <Button size="sm" variant="outline">
                  Ubah
                </Button>
              }
              defaults={{ id: t.id, name: t.name, program: t.program, opening: t.opening, body: t.body, isPublished: t.isPublished, order: String(t.order) }}
            />
            <DeleteButton
              size="sm"
              label="Hapus"
              title={`Hapus testimoni ${t.name}?`}
              description="Testimoni dihapus permanen dari beranda."
              action={hapusTestimoni.bind(null, { id: t.id })}
              successMessage="Testimoni dihapus."
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

// Testimoni beranda (M.1, D.1.7).
export default function AdminTestimonialsPage() {
  return (
    <>
      <DashboardHeading
        title="Testimoni"
        action={
          <TestimonialDialog
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Tambah testimoni
              </Button>
            }
            defaults={{ name: "", program: "", opening: "", body: "", isPublished: true, order: "0" }}
          />
        }
      >
        Cerita siswa di beranda. Testimoni yang dikirim siswa setelah menyelesaikan kelas masuk sebagai &ldquo;Menunggu tinjauan&rdquo;
        dan baru tampil setelah diterbitkan. Tulis apa adanya, tanpa angka atau klaim yang dilebih-lebihkan.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
