"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { rescoreAttempt } from "@/features/exam/attempt";
import { fail, invalidInput, ok, type ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

import { essayMaxScore } from "./grading";
import { adminAction, audit } from "./guard";

const gradeSchema = z.object({
  answerId: z.string().min(1),
  score: z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => /^\d+(\.\d+)?$/.test(v), "Nilai harus angka 0 atau lebih")
    .transform(Number),
});

/**
 * Nilai jawaban essay (L.2.7), lalu hitung ulang nilai percobaan itu: total, subtes,
 * kelulusan, dan analisis topik. Siswa mendapat notifikasi.
 */
export async function nilaiEssay(input: unknown): Promise<ActionResult<{ pending: number }>> {
  return adminAction(async (admin) => {
    const parsed = gradeSchema.safeParse(input);
    if (!parsed.success) return invalidInput(parsed.error);
    const info = await essayMaxScore(parsed.data.answerId);
    if (!info) return fail("Jawaban tidak ditemukan.");
    if (parsed.data.score > info.maxScore) {
      return fail(`Nilai maksimal ${String(info.maxScore).replace(".", ",")}.`, { score: `Maksimal ${String(info.maxScore).replace(".", ",")}` });
    }
    const before = await prisma.examAnswer.findUnique({ where: { id: parsed.data.answerId }, select: { score: true, gradedById: true } });
    await prisma.examAnswer.update({ where: { id: parsed.data.answerId }, data: { score: parsed.data.score, gradedById: admin.id } });
    const result = await rescoreAttempt(info.attemptId);
    if (!result) return fail("Percobaan belum selesai, jadi belum bisa dinilai.");
    if (result.pending === 0) {
      await prisma.notification.create({
        data: {
          userId: info.userId,
          type: "TRYOUT",
          title: "Essay sudah dinilai",
          body: `Nilai akhir ${info.examTitle} diperbarui setelah essay dinilai admin.`,
          href: `/tryout/hasil/${info.attemptId}`,
        },
      });
    }
    await audit(prisma, admin, before?.gradedById ? "essay.nilai-ulang" : "essay.nilai", "ExamAnswer", parsed.data.answerId, {
      before: before?.gradedById ? { score: before.score } : undefined,
      after: { score: parsed.data.score },
    });
    revalidatePath("/admin/penilaian");
    return ok({ pending: result.pending });
  });
}
