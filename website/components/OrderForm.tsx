"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  amountInr: number;
  /** When the customer is signed in, lock the identity fields so the order
   *  is bound to their account. They can still edit phone if the UPI number
   *  is different from the account phone. */
  lockedName?: string;
  lockedEmail?: string;
  lockedPhone?: string;
}

export function OrderForm({ amountInr, lockedName, lockedEmail, lockedPhone }: Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const fd = new FormData(e.currentTarget);
    if (lockedName) fd.set("name", lockedName);
    if (lockedEmail) fd.set("email", lockedEmail);
    try {
      const res = await fetch("/api/india-order", { method: "POST", body: fd });
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
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
          <p className="text-success font-bold">✓ Payment submitted for verification</p>
          <p className="mt-2 text-sm">
            Order <strong>{orderId || "received"}</strong>. The founder will
            confirm your UPI transaction (usually within 30 minutes) and you&apos;ll
            get an activation email at <strong>{lockedEmail || "your registered email"}</strong>.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            After that email arrives, sign in with your registered email/phone
            and password to configure and download your installer.
          </p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-white p-5 text-sm">
          <p className="font-semibold text-ink">What happens next?</p>
          <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-ink-muted">
            <li>Founder cross-checks the UPI reference and amount.</li>
            <li>You get a &ldquo;your account is active&rdquo; email (~30 min).</li>
            <li>You sign in at <Link href="/login" className="text-accent underline">jobybots.com/login</Link>.</li>
            <li>Portal opens, you configure your <code>.env</code>, download the ZIP.</li>
          </ol>
        </div>
        <p className="text-xs text-ink-muted text-center">
          Need it now?{" "}
          <a href="https://wa.me/971505619548" className="font-semibold text-accent underline">
            WhatsApp the founder
          </a>{" "}
          with your screenshot.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      {lockedEmail && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Paying as <strong>{lockedName}</strong> · <span className="font-mono">{lockedEmail}</span>.
          The activation email will go to this address.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          required
          placeholder="Tharak Reddy"
          defaultValue={lockedName}
          readOnly={!!lockedName}
        />
        <Field
          label="Phone (UPI)"
          name="phone"
          required
          placeholder="+91 98xxx xxxxx"
          defaultValue={lockedPhone}
        />
      </div>
      <Field
        label="Email (account)"
        name="email"
        type="email"
        required
        placeholder="you@gmail.com"
        defaultValue={lockedEmail}
        readOnly={!!lockedEmail}
      />
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
        <Link href="/terms" className="underline">terms</Link> and{" "}
        <Link href="/privacy" className="underline">privacy</Link> policy.
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
  defaultValue?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        readOnly={props.readOnly}
        className={`mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          props.readOnly ? "cursor-not-allowed bg-slate-50 text-slate-600" : ""
        }`}
      />
    </label>
  );
}
