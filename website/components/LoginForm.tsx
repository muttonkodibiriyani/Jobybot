"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginResponse = {
  ok: boolean;
  error?: string;
  message?: string;
  next?: string;
  email?: string;
  status?: string;
};

export function LoginForm({
  initialIdentifier = "",
}: {
  initialIdentifier?: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCta, setErrorCta] = useState<{ label: string; href: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCta(null);
    if (!identifier || !password) {
      setErrorMsg("Both fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as LoginResponse;
      if (!res.ok || !data.ok) {
        const code = data.error ?? "unknown";
        setErrorMsg(data.message ?? humaniseLoginError(code));
        if (code === "pending_payment") {
          setErrorCta({ label: "Complete payment →", href: data.next ?? "/buy-india" });
        } else if (code === "pending_verification") {
          // No CTA — they're already waiting.
        } else if (code === "rejected" || code === "refunded") {
          setErrorCta({
            label: "Email founder",
            href: "mailto:tharakesh.iitp@gmail.com?subject=JobyBots%20access",
          });
        }
        setLoading(false);
        return;
      }
      router.push("/portal");
    } catch {
      setErrorMsg("Network error. Try again in a moment.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Sign in
      </p>
      <h2 className="mt-1.5 text-2xl font-bold text-ink">
        Email or phone &amp; password
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Use whichever you registered with — both work.
      </p>

      <div className="mt-7 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Email or phone <span className="text-accent">*</span>
          </span>
          <input
            type="text"
            required
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@gmail.com  or  +91 98xxxxxxxx"
            className="input mt-1.5"
            autoComplete="username"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">
            Password <span className="text-accent">*</span>
          </span>
          <div className="relative mt-1.5">
            <input
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="input pr-20"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-3 my-auto h-7 rounded-md px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              tabIndex={-1}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </label>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{errorMsg}</p>
          {errorCta && (
            <Link
              href={errorCta.href}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-900/10 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-900/20"
            >
              {errorCta.label}
            </Link>
          )}
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
            Forgot your password?{" "}
            <a
              href="mailto:tharakesh.iitp@gmail.com?subject=Reset%20my%20JobyBots%20password"
              className="text-accent-strong underline"
            >
              Email the founder
            </a>{" "}
            — manual reset for now.
          </p>
          <p>
            New here?{" "}
            <Link href="/signup" className="text-accent-strong underline">
              Create an account
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

function humaniseLoginError(code: string): string {
  switch (code) {
    case "invalid_credentials": return "That email/phone + password combination doesn't match.";
    case "missing_fields":      return "Please fill both fields.";
    case "rate_limited":        return "Too many attempts. Try again in 10 minutes.";
    default:                    return "Couldn't sign you in. Please try again.";
  }
}
