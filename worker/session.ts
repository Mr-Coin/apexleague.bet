/**
 * Stateless HMAC-signed session cookie.
 *
 * The league uses one shared password, so a session carries no identity —
 * only a role (member or commissioner) and an expiry. The cookie is HttpOnly
 * and SameSite=Lax; write endpoints additionally check the Origin header.
 */
import { timingSafeEqual } from "hono/utils/buffer";

export const SESSION_COOKIE = "apex_session";
export const MEMBER_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const COMMISSIONER_TTL_MS = 12 * 60 * 60 * 1000;

export type Role = "member" | "commissioner";

export interface Session {
  v: 1;
  /** Random id so picks can record which session wrote them. */
  sid: string;
  role: Role;
  /** Unix ms */
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  try {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(secret: string, session: Session): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): Promise<Session | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = fromBase64Url(token.slice(dot + 1));
  if (!sig) return null;
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, encoder.encode(payload));
  if (!valid) return null;
  const bytes = fromBase64Url(payload);
  if (!bytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(bytes));
  } catch {
    return null;
  }
  if (!isSession(parsed) || parsed.exp <= now) return null;
  return parsed;
}

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    s.v === 1 &&
    typeof s.sid === "string" &&
    (s.role === "member" || s.role === "commissioner") &&
    typeof s.exp === "number"
  );
}

export function newSession(role: Role, now = Date.now()): Session {
  return {
    v: 1,
    sid: crypto.randomUUID(),
    role,
    exp: now + (role === "commissioner" ? COMMISSIONER_TTL_MS : MEMBER_TTL_MS),
  };
}

/** Constant-time string comparison that does not leak length via early exit. */
export async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  // Hash both sides so differing lengths are compared in constant time too.
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return timingSafeEqual(toBase64Url(new Uint8Array(a)), toBase64Url(new Uint8Array(b)));
}
