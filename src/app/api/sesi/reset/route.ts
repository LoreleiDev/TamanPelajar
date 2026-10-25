import { NextResponse, type NextRequest } from "next/server";

import { safeCallbackUrl } from "@/lib/safe-redirect";

// Hapus cookie sesi yang basi (akun sudah dihapus, dinonaktifkan, atau database di-seed ulang)
// lalu kembali ke halaman masuk. Tanpa ini proxy menganggap pengguna masih masuk dan
// mengalihkan /masuk ke /dashboard, sedangkan dashboard mengalihkan balik ke /masuk (loop).
export function GET(request: NextRequest) {
  const callbackUrl = safeCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
  const url = new URL("/masuk", request.url);
  url.searchParams.set("callbackUrl", callbackUrl);
  url.searchParams.set("sesi", "berakhir");
  const res = NextResponse.redirect(url);
  // Auth.js bisa memecah token besar menjadi beberapa cookie (.0, .1, …).
  for (const { name } of request.cookies.getAll()) {
    if (/^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(name)) res.cookies.delete(name);
  }
  return res;
}
