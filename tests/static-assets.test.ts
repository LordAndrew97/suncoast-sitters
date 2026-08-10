import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("private static entry points", () => {
  for (const relative of ["portal/index.html", "admin/index.html"]) {
    it(`${relative} only references existing local assets`, () => {
      const file = resolve(root, relative);
      const html = readFileSync(file, "utf8");
      const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((match) => match[1]!)
        .filter((value) => !/^(?:https?:|mailto:|tel:|#|\/api\/)/.test(value) && value !== "../");
      for (const reference of references) {
        const clean = reference.split(/[?#]/)[0]!;
        expect(existsSync(resolve(dirname(file), clean)), `${relative}: missing ${clean}`).toBe(true);
      }
    });
  }

  it("keeps sensitive and implementation files outside static uploads", () => {
    const ignore = readFileSync(resolve(root, ".assetsignore"), "utf8");
    for (const pattern of ["src/", "tests/", "migrations/", ".dev.vars*", "private/", "sensitive/", "legal/"]) {
      expect(ignore).toContain(pattern);
    }
  });
});
