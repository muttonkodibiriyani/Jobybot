"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * SetupWizard — fully client-side .env generator.
 *
 * SECURITY MODEL:
 *   • All form state lives in browser memory (useState) — never sent anywhere.
 *   • The "Download .env" button assembles a string client-side and triggers
 *     a Blob download. No fetch(), no POST, no analytics on values.
 *   • Open the page with DevTools → Network tab to verify: zero requests
 *     happen when you submit.
 */

type FormState = {
  // Identity
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  visa: string;
  notice: string;
  summary: string;
  // Gmail
  gmail: string;
  appPassword: string;
  // AI
  geminiKey: string;
  groqKey: string;
  // Targeting
  titles: string;
  primaryMarket: string;
  secondaryMarkets: string;
  // Optional
  linkedinCookie: string;
  dailyCap: number;
};

const DEFAULTS: FormState = {
  name: "",
  email: "",
  phone: "",
  linkedin: "",
  location: "Dubai, UAE",
  visa: "UAE Resident Visa",
  notice: "1 month",
  summary: "",
  gmail: "",
  appPassword: "",
  geminiKey: "",
  groqKey: "",
  titles:
    "Product Manager,Senior Product Manager,Data Product Manager,AI Product Manager",
  primaryMarket: "UAE",
  secondaryMarkets: "Saudi,Qatar,Oman,Bahrain,India,UK",
  linkedinCookie: "",
  dailyCap: 200,
};

const STEPS = [
  { id: 1, label: "Identity",   help: "Who you are" },
  { id: 2, label: "Gmail",      help: "App password" },
  { id: 3, label: "AI key",     help: "Free Gemini" },
  { id: 4, label: "Targeting",  help: "Roles + markets" },
  { id: 5, label: "Optional",   help: "LinkedIn cookie" },
  { id: 6, label: "Download",   help: "Your .env" },
] as const;

