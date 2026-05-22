/**
 * License & session library for JobyBots customer portal.
 *
 * SECURITY MODEL
 * --------------
 *  • License key format:  JB-XXXX-XXXX-XXXX  (12 base32 chars + JB- prefix)
 *  • The key is derived from   HMAC-SHA256( email_lowercased , LICENSE_SECRET )
 *    truncated to 12 chars and chunked into 3 groups of 4.
 *  • So validation is deterministic: same email + same secret = same key.
 *    No DB lookup needed. Revocation comes later via a denylist if needed.
 *
 *  • Session cookie:  jb_session  (httpOnly, secure, sameSite=lax, 30d)
 *    Payload: base64url(email).base64url(expISO).base64url(HMAC).
 *    Verified on every /portal request server-side.
 *
 *  • If LICENSE_SECRET env var is missing in dev, we still run with a known
 *    fallback secret AND log a loud warning. Production deploys MUST set it.
 *
 * EXAMPLES
 * --------
 *  // Server-side license generation (called from a webhook after payment)
 *  const key = generateLicenseKey("you@gmail.com")  // "JB-A4XC-PR2K-9LMQ"
 *
 *  // Server-side validation
 *  if (!validateLicenseKey("you@gmail.com", inputKey)) throw new Error("invalid")
 *
 *  // Server-side session
 *  const cookie = signSession("you@gmail.com")
 *  // ...later
 *  const email = verifySession(cookieValue)  // null if expired/tampered
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET =
  process.env.LICENSE_SECRET ||
  "jobybots-dev-secret-please-set-LICENSE_SECRET-in-vercel";

const SESSION_TTL_DAYS = 30;

if (
  !process.env.LICENSE_SECRET &&
  process.env.NODE_ENV === "production"
) {
  // Don't crash production, but surface loudly in logs.
  console.warn(
    "[jobybots] WARNING: LICENSE_SECRET env var not set in production. " +
      "Using fallback secret — every key is predictable. Set it in Vercel ASAP."
  );
}

/* ───────────────────────────── License keys ────────────────────────────── */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"; // no 0/1/O/L

function toBase32(buf: Buffer): string {
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    out += BASE32_ALPHABET[buf[i] % BASE32_ALPHABET.length];
  }
  return out;
}

export function generateLicenseKey(email: string): string {
  const e = email.trim().toLowerCase();
  const mac = createHmac("sha256", SECRET).update(e).digest();
  const b32 = toBase32(mac).slice(0, 12);
  return `JB-${b32.slice(0, 4)}-${b32.slice(4, 8)}-${b32.slice(8, 12)}`;
}

export function validateLicenseKey(email: string, key: string): boolean {
  if (typeof email !== "string" || typeof key !== "string") return false;
  const expected = generateLicenseKey(email);
  // Constant-time compare so we don't leak the prefix on partial matches.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(key.trim().toUpperCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Light format check: useful for UI-side gating before hitting the API. */
export function looksLikeLicenseKey(key: string): boolean {
  return /^JB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(key.trim().toUpperCase());
}

/* ─────────────────────────────── Sessions ──────────────────────────────── */

function b64urlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(norm, "base64").toString("utf8");
}

/**
 * Sign a session token for the given email.
 * Token format: <b64(email)>.<b64(expISO)>.<b64(hmac)>
 */
export function signSession(email: string): string {
  const e = email.trim().toLowerCase();
  const exp = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000).toISOString();
  const payload = `${e}|${exp}`;
  const mac = createHmac("sha256", SECRET).update(payload).digest("hex");
  return [b64urlEncode(e), b64urlEncode(exp), b64urlEncode(mac)].join(".");
}

/**
 * Verify a session token. Returns the email if valid and unexpired, else null.
 */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const email = b64urlDecode(parts[0]);
    const exp = b64urlDecode(parts[1]);
    const claimedMac = b64urlDecode(parts[2]);
    if (new Date(exp).getTime() < Date.now()) return null;
    const expectedMac = createHmac("sha256", SECRET)
      .update(`${email}|${exp}`)
      .digest("hex");
    const a = Buffer.from(expectedMac, "utf8");
    const b = Buffer.from(claimedMac, "utf8");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return email;
  } catch {
    return null;
  }
}

/* ────────────────────────────── Constants ──────────────────────────────── */

export const SESSION_COOKIE = "jb_session";
export const SESSION_MAX_AGE_SEC = SESSION_TTL_DAYS * 86400;
