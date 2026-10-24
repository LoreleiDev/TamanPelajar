import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Proteksi route lapis pertama (C.4, P.1.8). Lapis kedua ada di lib/rbac.ts pada setiap
// halaman, action, dan query sensitif. Next.js 16: middleware.ts bernama proxy.ts.
const { auth } = NextAuth(authConfig);

const protectedPrefixes = ["/dashboard", "/admin", "/ujian", "/keranjang", "/checkout", "/transaksi", "/invoice", "/lengkapi-profil"];
const guestOnly = ["/masuk", "/daftar"];

export default auth((req) => {
  // Hanya navigasi yang dialihkan. Request POST (server action) dibiarkan lewat: redirect
  // di tengah action membuat client gagal ("unexpected response"), dan action sendiri sudah
  // memeriksa sesi lewat lib/rbac.ts.
  if (req.method !== "GET" && req.method !== "HEAD") return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (guestOnly.includes(pathname) && user) {
    return NextResponse.redirect(new URL(user.role === "ADMIN" ? "/admin" : "/dashboard", req.url));
  }

  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  if (!user) {
    const url = new URL("/masuk", req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/ujian/:path*",
    "/keranjang/:path*",
    "/checkout/:path*",
    "/transaksi/:path*",
    "/invoice/:path*",
    "/lengkapi-profil",
    "/masuk",
    "/daftar",
  ],
};
