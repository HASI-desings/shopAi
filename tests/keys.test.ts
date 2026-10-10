import { describe, it, expect } from "vitest";
import { generateKey, parseKey, verifyKey } from "@/lib/keys";
describe("api keys", () => {
  const k = generateKey("live");
  it("round-trips and verifies", () => { expect(parseKey(k.full)).toBe(k.prefix); expect(verifyKey(k.full, k.hash)).toBe(true); });
  it("rejects wrong secrets and malformed keys", () => { expect(verifyKey(k.full + "0", k.hash)).toBe(false); expect(parseKey("nope")).toBeNull(); });
  it("does not store plaintext", () => { expect(k.hash).not.toContain(k.full); expect(k.hash).toHaveLength(64); });
});
