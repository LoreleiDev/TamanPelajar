import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { questionsToRows, toCsv } from "@/features/admin/questions/csv";
import { exportQuestions } from "@/features/admin/questions/queries";
import { questionFilterSchema } from "@/features/admin/questions/schemas";
import { currentUser } from "@/lib/rbac";

// Ekspor bank soal (M.5.3) dengan filter yang sama seperti halaman bank soal. Kolomnya sama
// dengan template impor, jadi hasil ekspor bisa diedit lalu diimpor ulang.
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin." }, { status: 403 });
  const url = new URL(request.url);
  const { page: _page, ...filter } = questionFilterSchema.parse(Object.fromEntries(url.searchParams));
  const template = url.searchParams.get("template") === "1";
  const rows = questionsToRows(template ? [] : await exportQuestions(filter));
  const stamp = new Date().toISOString().slice(0, 10);
  const base = template ? "template-impor-soal" : `bank-soal-${stamp}`;

  if (url.searchParams.get("format") === "xlsx") {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Soal");
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((c) => (c.width = 18));
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
      },
    });
  }
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` },
  });
}
