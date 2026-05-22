"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const KEY_PATTERN = /^JB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/i;

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-format the key as the user types: uppercase + auto-dash every 4 chars after JB-
  function formatKey(raw: string): string {
    const cleaned = raw.toUpperCase().replace(/[^A-Z2-9]/g, "");
    if (!cleaned) return "";
    let prefix = "JB";
    let body = cleaned;
    if (cleaned.startsWith("JB")) body = cleaned.slice(2);
    const groups = body.match(/.{1,4}/g) || [];
    return [prefix, ...groups].slice(0, 4).join("-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!KEY_PATTERN.test(key)) {
      setError("License key should look like JB-XXXX-XXXX-XXXX.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, key }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "invalid_key") {
          setError(
            "That email and license key don't match. Double-check your purchase email."
          );
        } else if (data.error === "missing_fields") {
          setError("Please fill both fields.");
        } else {
          setError("Couldn't sign in. Try again, or email the founder.");
        }
        setLoading(false);
        return;
      }
      router.push("/portal");
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Sign in
      </p>
      <h2 className="mt-1.5 text-2xl font-bold text-ink">
        Email + license key
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        These were sent to you immediately after payment. Check your spam folder
        if you can't find them.
      </p>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Purchase email <span className="text-accent">*</span>
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="input mt-1.5"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">
            License key <span className="text-accent">*</span>
          </span>
          <input
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => setKey(formatKey(e.target.value))}
            placeholder="JB-XXXX-XXXX-XXXX"
            className="input mt-1.5 font-mono tracking-widest text-base"
            maxLength={17}
          />
          <span className="mt-1 block text-xs text-slate-500">
            17 characters · format <span className="font-mono">JB-XXXX-XXXX-XXXX</span> · letters auto-uppercased
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-7 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-soft disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in to portal →"}
      </button>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
        <div className="space-y-1">
          <p>
            Lost your key?{" "}
            <a
              href="mailto:tharakesh.iitp@gmail.com?subject=Lost%20my%20JobyBots%20license%20key"
              className="text-accent-strong underline"
            >
              Email the founder
            </a>
            .
          </p>
          <p>
            New here?{" "}
            <Link href="/buy-india" className="text-accent-strong underline">
              Buy JobyBots
            </Link>
            .
          </p>
        </div>
        <Link
          href="/security"
          className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Why is this safe? →
        </Link>
      </div>
    </form>
  );
}
