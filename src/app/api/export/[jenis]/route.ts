import { NextResponse } from "next/server";

import { toCsv } from "@/features/admin/questions/csv";
import { reportRange } from "@/features/admin/report-range";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/rbac";

// Unduhan laporan admin (M.2, L.2.9) sebagai CSV: transaksi, pengguna, atau progres kelas.
// Nilai tryout ada di /api/export/nilai/[examId] dan bank soal di /api/export/bank-soal.

const wib = (d: Date | null) => (d ? new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16).replace("T", " ") : "");

function csv(rows: string[][], name: string) {
  return new NextResponse(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` } });
}

export async function GET(request: Request, ctx: RouteContext<"/api/export/[jenis]">) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });
  const { jenis } = await ctx.params;
  const params = Object.fromEntries(new URL(request.url).searchParams);

  if (jenis === "transaksi") {
    const range = reportRange(params);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: range.start, lt: range.end }, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        number: true,
        status: true,
        subtotal: true,
        discount: true,
        total: true,
        createdAt: true,
        paidAt: true,
        voucher: { select: { code: true } },
        user: { select: { name: true, email: true } },
        items: { select: { nameSnapshot: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { method: true } },
      },
    });
    return csv(
      [
        ["nomor", "dibuat_wib", "dibayar_wib", "status", "pembeli", "email", "produk", "metode", "voucher", "subtotal", "diskon", "total"],
        ...orders.map((o) => [
          o.number,
          wib(o.createdAt),
          wib(o.paidAt),
          o.status.toLowerCase(),
          o.user.name,
          o.user.email,
          o.items.map((i) => i.nameSnapshot).join("; "),
          o.payments[0]?.method.toLowerCase() ?? "",
          o.voucher?.code ?? "",
          String(o.subtotal),
          String(o.discount),
          String(o.total),
        ]),
      ],
      `transaksi-${range.from}-sd-${range.to}`,
    );
  }

  if (jenis === "pengguna") {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { name: true, email: true, role: true, isActive: true, createdAt: true, lastLoginAt: true, profile: { select: { phone: true, educationLevel: true, examTarget: true, city: true } } },
    });
    return csv(
      [
        ["nama", "email", "role", "aktif", "whatsapp", "jenjang", "target", "kota", "terdaftar_wib", "masuk_terakhir_wib"],
        ...users.map((u) => [
          u.name,
          u.email,
          u.role.toLowerCase(),
          u.isActive ? "ya" : "tidak",
          u.profile?.phone ?? "",
          u.profile?.educationLevel ?? "",
          u.profile?.examTarget ?? "",
          u.profile?.city ?? "",
          wib(u.createdAt),
          wib(u.lastLoginAt),
        ]),
      ],
      "pengguna",
    );
  }

  if (jenis === "progres") {
    const courseId = params.kelas;
    const course = courseId ? await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true, sections: { select: { _count: { select: { lessons: true } } } } } }) : null;
    if (!course) return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    const total = course.sections.reduce((n, s) => n + s._count.lessons, 0);
    const progress = await prisma.lessonProgress.findMany({
      where: { lesson: { section: { courseId } } },
      select: { completedAt: true, watchedSec: true, updatedAt: true, user: { select: { id: true, name: true, email: true } } },
    });
    const byUser = new Map<string, { name: string; email: string; done: number; watched: number; last: Date }>();
    for (const p of progress) {
      const cur = byUser.get(p.user.id) ?? { name: p.user.name, email: p.user.email, done: 0, watched: 0, last: p.updatedAt };
      cur.done += p.completedAt ? 1 : 0;
      cur.watched += p.watchedSec;
      if (p.updatedAt > cur.last) cur.last = p.updatedAt;
      byUser.set(p.user.id, cur);
    }
    return csv(
      [
        ["nama", "email", "materi_selesai", "total_materi", "persen", "menit_tonton", "aktivitas_terakhir_wib"],
        ...[...byUser.values()].map((u) => [u.name, u.email, String(u.done), String(total), total ? String(Math.round((u.done / total) * 100)) : "0", String(Math.round(u.watched / 60)), wib(u.last)]),
      ],
      `progres-${course.slug}`,
    );
  }

  if (jenis === "nilai-tryout" && params.tryout) {
    return NextResponse.redirect(new URL(`/api/export/nilai/${encodeURIComponent(params.tryout)}`, request.url));
  }

  return NextResponse.json({ error: "Jenis laporan tidak dikenal." }, { status: 404 });
}
