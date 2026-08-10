import { describe, expect, it } from "vitest";
import { hashPassword, randomToken, sha256, verifyPassword } from "../src/security";

describe("credential security", () => {
  it("hashes passwords with salt and rejects an incorrect password", async () => {
    const hash = await hashPassword("a sufficiently long passphrase");
    expect(hash).not.toContain("a sufficiently long passphrase");
    expect(await verifyPassword("a sufficiently long passphrase", hash)).toBe(true);
    expect(await verifyPassword("a different long passphrase", hash)).toBe(false);
  }, 20_000);

  it("generates opaque tokens whose stored digest differs", async () => {
    const token = randomToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(await sha256(token)).not.toBe(token);
  });
});
