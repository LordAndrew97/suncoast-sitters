import { describe, expect, it } from "vitest";
import { canTransitionBooking, canTransitionSitter, hasRole, intervalsOverlap, rankCandidates, type MatchCandidate } from "../src/domain";

describe("booking state machine", () => {
  it("allows the defined happy path", () => {
    expect(canTransitionBooking("draft", "requested")).toBe(true);
    expect(canTransitionBooking("requested", "matching")).toBe(true);
    expect(canTransitionBooking("offered", "confirmed")).toBe(true);
    expect(canTransitionBooking("in_progress", "completed")).toBe(true);
  });

  it("rejects skips and terminal-state changes", () => {
    expect(canTransitionBooking("draft", "confirmed")).toBe(false);
    expect(canTransitionBooking("completed", "cancelled")).toBe(false);
    expect(canTransitionBooking("cancelled", "requested")).toBe(false);
  });
});

describe("sitter screening state machine", () => {
  it("requires review before approval", () => {
    expect(canTransitionSitter("draft", "approved")).toBe(false);
    expect(canTransitionSitter("draft", "submitted")).toBe(true);
    expect(canTransitionSitter("under_review", "approved")).toBe(true);
  });
});

describe("role authorization", () => {
  it("does not let a family inherit staff privileges", () => {
    expect(hasRole("family", ["operations", "admin"])).toBe(false);
    expect(hasRole("operations", ["operations", "admin"])).toBe(true);
    expect(hasRole("admin", ["admin"])).toBe(true);
  });
});

describe("overlap protection", () => {
  it("treats adjacent bookings as safe and intersecting bookings as conflicts", () => {
    expect(intervalsOverlap("2026-08-11T10:00:00Z", "2026-08-11T12:00:00Z", "2026-08-11T12:00:00Z", "2026-08-11T14:00:00Z")).toBe(false);
    expect(intervalsOverlap("2026-08-11T10:00:00Z", "2026-08-11T12:00:00Z", "2026-08-11T11:59:00Z", "2026-08-11T14:00:00Z")).toBe(true);
  });
});

describe("deterministic matching", () => {
  const base: MatchCandidate = {
    userId: "s1", displayName: "Alex", approved: true, serviceAreas: ["Sarasota"],
    hasVehicle: true, canTransportChildren: true, languageCount: 1, firstAidCurrent: true,
    alreadyWorkedForFamily: false, conflicting: false, available: true
  };

  it("filters unsafe candidates and ranks the rest with explainable reasons", () => {
    const result = rankCandidates([
      base,
      { ...base, userId: "s2", displayName: "Blair", conflicting: true },
      { ...base, userId: "s3", displayName: "Casey", approved: false },
      { ...base, userId: "s4", displayName: "Drew", alreadyWorkedForFamily: true }
    ], { area: "Sarasota", transportRequired: true });
    expect(result.map((item) => item.userId)).toEqual(["s4", "s1"]);
    expect(result[0]?.reasons).toContain("Previously booked by this family");
  });

  it("uses stable name and id tie-breakers", () => {
    const result = rankCandidates([
      { ...base, userId: "b", displayName: "Sam" },
      { ...base, userId: "a", displayName: "Sam" }
    ], { area: "Sarasota", transportRequired: false });
    expect(result.map((item) => item.userId)).toEqual(["a", "b"]);
  });
});
