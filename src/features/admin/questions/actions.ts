"use server";

import ExcelJS from "exceljs";
import { revalidatePath, updateTag } from "next/cache";

import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { adminAction, audit, type Admin } from "../guard";
import { parseCsv, rowsToQuestions, type ImportRowError } from "./csv";
import { bulkStatusSchema, idsSchema, normalizeOptions, questionSchema, type QuestionOutput } from "./schemas";

const revalidate = (id?: string) => {
  revalidatePath("/admin/bank-soal");
  if (id) revalidatePath(`/admin/bank-soal/${id}`);
  // Isi tryout publik di-cache dengan tag katalog.
  updateTag("katalog");
};

const questionData = (q: QuestionOutput) => ({
  categoryId: q.categoryId,
  subject: q.subject,
  topic: q.topic,
  difficulty: q.difficulty,
  type: q.type,
  body: q.body,
  explanation: q.explanation,
  explanationVideoUrl: q.explanationVideoUrl || null,
  imageId: q.imageId,
  correctText: q.type === "ISIAN_SINGKAT" ? q.correctText : null,
  correctNumber: q.type === "NUMERIK" ? q.correctNumber : null,
  tolerance: q.type === "NUMERIK" ? q.tolerance : null,
  weight: q.weight ?? 1,
  status: q.status,
});

async function createQuestion(admin: Admin, q: QuestionOutput) {
  return prisma.question.create({
    data: { ...questionData(q), createdById: admin.id, options: { create: normalizeOptions(q) } },
    select: { id: true },
  });
}

/**
 * Buat atau ubah soal (M.5.1). Opsi diperbarui di tempat menurut urutan agar ID opsi tetap
 * sama: jawaban percobaan lama menyimpan ID opsi, jadi riwayat tidak rusak.
 */
export async function simpanSoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = questionSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const q = parsed.data;
    if (!(await prisma.courseCategory.findUnique({ where: { id: q.categoryId }, select: { id: true } }))) {
      return fail("Kategori tidak ditemukan.", { categoryId: "Pilih kategori yang ada" });
    }

    if (!q.id) {
      const created = await createQuestion(admin, q);
      await audit(prisma, admin, "soal.buat", "Question", created.id, { after: { subject: q.subject, topic: q.topic, type: q.type } });
      revalidate();
      return ok(created);
    }

    const id = q.id;
    const before = await prisma.question.findFirst({ where: { id, deletedAt: null }, include: { options: { orderBy: { order: "asc" } } } });
    if (!before) return fail("Soal tidak ditemukan.");
    const next = normalizeOptions(q);
    await prisma.$transaction(async (tx) => {
      await tx.question.update({ where: { id }, data: questionData(q) });
      // Geser urutan lama sementara agar unique (questionId, order) tidak bentrok.
      await tx.questionOption.updateMany({ where: { questionId: id }, data: { order: { increment: 100 } } });
      for (const [i, o] of next.entries()) {
        const existing = before.options[i];
        if (existing) await tx.questionOption.update({ where: { id: existing.id }, data: o });
        else await tx.questionOption.create({ data: { ...o, questionId: id } });
      }
      const extra = before.options.slice(next.length).map((o) => o.id);
      if (extra.length) await tx.questionOption.deleteMany({ where: { id: { in: extra } } });
    });
    await audit(prisma, admin, "soal.ubah", "Question", id, {
      before: { body: before.body, status: before.status, options: before.options.map((o) => ({ body: o.body, isCorrect: o.isCorrect })) },
      after: { body: q.body, status: q.status, options: next.map((o) => ({ body: o.body, isCorrect: o.isCorrect })) },
    });
    revalidate(id);
    return ok({ id });
  });
}

/** Duplikasi soal sebagai draf (M.5.5). */
export async function duplikasiSoal(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const src = await prisma.question.findFirst({ where: { id: parsed.data.ids[0], deletedAt: null }, include: { options: true } });
    if (!src) return fail("Soal tidak ditemukan.");
    const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, createdById: _by, options, ...data } = src;
    const copy = await prisma.question.create({
      data: {
        ...data,
        status: "DRAF",
        createdById: admin.id,
        options: { create: options.map(({ label, body, isCorrect, score, order, imageId }) => ({ label, body, isCorrect, score, order, imageId })) },
      },
      select: { id: true },
    });
    await audit(prisma, admin, "soal.duplikasi", "Question", copy.id, { before: { sumber: src.id } });
    revalidate();
    return ok(copy);
  });
}

