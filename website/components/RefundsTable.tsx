"use client";

import { useState } from "react";
import type { Refund } from "@/lib/orders";

export function RefundsTable({
  refunds,
  approvedView = false,
}: {
  refunds: Refund[];
  approvedView?: boolean;
}) {
  const [working, setWorking] = useState<string | null>(null);

  async function act(id: string, action: "refund" | "reject") {
    if (!confirm(`${action.toUpperCase()} refund ${id}?`)) return;
    setWorking(id);
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setWorking(null);
    if (res.ok) location.reload();
    else alert("Failed: " + (await res.text()));
  }

  if (refunds.length === 0) {
    return <p className="mt-4 text-sm text-ink-muted">No refunds here.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
            <th className="py-2">Refund</th>
            <th>Order</th>
            <th>Customer</th>
            <th>Reason</th>
            <th>Submitted</th>
            <th>{approvedView ? "Processed" : "Action"}</th>
          </tr>
        </thead>
        <tbody>
          {refunds.map((r) => (
            <tr key={r.id} className="border-t border-surface-border align-top">
              <td className="py-3 font-mono text-xs">{r.id}</td>
              <td className="font-mono text-xs">{r.orderId}</td>
              <td>
                <div className="text-xs">{r.email}</div>
                <div className="text-xs text-ink-muted">{r.phone}</div>
              </td>
              <td className="max-w-xs text-xs text-ink-muted">{r.reason}</td>
              <td className="text-xs text-ink-muted">
                {r.createdAt.slice(0, 19).replace("T", " ")}
              </td>
              <td>
                {approvedView ? (
                  <span className="text-success">✓ refunded</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(r.id, "refund")}
                      disabled={working === r.id}
                      className="rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      Mark refunded
                    </button>
                    <button
                      onClick={() => act(r.id, "reject")}
                      disabled={working === r.id}
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
