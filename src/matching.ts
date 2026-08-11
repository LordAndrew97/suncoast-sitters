import { intervalsOverlap, rankCandidates, type RankedMatch } from "./domain";

type Weekly = { sitter_user_id: string; weekday: number; start_minute: number; end_minute: number };
type Exception = { sitter_user_id: string; starts_at: string; ends_at: string; available: number };
type Conflict = { assigned_sitter_user_id: string; starts_at: string; ends_at: string };
type CandidateRow = {
  user_id: string; display_name: string; service_areas_json: string; has_vehicle: number;
  can_transport_children: number; languages_json: string; first_aid_expires_at: string | null;
};

function zonedParts(date: Date, timeZone: string): { weekday: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: weekdays[value("weekday")] ?? 0, minute: Number(value("hour")) * 60 + Number(value("minute")) };
}

export function coversInterval(
  sitterId: string,
  startsAt: string,
  endsAt: string,
  timeZone: string,
  weekly: Weekly[],
  exceptions: Exception[]
): boolean {
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return false;
  const relevantExceptions = exceptions.filter((e) => e.sitter_user_id === sitterId && intervalsOverlap(startsAt, endsAt, e.starts_at, e.ends_at));
  if (relevantExceptions.some((e) => !e.available)) return false;
  const availableException = relevantExceptions.some((e) => e.available && e.starts_at <= startsAt && e.ends_at >= endsAt);
  if (availableException) return true;

  for (let cursor = start; cursor < end;) {
    let sliceEnd = Math.min(cursor + 15 * 60_000, end);
    const from = zonedParts(new Date(cursor), timeZone);
    let toMinute: number;
    if (zonedParts(new Date(sliceEnd - 1), timeZone).weekday === from.weekday) {
      toMinute = zonedParts(new Date(sliceEnd - 1), timeZone).minute + 1;
    } else {
      // This slice straddles a local-midnight boundary (happens whenever the interval's
      // start-of-day minute isn't a multiple of 15). Narrow sliceEnd down to that boundary
      // so each slice we check availability for stays within a single weekday.
      let lo = cursor, hi = sliceEnd;
      while (hi - lo > 1000) {
        const mid = Math.floor((lo + hi) / 2);
        if (zonedParts(new Date(mid), timeZone).weekday === from.weekday) lo = mid; else hi = mid;
      }
      sliceEnd = hi;
      toMinute = 1440;
    }
    const covered = weekly.some((w) => w.sitter_user_id === sitterId && w.weekday === from.weekday && w.start_minute <= from.minute && w.end_minute >= toMinute);
    if (!covered) return false;
    cursor = sliceEnd;
  }
  return true;
}

export async function findMatches(
  db: D1Database,
  request: { bookingId: string; familyUserId: string; area: string; startsAt: string; endsAt: string; transportRequired: boolean; timeZone: string }
): Promise<RankedMatch[]> {
  const [candidateResult, weeklyResult, exceptionResult, conflictResult, priorResult] = await db.batch([
    db.prepare(`SELECT user_id, display_name, service_areas_json, has_vehicle, can_transport_children,
      languages_json, first_aid_expires_at FROM sitter_profiles WHERE screening_status = 'approved'`),
    db.prepare("SELECT sitter_user_id, weekday, start_minute, end_minute FROM weekly_availability"),
    db.prepare("SELECT sitter_user_id, starts_at, ends_at, available FROM availability_exceptions WHERE starts_at < ? AND ends_at > ?").bind(request.endsAt, request.startsAt),
    db.prepare(`SELECT assigned_sitter_user_id, starts_at, ends_at FROM bookings
      WHERE id <> ? AND assigned_sitter_user_id IS NOT NULL AND status IN ('confirmed','in_progress') AND starts_at < ? AND ends_at > ?
      UNION ALL
      SELECT p.sitter_user_id AS assigned_sitter_user_id, b.starts_at, b.ends_at
      FROM booking_proposals p JOIN bookings b ON b.id=p.booking_id
      WHERE b.id <> ? AND p.status IN ('offered','accepted') AND b.status IN ('offered','confirmed') AND b.starts_at < ? AND b.ends_at > ?`)
      .bind(request.bookingId,request.endsAt,request.startsAt,request.bookingId,request.endsAt,request.startsAt),
    db.prepare(`SELECT DISTINCT assigned_sitter_user_id FROM bookings WHERE family_user_id = ? AND status = 'completed' AND assigned_sitter_user_id IS NOT NULL`).bind(request.familyUserId)
  ]);
  if (!candidateResult || !weeklyResult || !exceptionResult || !conflictResult || !priorResult) throw new Error("MATCH_QUERY_FAILED");
  const weekly = weeklyResult.results as unknown as Weekly[];
  const exceptions = exceptionResult.results as unknown as Exception[];
  const conflicts = conflictResult.results as unknown as Conflict[];
  const prior = new Set((priorResult.results as unknown as { assigned_sitter_user_id: string }[]).map((r) => r.assigned_sitter_user_id));
  const today = new Date().toISOString().slice(0, 10);
  const candidates = (candidateResult.results as unknown as CandidateRow[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    approved: true,
    serviceAreas: safeStringArray(row.service_areas_json),
    hasVehicle: Boolean(row.has_vehicle),
    canTransportChildren: Boolean(row.can_transport_children),
    languageCount: safeStringArray(row.languages_json).length,
    firstAidCurrent: Boolean(row.first_aid_expires_at && row.first_aid_expires_at >= today),
    alreadyWorkedForFamily: prior.has(row.user_id),
    conflicting: conflicts.some((b) => b.assigned_sitter_user_id === row.user_id),
    available: coversInterval(row.user_id, request.startsAt, request.endsAt, request.timeZone, weekly, exceptions)
  }));
  return rankCandidates(candidates, { area: request.area, transportRequired: request.transportRequired });
}

function safeStringArray(value: string): string[] {
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : []; }
  catch { return []; }
}
