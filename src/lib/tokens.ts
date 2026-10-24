import { createHash, randomBytes } from "node:crypto";

/** Token acak untuk tautan email; yang disimpan di database hanya hash-nya. */
export function createToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
