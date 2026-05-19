import Link from "next/link";
import { DownloadInstaller } from "@/components/DownloadInstaller";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id ?? "";

  return (
    <div className="mx-auto max-w-page section-pad">
      <div className="mx-auto max-w-lg text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl text-success">
          ✓
        </span>
        <h1 className="h2 mt-6">Payment successful</h1>
        <p className="lead mt-4">
          Thank you for purchasing Jobybot Pro. Download your installer below, then run{" "}
          <strong>SETUP_FOR_FRIENDS.bat</strong> inside the ZIP.
        </p>
        <DownloadInstaller sessionId={sessionId} />
        <ol className="mt-10 space-y-3 text-left text-sm text-ink-muted">
          <li>1. Extract the ZIP to Documents or Downloads</li>
          <li>2. Add your resume PDF to the folder</li>
          <li>3. Double-click SETUP_FOR_FRIENDS.bat</li>
          <li>4. Fill .env when Notepad opens (Gmail App Password)</li>
          <li>5. Double-click START_AUTOSCHEDULE.bat</li>
        </ol>
        <Link href="/" className="btn-secondary mt-10 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  );
}
