"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/refund", label: "Refund" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="JobyBots home">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink-muted transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/signup" className="btn-secondary !py-2.5 !text-sm">
            Sign up
          </Link>
          <Link href="/buy-india" className="btn-primary !py-2.5 !text-sm">
            Buy ₹2,999
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-surface-border bg-surface px-4 py-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-3 text-base font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/buy-india"
            className="btn-primary mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            Buy ₹2,999
          </Link>
        </div>
      ) : null}
    </header>
  );
}
