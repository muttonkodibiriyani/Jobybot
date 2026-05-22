import Link from "next/link";
import { Logo } from "./Logo";
import { SUPPORT } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-ink text-white">
      <div className="mx-auto max-w-page section-pad !py-14 px-4">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo variant="light" size="md" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              JobyBots runs on your laptop — searching jobs every hour and
              sending tailored recruiter emails with your resume. Built for India,
              UAE, and global job seekers. 7-day money-back guarantee.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <p className="text-white/60">
                Support · <a className="text-white hover:text-accent" href={`mailto:${SUPPORT.email}`}>
                  {SUPPORT.email}
                </a>
              </p>
              <p className="text-white/60">
                Call · <a className="text-white hover:text-accent" href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>
                  {SUPPORT.phone}
                </a>
              </p>
              <p className="text-white/40 text-xs">{SUPPORT.hours}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/buy-india" className="hover:text-white">Buy with UPI</Link></li>
              <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              <li><Link href="/signup" className="hover:text-white">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Support</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/refund" className="hover:text-white">Refund</Link></li>
              <li><a className="hover:text-white" href={`mailto:${SUPPORT.email}`}>Email us</a></li>
              <li><a className="hover:text-white" href={`tel:${SUPPORT.phone.replace(/\s/g, "")}`}>Call us</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Trust</p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              <li><Link href="/security" className="hover:text-white">Security</Link></li>
              <li><Link href="/trust" className="hover:text-white">Bot boundaries</Link></li>
              <li><Link href="/technology" className="hover:text-white">Technology stack</Link></li>
              <li>
                <a href="https://github.com/muttonkodibiriyani/Jobybot" className="hover:text-white">
                  GitHub (community)
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} JobyBots — A product by Tharakeswara Reddy.
          Your data stays on your device.
        </p>
      </div>
    </footer>
  );
}
