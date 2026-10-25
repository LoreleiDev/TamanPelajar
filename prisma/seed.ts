// Seed data demo Taman Pelajar (butir O). Bisa dijalankan ulang: semua tabel dikosongkan lalu diisi.
// Jalankan: pnpm prisma db seed

import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import { PrismaClient } from "../src/generated/prisma/client";
import { scoreExam, type ScoringAnswer, type ScoringQuestion } from "../src/features/scoring/score";
import {
  articles,
  categories,
  courses,
  homeFaq,
  productFaq,
  products,
  testimonials,
  vouchers,
} from "./seed/catalog";
import { simplePdf } from "./seed/pdf";
import { exams, questions } from "./seed/questions";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diisi di .env");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const DEMO_PASSWORD = "Demo12345!";
// Video contoh orisinal per kelas dibuat oleh `pnpm seed:video` (prisma/seed/generate-videos.mts)
// dan disajikan sebagai MP4 oleh Cloudinary. TODO: ganti dengan video pembelajaran asli.
const SAMPLE_VIDEO_SECONDS = 24;
const sampleVideoUrl = (courseSlug: string) =>
  process.env.CLOUDINARY_CLOUD_NAME
    ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/q_auto/${process.env.CLOUDINARY_UPLOAD_FOLDER ?? "tamanpelajar"}/kelas/video-${courseSlug}.mp4`
    : "https://res.cloudinary.com/demo/video/upload/dog.mp4";

const cloudinaryReady = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);
if (cloudinaryReady) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
const uploadFolder = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? "tamanpelajar"}/kelas`;

/**
 * Unggah PDF ringkasan sebagai file berbayar (raw, delivery authenticated) lalu catat di
 * Media. Mengembalikan null bila Cloudinary belum dikonfigurasi atau gagal, agar seed tetap jalan.
 */
async function uploadSummaryPdf(uploaderId: string, name: string, title: string, paragraphs: string[]) {
  if (!cloudinaryReady) return null;
  try {
    const pdf = simplePdf(title, paragraphs);
    const r = await cloudinary.uploader.upload(`data:application/pdf;base64,${pdf.toString("base64")}`, {
      resource_type: "raw",
      type: "authenticated",
      public_id: `${uploadFolder}/${name}.pdf`,
      overwrite: true,
    });
    return prisma.media.create({
      data: {
        publicId: r.public_id,
        resourceType: "RAW",
        format: "pdf",
        version: r.version,
        bytes: r.bytes,
        deliveryType: "AUTHENTICATED",
        folder: uploadFolder,
        uploadedById: uploaderId,
      },
    });
  } catch (e) {
    console.warn(`  Lewati PDF ${name}: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    return null;
  }
}

const DAY = 86_400_000;
const now = new Date();
const daysAgo = (d: number, hour = 9) => {
  const t = new Date(now.getTime() - d * DAY);
  t.setUTCHours(hour, 0, 0, 0);
  return t;
};
const daysAhead = (d: number) => new Date(now.getTime() + d * DAY);

// PRNG deterministik agar seed menghasilkan data yang sama setiap kali.
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261024);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function wipe() {
  const tables = await prisma.$queryRawUnsafe<{ t: string }[]>(
    "SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> '_prisma_migrations'",
  );
  // Satu transaksi = satu koneksi, sehingga FOREIGN_KEY_CHECKS berlaku untuk semua TRUNCATE.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
      for (const { t } of tables) await tx.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\``);
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    },
    { timeout: 60_000 },
  );
  console.log(`  ${tables.length} tabel dikosongkan`);
}