/**
 * Hapus massal (M.5.7): soft delete. Soal yang sudah dipakai tryout dilewati agar tryout
 * dan riwayat nilai tetap utuh; keluarkan dulu dari tryout atau arsipkan.
 */
export async function hapusSoal(input: unknown): Promise<ActionResult<{ deleted: number; skipped: number }>> {
  return adminAction(async (admin) => {
    const parsed = idsSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const used = await prisma.examQuestion.findMany({ where: { questionId: { in: parsed.data.ids } }, distinct: ["questionId"], select: { questionId: true } });
    const usedIds = new Set(used.map((u) => u.questionId));
    const deletable = parsed.data.ids.filter((id) => !usedIds.has(id));
    if (deletable.length) {
      await prisma.question.updateMany({ where: { id: { in: deletable }, deletedAt: null }, data: { deletedAt: new Date() } });
      for (const id of deletable) await audit(prisma, admin, "soal.hapus", "Question", id);
    }
    revalidate();
    return ok({ deleted: deletable.length, skipped: usedIds.size });
  });
}

/** Terbitkan, jadikan draf, atau arsipkan massal (M.5.8). */
export async function aturStatusSoal(input: unknown): Promise<ActionResult<{ count: number }>> {
  return adminAction(async (admin) => {
    const parsed = bulkStatusSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const r = await prisma.question.updateMany({ where: { id: { in: parsed.data.ids }, deletedAt: null }, data: { status: parsed.data.status } });
    for (const id of parsed.data.ids) await audit(prisma, admin, "soal.status", "Question", id, { after: { status: parsed.data.status } });
    revalidate();
    return ok({ count: r.count });
  });
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;

async function readRows(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseCsv(await file.text());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const sheet = wb.worksheets[0];
  if (!sheet) return [];
  const rows: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= Math.max(row.cellCount, 16); c++) {
      const v = row.getCell(c).value;
      // Sel rich text, rumus, dan hyperlink diambil teksnya.
      const text =
        v === null || v === undefined
          ? ""
          : typeof v === "object"
            ? "richText" in v
              ? v.richText.map((t) => t.text).join("")
              : "result" in v
                ? String(v.result ?? "")
                : "text" in v
                  ? String(v.text)
                  : v instanceof Date
                    ? v.toISOString()
                    : ""
            : String(v);
      cells.push(text);
    }
    rows.push(cells);
  });
  return rows;
}

export interface ImportReport {
  mode: "periksa" | "impor";
  valid: number;
  imported: number;
  errors: ImportRowError[];
}

/**
 * Impor soal dari CSV/XLSX (M.5.2). Mode "periksa" hanya memvalidasi; mode "impor"
 * menyimpan baris yang valid sebagai draf atau status di file, sekaligus dalam satu transaksi.
 */
export async function imporSoal(formData: FormData): Promise<ActionResult<ImportReport>> {
  return adminAction(async (admin) => {
    const file = formData.get("file");
    const mode = formData.get("mode") === "impor" ? "impor" : "periksa";
    if (!(file instanceof File) || file.size === 0) return fail("Pilih file CSV atau XLSX.");
    if (!/\.(csv|xlsx)$/i.test(file.name)) return fail("Format file harus .csv atau .xlsx.");
    if (file.size > MAX_IMPORT_BYTES) return fail("Ukuran file maksimal 2 MB.");

    let rows: string[][];
    try {
      rows = await readRows(file);
    } catch {
      return fail("File tidak bisa dibaca. Pastikan file CSV (UTF-8) atau XLSX yang valid.");
    }
    if (rows.length - 1 > MAX_IMPORT_ROWS) return fail(`Maksimal ${MAX_IMPORT_ROWS} soal per impor. Pecah file menjadi beberapa bagian.`);

    const categories = await prisma.courseCategory.findMany({ select: { id: true, slug: true } });
    const { valid, errors } = rowsToQuestions(rows, new Map(categories.map((c) => [c.slug, c.id])));
    if (mode === "periksa" || valid.length === 0) return ok({ mode, valid: valid.length, imported: 0, errors });

    const parsed = valid.map((v) => questionSchema.parse(v.input));
    await prisma.$transaction(
      parsed.map((q) => prisma.question.create({ data: { ...questionData(q), createdById: admin.id, options: { create: normalizeOptions(q) } } })),
    );
    await audit(prisma, admin, "soal.impor", "Question", "-", { after: { file: file.name, jumlah: parsed.length } });
    revalidate();
    return ok({ mode, valid: valid.length, imported: parsed.length, errors });
  });
}
