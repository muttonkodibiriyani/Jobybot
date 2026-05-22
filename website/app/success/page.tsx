import Link from "next/link";
import { DownloadInstaller } from "@/components/DownloadInstaller";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; email?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id ?? "";
  const email = params.email ?? "";

  return (
    <div className="mx-auto max-w-3xl section-pad">
      <div className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl text-success">
          ✓
        </span>
        <h1 className="h2 mt-6">Payment successful</h1>
        <p className="lead mt-4">
          Thank you for purchasing JobyBots Pro. We've emailed your license key
          and a direct portal link to your inbox.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border-2 border-accent bg-cream/40 p-6 sm:p-10 shadow-lift">
        <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
          Recommended · 2 minutes
        </p>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-ink">
          Sign in to your portal &amp; build your personalised installer
        </h2>
        <p className="mt-4 text-base text-slate-700 leading-relaxed">
          The portal walks you through a 5-step config wizard (Gmail App
          Password, Gemini key, target roles) and downloads a single ZIP with
          everything wired up. The whole flow runs in your browser — your
          credentials never reach our servers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-accent-strong"
          >
            Sign in to portal →
          </Link>
          <Link
            href="/security"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            How is this safe?
          </Link>
        </div>
      </div>

      <details className="mt-8 rounded-2xl border border-surface-divider bg-white p-6">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Prefer the manual ZIP download? (advanced users)
        </summary>
        <div className="mt-5">
          <p className="text-sm text-slate-700">
            Download the raw installer ZIP and edit{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>{" "}
            by hand. Same product, just without the wizard.
          </p>
          <div className="mt-5">
            <DownloadInstaller sessionId={sessionId} />
          </div>
          <ol className="mt-6 space-y-2 text-sm text-ink-muted">
            <li>1. Extract the ZIP to Desktop / Documents.</li>
            <li>2. Add your resume.pdf to the folder.</li>
            <li>3. Windows: <code>SETUP_FOR_FRIENDS.bat</code> · Mac: <code>mac/Setup.command</code>.</li>
            <li>4. Fill <code>.env</code> when it opens (Gmail App Password, Gemini key).</li>
            <li>5. Windows: <code>START_AUTOSCHEDULE.bat</code> · Mac: <code>mac/StartAutoSchedule.command</code>.</li>
          </ol>
        </div>
      </details>

      <p className="mt-10 text-center text-sm text-ink-muted">
        <Link href="/" className="underline">Back to home</Link>
        {" · "}
        <Link href="/install" className="underline">Install walkthrough</Link>
        {" · "}
        <a href="mailto:tharakesh.iitp@gmail.com" className="underline">
          Email the founder
        </a>
      </p>
    </div>
  );
}
