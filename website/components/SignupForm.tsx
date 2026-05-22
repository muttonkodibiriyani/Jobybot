"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FieldError = "name" | "email" | "phone" | "password" | "consent" | null;

function scorePassword(s: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!s) return { score: 0, label: "—",       color: "bg-slate-200" };
  if (s.length < 8) return { score: 0, label: "Too short", color: "bg-red-400" };
  let n = 0;
  if (/[a-z]/.test(s)) n++;
  if (/[A-Z]/.test(s)) n++;
  if (/[0-9]/.test(s)) n++;
  if (/[^A-Za-z0-9]/.test(s)) n++;
  if (s.length >= 12) n = Math.min(4, n + 1);
  const score = Math.min(4, n) as 0 | 1 | 2 | 3 | 4;
  const map = {
    0: { label: "Weak",     color: "bg-red-400" },
    1: { label: "Weak",     color: "bg-orange-400" },
    2: { label: "OK",       color: "bg-amber-400" },
    3: { label: "Good",     color: "bg-emerald-400" },
    4: { label: "Strong",   color: "bg-emerald-600" },
  } as const;
  return { score, ...map[score] };
}

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<FieldError>(null);

  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordOk = strength.score >= 2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setErrorField(null);

    if (!consent) {
      setErrorField("consent");
      setErrorMsg("Please agree to the terms and privacy policy.");
      return;
    }
    if (!passwordOk) {
      setErrorField("password");
      setErrorMsg("Please use a stronger password (8+ chars with a mix).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        field?: FieldError;
        hint?: string;
      };
      if (!res.ok || !data.ok) {
        setErrorField((data.field as FieldError) ?? null);
        setErrorMsg(humaniseSignupError(data.error, data.hint));
        setLoading(false);
        return;
      }
      // Pass email along so /buy-india can lock the payment form to this account.
      window.location.href = `/buy-india?from=signup&email=${encodeURIComponent(email)}`;
    } catch {
      setErrorMsg("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        New account
      </p>
      <h2 className="mt-1.5 text-2xl font-bold text-ink">Email + phone + password</h2>
      <p className="mt-2 text-sm text-slate-600">
        All three are required so we can reach you (email), verify your UPI
        payment (phone), and let you sign in later (password).
      </p>

      <div className="mt-7 space-y-5">
        <Field label="Full name" required error={errorField === "name"}>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tharak Reddy"
            className="input"
            autoComplete="name"
          />
        </Field>

        <Field label="Email" required error={errorField === "email"}
               hint="Where we send your installer + receipts">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="input"
            autoComplete="email"
            inputMode="email"
          />
        </Field>

        <Field label="Phone" required error={errorField === "phone"}
               hint="With country code. Same number you'll pay from.">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="input"
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>

        <Field label="Password" required error={errorField === "password"}>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars · use a mix"
              className="input pr-20"
              autoComplete="new-password"
              minLength={8}
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
          {/* Strength bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1 overflow-hidden rounded-full bg-slate-100">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-full flex-1 transition-colors ${
                    strength.score > i ? strength.color : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <span className="w-16 text-right text-[11px] font-mono text-slate-500">
              {strength.label}
            </span>
          </div>
        </Field>

        <label className={`flex items-start gap-2.5 text-sm ${
          errorField === "consent" ? "text-red-700" : "text-slate-700"
        }`}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="underline">terms</Link> and{" "}
            <Link href="/privacy" className="underline">privacy policy</Link>.
          </span>
        </label>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-7 w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account & continue to payment →"}
      </button>

      <p className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-strong underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={`text-sm font-semibold ${error ? "text-red-700" : "text-ink"}`}>
        {label} {required ? <span className="text-accent">*</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function humaniseSignupError(code?: string, hint?: string): string {
  switch (code) {
    case "missing":         return "Please fill all required fields.";
    case "invalid_email":   return "That email doesn't look right.";
    case "invalid_phone":   return "Phone should have 8–15 digits (include country code).";
    case "weak_password":   return `Password too weak. ${hint ?? "Add uppercase, numbers, or symbols."}`;
    case "email_exists":    return "An account with this email already exists. Sign in instead.";
    case "phone_exists":    return "An account with this phone already exists. Sign in instead.";
    default:                return "Couldn't create your account. Please try again.";
  }
}
