"use client";

import { useState } from "react";

export function RefundForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [refundId, setRefundId] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok: boolean; refundId?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Submission failed");
        return;
      }
      setRefundId(data.refundId ?? "");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <p className="text-success font-bold text-lg">✓ Refund request received</p>
        <p className="mt-2 text-sm">
          Reference <strong>{refundId}</strong>. We&apos;ve emailed an
          acknowledgement to your registered address. Funds will return to your
          UPI / card within 5 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Order ID" name="orderId" required placeholder="JB-XXXXX-XXXX" />
      <Field label="Registered email" name="email" type="email" required placeholder="you@gmail.com" />
      <Field label="Phone (UPI)" name="phone" required placeholder="+91 98xxx xxxxx" />
      <label className="block">
        <span className="text-sm font-semibold">Reason (helps us improve)</span>
        <textarea
          name="reason"
          rows={4}
          required
          minLength={10}
          placeholder="e.g. The bot didn't find roles in my niche, or installation broke on Windows 10…"
          className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="ack" required className="mt-1 h-4 w-4" />
        <span>
          I confirm I purchased within the last 7 days and have not violated the
          terms (no resale, no commercial use beyond the license).
        </span>
      </label>
      {status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <button
        className="btn-primary w-full"
        type="submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting…" : "Submit refund request"}
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}