export function SetupWizard() {
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [showPasswords, setShowPasswords] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const envFile = useMemo(() => buildEnv(form), [form]);
  const downloadHref = useMemo(() => {
    if (typeof window === "undefined") return "#";
    const blob = new Blob([envFile], { type: "text/plain;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [envFile]);

  // Per-step validation summary
  const validation = validateStep(step, form);

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-white to-white">
      {/* HERO */}
      <section className="mx-auto max-w-4xl px-6 pt-16 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-strong">
          Setup wizard · 2 minutes · 100% client-side
        </p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-bold text-ink tracking-tight">
          Build your personal JobyBots config — without us seeing a single
          credential.
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-700">
          This page runs entirely in your browser. Your Gmail App Password, your
          Gemini API key, and everything else stay on this tab. When you click{" "}
          <em>Download .env</em>, the file is built locally and saved to your
          Downloads folder. <strong>Open DevTools → Network</strong> and watch —
          you'll see zero outgoing requests.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <span aria-hidden>●</span>
          Local-first · No server stores credentials ·{" "}
          <Link href="/security" className="underline">
            How we proved it
          </Link>
        </div>
      </section>

      {/* PROGRESS BAR */}
      <section className="mx-auto max-w-4xl px-6 pb-4">
        <ol
          className="flex items-center gap-2 overflow-x-auto pb-2"
          aria-label="Setup progress"
        >
          {STEPS.map((s) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <li key={s.id} className="flex-1 min-w-[88px]">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`block w-full rounded-xl border px-3 py-2 text-left transition ${
                    current
                      ? "border-accent bg-accent/10"
                      : done
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                    Step {s.id}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-ink">
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    {s.help}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* FORM CARD */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xl shadow-slate-900/5">
          {step === 1 && (
            <Identity form={form} update={update} />
          )}
          {step === 2 && (
            <GmailStep
              form={form}
              update={update}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />
          )}
          {step === 3 && (
            <AiStep
              form={form}
              update={update}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
            />
          )}
          {step === 4 && <TargetingStep form={form} update={update} />}
          {step === 5 && <OptionalStep form={form} update={update} />}
          {step === 6 && (
            <DownloadStep form={form} envFile={envFile} downloadHref={downloadHref} />
          )}

          {/* NAV */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              {validation.message && (
                <span
                  className={`text-xs font-medium ${
                    validation.ok ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {validation.message}
                </span>
              )}
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(6, s + 1))}
                  className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-soft"
                >
                  Next →
                </button>
              ) : (
                <a
                  href={downloadHref}
                  download="JobyBots.env"
                  className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-strong"
                >
                  Download .env file ↓
                </a>
              )}
            </div>
          </div>
        </div>

        {/* HONEST CALLOUT */}
        <div className="mt-8 rounded-2xl bg-ink p-6 text-white">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/70">
            Why this works without an account
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90">
            Most SaaS tools ask you to "sign up", upload secrets to their server,
            and trust them to keep those secrets safe. JobyBots is the
            opposite — your installer is bought once, your secrets live in a
            text file on your laptop, and this wizard exists only to make
            building that text file friendlier than copy-pasting from a README.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ─── Step 1: Identity ─────────────────────────────────────────────── */
function Identity({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Tell us who you are</h2>
      <p className="mt-2 text-sm text-slate-600">
        These details are written into your cover letters. Be the version of
        you you'd want a recruiter to read.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Darapu Tharakeswara Reddy"
            className="input"
          />
        </Field>
        <Field label="Personal email" required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@gmail.com"
            className="input"
          />
        </Field>
        <Field label="Phone (with country code)">
          <input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+971501234567"
            className="input"
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            value={form.linkedin}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="https://linkedin.com/in/your-profile"
            className="input"
          />
        </Field>
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Visa / right-to-work">
          <input
            value={form.visa}
            onChange={(e) => update("visa", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Notice period">
          <input
            value={form.notice}
            onChange={(e) => update("notice", e.target.value)}
            className="input"
          />
        </Field>
      </div>
      <Field
        className="mt-4"
        label="One-line summary (used in cover letters)"
        hint="Two sentences. Pretend you have 8 seconds with a recruiter."
      >
        <textarea
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="8+ years building data products and AI agents in MENA retail. Azure-certified, IIT alum, Dubai-based, available in 1 month."
          rows={3}
          className="input"
        />
      </Field>
    </div>
  );
}

/* ─── Step 2: Gmail ─────────────────────────────────────────────────── */
function GmailStep({
  form,
  update,
  showPasswords,
  setShowPasswords,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  showPasswords: boolean;
  setShowPasswords: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Gmail App Password</h2>
      <p className="mt-2 text-sm text-slate-600">
        JobyBots sends every recruiter email from <em>your</em> Gmail account so
        replies land in <em>your</em> inbox. We never see this password — it's
        written into the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>{" "}
        file on your laptop.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Gmail address" required>
          <input
            type="email"
            value={form.gmail}
            onChange={(e) => update("gmail", e.target.value)}
            placeholder="you@gmail.com"
            className="input"
          />
        </Field>
        <Field
          label="16-digit App Password"
          required
          hint='Looks like "xxxx xxxx xxxx xxxx"'
        >
          <input
            type={showPasswords ? "text" : "password"}
            value={form.appPassword}
            onChange={(e) => update("appPassword", e.target.value)}
            placeholder="xxxx xxxx xxxx xxxx"
            className="input"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show password (only on this screen)
      </label>

      <div className="mt-8 rounded-2xl bg-cream p-6 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-ink">
          How to generate a free App Password (90 seconds)
        </h3>
        <ol className="mt-3 ml-5 list-decimal space-y-2 text-sm text-slate-700">
          <li>
            Make sure 2-Step Verification is on:{" "}
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong underline"
            >
              myaccount.google.com/security
            </a>
            . Scroll to <em>How you sign in to Google</em> → enable <em>2-Step Verification</em>.
          </li>
          <li>
            Open{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong underline"
            >
              myaccount.google.com/apppasswords
            </a>
            .
          </li>
          <li>
            Type <em>JobyBots</em> as the app name → click{" "}
            <strong>Create</strong>.
          </li>
          <li>
            Google shows a yellow box with 16 letters. Copy <em>without the
            spaces</em> and paste above. (Spaces are okay too — JobyBots strips
            them.)
          </li>
          <li>
            That's it. The App Password gives JobyBots <em>send-only</em> access
            to your Gmail — you can revoke it any time in the same screen.
          </li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Don't have 2FA? Free, takes 30 seconds:{" "}
          <a
            href="https://myaccount.google.com/signinoptions/two-step-verification"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            turn it on here
          </a>
          .
        </p>
      </div>
    </div>
  );
}

/* ─── Step 3: AI key ────────────────────────────────────────────────── */
function AiStep({
  form,
  update,
  showPasswords,
  setShowPasswords,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  showPasswords: boolean;
  setShowPasswords: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">Free AI key (Gemini)</h2>
      <p className="mt-2 text-sm text-slate-600">
        Gemini scores every job against your résumé and rewrites every cover
        letter. Google's free tier is{" "}
        <strong>1,500 calls per day</strong> — more than enough.
      </p>

      <div className="mt-5 grid gap-4">
        <Field label="Gemini API key" required>
          <input
            type={showPasswords ? "text" : "password"}
            value={form.geminiKey}
            onChange={(e) => update("geminiKey", e.target.value)}
            placeholder="AIzaSy…"
            className="input font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          label="Groq API key (optional fallback, also free)"
          hint="Used only if Gemini's daily limit is reached."
        >
          <input
            type={showPasswords ? "text" : "password"}
            value={form.groqKey}
            onChange={(e) => update("groqKey", e.target.value)}
            placeholder="gsk_…"
            className="input font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
      </div>

      <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show keys (only on this screen)
      </label>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
          <h3 className="text-sm font-bold text-ink">Get a free Gemini key</h3>
          <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-700">
            <li>
              Go to{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-strong underline"
              >
                aistudio.google.com/apikey
              </a>
              .
            </li>
            <li>Sign in with Google.</li>
            <li>
              Click <strong>Create API key</strong> → choose any project.
            </li>
            <li>
              Copy the key (starts with <code>AIzaSy…</code>) and paste above.
            </li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Free tier: 60 calls/min, 1,500/day. No credit card required.
          </p>
        </div>
        <div className="rounded-2xl bg-cream p-5 ring-1 ring-amber-100">
          <h3 className="text-sm font-bold text-ink">Get a free Groq key (optional)</h3>
          <ol className="mt-3 ml-5 list-decimal space-y-1.5 text-sm text-slate-700">
            <li>
              Go to{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-strong underline"
              >
                console.groq.com/keys
              </a>
              .
            </li>
            <li>Sign up free (Google or GitHub login).</li>
            <li>
              Click <strong>Create API Key</strong> → name it "JobyBots".
            </li>
            <li>
              Copy the key (starts with <code>gsk_…</code>).
            </li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Used only if Gemini's daily quota is exhausted.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Targeting ─────────────────────────────────────────────── */
function TargetingStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  const allMarkets = [
    "Saudi",
    "Qatar",
    "Oman",
    "Bahrain",
    "India",
    "Singapore",
    "Australia",
    "Canada",
    "UK",
    "Germany",
    "Netherlands",
    "Ireland",
    "Sweden",
  ];
  const selected = new Set(
    form.secondaryMarkets.split(",").map((s) => s.trim()).filter(Boolean),
  );
  function toggleMarket(m: string) {
    const next = new Set(selected);
    if (next.has(m)) next.delete(m);
    else next.add(m);
    update("secondaryMarkets", Array.from(next).join(","));
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">What roles? Where?</h2>
      <p className="mt-2 text-sm text-slate-600">
        These drive the search. You can edit them anytime in your{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>.
      </p>

      <Field
        className="mt-6"
        label="Target job titles (comma-separated)"
        required
        hint="Add 4–10 variations. JobyBots searches each one across every job board."
      >
        <textarea
          value={form.titles}
          onChange={(e) => update("titles", e.target.value)}
          rows={3}
          className="input"
        />
      </Field>

      <Field className="mt-4" label="Primary market (lives in your home country)">
        <select
          value={form.primaryMarket}
          onChange={(e) => update("primaryMarket", e.target.value)}
          className="input"
        >
          {["UAE", "Saudi", "Qatar", "Oman", "Bahrain", "India", "UK"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <div className="mt-6">
        <p className="text-sm font-semibold text-ink">
          Secondary markets you'd accept
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Search runs everywhere. Email blast respects each market's privacy
          rules (Germany / NL / Ireland / Sweden are GDPR-strict).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allMarkets.map((m) => {
            const on = selected.has(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMarket(m)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  on
                    ? "border-accent bg-accent text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <Field
        className="mt-6"
        label="Daily email cap"
        hint="200 is the safe limit per Gmail account. Lower it if Google flags you."
      >
        <input
          type="number"
          min={20}
          max={500}
          value={form.dailyCap}
          onChange={(e) => update("dailyCap", Number(e.target.value) || 200)}
          className="input"
        />
      </Field>
    </div>
  );
}

/* ─── Step 5: Optional (LinkedIn cookie) ─────────────────────────────── */
function OptionalStep({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">
        LinkedIn session cookie <span className="text-slate-400">(optional but powerful)</span>
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Without this, JobyBots still works — it scrapes Bayt, Naukrigulf,
        GulfTalent, Indeed and 40+ company career pages. <em>With</em> this
        cookie, it can also identify the actual recruiter who posted each
        LinkedIn job and email <em>them</em> personally (typically 4× higher
        reply rate).
      </p>

      <Field
        className="mt-6"
        label="li_at cookie value"
        hint="Looks like 200+ random characters. We never see it; it's written to your local .env."
      >
        <textarea
          value={form.linkedinCookie}
          onChange={(e) => update("linkedinCookie", e.target.value)}
          rows={3}
          placeholder="AQEDA…"
          className="input font-mono text-xs"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>

      <div className="mt-8 rounded-2xl bg-cream p-6 ring-1 ring-amber-100">
        <h3 className="text-sm font-bold text-ink">
          How to copy your LinkedIn cookie (60 seconds, Chrome / Edge)
        </h3>
        <ol className="mt-3 ml-5 list-decimal space-y-2 text-sm text-slate-700">
          <li>
            Sign in to{" "}
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-strong underline"
            >
              linkedin.com
            </a>{" "}
            in Chrome or Edge.
          </li>
          <li>
            Press <kbd className="kbd">F12</kbd> → click the{" "}
            <strong>Application</strong> tab (might be hidden under{" "}
            <strong>»</strong>).
          </li>
          <li>
            In the left sidebar: <strong>Storage → Cookies →
            https://www.linkedin.com</strong>.
          </li>
          <li>
            Find the row named <code>li_at</code>. Double-click the{" "}
            <em>Value</em> column → <kbd className="kbd">Ctrl+C</kbd> /{" "}
            <kbd className="kbd">⌘C</kbd>.
          </li>
          <li>Paste it here.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          The cookie expires when you log out of LinkedIn or in ~12 months,
          whichever comes first. Just re-paste when needed.
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        You can skip this and add it later by editing your{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>.
      </p>
    </div>
  );
}

/* ─── Step 6: Download ──────────────────────────────────────────────── */
function DownloadStep({
  form,
  envFile,
  downloadHref,
}: {
  form: FormState;
  envFile: string;
  downloadHref: string;
}) {
  const ready =
    form.name && form.email && form.gmail && form.appPassword && form.geminiKey;
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">
        Your personal config is ready.
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Below is the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>{" "}
        file the wizard built. Click <strong>Download</strong>, then drop it
        into your JobyBots folder (the one you unzipped).
      </p>

      <div className="mt-6 rounded-2xl bg-ink p-1">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-xs font-mono text-white/60">
            JobyBots.env · preview
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300">
            ● Generated locally — never sent
          </span>
        </div>
        <pre className="max-h-72 overflow-auto p-4 text-xs font-mono leading-relaxed text-emerald-200">
          {envFile.split("\n").slice(0, 26).join("\n")}
          {envFile.split("\n").length > 26 ? "\n…" : ""}
        </pre>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <a
          href={downloadHref}
          download="JobyBots.env"
          aria-disabled={!ready}
          className={`rounded-2xl px-5 py-4 text-center font-semibold text-white shadow-sm transition ${
            ready
              ? "bg-accent hover:bg-accent-strong"
              : "bg-slate-300 pointer-events-none"
          }`}
        >
          ↓ Download <code>.env</code> file
        </a>
        <a
          href="/install"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          See install steps →
        </a>
        <a
          href="/security"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          Why is this safe? →
        </a>
      </div>

      {!ready && (
        <p className="mt-3 text-xs text-amber-700">
          Fill in the required fields in steps 1–3 (name, email, Gmail address,
          App Password, Gemini key) to unlock the download.
        </p>
      )}

      <div className="mt-10 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
        <h3 className="text-sm font-bold text-emerald-900">
          Next: drop the file into JobyBots
        </h3>
        <ol className="mt-3 ml-5 list-decimal space-y-2 text-sm text-emerald-900">
          <li>
            Unzip the JobyBots installer that came in your purchase email
            (Windows <code>.zip</code> or Mac <code>.zip</code>).
          </li>
          <li>
            Move the downloaded <code>JobyBots.env</code> into that folder and{" "}
            <strong>rename it to <code>.env</code></strong> (with the leading
            dot, no extension).
          </li>
          <li>
            Drop your <code>resume.pdf</code> into the same folder.
          </li>
          <li>
            <strong>Windows:</strong> double-click{" "}
            <code>SETUP_FOR_FRIENDS.bat</code>.
            <br />
            <strong>Mac:</strong> double-click <code>mac/Setup.command</code>.
          </li>
        </ol>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */
function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-ink">
        {label} {required ? <span className="text-accent">*</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint && (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

function validateStep(step: number, f: FormState): { ok: boolean; message: string } {
  if (step === 1) {
    if (!f.name) return { ok: false, message: "Name is required" };
    if (!f.email) return { ok: false, message: "Email is required" };
    return { ok: true, message: "Looks good" };
  }
  if (step === 2) {
    if (!f.gmail) return { ok: false, message: "Gmail address required" };
    if (!f.appPassword)
      return { ok: false, message: "App Password required" };
    if (f.appPassword.replace(/\s/g, "").length < 16)
      return { ok: false, message: "App Password should be 16 characters" };
    return { ok: true, message: "Gmail looks valid" };
  }
  if (step === 3) {
    if (!f.geminiKey)
      return { ok: false, message: "Gemini key required (free)" };
    if (!f.geminiKey.startsWith("AIza"))
      return { ok: false, message: "Gemini keys start with AIza…" };
    return { ok: true, message: "AI ready" };
  }
  if (step === 4) {
    if (!f.titles) return { ok: false, message: "Add at least one role" };
    return { ok: true, message: "Targeting set" };
  }
  if (step === 5) return { ok: true, message: "Optional — skip if unsure" };
  return { ok: true, message: "" };
}

/**
 * Build a complete .env file from form state.
 * Pure function; can be unit-tested.
 */
function buildEnv(f: FormState): string {
  const esc = (v: string) => `"${v.replace(/"/g, '\\"').replace(/\n/g, " ")}"`;
  const cleanPwd = f.appPassword.replace(/\s/g, "");
  const cookie = f.linkedinCookie.replace(/\n/g, "").trim();
  return `# ─── Generated by https://jobybots.com/setup ─────────────────────
# Built ${new Date().toISOString()}
# This file is on YOUR machine. Never commit it. Never share it.
#
# Your credentials never reached our servers — this file was assembled
# entirely in your browser. Verify: open DevTools → Network tab and
# you'll see zero outgoing requests when you clicked Download.

# ─── REQUIRED: Identity ──────────────────────────────────────────
USER_NAME=${esc(f.name)}
USER_EMAIL=${f.email}
USER_PHONE=${f.phone}
USER_LINKEDIN=${f.linkedin}
USER_LOCATION=${esc(f.location)}
USER_VISA=${esc(f.visa)}
USER_NOTICE=${esc(f.notice)}
RESUME_PATH=./resume.pdf
USER_SUMMARY=${esc(f.summary || "Open to roles that match the title list below.")}

# ─── REQUIRED: Gmail SMTP ────────────────────────────────────────
GMAIL_ADDRESS=${f.gmail}
GMAIL_APP_PASSWORD=${cleanPwd}

# ─── Target roles ────────────────────────────────────────────────
TARGET_TITLES=${esc(f.titles)}

# ─── Markets ─────────────────────────────────────────────────────
PRIMARY_MARKET=${f.primaryMarket}
SECONDARY_MARKETS=${esc(f.secondaryMarkets)}

# ─── Rate limits ─────────────────────────────────────────────────
DAILY_EMAIL_CAP=${f.dailyCap}
HOURLY_JOB_LIMIT=20
MATCH_THRESHOLD=50
RUN_INTERVAL_MINUTES=30
MIN_DELAY_SEC=30
MAX_DELAY_SEC=120

# ─── Sources ─────────────────────────────────────────────────────
ENABLE_LINKEDIN_SEARCH=true
ENABLE_INDEED=true
ENABLE_NAUKRIGULF=true
ENABLE_BAYT=true
ENABLE_GULFTALENT=true
ENABLE_REMOTEOK=true
ENABLE_COMPANY_CAREERS=true

# ─── Follow-ups ──────────────────────────────────────────────────
ENABLE_FOLLOWUP=true
FOLLOWUP_DAYS=7

# ─── AI providers (free tier) ────────────────────────────────────
GEMINI_API_KEY=${f.geminiKey}
GEMINI_MODEL=gemini-flash-latest
GROQ_API_KEY=${f.groqKey}
GROQ_MODEL=llama-3.3-70b-versatile
AI_ENABLED=true
AI_MIN_MATCH=60

# ─── Email finder v2 ─────────────────────────────────────────────
EMAIL_FINDER_TIER=${cookie ? "t2" : "t1"}
SMTP_PROBE_ENABLED=true
LINKEDIN_COOKIE=${cookie}
LINKEDIN_FINDER_DAILY_CAP=30

# ─── Misc ────────────────────────────────────────────────────────
DAILY_SUMMARY_HOUR=9
LOG_LEVEL=INFO
`;
}
