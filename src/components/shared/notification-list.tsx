"use client";

import { Bell, ClipboardList, GraduationCap, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { bacaNotifikasi } from "@/features/dashboard/actions";
import { formatTanggalJam } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = { id: string; type: "TRANSAKSI" | "TRYOUT" | "KELAS" | "SISTEM"; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date };

const icons = { TRANSAKSI: Receipt, TRYOUT: ClipboardList, KELAS: GraduationCap, SISTEM: Bell };

/** Daftar notifikasi (F.1, B.2.4). Yang belum dibaca ditandai teks, bukan warna saja. */
export function NotificationList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = items.filter((i) => !i.readAt).length;

  const mark = (id?: string) =>
    startTransition(async () => {
      const r = await bacaNotifikasi({ id });
      if (!r.ok) return void toast.error(r.error);
      if (!id) toast.success("Semua notifikasi ditandai dibaca.");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">{unread} belum dibaca</p>
        <Button variant="outline" size="sm" disabled={pending || unread === 0} onClick={() => mark()}>
          Tandai semua dibaca
        </Button>
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" /* taste-skill-ignore: daftar padat dashboard, border tipis sesuai CLAUDE.md */>
        {items.map((n) => {
          const Icon = icons[n.type];
          const body = (
            <>
              <Icon className={cn("mt-0.5 size-5 shrink-0", n.readAt ? "text-muted-foreground" : "text-primary")} aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className={n.readAt ? "font-semibold" : "font-bold"}>{n.title}</span>
                  {!n.readAt && <span className="text-sm font-semibold text-bark">Baru</span>}
                </span>
                <span className="text-muted-foreground">{n.body}</span>
                <time dateTime={new Date(n.createdAt).toISOString()} className="text-sm text-muted-foreground">
                  {formatTanggalJam(new Date(n.createdAt))}
                </time>
              </span>
            </>
          );
          const cls = cn("flex w-full items-start gap-3 px-4 py-3 text-left", !n.readAt && "bg-accent/50", "hover:bg-secondary");
          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className={cls} onClick={() => !n.readAt && mark(n.id)}>
                  {body}
                </Link>
              ) : (
                <button type="button" className={cls} onClick={() => !n.readAt && mark(n.id)}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
