import { RefundForm } from "@/components/RefundForm";
import { SUPPORT } from "@/lib/config";

export const metadata = {
  title: `Request a refund · ${SUPPORT.refundDays}-day money-back guarantee`,
  description:
    "Not satisfied? Submit your refund request — we acknowledge in 30 minutes and refund within 5 business days.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-2xl section-pad px-4">
      <p className="eyebrow">Refund</p>
      <h1 className="h1 mt-2">{SUPPORT.refundDays}-day money-back guarantee</h1>
      <p className="lead mt-3">
        If JobyBots doesn&apos;t make your job search easier, we refund 100%
        — same UPI / card — within 5 business days. Submit the form, we
        acknowledge inside {SUPPORT.verificationWindow}.
      </p>

      <div className="card mt-8">
        <RefundForm />
      </div>

      <div className="mt-10 rounded-2xl border border-surface-border bg-surface-subtle p-6">
        <h2 className="font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
          <li>You submit the form below within {SUPPORT.refundDays} days of receiving the installer.</li>
          <li>We confirm receipt within {SUPPORT.verificationWindow} (automated email).</li>
          <li>We review and process the refund within 5 business days.</li>
          <li>The refund lands in the same UPI account / card that paid.</li>
          <li>Your data (email, phone, payment proof) is permanently deleted within 24 hours after the refund.</li>
        </ol>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Need help finding your Order ID?{" "}
        <a className="font-medium text-accent underline" href={`mailto:${SUPPORT.email}`}>
          Email {SUPPORT.email}
        </a>
      </p>
    </div>
  );
}
