import { describe, expect, it } from "vitest";
import { coversInterval } from "../src/matching";

describe("timezone-aware availability", () => {
  const weekly = [{ sitter_user_id: "s1", weekday: 1, start_minute: 9 * 60, end_minute: 17 * 60 }];

  it("covers a Monday shift in Florida local time", () => {
    expect(coversInterval("s1", "2026-08-10T14:00:00.000Z", "2026-08-10T18:00:00.000Z", "America/New_York", weekly, [])).toBe(true);
  });

  it("rejects time beyond weekly availability", () => {
    expect(coversInterval("s1", "2026-08-10T20:30:00.000Z", "2026-08-10T22:00:00.000Z", "America/New_York", weekly, [])).toBe(false);
  });

  it("lets an unavailable exception override the weekly schedule", () => {
    const exceptions = [{ sitter_user_id: "s1", starts_at: "2026-08-10T15:00:00.000Z", ends_at: "2026-08-10T16:00:00.000Z", available: 0 }];
    expect(coversInterval("s1", "2026-08-10T14:00:00.000Z", "2026-08-10T18:00:00.000Z", "America/New_York", weekly, exceptions)).toBe(false);
  });
});
