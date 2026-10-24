import type { NextAuthConfig } from "next-auth";

type TokenClaims = { id?: string; role?: "ADMIN" | "USER" };

// Konfigurasi Auth.js yang aman untuk proxy: tanpa Prisma dan tanpa provider yang
// membutuhkan database. Provider dan callback berbasis database ada di lib/auth.ts.
export const authConfig = {
  pages: { signIn: "/masuk", error: "/masuk" },
  // Sesi JWT di cookie HTTP-only (secure otomatis di HTTPS) (E.3.8, P.1.7).
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      const claims = token as TokenClaims;
      if (claims.id) session.user.id = claims.id;
      session.user.role = claims.role ?? "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;
