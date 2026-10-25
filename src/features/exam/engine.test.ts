import { describe, expect, it } from "vitest";

import { advanceTimeline, finishActiveSection, initialTimeline, orderForAttempt, seededShuffle, startBlock } from "./engine";

const at = (min: number) => new Date(Date.UTC(2026, 9, 25, 8, 0) + min * 60_000);

describe("urutan acak dengan seed (I.4.13)", () => {
  const sections = [
    {
      id: "s1",
      questions: [
        { id: "q1", type: "PG_TUNGGAL", options: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] },
        { id: "q2", type: "BENAR_SALAH", options: [{ id: "benar" }, { id: "salah" }] },
        { id: "q3", type: "ISIAN_SINGKAT", options: [] },
        { id: "q4", type: "PG_TUNGGAL", options: [{ id: "e" }, { id: "f" }] },
      ],
    },
  ];
  const ids = (s: typeof sections) => s[0].questions.map((q) => q.id);

  it("seed sama menghasilkan urutan sama setelah refresh", () => {
    const cfg = { shuffleQuestions: true, shuffleOptions: true };
    expect(orderForAttempt(sections, 42, cfg)).toEqual(orderForAttempt(sections, 42, cfg));
  });

  it("seed berbeda menghasilkan urutan berbeda, isi tetap lengkap", () => {
    const cfg = { shuffleQuestions: true, shuffleOptions: false };
    const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => ids(orderForAttempt(sections, seed, cfg)).join()));
    expect(orders.size).toBeGreaterThan(1);
    expect(ids(orderForAttempt(sections, 3, cfg)).sort()).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("tanpa pengaturan acak urutan asli dipakai; opsi benar/salah tidak diacak", () => {
    expect(ids(orderForAttempt(sections, 9, { shuffleQuestions: false, shuffleOptions: false }))).toEqual(["q1", "q2", "q3", "q4"]);
    for (const seed of [1, 2, 3, 4, 5]) {
      const q2 = orderForAttempt(sections, seed, { shuffleQuestions: false, shuffleOptions: true })[0].questions[1];
      expect(q2.options.map((o) => o.id)).toEqual(["benar", "salah"]);
    }
  });

  it("seededShuffle tidak mengubah array asal", () => {
    const src = [1, 2, 3, 4, 5];
    seededShuffle(src, 7);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("jadwal subtes (I.4.14–I.4.15)", () => {
  const plan = [
    { sectionId: "twk", durationMin: 20 },
    { sectionId: "tiu", durationMin: 30 },
  ];

  it("subtes pertama langsung berjalan; batas ujian = jumlah durasi", () => {
    const t = initialTimeline(plan, at(0), 50);
    expect(t.deadlineAt).toEqual(at(50));
    expect(t.sections[0]).toMatchObject({ startedAt: at(0), deadlineAt: at(20), submittedAt: null });
    expect(t.sections[1]).toMatchObject({ startedAt: null, deadlineAt: null });
  });

  it("subtes yang habis waktunya ditutup dan subtes berikutnya mulai di batas itu", () => {
    const t0 = initialTimeline(plan, at(0), 50);
    const t = advanceTimeline(t0.sections, at(0), t0.deadlineAt, at(25));
    expect(t.activeIndex).toBe(1);
    expect(t.changed).toBe(true);
    expect(t.sections[0].submittedAt).toEqual(at(20));
    expect(t.sections[1]).toMatchObject({ startedAt: at(20), deadlineAt: at(50) });
  });

  it("menyelesaikan subtes lebih awal memulai subtes berikutnya saat itu juga", () => {
    const t0 = initialTimeline(plan, at(0), 50);
    const t1 = advanceTimeline(t0.sections, at(0), t0.deadlineAt, at(5));
    const t = finishActiveSection(t1, at(0), t0.deadlineAt, at(8));
    expect(t.activeIndex).toBe(1);
    expect(t.sections[0].submittedAt).toEqual(at(8));
    expect(t.sections[1]).toMatchObject({ startedAt: at(8), deadlineAt: at(38) });
  });

  it("semua subtes lewat batas waktu: tidak ada yang aktif", () => {
    const t0 = initialTimeline(plan, at(0), 50);
    const t = advanceTimeline(t0.sections, at(0), t0.deadlineAt, at(60));
    expect(t.activeIndex).toBe(-1);
    expect(t.sections.map((s) => s.submittedAt)).toEqual([at(20), at(50)]);
  });

  it("subtes tanpa durasi memakai satu waktu untuk seluruh ujian", () => {
    const free = [
      { sectionId: "a", durationMin: null },
      { sectionId: "b", durationMin: 10 },
    ];
    const t0 = initialTimeline(free, at(0), 30);
    expect(t0.deadlineAt).toEqual(at(30));
    expect(advanceTimeline(t0.sections, at(0), at(30), at(29))).toMatchObject({ mode: "bebas", activeIndex: 0, deadlineAt: at(30) });
    expect(advanceTimeline(t0.sections, at(0), at(30), at(30)).activeIndex).toBe(-1);
  });
});

describe("syarat memulai tryout (I.1, I.2)", () => {
  const base = { now: at(0), loggedIn: true, isAdmin: false, enrolled: true, opensAt: null, closesAt: null, attemptsUsed: 0, maxAttempts: 2 };

  it("pemilik paket dalam jadwal boleh mulai", () => expect(startBlock(base)).toBeNull());
  it("tamu dan non-pelanggan ditolak; admin tidak butuh paket", () => {
    expect(startBlock({ ...base, loggedIn: false })).toBe("BELUM_MASUK");
    expect(startBlock({ ...base, enrolled: false })).toBe("PERLU_PAKET");
    expect(startBlock({ ...base, enrolled: false, isAdmin: true })).toBeNull();
  });
  it("jadwal dan batas percobaan", () => {
    expect(startBlock({ ...base, opensAt: at(10) })).toBe("BELUM_DIBUKA");
    expect(startBlock({ ...base, closesAt: at(0) })).toBe("SUDAH_DITUTUP");
    expect(startBlock({ ...base, attemptsUsed: 2 })).toBe("BATAS_PERCOBAAN");
  });
});
