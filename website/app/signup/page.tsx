import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Sign up · Jobybot",
  description:
    "Create your Jobybot account. We'll email installation steps after payment is verified.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md section-pad">
      <p className="eyebrow">Create account</p>
      <h1 className="h1 mt-2">Sign up for Jobybot</h1>
      <p className="lead mt-2">
        We email install steps + license once your payment is verified.
        Your details are stored securely and never shared.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already paid?{" "}
        <a href="/buy-india" className="font-medium text-accent underline">
          Skip and submit your UPI payment →
        </a>
      </p>
    </div>
  );
}
