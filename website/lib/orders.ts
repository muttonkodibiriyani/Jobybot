/**
 * Order storage with two backends:
 *   1. Local SQLite (better-sqlite3) — for self-host / dev / VPS.
 *   2. Vercel KV (if KV_REST_API_URL is set) — for serverless / Vercel.
 *
 * The runtime picks the right backend automatically.
 */
import fs from "node:fs";
import path from "node:path";

export interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  amountInr: number;
  txnRef: string;
  txnTime: string; // ISO
  screenshotPath?: string;
  status: "pending" | "approved" | "rejected" | "refund_requested" | "refunded";
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

export interface Refund {
  id: string;
  orderId: string;
  email: string;
  phone: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const DB_PATH = process.env.ORDERS_DB_PATH ?? "./data/orders.db";

// ───── SQLite backend ─────
type Stmt = {
  run: (...a: unknown[]) => void;
  all: (...a: unknown[]) => unknown[];
  get: (...a: unknown[]) => unknown;
};
type Sqlite = { prepare: (s: string) => Stmt; exec: (s: string) => void };
let _db: Sqlite | null = null;

function ensureLocalDb(): Sqlite {
  if (_db) return _db;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      amount_inr INTEGER NOT NULL,
      txn_ref TEXT,
      txn_time TEXT,
      screenshot_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      approved_at TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      processed_at TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      ip TEXT,
      detail TEXT,
      at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_secevents_at ON security_events(at);
  `);
  _db = db as Sqlite;
  return _db;
}

function toRefund(row: Record<string, unknown>): Refund {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    reason: String(row.reason),
    status: row.status as Refund["status"],
    createdAt: String(row.created_at),
    processedAt: row.processed_at ? String(row.processed_at) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

function toOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    amountInr: Number(row.amount_inr),
    txnRef: String(row.txn_ref ?? ""),
    txnTime: String(row.txn_time ?? ""),
    screenshotPath: row.screenshot_path ? String(row.screenshot_path) : undefined,
    status: row.status as Order["status"],
    createdAt: String(row.created_at),
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

// ───── KV backend ─────
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

// ───── Public API ─────
export async function saveOrder(o: Order): Promise<void> {
  if (USE_KV) {
    await kvFetch(`set/order:${o.id}`, {
      method: "POST",
      body: JSON.stringify(o),
      headers: { "Content-Type": "application/json" },
    });
    // Maintain a list of all order ids
    await kvFetch(`sadd/orders:all/${o.id}`, { method: "POST" });
    await kvFetch(`sadd/orders:${o.status}/${o.id}`, { method: "POST" });
    return;
  }
  const db = ensureLocalDb();
  db.prepare(
    `INSERT OR REPLACE INTO orders
     (id,name,email,phone,amount_inr,txn_ref,txn_time,screenshot_path,status,created_at,approved_at,notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    o.id, o.name, o.email, o.phone, o.amountInr,
    o.txnRef, o.txnTime, o.screenshotPath ?? null,
    o.status, o.createdAt, o.approvedAt ?? null, o.notes ?? null,
  );
}

export async function listOrders(status?: Order["status"]): Promise<Order[]> {
  if (USE_KV) {
    const setKey = status ? `orders:${status}` : "orders:all";
    const { result } = (await kvFetch(`smembers/${setKey}`)) as { result: string[] };
    if (!result?.length) return [];
    const orders: Order[] = [];
    for (const id of result) {
      const { result: raw } = (await kvFetch(`get/order:${id}`)) as { result: string | null };
      if (raw) orders.push(JSON.parse(raw));
    }
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const db = ensureLocalDb();
  const stmt = status
    ? db.prepare("SELECT * FROM orders WHERE status=? ORDER BY created_at DESC")
    : db.prepare("SELECT * FROM orders ORDER BY created_at DESC");
  const rows = (status ? stmt.all(status) : stmt.all()) as Record<string, unknown>[];
  return rows.map(toOrder);
}

export async function updateOrderStatus(id: string, status: Order["status"], notes = ""): Promise<Order | null> {
  if (USE_KV) {
    const { result: raw } = (await kvFetch(`get/order:${id}`)) as { result: string | null };
    if (!raw) return null;
    const o: Order = JSON.parse(raw);
    const prev = o.status;
    o.status = status;
    o.notes = notes;
    if (status === "approved") o.approvedAt = new Date().toISOString();
    await kvFetch(`set/order:${id}`, {
      method: "POST",
      body: JSON.stringify(o),
      headers: { "Content-Type": "application/json" },
    });
    await kvFetch(`srem/orders:${prev}/${id}`, { method: "POST" });
    await kvFetch(`sadd/orders:${status}/${id}`, { method: "POST" });
    return o;
  }
  const db = ensureLocalDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE orders SET status=?, approved_at=?, notes=? WHERE id=?",
  ).run(status, status === "approved" ? now : null, notes, id);
  const row = db.prepare("SELECT * FROM orders WHERE id=?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? toOrder(row) : null;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (USE_KV) {
    const { result: raw } = (await kvFetch(`get/order:${id}`)) as { result: string | null };
    return raw ? JSON.parse(raw) : null;
  }
  const db = ensureLocalDb();
  const row = db.prepare("SELECT * FROM orders WHERE id=?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? toOrder(row) : null;
}

export function newOrderId(): string {
  return "JB-" + Date.now().toString(36).toUpperCase() + "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function newRefundId(): string {
  return "RF-" + Date.now().toString(36).toUpperCase() + "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ───── Refunds ─────
export async function saveRefund(r: Refund): Promise<void> {
  if (USE_KV) {
    await kvFetch(`set/refund:${r.id}`, {
      method: "POST",
      body: JSON.stringify(r),
      headers: { "Content-Type": "application/json" },
    });
    await kvFetch(`sadd/refunds:all/${r.id}`, { method: "POST" });
    await kvFetch(`sadd/refunds:${r.status}/${r.id}`, { method: "POST" });
    return;
  }
  const db = ensureLocalDb();
  db.prepare(
    `INSERT OR REPLACE INTO refunds
     (id, order_id, email, phone, reason, status, created_at, processed_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    r.id, r.orderId, r.email, r.phone, r.reason, r.status,
    r.createdAt, r.processedAt ?? null, r.notes ?? null,
  );
}

export async function listRefunds(status?: Refund["status"]): Promise<Refund[]> {
  if (USE_KV) {
    const setKey = status ? `refunds:${status}` : "refunds:all";
    const { result } = (await kvFetch(`smembers/${setKey}`)) as { result: string[] };
    if (!result?.length) return [];
    const out: Refund[] = [];
    for (const id of result) {
      const { result: raw } = (await kvFetch(`get/refund:${id}`)) as { result: string | null };
      if (raw) out.push(JSON.parse(raw));
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const db = ensureLocalDb();
  const stmt = status
    ? db.prepare("SELECT * FROM refunds WHERE status=? ORDER BY created_at DESC")
    : db.prepare("SELECT * FROM refunds ORDER BY created_at DESC");
  const rows = (status ? stmt.all(status) : stmt.all()) as Record<string, unknown>[];
  return rows.map(toRefund);
}

export async function updateRefundStatus(
  id: string,
  status: Refund["status"],
  notes = "",
): Promise<Refund | null> {
  if (USE_KV) {
    const { result: raw } = (await kvFetch(`get/refund:${id}`)) as { result: string | null };
    if (!raw) return null;
    const r: Refund = JSON.parse(raw);
    const prev = r.status;
    r.status = status;
    r.notes = notes;
    if (status === "refunded") r.processedAt = new Date().toISOString();
    await kvFetch(`set/refund:${id}`, {
      method: "POST",
      body: JSON.stringify(r),
      headers: { "Content-Type": "application/json" },
    });
    await kvFetch(`srem/refunds:${prev}/${id}`, { method: "POST" });
    await kvFetch(`sadd/refunds:${status}/${id}`, { method: "POST" });
    return r;
  }
  const db = ensureLocalDb();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE refunds SET status=?, processed_at=?, notes=? WHERE id=?",
  ).run(status, status === "refunded" ? now : null, notes, id);
  const row = db.prepare("SELECT * FROM refunds WHERE id=?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? toRefund(row) : null;
}

// ───── Security events ─────
export async function logSecurityEvent(event: string, ip: string, detail = ""): Promise<void> {
  if (USE_KV) {
    // Keep the last ~500 events in a list
    await kvFetch(`lpush/sec:events/${encodeURIComponent(JSON.stringify({ event, ip, detail, at: new Date().toISOString() }))}`, {
      method: "POST",
    });
    return;
  }
  const db = ensureLocalDb();
  db.prepare(
    "INSERT INTO security_events (event, ip, detail, at) VALUES (?, ?, ?, ?)",
  ).run(event, ip || "", detail, new Date().toISOString());
}

export async function recentSecurityEvents(limit = 50): Promise<Array<{
  event: string;
  ip: string;
  detail: string;
  at: string;
}>> {
  if (USE_KV) return []; // KV path not wired for listing here yet
  const db = ensureLocalDb();
  const rows = db.prepare(
    "SELECT * FROM security_events ORDER BY id DESC LIMIT ?",
  ).all(limit) as Record<string, unknown>[];
  return rows.map((r) => ({
    event: String(r.event),
    ip: String(r.ip ?? ""),
    detail: String(r.detail ?? ""),
    at: String(r.at),
  }));
}

export async function countSecurityEventsSince(
  event: string,
  ip: string,
  sinceIso: string,
): Promise<number> {
  if (USE_KV) return 0;
  const db = ensureLocalDb();
  const row = db.prepare(
    "SELECT COUNT(*) AS n FROM security_events WHERE event=? AND ip=? AND at >= ?",
  ).get(event, ip, sinceIso) as { n: number } | undefined;
  return row?.n ?? 0;
}
