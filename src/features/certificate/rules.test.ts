import { describe, expect, it } from "vitest";

import {
  averageBestQuizScore,
  canRequestRevision,
  canSubmitPractical,
  certificateNumber,
  expiresWithBatch,
  isDriveUrl,
  meetsRequirement,
  pickCurrentBatch,
  pickNextBatch,
} from "./rules";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const batches = [
  { id: "b1", startsAt: d("2026-07-01"), endsAt: d("2026-09-30") },
  { id: "b2", startsAt: d("2026-10-01"), endsAt: d("2026-12-31") },
  { id: "b3", startsAt: d("2027-01-15"), endsAt: d("2027-03-31") },
];

describe("batch", () => {
  it("memilih batch yang sedang berjalan", () => {
    expect(pickCurrentBatch(batches, d("2026-10-25"))?.id).toBe("b2");
    expect(pickCurrentBatch(batches, d("2027-01-05"))).toBeNull();
  });
  it("memilih batch berikutnya yang terdekat", () => {
    expect(pickNextBatch(batches, d("2026-10-25"))?.id).toBe("b3");
    expect(pickNextBatch(batches, d("2027-02-01"))).toBeNull();
  });
});

describe("syarat nilai", () => {
  it("rata-rata nilai terbaik; kuis belum dikerjakan dihitung 0", () => {
    expect(averageBestQuizScore([{ best: 90 }, { best: 70 }])).toBe(80);
    expect(averageBestQuizScore([{ best: 100 }, { best: null }])).toBe(50);
    expect(averageBestQuizScore([])).toBeNull();
  });
  it("butuh semua materi selesai dan nilai minimal", () => {
    expect(meetsRequirement({ completed: 10, total: 10, average: 80, minScore: 80 })).toBe(true);
    expect(meetsRequirement({ completed: 10, total: 10, average: 79.9, minScore: 80 })).toBe(false);
    expect(meetsRequirement({ completed: 9, total: 10, average: 95, minScore: 80 })).toBe(false);
    expect(meetsRequirement({ completed: 4, total: 4, average: null, minScore: 80 })).toBe(true);
    expect(meetsRequirement({ completed: 0, total: 0, average: null, minScore: 80 })).toBe(false);
  });
});

describe("tugas praktik", () => {
  const ok = { completed: 5, total: 5, average: 85, minScore: 80 };
  const endsAt = d("2026-12-31");
  it("boleh kirim saat berjalan atau revisi, sebelum batch berakhir", () => {
    expect(canSubmitPractical({ status: "BERJALAN", requirement: ok, now: d("2026-11-01"), endsAt })).toBe(true);
    expect(canSubmitPractical({ status: "REVISI", requirement: ok, now: d("2026-11-01"), endsAt })).toBe(true);
    expect(canSubmitPractical({ status: "MENUNGGU_PENILAIAN", requirement: ok, now: d("2026-11-01"), endsAt })).toBe(false);
    expect(canSubmitPractical({ status: "BERJALAN", requirement: ok, now: d("2027-01-01"), endsAt })).toBe(false);
    expect(canSubmitPractical({ status: "BERJALAN", requirement: { ...ok, average: 70 }, now: d("2026-11-01"), endsAt })).toBe(false);
  });
  it("revisi hanya sekali dan sebelum batch berakhir", () => {
    expect(canRequestRevision({ revisionsGiven: 0, now: d("2026-11-01"), endsAt })).toBe(true);
    expect(canRequestRevision({ revisionsGiven: 1, now: d("2026-11-01"), endsAt })).toBe(false);
    expect(canRequestRevision({ revisionsGiven: 0, now: d("2027-01-02"), endsAt })).toBe(false);
  });
  it("status yang gagal saat batch berakhir", () => {
    expect(expiresWithBatch("BERJALAN")).toBe(true);
    expect(expiresWithBatch("REVISI")).toBe(true);
    expect(expiresWithBatch("MENUNGGU_PENILAIAN")).toBe(false);
    expect(expiresWithBatch("LULUS")).toBe(false);
  });
  it("hanya menerima link Google Drive/Docs HTTPS", () => {
    expect(isDriveUrl("https://drive.google.com/file/d/abc/view")).toBe(true);
    expect(isDriveUrl("https://docs.google.com/document/d/abc/edit")).toBe(true);
    expect(isDriveUrl("http://drive.google.com/file/d/abc")).toBe(false);
    expect(isDriveUrl("https://drive.google.com.evil.test/x")).toBe(false);
    expect(isDriveUrl("bukan url")).toBe(false);
  });
});

it("nomor sertifikat", () => {
  expect(certificateNumber({ year: 2026, courseSlug: "penalaran-umum", sequence: 7, userId: "cuid000abcd" })).toBe("TP-2026-PEN-0007-ABCD");
});
