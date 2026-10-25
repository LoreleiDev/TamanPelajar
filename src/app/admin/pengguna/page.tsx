import type { Metadata } from "next";
import { Suspense } from "react";

import { DataPagination } from "@/components/shared/data-pagination";
import { FilterBar, pageHref } from "@/components/admin/filter-bar";
import { UserCreateDialog } from "@/components/admin/users/user-create-dialog";
import { UserTable } from "@/components/admin/users/user-table";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { adminPage } from "@/features/admin/guard";
import { listUsers } from "@/features/admin/users/queries";
import { userFilterSchema } from "@/features/admin/users/schemas";

export const metadata: Metadata = { title: "Pengguna", robots: { index: false } };

const nf = new Intl.NumberFormat("id-ID");

async function Content({ searchParams }: { searchParams: PageProps<"/admin/pengguna">["searchParams"] }) {
  await adminPage("/admin/pengguna");
  const filter = userFilterSchema.parse(await searchParams);
  const data = await listUsers(filter);
  return (
    <>
      <FilterBar
        action="/admin/pengguna"
        q={filter.q}
        searchLabel="Cari pengguna"
        placeholder="Nama atau email"
        selects={[
          { name: "role", label: "Role", value: filter.role, options: [{ value: "USER", label: "Siswa" }, { value: "ADMIN", label: "Administrator" }] },
          { name: "status", label: "Status", value: filter.status, options: [{ value: "aktif", label: "Aktif" }, { value: "nonaktif", label: "Nonaktif" }] },
        ]}
      />
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {nf.format(data.total)} pengguna
      </p>
      {data.rows.length === 0 ? (
        <EmptyState title="Tidak ada pengguna yang cocok" description="Ubah kata kunci atau filter, atau tambahkan pengguna baru." />
      ) : (
        <UserTable rows={data.rows} />
      )}
      <DataPagination page={data.page} pageCount={data.pageCount} hrefFor={(p) => pageHref("/admin/pengguna", filter, p)} />
    </>
  );
}

// Kelola pengguna (M.3, C.2.1).
export default function AdminUsersPage({ searchParams }: PageProps<"/admin/pengguna">) {
  return (
    <>
      <DashboardHeading title="Pengguna" action={<UserCreateDialog />}>
        Tambah, ubah, nonaktifkan, dan reset password akun siswa maupun administrator.
      </DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}
