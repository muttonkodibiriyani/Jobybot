import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-ink text-white">
      <div className="mx-auto max-w-page section-pad !py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="light" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Jobybot runs on your laptop — searching jobs every hour and sending
              tailored recruiter emails with your resume. Built for UAE, India, and
              global job seekers.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/#how" className="hover:text-white">How it works</Link></li>
              <li><Link href="/download" className="hover:text-white">Download</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Legal</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li>
                <a href="https://github.com/muttonkodibiriyani/Jobybot" className="hover:text-white">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Jobybot. Your data stays on your device.
        </p>
      </div>
    </footer>
  );
}
