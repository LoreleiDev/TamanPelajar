import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("pnpm exec tsx e2e/reset-db.ts", { stdio: "inherit" });
}
