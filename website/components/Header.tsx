"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/install", label: "Install" },
  { href: "/setup", label: "Setup" },
  { href: "/security", label: "Security" },
  { href: "/wins", label: "Wins" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Slight shadow + tighter border once we scroll past the hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-surface-divider bg-white/80 backdrop-blur-xl shadow-xs"
          : "border-b border-transparent bg-white/60 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" aria-label="JobyBots home" className="group">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/buy-india"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all duration-300 hover:bg-ink-soft hover:shadow-sm"
          >
            Get JobyBots
            <span aria-hidden>→</span>
          </Link>
        </div>

        <button
          type="button"
          className="-mr-2 rounded-lg p-2 md:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <span
            className={`block h-0.5 w-6 bg-ink transition-transform duration-300 ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`mt-1.5 block h-0.5 w-6 bg-ink transition-opacity duration-300 ${
              open ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`mt-1.5 block h-0.5 w-6 bg-ink transition-transform duration-300 ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {open ? (
        <div className="animate-fade-in border-t border-surface-divider bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-xl px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-surface-subtle"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/buy-india"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Get JobyBots →
          </Link>
        </div>
      ) : null}
    </header>
  );
}
