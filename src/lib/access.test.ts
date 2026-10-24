import { describe, expect, it } from "vitest";

import { resolveLessonAccess } from "./access-rules";

const user = { id: "u1", role: "USER" as const };
const admin = { id: "a1", role: "ADMIN" as const };
const base = { sectionIsFree: false, enrolled: false, previousIncomplete: false };

describe("resolveLessonAccess", () => {
  it("tamu selalu diminta masuk, termasuk untuk bab gratis (C.5.2)", () => {
    expect(resolveLessonAccess({ ...base, user: null, sectionIsFree: true })).toBe("perlu-masuk");
  });

  it("bab gratis terbuka untuk user yang sudah masuk (G.4.10)", () => {
    expect(resolveLessonAccess({ ...base, user, sectionIsFree: true })).toBe("terbuka");
  });

  it("bab berbayar butuh langganan aktif (G.4.11, K.5)", () => {
    expect(resolveLessonAccess({ ...base, user })).toBe("perlu-langganan");
    expect(resolveLessonAccess({ ...base, user, enrolled: true })).toBe("terbuka");
  });

  it("kelas berurutan mengunci materi bila materi sebelumnya belum selesai (G.4.3)", () => {
    expect(resolveLessonAccess({ ...base, user, enrolled: true, previousIncomplete: true })).toBe("terkunci-urutan");
  });

  it("admin melihat semua materi untuk pratinjau", () => {
    expect(resolveLessonAccess({ ...base, user: admin, previousIncomplete: true })).toBe("terbuka");
  });
});
