import { describe, expect, it } from "vitest";

import { safeCallbackUrl } from "@/lib/safe-redirect";

import { daftarSchema, passwordStrength } from "./schemas";

const valid = {
  name: "Rani Oktaviani",
  email: " Rani@Contoh.COM ",
  phone: "0812-3456-7890",
  password: "belajar2027",
  confirmPassword: "belajar2027",
  educationLevel: "SMA",
  examTarget: "UTBK/SNBT",
  terms: true,
} as const;

describe("daftarSchema", () => {
  it("menormalkan email dan nomor WhatsApp", () => {
    const r = daftarSchema.parse(valid);
    expect(r.email).toBe("rani@contoh.com");
    expect(r.phone).toBe("081234567890");
  });

  it("memberi pesan Bahasa Indonesia per field", () => {
    const r = daftarSchema.safeParse({ ...valid, password: "pendek", confirmPassword: "beda", terms: false, phone: "12345" });
    expect(r.success).toBe(false);
    // Form menampilkan pesan pertama per field, jadi ambil yang pertama.
    const issues: Record<string, string> = {};
    for (const i of r.error?.issues ?? []) issues[i.path.join(".")] ??= i.message;
    expect(issues.password).toBe("Password minimal 8 karakter");
    expect(issues.phone).toMatch(/Nomor WhatsApp/);
    expect(issues.terms).toMatch(/syarat dan ketentuan/);
  });

  it("menolak konfirmasi password yang berbeda", () => {
    const r = daftarSchema.safeParse({ ...valid, confirmPassword: "belajar2028" });
    expect(r.error?.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "Konfirmasi password tidak sama" });
  });
});

describe("passwordStrength", () => {
  it("naik seiring panjang dan variasi karakter", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abc").score).toBeLessThanOrEqual(1);
    expect(passwordStrength("belajar27").label).toBe("Lemah");
    expect(passwordStrength("Belajar2027!").score).toBe(4);
  });
});

describe("safeCallbackUrl", () => {
  it("hanya menerima path internal", () => {
    expect(safeCallbackUrl("/paket/persiapan-skd-cpns")).toBe("/paket/persiapan-skd-cpns");
    expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("/masuk?callbackUrl=/x")).toBe("/dashboard");
    expect(safeCallbackUrl(undefined, "/admin")).toBe("/admin");
  });
});
