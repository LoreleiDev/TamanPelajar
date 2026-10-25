import { NextResponse } from "next/server";

import { getExamResults } from "@/features/admin/exams/queries";
import { toCsv } from "@/features/admin/questions/csv";
import { currentUser } from "@/lib/rbac";

const num = (n: number) => String(Math.round(n * 100) / 100);
const wib = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16).replace("T", " ");

// Unduh laporan nilai satu tryout (L.2.9) sebagai CSV.
export async function GET(_request: Request, ctx: RouteContext<"/api/export/nilai/[examId]">) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });
  const { examId } = await ctx.params;
  const data = await getExamResults(examId);
  if (!data) return NextResponse.json({ error: "Tryout tidak ditemukan." }, { status: 404 });
  const { exam, attempts } = data;
  const rows = [
    ["nama", "email", "percobaan", "status", "nilai", "nilai_maks", ...exam.sections.map((s) => `subtes_${s.title}`), "benar", "salah", "kosong", "durasi_detik", "lulus", "dikumpulkan_wib", "essay_belum_dinilai"],
    ...attempts.map((a) => {
      const bySection = new Map(a.result?.sections.map((s) => [s.sectionId, s.score]));
      return [
        a.user.name,
        a.user.email,
        String(a.attemptNo),
        a.status.toLowerCase(),
        a.result ? num(a.result.totalScore) : "",
        a.result ? num(a.result.maxScore) : "",
        ...exam.sections.map((s) => (bySection.has(s.id) ? num(bySection.get(s.id)!) : "")),
        a.result ? String(a.result.correct) : "",
        a.result ? String(a.result.wrong) : "",
        a.result ? String(a.result.empty) : "",
        a.result ? String(a.result.durationSec) : "",
        a.result ? (a.result.passed ? "ya" : "tidak") : "",
        a.submittedAt ? wib(a.submittedAt) : "",
        String(a.pendingEssays),
      ];
    }),
  ];
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="nilai-${exam.slug}.csv"` },
  });
}
