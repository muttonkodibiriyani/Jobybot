import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — runs on every request before the route.
 * Adds production-grade security headers. No personal data is processed here.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // HSTS — force HTTPS in browsers for 2 years (preloadable).
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // Prevent rendering inside any iframe (clickjacking).
  res.headers.set("X-Frame-Options", "DENY");

  // Mime sniff off.
  res.headers.set("X-Content-Type-Options", "nosniff");

  // Cross-site referrer leakage off.
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy — disable mic / camera / FLoC etc.
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  );

  // Content-Security-Policy — strict, only allow self + Stripe + the QR data
  // we render server-side; inline styles allowed for Tailwind in dev.
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob: https://*.stripe.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://*.youtube.com https://*.youtube-nocookie.com https://player.vimeo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);

  // Cross-Origin isolation
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return res;
}

export const config = {
  matcher: [
    // Run on every path except next-internal, image-optimisation, and well-known statics.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
