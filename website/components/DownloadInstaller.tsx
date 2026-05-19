"use client";

export function DownloadInstaller({ sessionId }: { sessionId: string }) {
  if (!sessionId) {
    return (
      <p className="mt-6 text-sm text-red-600">
        Missing session. If you paid, contact support with your receipt.
      </p>
    );
  }

  const href = `/api/download?session_id=${encodeURIComponent(sessionId)}`;

  return (
    <a href={href} className="btn-primary mt-8 inline-flex w-full sm:w-auto">
      Download Jobybot-Pro-Setup.zip
    </a>
  );
}
