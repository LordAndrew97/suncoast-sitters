import { describe, expect, it } from "vitest";
import { hashPassword, randomToken, sha256, timingSafeEqual, verifyPassword } from "../src/security";

describe("credential security", () => {
  it("hashes passwords with salt and rejects an incorrect password", async () => {
    const hash = await hashPassword("a sufficiently long passphrase");
    expect(hash).toMatch(/^pbkdf2-sha256\$100000\$/);
    expect(hash).not.toContain("a sufficiently long passphrase");
    expect(await verifyPassword("a sufficiently long passphrase", hash)).toBe(true);
    expect(await verifyPassword("a different long passphrase", hash)).toBe(false);
  }, 20_000);

  it("generates opaque tokens whose stored digest differs", async () => {
    const token = randomToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(await sha256(token)).not.toBe(token);
  });

  it("compares bootstrap secrets without exposing an early-exit comparison", async () => {
    expect(await timingSafeEqual("the configured secret", "the configured secret")).toBe(true);
    expect(await timingSafeEqual("the configured secret", "a different secret")).toBe(false);
  });
});
