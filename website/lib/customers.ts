/**
 * Customer accounts — sign-up / sign-in storage.
 *
 * Storage backends, picked at runtime (same pattern as lib/orders.ts):
 *   1. Vercel KV (KV_REST_API_URL set)        — preferred for prod
 *   2. Local SQLite (better-sqlite3)          — for self-host / dev
 *   3. In-memory fallback                     — keeps prod up while you wire KV
 *
 * The "customer" record is the source of truth for who can sign in. The
 * "order" record (lib/orders.ts) stays the source of truth for which
 * payments are pending vs verified. They're joined by the email field.
 *
 * Status machine:
 *   pending_payment       → just signed up, hasn't submitted payment screenshot
 *   pending_verification  → payment screenshot submitted, owner hasn't approved
 *   active                → owner approved → can sign in + use portal
 *   rejected              → owner rejected (with notes)
 *   refunded              → 7-day refund processed → access revoked
 */
import fs from "node:fs";
import path from "node:path";

export type CustomerStatus =
  | "pending_payment"
  | "pending_verification"
  | "active"
  | "rejected"
  | "refunded";

export interface Customer {
  email: string;            // lowercased, primary key
  phone: string;            // E.164-ish (digits, +, spaces stripped)
  name: string;
  passwordHash: string;     // "scrypt$N$r$p$salt$hash" (all base64url)
  status: CustomerStatus;
  createdAt: string;        // ISO
  activatedAt?: string;     // ISO (when status flipped to active)
  orderId?: string;         // joined to orders.ts
  notes?: string;
}

const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const IS_VERCEL = !!process.env.VERCEL;
const DB_PATH = process.env.CUSTOMERS_DB_PATH ?? "./data/customers.db";
const RUNTIME_DB_PATH = IS_VERCEL ? "/tmp/customers.db" : DB_PATH;

/* ───── SQLite backend ─────────────────────────────────────────────── */
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
      CREATE TABLE IF NOT EXISTS customers (
        email TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_payment',
        created_at TEXT NOT NULL,
        activated_at TEXT,
        order_id TEXT,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_customers_phone  ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    `);
    _db = db as Sqlite;
    return _db;
  } catch (e) {
    _sqliteUnavailable = true;
    console.warn("[customers] better-sqlite3 unavailable, using in-memory:", (e as Error).message);
    throw new Error("sqlite-unavailable");
  }
}

/* ───── In-memory fallback ─────────────────────────────────────────── */
const _mem = {
  byEmail: new Map<string, Customer>(),
};
function memAvailable(): boolean {
  if (USE_KV) return false;
  if (!_sqliteUnavailable) return false;
  return true;
}

function toCustomer(row: Record<string, unknown>): Customer {
  return {
    email: String(row.email),
    phone: String(row.phone),
    name: String(row.name),
    passwordHash: String(row.password_hash),
    status: row.status as CustomerStatus,
    createdAt: String(row.created_at),
    activatedAt: row.activated_at ? String(row.activated_at) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

/* ───── KV backend ─────────────────────────────────────────────────── */
async function kvFetch(p: string, init: RequestInit = {}) {
  const url = `${process.env.KV_REST_API_URL}/${p}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`KV ${p} → ${res.status}`);
  return res.json();
}

/* ───── Public API ─────────────────────────────────────────────────── */

/** Normalise an identifier (email or phone) for lookup. */
export function normEmail(s: string): string {
  return s.trim().toLowerCase();
}
export function normPhone(s: string): string {
  return s.replace(/[^\d+]/g, "");
}

export async function saveCustomer(c: Customer): Promise<void> {
  const email = normEmail(c.email);
  const phone = normPhone(c.phone);
  if (USE_KV) {
    const rec = { ...c, email, phone };
    await kvFetch(`set/customer:${email}`, {
      method: "POST",
      body: JSON.stringify(rec),
      headers: { "Content-Type": "application/json" },
    });
    if (phone) await kvFetch(`set/customer-phone:${phone}/${email}`, { method: "POST" });
    await kvFetch(`sadd/customers:all/${email}`, { method: "POST" });
    return;
  }
  try {
    const db = ensureLocalDb();
    db.prepare(
      `INSERT OR REPLACE INTO customers
       (email,phone,name,password_hash,status,created_at,activated_at,order_id,notes)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(
      email, phone, c.name, c.passwordHash, c.status, c.createdAt,
      c.activatedAt ?? null, c.orderId ?? null, c.notes ?? null
    );
  } catch {
    if (memAvailable()) _mem.byEmail.set(email, { ...c, email, phone });
    else throw new Error("No customer storage available. Configure Vercel KV.");
  }
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const e = normEmail(email);
  if (!e) return null;
  if (USE_KV) {
    const { result } = (await kvFetch(`get/customer:${e}`)) as { result: string | null };
    return result ? (JSON.parse(result) as Customer) : null;
  }
  try {
    const db = ensureLocalDb();
    const row = db.prepare(`SELECT * FROM customers WHERE email = ?`).get(e) as
      | Record<string, unknown>
      | undefined;
    return row ? toCustomer(row) : null;
  } catch {
    if (memAvailable()) return _mem.byEmail.get(e) ?? null;
    return null;
  }
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const p = normPhone(phone);
  if (!p) return null;
  if (USE_KV) {
    const { result: email } = (await kvFetch(`get/customer-phone:${p}`)) as {
      result: string | null;
    };
    return email ? getCustomerByEmail(email) : null;
  }
  try {
    const db = ensureLocalDb();
    const row = db.prepare(`SELECT * FROM customers WHERE phone = ? LIMIT 1`).get(p) as
      | Record<string, unknown>
      | undefined;
    return row ? toCustomer(row) : null;
  } catch {
    if (memAvailable()) {
      for (const c of _mem.byEmail.values()) if (c.phone === p) return c;
      return null;
    }
    return null;
  }
}

/** Lookup by email or phone (whichever is present). */
export async function getCustomerByIdentifier(id: string): Promise<Customer | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return getCustomerByEmail(trimmed);
  return getCustomerByPhone(trimmed);
}

export async function updateCustomerStatus(
  email: string,
  status: CustomerStatus,
  patch: Partial<Pick<Customer, "orderId" | "notes" | "activatedAt">> = {}
): Promise<Customer | null> {
  const c = await getCustomerByEmail(email);
  if (!c) return null;
  const next: Customer = {
    ...c,
    status,
    orderId: patch.orderId ?? c.orderId,
    notes: patch.notes ?? c.notes,
    activatedAt:
      status === "active"
        ? patch.activatedAt ?? c.activatedAt ?? new Date().toISOString()
        : c.activatedAt,
  };
  await saveCustomer(next);
  return next;
}