async function main() {
  console.log("Seed Taman Pelajar");
  await wipe();

  // ─── O.1 Pengguna ───
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@tamanpelajar.test",
      name: "Admin Taman Pelajar",
      role: "ADMIN",
      passwordHash,
      emailVerified: daysAgo(120),
      createdAt: daysAgo(120),
      profile: { create: { phone: "081200000000", educationLevel: "S1", completedAt: daysAgo(120) } },
    },
  });

  const studentSeeds = [
    { name: "Nadia Rahmawati", level: "UMUM", target: "SKD CPNS", joined: 40 },
    { name: "Fikri Ananda", level: "SMA", target: "UTBK/SNBT", joined: 60 },
    { name: "Salsa Putri", level: "UMUM", target: "SKD CPNS", joined: 25 },
    { name: "Dimas Wicaksono", level: "SMA", target: "UTBK/SNBT", joined: 8 },
    { name: "Ayu Lestari", level: "S1", target: "Tes Potensi Akademik", joined: 150 },
  ] as const;
  const users = [];
  for (const [i, s] of studentSeeds.entries()) {
    users.push(
      await prisma.user.create({
        data: {
          email: `user${i + 1}@tamanpelajar.test`,
          name: s.name,
          passwordHash,
          emailVerified: daysAgo(s.joined),
          createdAt: daysAgo(s.joined),
          lastLoginAt: daysAgo(randInt(0, 3)),
          profile: {
            create: {
              phone: `0812345678${i + 1}0`,
              educationLevel: s.level,
              examTarget: s.target,
              city: ["Bandung", "Yogyakarta", "Makassar", "Medan", "Surabaya"][i],
              completedAt: daysAgo(s.joined),
            },
          },
        },
      }),
    );
  }
  const [nadia, fikri, salsa, dimas, ayu] = users;
  console.log(`  ${users.length + 1} pengguna (password ${DEMO_PASSWORD})`);

  // ─── O.2 Program ───
  const categoryId = new Map<string, string>();
  for (const [order, c] of categories.entries()) {
    const row = await prisma.courseCategory.create({ data: { ...c, order } });
    categoryId.set(c.slug, row.id);
  }
  const cat = (slug: string) => {
    const id = categoryId.get(slug);
    if (!id) throw new Error(`Kategori ${slug} tidak ada`);
    return id;
  };

  // ─── Bank soal ───
  const questionRows = new Map<string, { id: string; optionIds: string[]; seed: (typeof questions)[number] }>();
  for (const q of questions) {
    const options = (q.options ?? []).map((text, order) => ({
      label: String.fromCharCode(65 + order),
      body: text.replace(/^\*/, ""),
      isCorrect: text.startsWith("*"),
      order,
    }));
    const row = await prisma.question.create({
      data: {
        categoryId: cat(q.category),
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        body: q.body,
        explanation: q.explanation,
        correctText: q.correctText ?? null,
        correctNumber: q.correctNumber ?? null,
        tolerance: q.tolerance ?? null,
        status: "TERBIT",
        createdById: admin.id,
        options: { create: options },
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
    questionRows.set(q.key, { id: row.id, optionIds: row.options.map((o) => o.id), seed: q });
  }
  const qid = (key: string) => {
    const r = questionRows.get(key);
    if (!r) throw new Error(`Soal ${key} tidak ada`);
    return r;
  };
  console.log(`  ${questions.length} soal`);

  // ─── O.3 Kelas, bab, materi, video, kuis ───
  const courseId = new Map<string, string>();
  const lessonsByCourse = new Map<string, { id: string; sectionOrder: number; videoId: string | null }[]>();
  let videoCount = 0;
  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        categoryId: cat(c.category),
        subject: c.subject,
        level: c.level,
        status: "TERBIT",
        estimatedMinutes: 0,
        createdAt: daysAgo(100),
      },
    });
    courseId.set(c.slug, course.id);
    const lessons: { id: string; sectionOrder: number; videoId: string | null }[] = [];
    let seconds = 0;

    for (const [order, chapter] of c.chapters.entries()) {
      const section = await prisma.courseSection.create({
        data: { courseId: course.id, title: chapter.title, order, isFree: order < 2 },
      });
      for (const [i, title] of chapter.lessons.entries()) {
        const durationSec = SAMPLE_VIDEO_SECONDS;
        seconds += durationSec;
        const video = await prisma.video.create({
          data: {
            slug: `${c.slug}-${slugify(title)}`,
            title,
            description: `${title} dalam kelas ${c.title}. Video ini menjelaskan konsepnya dengan contoh soal dan langkah penyelesaian.`,
            transcript: [
              `Halo, di video ini kita membahas ${title.toLowerCase()}.`,
              `Pertama, kita lihat contoh soal yang sering muncul di ${c.subject}.`,
              "Perhatikan kata kunci di soal, lalu tentukan langkah yang paling cepat.",
              "Terakhir, coba kerjakan latihan di bawah video sebelum lanjut ke materi berikutnya.",
            ].join("\n\n"),
            provider: "EKSTERNAL",
            url: sampleVideoUrl(c.slug),
            durationSec,
            subject: c.subject,
            difficulty: c.level,
            categoryId: cat(c.category),
            status: "TERBIT",
            createdAt: daysAgo(100 - videoCount),
          },
        });
        videoCount += 1;
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            slug: slugify(title),
            title,
            summary: `Konsep dan contoh soal ${title.toLowerCase()}.`,
            type: "VIDEO",
            order: i,
            durationSec,
            videoId: video.id,
            content: `<p>Materi ini membahas <strong>${title.toLowerCase()}</strong> sebagai bagian dari bab “${chapter.title}”.</p><p>Tonton videonya sampai selesai, lalu tulis ringkasan dengan kata-katamu sendiri di kolom catatan. Ringkasan singkat membantu saat mengulang menjelang tryout.</p>`,
          },
        });
        lessons.push({ id: lesson.id, sectionOrder: order, videoId: video.id });
      }
      if (chapter.quiz) {
        const quiz = await prisma.quiz.create({
          data: {
            title: `Kuis: ${chapter.title}`,
            passingScore: 60,
            questions: { create: chapter.quiz.map((key, order) => ({ questionId: qid(key).id, order })) },
          },
        });
        const lesson = await prisma.lesson.create({
          data: {
            sectionId: section.id,
            slug: `kuis-${slugify(chapter.title)}`,
            title: `Kuis: ${chapter.title}`,
            summary: `${chapter.quiz.length} soal untuk memeriksa pemahaman bab ini.`,
            type: "KUIS",
            order: chapter.lessons.length,
            quizId: quiz.id,
          },
        });
        lessons.push({ id: lesson.id, sectionOrder: order, videoId: null });
      }
    }
    await prisma.course.update({ where: { id: course.id }, data: { estimatedMinutes: Math.ceil(seconds / 60) } });

    // Lampiran PDF (G.4.4): bab 1 (gratis) dan bab 3 (berbayar) untuk mendemokan aturan akses.
    for (const chapterIndex of [0, 2]) {
      const chapter = c.chapters[chapterIndex];
      const target = lessons.find((l) => l.sectionOrder === chapterIndex);
      if (!chapter || !target) continue;
      const media = await uploadSummaryPdf(
        admin.id,
        `${c.slug}-ringkasan-bab-${chapterIndex + 1}`,
        `Ringkasan ${c.title}: Bab ${chapterIndex + 1} ${chapter.title}`,
        [
          `Ringkasan ini merangkum materi bab ${chapterIndex + 1} kelas ${c.title} di Taman Pelajar.`,
          ...chapter.lessons.map((t, i) => `${i + 1}. ${t}: pahami konsepnya, lalu kerjakan contoh soal di video sebelum lanjut.`),
          "Tips: tulis ulang poin penting dengan kata-katamu sendiri di kolom catatan setiap materi.",
        ],
      );
      if (media) {
        await prisma.material.create({ data: { lessonId: target.id, title: `Ringkasan bab ${chapterIndex + 1} (PDF)`, mediaId: media.id } });
      }
    }
    await prisma.certificate.create({ data: { title: `Sertifikat ${c.title}`, courseId: course.id } });
    lessonsByCourse.set(c.slug, lessons);
  }
  console.log(`  ${courses.length} kelas, ${videoCount} video`);

  // ─── O.4–O.5 Tryout ───
  const examRows = new Map<string, { id: string; sections: { id: string; durationMin: number; keys: string[] }[] }>();
  for (const e of exams) {
    const exam = await prisma.exam.create({
      data: {
        slug: e.slug,
        title: e.title,
        description: e.description,
        rules: e.rules,
        categoryId: cat(e.category),
        durationMin: e.sections.reduce((n, s) => n + s.durationMin, 0),
        maxAttempts: e.maxAttempts,
        shuffleQuestions: e.shuffleQuestions,
        shuffleOptions: e.shuffleOptions,
        correctScore: e.correctScore,
        wrongScore: e.wrongScore,
        passingGrade: e.passingGrade,
        status: "TERBIT",
        createdAt: daysAgo(90),
      },
    });
    const sections = [];
    for (const [order, s] of e.sections.entries()) {
      const section = await prisma.examSection.create({
        data: { examId: exam.id, title: s.title, order, durationMin: s.durationMin, weight: s.weight, passingGrade: s.passingGrade },
      });
      await prisma.examQuestion.createMany({
        data: s.questionKeys.map((key, i) => ({ examId: exam.id, sectionId: section.id, questionId: qid(key).id, order: i })),
      });
      sections.push({ id: section.id, durationMin: s.durationMin, keys: s.questionKeys });
    }
    examRows.set(e.slug, { id: exam.id, sections });
  }
  console.log(`  ${exams.length} tryout`);

  // ─── Produk ───
  const productRows = new Map<string, { id: string; activeDays: number; price: number; promoPrice: number | null; name: string }>();
  for (const p of products) {
    const row = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId: cat(p.category),
        programType: p.programType,
        educationLevel: p.educationLevel,
        summary: p.summary,
        description: p.description.join("\n\n"),
        price: p.price,
        promoPrice: p.promoPrice,
        activeDays: p.activeDays,
        features: p.features,
        faq: productFaq,
        status: "TERBIT",
        salesCount: p.salesCount,
        createdAt: daysAgo(p.daysAgo),
        courses: { create: p.courses.map((slug, order) => ({ courseId: courseId.get(slug)!, order })) },
        exams: { create: p.exams.map((slug, order) => ({ examId: examRows.get(slug)!.id, order })) },
      },
    });
    productRows.set(p.slug, { id: row.id, activeDays: p.activeDays, price: p.price, promoPrice: p.promoPrice, name: p.name });
  }
  console.log(`  ${products.length} paket`);

  // ─── Pesanan, pembayaran, enrollment ───
  let orderSeq = 0;
  async function order(
    user: { id: string },
    productSlug: string,
    status: "BERHASIL" | "MENUNGGU" | "KEDALUWARSA",
    createdDaysAgo: number,
  ) {
    const p = productRows.get(productSlug)!;
    const created = daysAgo(createdDaysAgo, 10);
    const total = p.promoPrice ?? p.price;
    orderSeq += 1;
    const ymd = created.toISOString().slice(0, 10).replace(/-/g, "");
    const row = await prisma.order.create({
      data: {
        number: `TP-${ymd}-${String(orderSeq).padStart(4, "0")}`,
        userId: user.id,
        subtotal: total,
        total,
        status,
        createdAt: created,
        expiresAt: new Date(created.getTime() + DAY),
        paidAt: status === "BERHASIL" ? new Date(created.getTime() + 15 * 60_000) : null,
        items: { create: { productId: p.id, nameSnapshot: p.name, price: p.price, promoPrice: p.promoPrice, activeDays: p.activeDays } },
        payments: {
          create: {
            provider: "simulasi",
            method: "SIMULASI",
            status,
            externalId: `SIM-${ymd}-${orderSeq}`,
            paidAt: status === "BERHASIL" ? new Date(created.getTime() + 15 * 60_000) : null,
          },
        },
      },
    });
    if (status === "BERHASIL") {
      const startsAt = row.paidAt!;
      const expiresAt = new Date(startsAt.getTime() + p.activeDays * DAY);
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          productId: p.id,
          orderId: row.id,
          startsAt,
          expiresAt,
          status: expiresAt < now ? "KEDALUWARSA" : "AKTIF",
        },
      });
    }
    return row;
  }
  await order(nadia, "persiapan-skd-cpns", "BERHASIL", 20);
  await order(fikri, "persiapan-utbk-snbt", "BERHASIL", 35);
  await order(salsa, "tryout-skd-cpns", "BERHASIL", 10);
  await order(ayu, "tes-potensi-akademik", "BERHASIL", 140);
  await order(dimas, "kelas-penalaran-umum", "KEDALUWARSA", 5);
  // Pesanan menunggu dibuat "hari ini" agar batas bayarnya masih berlaku.
  await order(dimas, "persiapan-utbk-snbt", "MENUNGGU", 0);
  console.log(`  ${orderSeq} pesanan`);

  // ─── Hasil tryout demo (O.5) ───
  const examSeed = new Map(exams.map((e) => [e.slug, e]));
  let attemptsDone = 0;
  async function attempt(user: { id: string }, examSlug: string, attemptNo: number, startedDaysAgo: number, accuracy: number) {
    const exam = examRows.get(examSlug)!;
    const cfg = examSeed.get(examSlug)!;
    const startedAt = daysAgo(startedDaysAgo, 13);
    const total = cfg.sections.reduce((n, s) => n + s.durationMin, 0);
    const deadlineAt = new Date(startedAt.getTime() + total * 60_000);

    const scoringQuestions: ScoringQuestion[] = [];
    const answers: Record<string, ScoringAnswer> = {};
    const rows: { questionId: string; optionIds: string[] | null; textAnswer: string | null; numberAnswer: number | null; timeSpentSec: number; gradedScore: number | null }[] = [];

    for (const section of exam.sections) {
      for (const key of section.keys) {
        const { id, optionIds, seed } = qid(key);
        const options = (seed.options ?? []).map((t, i) => ({ id: optionIds[i], isCorrect: t.startsWith("*"), score: null }));
        scoringQuestions.push({
          id,
          sectionId: section.id,
          type: seed.type,
          topic: seed.topic,
          difficulty: seed.difficulty,
          weight: 1,
          options,
          correctText: seed.correctText ?? null,
          correctNumber: seed.correctNumber ?? null,
          tolerance: seed.tolerance ?? null,
        });
        const skip = rand() < 0.08;
        const right = rand() < accuracy;
        const timeSpentSec = randInt(25, 140);
        let a: (typeof rows)[number] = { questionId: id, optionIds: null, textAnswer: null, numberAnswer: null, timeSpentSec, gradedScore: null };
        if (!skip) {
          if (seed.type === "PG_JAMAK") {
            const correct = options.filter((o) => o.isCorrect).map((o) => o.id);
            a.optionIds = right ? correct : correct.slice(0, 1);
          } else if (seed.type === "PG_TUNGGAL" || seed.type === "BENAR_SALAH") {
            const wrong = options.filter((o) => !o.isCorrect);
            a.optionIds = [right ? options.find((o) => o.isCorrect)!.id : wrong[randInt(0, wrong.length - 1)].id];
          } else if (seed.type === "ISIAN_SINGKAT") {
            a.textAnswer = right ? seed.correctText!.split("|")[0] : "tersurat";
          } else if (seed.type === "NUMERIK") {
            a.numberAnswer = right ? seed.correctNumber! : seed.correctNumber! + randInt(1, 9);
          } else if (seed.type === "ESSAY") {
            a = {
              ...a,
              textAnswer:
                "Belajar rutin membuat materi diulang berkali-kali sehingga lebih lama diingat. Bebannya juga terbagi, jadi tidak kelelahan menjelang ujian. Waktu saya belajar SKD seminggu sekali, banyak materi yang lupa, lalu saya ganti menjadi 30 menit setiap hari.",
              gradedScore: right ? 8 : 5,
            };
          }
        }
        rows.push(a);
        answers[id] = { ...a, gradedScore: a.gradedScore };
      }
    }

    const score = scoreExam(scoringQuestions, answers, {
      correctScore: cfg.correctScore,
      wrongScore: cfg.wrongScore,
      passingGrade: cfg.passingGrade,
      sections: exam.sections.map((s, i) => ({ id: s.id, weight: cfg.sections[i].weight, passingGrade: cfg.sections[i].passingGrade })),
    });
    const usedSec = rows.reduce((n, r) => n + r.timeSpentSec, 0);
    const submittedAt = new Date(startedAt.getTime() + Math.min(usedSec, total * 60) * 1000);

    let sectionStart = startedAt;
    const attemptRow = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        userId: user.id,
        attemptNo,
        status: "SELESAI",
        seed: randInt(1, 2 ** 31 - 1),
        startedAt,
        deadlineAt,
        submittedAt,
        createdAt: startedAt,
        sections: {
          create: exam.sections.map((s) => {
            const start = sectionStart;
            sectionStart = new Date(start.getTime() + s.durationMin * 60_000);
            return { sectionId: s.id, startedAt: start, deadlineAt: sectionStart, submittedAt: sectionStart };
          }),
        },
        answers: {
          create: rows.map((r, i) => ({
            questionId: r.questionId,
            optionIds: r.optionIds ?? undefined,
            textAnswer: r.textAnswer,
            numberAnswer: r.numberAnswer,
            timeSpentSec: r.timeSpentSec,
            isCorrect: score.questions[i].status === "BENAR" ? true : score.questions[i].status === "SALAH" ? false : null,
            score: score.questions[i].score,
            gradedById: r.gradedScore !== null ? admin.id : null,
          })),
        },
        activity: {
          create: [
            { type: "MULAI", at: startedAt },
            { type: "SUBMIT", at: submittedAt },
          ],
        },
        result: {
          create: {
            totalScore: score.totalScore,
            maxScore: score.maxScore,
            correct: score.correct,
            wrong: score.wrong,
            empty: score.empty,
            durationSec: Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000),
            passed: score.passed,
            sections: { create: score.sections.map((s) => ({ ...s })) },
            topics: { create: score.topics },
          },
        },
      },
    });
    attemptsDone += 1;
    return attemptRow;
  }
  await attempt(nadia, "tryout-skd-paket-1", 1, 15, 0.5);
  await attempt(nadia, "tryout-skd-paket-1", 2, 5, 0.85);
  await attempt(salsa, "tryout-skd-paket-1", 1, 6, 0.65);
  await attempt(fikri, "tryout-utbk-paket-1", 1, 20, 0.5);
  await attempt(fikri, "tryout-utbk-paket-1", 2, 3, 0.9);
  await attempt(ayu, "tryout-tpa-paket-1", 1, 100, 0.7);
  console.log(`  ${attemptsDone} hasil tryout`);

  // ─── Progres belajar, sesi belajar, sertifikat ───
  async function complete(user: { id: string }, courseSlug: string, count: number, daysBack: number) {
    const lessons = lessonsByCourse.get(courseSlug)!;
    for (const [i, l] of lessons.slice(0, count).entries()) {
      await prisma.lessonProgress.create({
        data: { userId: user.id, lessonId: l.id, completedAt: daysAgo(daysBack - i, 19), lastPositionSec: 0, watchedSec: randInt(240, 700) },
      });
    }
    // Materi berikutnya setengah ditonton, untuk fitur lanjutkan dari posisi terakhir (G.4.2).
    const next = lessons[count];
    if (next?.videoId) {
      await prisma.lessonProgress.create({ data: { userId: user.id, lessonId: next.id, lastPositionSec: 135, watchedSec: 135 } });
    }
  }
  await complete(nadia, "tes-wawasan-kebangsaan", 8, 18);
  await complete(nadia, "tes-intelegensia-umum", 3, 9);
  await complete(fikri, "penalaran-umum", lessonsByCourse.get("penalaran-umum")!.length, 30);
  await complete(fikri, "pengetahuan-kuantitatif", lessonsByCourse.get("pengetahuan-kuantitatif")!.length, 12);
  await complete(dimas, "penalaran-umum", 2, 4);
  await complete(ayu, "tes-intelegensia-umum", 6, 130);

  for (const [user, course] of [
    [nadia, "tes-wawasan-kebangsaan"],
    [fikri, "penalaran-umum"],
  ] as const) {
    for (let d = 42; d >= 0; d -= 1) {
      if (rand() < 0.45) continue;
      await prisma.learningSession.create({
        data: { userId: user.id, courseId: courseId.get(course)!, date: daysAgo(d, 0), seconds: randInt(15, 75) * 60 },
      });
    }
  }

  // ─── Batch, syarat sertifikat, dan tugas praktik (revisi RMED) ───
  // Setiap kelas punya batch yang berjalan dan batch berikutnya. Sertifikat butuh rata-rata
  // kuis ≥ 80 dan tugas praktik yang disetujui admin.
  const monthName = (d: Date) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(d);
  const currentStart = daysAgo(45, 0);
  const currentEnd = new Date(now.getTime() + 45 * DAY);
  const nextStart = new Date(currentEnd.getTime() + DAY);
  const nextEnd = new Date(nextStart.getTime() + 90 * DAY);
  const currentBatch = new Map<string, string>();
  for (const c of courses) {
    const id = courseId.get(c.slug)!;
    const [cur] = await Promise.all([
      prisma.courseBatch.create({ data: { courseId: id, name: `Batch ${monthName(currentStart)}`, startsAt: currentStart, endsAt: currentEnd } }),
      prisma.courseBatch.create({ data: { courseId: id, name: `Batch ${monthName(nextStart)}`, startsAt: nextStart, endsAt: nextEnd } }),
    ]);
    currentBatch.set(c.slug, cur.id);
    await prisma.certificate.update({
      where: { courseId: id },
      data: {
        minScore: 80,
        practicalInstructions: `Kerjakan studi kasus ${c.title}: buat ringkasan konsep tiap bab dan selesaikan lima soal latihan buatanmu sendiri lengkap dengan pembahasannya. Simpan dalam satu folder Google Drive (dokumen atau foto tulisan tangan), lalu kirim link folder itu.`,
      },
    });
  }

  // Fikri sudah lulus Penalaran Umum di batch berjalan.
  const certificate = await prisma.certificate.findUniqueOrThrow({ where: { courseId: courseId.get("penalaran-umum")! } });
  const fikriPu = await prisma.batchParticipant.create({
    data: { batchId: currentBatch.get("penalaran-umum")!, userId: fikri.id, status: "LULUS", finalScore: 88 },
  });
  await prisma.practicalSubmission.create({
    data: {
      participantId: fikriPu.id,
      driveUrl: "https://drive.google.com/drive/folders/contoh-tugas-penalaran-umum",
      status: "DISETUJUI",
      reviewNote: "Ringkasan rapi dan soal buatanmu bervariasi. Pertahankan.",
      reviewedById: admin.id,
      reviewedAt: daysAgo(14),
      createdAt: daysAgo(16),
    },
  });
  await prisma.userCertificate.create({
    data: { certificateId: certificate.id, userId: fikri.id, participantId: fikriPu.id, number: `TP-${now.getUTCFullYear()}-PU-0001`, issuedAt: daysAgo(14) },
  });

  // Fikri menyelesaikan Pengetahuan Kuantitatif dengan rata-rata kuis 85 dan menunggu penilaian tugas.
  const pkQuizzes = await prisma.quiz.findMany({ where: { lesson: { section: { courseId: courseId.get("pengetahuan-kuantitatif")! } } }, select: { id: true } });
  for (const [i, q] of pkQuizzes.entries()) {
    await prisma.quizAttempt.create({
      data: { quizId: q.id, userId: fikri.id, score: i % 2 === 0 ? 90 : 80, passed: true, answers: {}, submittedAt: daysAgo(3 + i, 20) },
    });
  }
  const fikriPk = await prisma.batchParticipant.create({
    data: { batchId: currentBatch.get("pengetahuan-kuantitatif")!, userId: fikri.id, status: "MENUNGGU_PENILAIAN", finalScore: 85 },
  });
  await prisma.practicalSubmission.create({
    data: {
      participantId: fikriPk.id,
      driveUrl: "https://drive.google.com/drive/folders/contoh-tugas-pengetahuan-kuantitatif",
      note: "Soal nomor 4 saya buat dua versi karena ragu dengan satuan yang dipakai.",
      createdAt: daysAgo(1, 21),
    },
  });

  // ─── Catatan, bookmark, diskusi ───
  const twkLessons = lessonsByCourse.get("tes-wawasan-kebangsaan")!;
  await prisma.lessonNote.create({
    data: {
      userId: nadia.id,
      lessonId: twkLessons[2].id,
      content: "Urutan perumusan: BPUPKI, Piagam Jakarta, lalu PPKI 18 Agustus 1945. Ulang bagian perubahan sila pertama.",
    },
  });
  await prisma.bookmark.createMany({
    data: [
      { userId: nadia.id, lessonId: twkLessons[4].id },
      { userId: nadia.id, lessonId: twkLessons[5].id },
    ],
  });
  const puLessons = lessonsByCourse.get("penalaran-umum")!;
  await prisma.discussion.create({
    data: {
      userId: fikri.id,
      lessonId: puLessons[2].id,
      body: "Kalau soal implikasinya pakai kata “hanya jika”, urutan p dan q dibalik atau tidak?",
      createdAt: daysAgo(26),
      replies: {
        create: {
          userId: admin.id,
          body: "“p hanya jika q” sama dengan “jika p maka q”, jadi urutannya tidak dibalik. Yang dibalik adalah “p jika q”, artinya “jika q maka p”.",
          createdAt: daysAgo(25),
        },
      },
    },
  });

  // ─── Ulasan dari pembeli ───
  const reviews: [typeof nadia, string, number, string, number][] = [
    [nadia, "persiapan-skd-cpns", 5, "Penjelasan pasal UUD di kelas TWK runtut. Tryout-nya membantu saya tahu subtes mana yang belum aman.", 6],
    [fikri, "persiapan-utbk-snbt", 5, "Bagian penalaran analitik paling membantu. Soal penjadwalan yang dulu saya lewati sekarang bisa dikerjakan.", 4],
    [salsa, "tryout-skd-cpns", 4, "Timer per subtes membuat saya terbiasa mengatur waktu. Semoga soalnya ditambah.", 5],
    [ayu, "tes-potensi-akademik", 4, "Soal essay dinilai cukup cepat dan komentarnya jelas.", 95],
  ];
  for (const [user, slug, rating, body, d] of reviews) {
    await prisma.review.create({ data: { userId: user.id, productId: productRows.get(slug)!.id, rating, body, createdAt: daysAgo(d) } });
  }

  // ─── Notifikasi ───
  await prisma.notification.createMany({
    data: [
      { userId: nadia.id, type: "TRANSAKSI", title: "Pembayaran berhasil", body: "Persiapan SKD CPNS 2027 sudah aktif sampai masa aktif berakhir.", href: "/dashboard/kelas", createdAt: daysAgo(20), readAt: daysAgo(20) },
      { userId: nadia.id, type: "TRYOUT", title: "Hasil tryout tersedia", body: "Nilai Tryout SKD Paket 1 percobaan kedua sudah bisa dilihat.", href: "/dashboard/riwayat", createdAt: daysAgo(5) },
      { userId: fikri.id, type: "KELAS", title: "Sertifikat terbit", body: "Selamat, sertifikat Penalaran Umum sudah bisa diunduh.", href: "/dashboard/sertifikat", createdAt: daysAgo(14) },
      { userId: dimas.id, type: "TRANSAKSI", title: "Menunggu pembayaran", body: "Selesaikan pembayaran Persiapan UTBK/SNBT 2027 sebelum batas waktu.", href: "/transaksi", createdAt: daysAgo(0) },
      { userId: ayu.id, type: "SISTEM", title: "Masa aktif berakhir", body: "Masa aktif Tes Potensi Akademik Lengkap sudah berakhir. Riwayat nilai tetap tersimpan.", href: "/dashboard/kelas", createdAt: daysAgo(20) },
    ],
  });

  // ─── Konten: testimoni, FAQ beranda, artikel, voucher, pengaturan ───
  await prisma.testimonial.createMany({
    data: testimonials.map((t, order) => ({ name: t.name, program: t.program, opening: t.opening, body: t.body.join("\n\n"), order })),
  });
  for (const { daysAgo: published, ...a } of articles) {
    await prisma.article.create({
      data: { ...a, authorId: admin.id, status: "TERBIT", publishedAt: daysAgo(published), createdAt: daysAgo(published) },
    });
  }
  await prisma.voucher.createMany({
    data: vouchers.map((v) => ({ ...v, startsAt: daysAgo(30), endsAt: daysAhead(60) })),
  });
  await prisma.setting.createMany({
    data: [
      { key: "beranda.faq", value: homeFaq },
      { key: "kontak", value: { email: "halo@tamanpelajar.com", jamLayanan: "Senin–Jumat, 09.00–17.00 WIB" } },
    ],
  });

  console.log("Selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
