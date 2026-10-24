import type { DefaultSession } from "next-auth";

type Role = "ADMIN" | "USER";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}
// Klaim tambahan di token JWT (id, role) diketik di auth.config.ts, karena modul
// @auth/core/jwt tidak bisa di-augment dari sini (tidak di-hoist oleh pnpm).
