import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { BannerDialog } from "@/components/admin/banner-dialog";
import { DeleteButton } from "@/components/admin/delete-button";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { listAdminBanners } from "@/features/admin/site";
import { hapusBanner } from "@/features/admin/site-actions";
import { toJakartaInput } from "@/lib/datetime";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Banner", robots: { index: false } };

function bannerState(b: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }, now: Date) {
  if (!b.isActive) return { label: "Nonaktif", tone: "netral" as const };
  if (b.startsAt && b.startsAt > now) return { label: "Terjadwal", tone: "menunggu" as const };
  if (b.endsAt && b.endsAt < now) return { label: "Selesai tayang", tone: "netral" as const };
  return { label: "Tayang", tone: "berhasil" as const };
}

async function Content() {
  await adminPage("/admin/banner");
  const rows = await listAdminBanners();
  const now = new Date();
  if (rows.length === 0) return <EmptyState title="Belum ada banner" description="Banner aktif tampil di beranda, misalnya untuk promo atau jadwal tryout akbar." />;
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {rows.map((b) => {
        const s = bannerState(b, now);
        return (
          <li key={b.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau Cloudinary */}
            <img src={b.imageUrl} alt={b.title} className="aspect-[3/1] w-full rounded-lg object-cover" />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm text-muted-foreground tabular-nums">#{b.order}</span>
              <span className="font-semibold">{b.title}</span>
              <StatusBadge tone={s.tone} className="text-sm">
                {s.label}
              </StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground">
              {b.href ?? "Tanpa tautan"}
              {(b.startsAt || b.endsAt) && ` · ${b.startsAt ? formatTanggalJam(b.startsAt) : "sekarang"} s.d. ${b.endsAt ? formatTanggalJam(b.endsAt) : "tanpa batas"}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <BannerDialog
                trigger={
                  <Button size="sm" variant="outline">
                    Ubah
                  </Button>
                }
                image={{ id: b.imageId, url: b.imageUrl, name: b.title }}
                defaults={{
                  id: b.id,
                  title: b.title,
                  imageId: b.imageId,
                  href: b.href ?? "",
                  order: String(b.order),
                  isActive: b.isActive,
                  startsAt: toJakartaInput(b.startsAt),
                  endsAt: toJakartaInput(b.endsAt),
                }}
              />
              <DeleteButton
                size="sm"
                label="Hapus"
                title={`Hapus banner ${b.title}?`}
                description="Banner dihapus dari beranda."
                action={hapusBanner.bind(null, { id: b.id })}
                successMessage="Banner dihapus."
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Banner beranda (C.2.8).
export default function AdminBannersPage() {
  return (
    <>
      <DashboardHeading
        title="Banner"
        action={
          <BannerDialog
            image={null}
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Tambah banner
              </Button>
            }
            defaults={{ title: "", imageId: "", href: "", order: "0", isActive: true, startsAt: "", endsAt: "" }}
          />
        }
      >
        Gambar promosi di beranda dengan jadwal tayang opsional.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
