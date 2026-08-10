export const ROLES = ["family", "sitter", "operations", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const BOOKING_TRANSITIONS = {
  draft: ["requested", "cancelled"],
  requested: ["matching", "cancelled", "expired"],
  matching: ["offered", "cancelled", "expired"],
  offered: ["confirmed", "matching", "cancelled", "expired"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  expired: []
} as const;

export type BookingStatus = keyof typeof BOOKING_TRANSITIONS;

export const SITTER_TRANSITIONS = {
  draft: ["submitted"],
  submitted: ["under_review", "draft"],
  under_review: ["approved", "rejected", "draft"],
  approved: ["suspended"],
  rejected: ["draft"],
  suspended: ["under_review", "approved"]
} as const;

export type SitterStatus = keyof typeof SITTER_TRANSITIONS;

export function canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
  return (BOOKING_TRANSITIONS[from] as readonly string[]).includes(to);
}

export function canTransitionSitter(from: SitterStatus, to: SitterStatus): boolean {
  return (SITTER_TRANSITIONS[from] as readonly string[]).includes(to);
}

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

export function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export type MatchCandidate = {
  userId: string;
  displayName: string;
  approved: boolean;
  serviceAreas: string[];
  hasVehicle: boolean;
  canTransportChildren: boolean;
  languageCount: number;
  firstAidCurrent: boolean;
  alreadyWorkedForFamily: boolean;
  conflicting: boolean;
  available: boolean;
};

export type MatchRequest = {
  area: string;
  transportRequired: boolean;
};

export type RankedMatch = MatchCandidate & { score: number; reasons: string[] };

export function rankCandidates(candidates: MatchCandidate[], request: MatchRequest): RankedMatch[] {
  return candidates
    .filter((c) => c.approved && c.available && !c.conflicting)
    .filter((c) => c.serviceAreas.includes(request.area))
    .filter((c) => !request.transportRequired || (c.hasVehicle && c.canTransportChildren))
    .map((c) => {
      const reasons = ["Approved and available", `Serves ${request.area}`];
      let score = 100;
      if (c.firstAidCurrent) { score += 20; reasons.push("First aid current"); }
      if (c.alreadyWorkedForFamily) { score += 15; reasons.push("Previously booked by this family"); }
      if (c.hasVehicle) { score += 5; reasons.push("Has vehicle"); }
      score += Math.min(c.languageCount, 3) * 2;
      if (c.languageCount) reasons.push(`${c.languageCount} language option${c.languageCount === 1 ? "" : "s"}`);
      return { ...c, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName) || a.userId.localeCompare(b.userId));
}
