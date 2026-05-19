"use client";

import { useState } from "react";
import type { Order } from "@/lib/orders";

export function AdminTable({
  orders,
  approvedView = false,
}: {
  orders: Order[];
  approvedView?: boolean;
}) {
  const [working, setWorking] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    if (!confirm(`${action.toUpperCase()} order ${id}?`)) return;
    setWorking(id);
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setWorking(null);
    if (res.ok) location.reload();
    else alert("Failed: " + (await res.text()));
  }

  if (orders.length === 0) {
    return <p className="mt-4 text-sm text-ink-muted">No orders here yet.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
            <th className="py-2">Order</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Txn / Time</th>
            <th>Submitted</th>
            <th>{approvedView ? "Approved" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-surface-border">
              <td className="py-3 font-mono text-xs">{o.id}</td>
              <td>
                <div className="font-semibold">{o.name}</div>
                <div className="text-xs text-ink-muted">{o.email}</div>
                <div className="text-xs text-ink-muted">{o.phone}</div>
              </td>
              <td className="font-semibold">₹{o.amountInr.toLocaleString("en-IN")}</td>
              <td>
                <div className="font-mono text-xs">{o.txnRef}</div>
                <div className="text-xs text-ink-muted">{o.txnTime?.replace("T", " ")}</div>
              </td>
              <td className="text-xs text-ink-muted">
                {o.createdAt.slice(0, 19).replace("T", " ")}
              </td>
              <td>
                {approvedView ? (
                  <span className="text-success">✓ approved</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(o.id, "approve")}
                      disabled={working === o.id}
                      className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      Approve & send
                    </button>
                    <button
                      onClick={() => act(o.id, "reject")}
                      disabled={working === o.id}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
