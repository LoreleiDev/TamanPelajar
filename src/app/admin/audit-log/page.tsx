import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { adminPage } from "@/features/admin/guard";
import { listAuditLogs } from "@/features/admin/queries";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log", robots: { index: false } };

const filterSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  entity: z.string().trim().max(40).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

/** Tautan ke halaman entitas yang punya halaman detail admin. */
function entityHref(entity: string, id: string) {
  if (entity === "User") return `/admin/pengguna/${id}`;
  if (entity === "Voucher") return `/admin/voucher/${id}`;
  return null;
}

const json = (v: unknown) => JSON.stringify(v, null, 2);

async function Content({ searchParams }: { searchParams: PageProps<"/admin/audit-log">["searchParams"] }) {
  await adminPage("/admin/audit-log");
  const filter = filterSchema.parse(await searchParams);
  const data = await listAuditLogs(filter);
  return (
    <>
      <FilterBar
        action="/admin/audit-log"
        q={filter.q}
        searchLabel="Cari tindakan"
        placeholder="Nama admin, tindakan, atau ID"
        selects={[{ name: "entity", label: "Entitas", value: filter.entity, options: data.entities.map((e) => ({ value: e, label: e })) }]}
      />
      {data.rows.length === 0 ? (
        <EmptyState title="Belum ada catatan" description="Setiap tindakan admin (ubah data, verifikasi pembayaran, hapus) tercatat di sini." />
      ) : (
        <ol className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {data.rows.map((l) => {
            const href = entityHref(l.entity, l.entityId);
            const hasDetail = l.before !== null || l.after !== null;
            return (
              <li key={l.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-sm font-semibold">{l.action}</code>
                  <span className="text-sm">
                    {l.entity}{" "}
                    {href ? (
                      <Link href={href} className="text-primary hover:underline">
                        {l.entityId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{l.entityId}</span>
                    )}
                  </span>
                  <time dateTime={l.createdAt.toISOString()} className="ml-auto text-sm text-muted-foreground">
                    {formatTanggalJam(l.createdAt)}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground">
                  oleh{" "}
                  <Link href={`/admin/pengguna/${l.actor.id}`} className="font-semibold text-foreground hover:text-primary">
                    {l.actor.name}
                  </Link>
                  {l.ip && `, IP ${l.ip}`}
                </p>
                {hasDetail && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-primary">Lihat perubahan</summary>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      {l.before !== null && (
                        <div className="min-w-0">
                          <p className="font-semibold">Sebelum</p>
                          <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-secondary p-3 text-xs">{json(l.before)}</pre>
                        </div>
                      )}
                      {l.after !== null && (
                        <div className="min-w-0">
                          <p className="font-semibold">Sesudah</p>
                          <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-secondary p-3 text-xs">{json(l.after)}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/audit-log", filter, p)} />
    </>
  );
}

// Audit log tindakan admin (P.1.10).
export default function AuditLogPage({ searchParams }: PageProps<"/admin/audit-log">) {
  return (
    <>
      <DashboardHeading title="Audit log">Catatan setiap tindakan admin: siapa, apa, kapan, dan perubahannya.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
