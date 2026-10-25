import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { UserAccountActions, UserEditForm } from "@/components/admin/users/user-manage";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { Breadcrumb } from "@/components/shared/page-header";
import { PassStatus, StatusBadge } from "@/components/shared/status-badge";
import { EDUCATION_OPTIONS } from "@/features/auth/schemas";
import { adminPage } from "@/features/admin/guard";
import { attemptLabel, enrollmentLabel, enrollmentTone, roleLabel } from "@/features/admin/labels";
import { getUserDetail } from "@/features/admin/users/queries";
import { statusLabel, statusTone } from "@/features/payment/labels";
import { formatRupiah, formatStudyTime, formatTanggal, formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Detail pengguna", robots: { index: false } };

const score = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

function Table({ caption, head, children }: { caption: string; head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
      <table className="w-full min-w-136 text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-secondary text-sm">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">{children}</tbody>
      </table>
    </div>
  );
}

async function Content({ params }: { params: PageProps<"/admin/pengguna/[id]">["params"] }) {
  const { id } = await params;
  const admin = await adminPage(`/admin/pengguna/${id}`);
  const u = await getUserDetail(id);
  if (!u) notFound();
  const isSelf = u.id === admin.id;
  const education = EDUCATION_OPTIONS.find((o) => o.value === u.profile?.educationLevel)?.label;

  const info: [string, string][] = [
    ["Email", u.email],
    ["WhatsApp", u.profile?.phone ?? "Belum diisi"],
    ["Jenjang", education ?? "Belum diisi"],
    ["Target ujian", u.profile?.examTarget ?? "Belum diisi"],
    ["Sekolah atau kampus", u.profile?.school || "Belum diisi"],
    ["Kota", u.profile?.city || "Belum diisi"],
    ["Terdaftar", formatTanggalJam(u.createdAt)],
    ["Masuk terakhir", u.lastLoginAt ? formatTanggalJam(u.lastLoginAt) : "Belum pernah"],
    ["Cara masuk", [u.hasPassword && "Email dan password", ...u.accounts.map((a) => (a.provider === "google" ? "Google" : a.provider))].filter(Boolean).join(", ") || "–"],
    ["Email terverifikasi", u.emailVerified ? formatTanggal(u.emailVerified) : "Belum"],
    ["Total waktu belajar", formatStudyTime(u.studySeconds)],
  ];

  return (
    <>
      <Breadcrumb items={[{ label: "Pengguna", href: "/admin/pengguna" }, { label: u.name }]} />
      <DashboardHeading title={u.name}>
        {roleLabel[u.role]}
        {isSelf && " (akunmu)"}
      </DashboardHeading>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusBadge tone={u.isActive ? "berhasil" : "gagal"} variant="box">
          {u.isActive ? "Akun aktif" : "Akun nonaktif"}
        </StatusBadge>
        {u.lockedUntil && u.lockedUntil > new Date() && (
          <StatusBadge tone="menunggu">Login terkunci sampai {formatTanggalJam(u.lockedUntil)}</StatusBadge>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DashboardSection title="Data diri">
          <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[0.9375rem]">
            {info.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </DashboardSection>
        <div className="flex flex-col gap-8">
          <DashboardSection title="Ubah data">
            <UserEditForm user={{ id: u.id, name: u.name, email: u.email, role: u.role }} isSelf={isSelf} />
          </DashboardSection>
          <DashboardSection title="Akun">
            <UserAccountActions id={u.id} name={u.name} email={u.email} active={u.isActive} isSelf={isSelf} />
          </DashboardSection>
        </div>
      </div>

      <DashboardSection title="Program">
        {u.enrollments.length === 0 ? (
          <p className="text-muted-foreground">Belum memiliki program.</p>
        ) : (
          <Table caption="Program pengguna" head={["Paket", "Status", "Mulai", "Berakhir"]}>
            {u.enrollments.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <th scope="row" className="px-4 py-2.5 font-semibold">
                  <Link href={`/paket/${e.product.slug}`} className="hover:text-primary">
                    {e.product.name}
                  </Link>
                </th>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={e.status === "AKTIF" && e.expiresAt < new Date() ? "netral" : enrollmentTone[e.status]}>
                    {e.status === "AKTIF" && e.expiresAt < new Date() ? "Masa aktif habis" : enrollmentLabel[e.status]}
                  </StatusBadge>
                </td>
                <td className="px-4 py-2.5 text-sm">{formatTanggal(e.startsAt)}</td>
                <td className="px-4 py-2.5 text-sm">{formatTanggal(e.expiresAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </DashboardSection>

      <DashboardSection title="Riwayat belajar">
        {u.courses.length === 0 ? (
          <p className="text-muted-foreground">Belum membuka materi kelas.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {u.courses.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5">
                <GrowthProgress value={c.total ? (c.done / c.total) * 100 : 0} label={c.title} />
                <span className="text-sm text-muted-foreground tabular-nums">
                  {c.done} dari {c.total} materi selesai, terakhir dibuka {formatTanggal(c.last)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Tryout">
        {u.examAttempts.length === 0 ? (
          <p className="text-muted-foreground">Belum mengerjakan tryout.</p>
        ) : (
          <Table caption="Riwayat tryout pengguna" head={["Tryout", "Percobaan", "Nilai", "Status", "Mulai"]}>
            {u.examAttempts.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <th scope="row" className="px-4 py-2.5 font-semibold">
                  {a.result ? (
                    <Link href={`/tryout/hasil/${a.id}`} className="text-primary hover:underline">
                      {a.exam.title}
                    </Link>
                  ) : (
                    a.exam.title
                  )}
                </th>
                <td className="px-4 py-2.5">ke-{a.attemptNo}</td>
                <td className="px-4 py-2.5">{a.result ? `${score(a.result.totalScore)} / ${score(a.result.maxScore)}` : "–"}</td>
                <td className="px-4 py-2.5">{a.result ? <PassStatus passed={a.result.passed} /> : attemptLabel[a.status]}</td>
                <td className="px-4 py-2.5 text-sm">{formatTanggalJam(a.startedAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </DashboardSection>

      <DashboardSection title="Transaksi">
        {u.orders.length === 0 ? (
          <p className="text-muted-foreground">Belum ada transaksi.</p>
        ) : (
          <Table caption="Transaksi pengguna" head={["Nomor", "Produk", "Total", "Status", "Tanggal"]}>
            {u.orders.map((o) => (
              <tr key={o.number} className="border-t border-border">
                <th scope="row" className="px-4 py-2.5 font-semibold">
                  <Link href={`/admin/transaksi/${o.number}`} className="text-primary hover:underline">
                    {o.number}
                  </Link>
                </th>
                <td className="px-4 py-2.5">{o.items.map((i) => i.nameSnapshot).join(", ")}</td>
                <td className="px-4 py-2.5">{formatRupiah(o.total)}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge tone={statusTone[o.status]}>{statusLabel[o.status]}</StatusBadge>
                </td>
                <td className="px-4 py-2.5 text-sm">{formatTanggalJam(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </DashboardSection>
    </>
  );
}

// Detail pengguna (M.3): data diri, ubah data, status akun, riwayat belajar, transaksi.
export default function AdminUserDetailPage({ params }: PageProps<"/admin/pengguna/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
