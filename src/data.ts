import { newId, sha256, type AppContext, type SessionUser } from "./security";

export async function currentUser(c: AppContext): Promise<SessionUser | null> {
  const { getSessionToken } = await import("./security");
  const token = getSessionToken(c);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await c.env.DB.prepare(`
    SELECT u.id, u.email, u.role, u.status, u.session_version, s.csrf_hash, s.id AS session_id
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
      AND s.session_version = u.session_version
  `).bind(tokenHash, new Date().toISOString()).first<{
    id: string; email: string; role: SessionUser["role"]; status: string;
    session_version: number; csrf_hash: string; session_id: string;
  }>();
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, status: row.status, sessionVersion: row.session_version, csrfHash: row.csrf_hash, sessionId: row.session_id };
}

export async function audit(c: AppContext, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}): Promise<void> {
  const actor = c.get("user");
  const ipHash = await sha256(c.req.header("CF-Connecting-IP") || "local");
  await c.env.DB.prepare(`INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(newId("aud"), actor?.id ?? null, action, entityType, entityId ?? null, JSON.stringify(metadata), ipHash, new Date().toISOString()).run();
}

export async function nextCode(db: D1Database, namespace: "family" | "sitter" | "booking" | "incident"): Promise<string> {
  const row = await db.prepare("UPDATE code_sequences SET value = value + 1 WHERE namespace = ? RETURNING value")
    .bind(namespace).first<{ value: number }>();
  if (!row) throw new Error("CODE_SEQUENCE_MISSING");
  const prefix = { family: "FAM", sitter: "SIT", booking: "BK", incident: "INC" }[namespace];
  return `${prefix}-${String(row.value).padStart(6, "0")}`;
}

export async function rateLimit(c: AppContext, scope: string, identifier: string, max: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const key = await sha256(`${scope}:${identifier.toLowerCase()}`);
  await c.env.DB.prepare(`INSERT INTO rate_limit_buckets(key_hash, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(key_hash, window_start) DO UPDATE SET count = count + 1`).bind(key, windowStart).run();
  const row = await c.env.DB.prepare("SELECT count FROM rate_limit_buckets WHERE key_hash = ? AND window_start = ?")
    .bind(key, windowStart).first<{ count: number }>();
  return (row?.count ?? max + 1) <= max;
}
