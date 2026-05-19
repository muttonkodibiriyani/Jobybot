"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error || "Submission failed");
      setStatus("error");
      return;
    }
    setStatus("ok");
    setTimeout(() => router.push("/buy-india"), 1200);
  }

  if (status === "ok") {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <p className="text-success font-bold">✓ Account created</p>
        <p className="mt-2 text-sm">Redirecting to UPI payment…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card mt-8 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Full name</span>
        <input
          name="name"
          required
          placeholder="Tharak Reddy"
          className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="you@gmail.com"
          className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Phone</span>
        <input
          name="phone"
          required
          placeholder="+91 98xxx xxxxx"
          className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4"
        />
        <span>
          I agree to the <a className="underline" href="/terms">terms</a> and{" "}
          <a className="underline" href="/privacy">privacy policy</a>.
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
        {status === "submitting" ? "Creating…" : "Create account & continue"}
      </button>
    </form>
  );
}
