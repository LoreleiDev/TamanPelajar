import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback kosong agar `prisma generate` tetap jalan tanpa .env (mis. saat build CI).
    url: process.env.DATABASE_URL ?? "",
  },
});
