"use client";

import { useState } from "react";

export function OrderForm({ amountInr }: { amountInr: number }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/india-order", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { ok: boolean; orderId?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Submission failed. Please try again.");
        return;
      }
      setOrderId(data.orderId ?? "");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "ok") {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6">
        <p className="text-success font-bold">✓ Payment submitted</p>
        <p className="mt-2 text-sm">
          Order <strong>{orderId}</strong> received. We&apos;ll verify within
          ~30 minutes and email your download link to the address you provided.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Please keep this email reachable. If you don&apos;t see anything in 2 hours,
          check spam or reply to the confirmation email.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required placeholder="Tharak Reddy" />
        <Field label="Phone (UPI)" name="phone" required placeholder="+91 98xxx xxxxx" />
      </div>
      <Field label="Email (delivery)" name="email" type="email" required placeholder="you@gmail.com" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="UPI reference / Txn ID"
          name="txnRef"
          required
          placeholder="e.g. 50298732812 (last 4-12 chars OK)"
        />
        <Field
          label="Payment time"
          name="txnTime"
          type="datetime-local"
          required
        />
      </div>

      <label className="block">
        <span className="text-sm font-semibold">Payment screenshot</span>
        <input
          type="file"
          name="screenshot"
          accept="image/png,image/jpeg,image/webp"
          required
          className="mt-2 block w-full rounded-lg border border-surface-border bg-white p-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-white"
        />
        <span className="mt-1 block text-xs text-ink-muted">
          Required as proof. Max 4 MB. PNG/JPG/WebP.
        </span>
      </label>

      <input type="hidden" name="amountInr" value={amountInr} />

      {status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting…" : `Submit for verification`}
      </button>

      <p className="text-center text-xs text-ink-muted">
        By submitting you agree to our{" "}
        <a href="/terms" className="underline">terms</a> and{" "}
        <a href="/privacy" className="underline">privacy</a> policy.
      </p>
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
