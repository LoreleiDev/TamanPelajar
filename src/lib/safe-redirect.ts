/**
 * callbackUrl hanya boleh path internal ("/..."), bukan "//host" atau URL absolut,
 * agar tidak bisa dipakai untuk open redirect (C.5.4).
 */
export function safeCallbackUrl(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  // Jangan kembali ke halaman autentikasi setelah masuk.
  if (/^\/(masuk|daftar|lupa-password|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
