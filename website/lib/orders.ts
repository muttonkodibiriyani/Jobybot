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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
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
  `);
  _db = db as Sqlite;
  return _db;
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
