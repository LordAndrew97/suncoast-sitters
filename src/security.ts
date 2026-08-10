import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 600_000;
const SESSION_DAYS = 14;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64ToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(size = 32): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(size)));
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function sha256(value: string): Promise<string> {
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, key, 256
  );
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterationsRaw, saltRaw, expectedRaw] = encoded.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsRaw || !saltRaw || !expectedRaw) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isSafeInteger(iterations) || iterations < 100_000 || iterations > 1_000_000) return false;
  const salt = base64ToBytes(saltRaw);
  const expected = base64ToBytes(expectedRaw);
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, key, expected.length * 8));
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) mismatch |= actual[i]! ^ expected[i]!;
  return mismatch === 0;
}

export type SessionUser = {
  id: string;
  email: string;
  role: "family" | "sitter" | "operations" | "admin";
  status: string;
  sessionVersion: number;
  csrfHash: string;
  sessionId: string;
};

export type AppVariables = { user: SessionUser | undefined };
export type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

function isSecure(c: AppContext): boolean {
  return new URL(c.req.url).protocol === "https:";
}

function sessionCookieName(c: AppContext): string {
  return isSecure(c) ? "__Host-ss_session" : "ss_session";
}

export function getSessionToken(c: AppContext): string | undefined {
  return getCookie(c, sessionCookieName(c));
}

export function setSessionCookies(c: AppContext, sessionToken: string, csrfToken: string): void {
  const secure = isSecure(c);
  const common = { path: "/", secure, sameSite: "Lax" as const, maxAge: SESSION_DAYS * 86400 };
  setCookie(c, sessionCookieName(c), sessionToken, { ...common, httpOnly: true });
  setCookie(c, "ss_csrf", csrfToken, { ...common, httpOnly: false });
}

export function clearSessionCookies(c: AppContext): void {
  const secure = isSecure(c);
  deleteCookie(c, sessionCookieName(c), { path: "/", secure });
  deleteCookie(c, "ss_csrf", { path: "/", secure });
}

export function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
}

export function requestIp(c: AppContext): string {
  return c.req.header("CF-Connecting-IP") || "local";
}
