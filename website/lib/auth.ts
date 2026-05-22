/**
 * Customer auth helpers — password hashing + session cookies.
 *
 * Password hashing: scrypt (built-in Node crypto, no external deps).
 *   Storage format: scrypt$N$r$p$<salt-base64url>$<hash-base64url>
 *   We keep N/r/p in the string so we can rotate cost without
 *   invalidating older hashes.
 *
 * Sessions: we reuse the HMAC-signed cookie helpers from lib/license.ts
 *   (signSession / verifySession). The cookie carries the customer's email.
 *   This means /portal can be served as a Server Component that just reads
 *   the cookie and looks up the customer — no extra round trips.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { signSession, verifySession } from "./license";

/* ───── Password hashing ───────────────────────────────────────────── */

// scrypt cost parameters — tuned for ~50ms on modern Vercel runtime.
const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;

function b64url(b: Buffer): string {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad), "base64");
}

/** Hash a plaintext password. Returns the storage string. */
export function hashPassword(plain: string): string {
  if (typeof plain !== "string" || plain.length < 8) {
    throw new Error("password_too_short");
  }
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(plain.normalize("NFKC"), salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${b64url(salt)}$${b64url(hash)}`;
}

/** Constant-time verify. */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  let salt: Buffer, expected: Buffer;
  try {
    salt = fromB64url(parts[4]);
    expected = fromB64url(parts[5]);
  } catch {
    return false;
  }
  let candidate: Buffer;
  try {
    candidate = scryptSync(plain.normalize("NFKC"), salt, expected.length, { N, r, p });
  } catch {
    return false;
  }
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/* ───── Validation ─────────────────────────────────────────────────── */

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
export function isValidPhone(s: string): boolean {
  const digits = s.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
export function passwordStrength(s: string): {
  ok: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  hint: string;
} {
  if (!s || s.length < 8) return { ok: false, score: 0, hint: "Use at least 8 characters" };
  let score = 0;
  if (/[a-z]/.test(s)) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  if (s.length >= 12) score = Math.min(4, score + 1) as 0 | 1 | 2 | 3 | 4;
  const cappedScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  return {
    ok: cappedScore >= 2,
    score: cappedScore,
    hint:
      cappedScore >= 3
        ? "Strong"
        : cappedScore === 2
        ? "OK — mix in a number or symbol to make it stronger"
        : "Weak — add uppercase, numbers, or symbols",
  };
}

/* ───── Sessions (re-exports from license.ts so call sites stay one import) ── */
export { signSession, verifySession };

export const CUSTOMER_SESSION_COOKIE = "jb_customer";
export const CUSTOMER_SESSION_MAX_AGE_SEC = 30 * 86400; // 30 days
