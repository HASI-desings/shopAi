import { createHash, randomBytes, timingSafeEqual } from "crypto";
export const PERMISSIONS = ["analytics:read", "analytics:ai", "usage:read", "projects:read"] as const;
export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");
export function generateKey(env: "live" | "test") {
  const id = randomBytes(4).toString("hex"), secret = randomBytes(24).toString("hex");
  const full = `meeru_${env}_${id}_${secret}`;
  return { full, prefix: `meeru_${env}_${id}`, hash: hashKey(full) };
}
export function parseKey(k: string) { const m = /^(meeru_(?:live|test)_[0-9a-f]{8})_[0-9a-f]{48}$/.exec(k); return m ? m[1] : null; }
export function verifyKey(presented: string, storedHash: string) {
  const a = Buffer.from(hashKey(presented), "hex"), b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
