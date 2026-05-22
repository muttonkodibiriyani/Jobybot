/**
 * Machine-binding store: one license email = one fingerprint.
 *
 * Purpose
 * -------
 * Every paying customer's bot calls /api/license/bind with their email and
 * a SHA-256 machine fingerprint. We persist {email -> fingerprint, boundAt}
 * so subsequent calls from a DIFFERENT fingerprint for the same email are
 * rejected. This stops "I'll share the ZIP with my friends" piracy.
 *
 * Storage backends (same KV → SQLite → memory pattern as customers.ts):
 *   1. Vercel KV               — recommended for prod
 *   2. better-sqlite3 in /tmp  — works on Vercel cold-start scratch disk
 *   3. In-memory               — keeps prod alive while you wire KV
 *
 * Re-binding (customer got a new laptop) is the customer's choice:
 * /api/license/move clears their fingerprint so the next bot cycle re-binds.
 */
import fs from "node:fs";
import path from "node:path";

export interface MachineBinding {
  email: string;          // lowercased
  fingerprint: string;    // 64-char hex (SHA-256)
  boundAt: string;        // ISO
  moves: number;          // how many times the customer has re-bound
}

const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const IS_VERCEL = !!process.env.VERCEL;
const DB_PATH = process.env.MACHINES_DB_PATH ?? "./data/machines.db";
const RUNTIME_DB_PATH = IS_VERCEL ? "/tmp/machines.db" : DB_PATH;

type Stmt = {
  run: (...a: unknown[]) => void;
  all: (...a: unknown[]) => unknown[];
  get: (...a: unknown[]) => unknown;
};
type Sqlite = { prepare: (s: string) => Stmt; exec: (s: string) => void };
let _db: Sqlite | null = null;
let _sqliteUnavailable = false;

function ensureLocalDb(): Sqlite {
  if (_db) return _db;
  if (_sqliteUnavailable) throw new Error("sqlite-unavailable");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3") as new (p: string) => Sqlite;
    fs.mkdirSync(path.dirname(RUNTIME_DB_PATH), { recursive: true });
    const db = new Database(RUNTIME_DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS machines (
        email TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL,
        bound_at TEXT NOT NULL,
        moves INTEGER NOT NULL DEFAULT 0
      );
    `);
    _db = db as Sqlite;
    return _db;
  } catch {
    _sqliteUnavailable = true;
    throw new Error("sqlite-unavailable");
  }
}

const _mem = new Map<string, MachineBinding>();

async function kvGet(email: string): Promise<MachineBinding | null> {
  const url = `${process.env.KV_REST_API_URL}/get/jb_machine_${email}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  if (!r.ok) return null;
  const data = (await r.json()) as { result?: string | null };
  if (!data.result) return null;
  try {
    return JSON.parse(data.result) as MachineBinding;
  } catch {
    return null;
  }
}
async function kvSet(b: MachineBinding): Promise<void> {
  const url = `${process.env.KV_REST_API_URL}/set/jb_machine_${b.email}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify(b)),
  });
}
async function kvDel(email: string): Promise<void> {
  await fetch(`${process.env.KV_REST_API_URL}/del/jb_machine_${email}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
}

export async function getBinding(email: string): Promise<MachineBinding | null> {
  const e = email.toLowerCase().trim();
  if (!e) return null;
  if (USE_KV) return kvGet(e);
  try {
    const db = ensureLocalDb();
    const row = db
      .prepare("SELECT email, fingerprint, bound_at, moves FROM machines WHERE email = ?")
      .get(e) as
      | { email: string; fingerprint: string; bound_at: string; moves: number }
      | undefined;
    if (!row) return null;
    return {
      email: row.email,
      fingerprint: row.fingerprint,
      boundAt: row.bound_at,
      moves: row.moves,
    };
  } catch {
    return _mem.get(e) ?? null;
  }
}

export async function saveBinding(b: MachineBinding): Promise<void> {
  const next: MachineBinding = { ...b, email: b.email.toLowerCase().trim() };
  if (USE_KV) {
    await kvSet(next);
    return;
  }
  try {
    const db = ensureLocalDb();
    db.prepare(
      `INSERT INTO machines (email, fingerprint, bound_at, moves)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         fingerprint = excluded.fingerprint,
         bound_at = excluded.bound_at,
         moves = excluded.moves`
    ).run(next.email, next.fingerprint, next.boundAt, next.moves);
  } catch {
    _mem.set(next.email, next);
  }
}

export async function clearBinding(email: string): Promise<void> {
  const e = email.toLowerCase().trim();
  if (USE_KV) {
    await kvDel(e);
    return;
  }
  try {
    const db = ensureLocalDb();
    db.prepare("DELETE FROM machines WHERE email = ?").run(e);
  } catch {
    _mem.delete(e);
  }
}

/**
 * Validate a fingerprint claim. Returns:
 *   { decision: 'ok'      , status }   — first bind OR matches existing
 *   { decision: 'rejected', reason }   — different machine, same license
 */
export async function evaluateBind(
  email: string,
  fingerprint: string,
  activeCustomer: boolean
): Promise<
  | { decision: "ok"; status: "new" | "matches" }
  | { decision: "rejected"; reason: string }
> {
  const e = email.toLowerCase().trim();
  const fp = fingerprint.trim().toLowerCase();
  if (!/^[a-f0-9]{32,128}$/.test(fp)) {
    return { decision: "rejected", reason: "Invalid fingerprint format." };
  }
  if (!activeCustomer) {
    return {
      decision: "rejected",
      reason:
        "No active subscription found for this email. Sign in at https://jobybots.com/portal to check your status.",
    };
  }
  const existing = await getBinding(e);
  // No binding OR previously cleared (empty fingerprint = "moved") -> bind now.
  if (!existing || !existing.fingerprint) {
    await saveBinding({
      email: e,
      fingerprint: fp,
      boundAt: new Date().toISOString(),
      moves: existing?.moves ?? 0,
    });
    return { decision: "ok", status: "new" };
  }
  if (existing.fingerprint === fp) {
    return { decision: "ok", status: "matches" };
  }
  return {
    decision: "rejected",
    reason:
      "This license is already activated on another machine. Visit https://jobybots.com/portal -> 'Move my license' to free it.",
  };
}
