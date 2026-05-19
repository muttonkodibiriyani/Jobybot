export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl section-pad">
      <h1>Privacy Policy</h1>
      <p className="text-ink-muted">Last updated: May 2026</p>
      <p>
        <strong>Local-first:</strong> Jobybot Pro runs on your computer. Your resume, Gmail App
        Password, and job database stay on your device unless you choose to share them.
      </p>
      <p>
        <strong>Payments:</strong> Checkout is processed by Stripe. We receive your email and
        payment status from Stripe, not your Gmail credentials.
      </p>
      <p>
        <strong>Website:</strong> Standard server logs (IP, browser) may be collected by your
        hosting provider (e.g. Vercel).
      </p>
    </article>
  );
}
