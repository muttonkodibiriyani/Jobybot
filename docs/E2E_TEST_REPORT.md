# JobyBots — End-to-End Test Report

**Tested on:** Wednesday, May 20, 2026
**Site:** <https://jobybots.com>
**Vercel commit:** `5f91c86` (rotating gear logo + SVG favicon)

---

## How to re-run these tests yourself

Two scripts are checked into the repo:

```powershell
# Test the Gemini AI integration (uses the key in your .env)
py -3 scripts/test_gemini.py

# Test every public route on the live site
py -3 scripts/e2e_smoke.py
```

If `scripts/e2e_smoke.py` fails with `WinError 10013` it means your
local Windows Firewall is blocking outbound Python connections.
Either allow Python through the firewall, or just open each URL in
Chrome manually — they're the same routes the script checks.

---

## Results — live site (Vercel)

| Route | Status | Critical content | Verdict |
|---|---:|---|:---:|
| `/` (home) | 200 | **"Powered by Google Gemini AI"** badge, hero, AI search demo, 9 AI capability cards, comparison table, support, CTA | ✅ |
| `/demo` | 200 | Live AI demo, 6-stage AI pipeline explainer, dashboard preview, 6-step customer install | ✅ |
| `/dashboard` | 200 | Window-chrome mock dashboard, live AI activity log, ranked jobs table, daily-email mockup | ✅ |
| `/pricing` | 200 | Both UPI ₹2,999 and Stripe $49 tiers visible, feature list | ✅ |
| `/buy-india` | 200 | PhonePe QR, two-step form, customer-friendly safety badges (no HTTPS/HSTS jargon) | ✅ |
| `/faq` | 200 | All sections (payments, refunds, product, security, support); "Is jobybots.com secure?" answer is in plain English now | ✅ |
| `/refund` | 200 | Refund form with Order ID, email, reason, consent checkbox | ✅ |
| `/icon.svg` | 200 | New J monogram in dark rounded square (no bot picture) | ✅ |
| `/apple-icon.svg` | 200 | 180×180 J monogram for iOS home-screen | ✅ |
| `/robots.txt` | 200 | Sitemap declaration present | ✅ |
| `/sitemap.xml` | 200 | All public routes included | ✅ |
| `/admin` | 307 → `/admin/login` | Redirect chain works; admin gated | ✅ |
| `/api/cron/notify-pending` | 401 | Properly rejects unauthenticated requests | ✅ |

**Overall:** 13 / 13 critical routes pass.

---

## Results — Gemini AI integration (local bot)

Test script: `py -3 scripts/test_gemini.py`

| Test | Result |
|---|---|
| Key loaded from `.env` | ✅ `AIzaSyAc…6qE4` |
| Model | `gemini-flash-latest` |
| Sample-job match score | **96 / 100** |
| Match source | `gemini` (not fallback) |
| Match reason | *"The candidate has 7+ years of MENA-based Data PM experience, strong AWS data lake expertise, and hands-on experience shipping AI agents, perfectly aligning with Careem's requirements."* |
| Tailored cover letter | 5-sentence personalised email referencing the actual JD + résumé |
| Round-trip latency | ~6 seconds per (score + email) |

**Overall:** Gemini end-to-end is fully wired and producing
production-quality output.

---

## Results — local Next.js build

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    1.91 kB         108 kB
├ ○ /buy-india                           6.88 kB         109 kB
├ ○ /dashboard                           2.74 kB         109 kB
├ ○ /demo                                 3.7 kB         110 kB
├ ○ /faq                                   164 B         106 kB
├ ○ /icon.svg                                0 B            0 B
├ ○ /pricing                               560 B         106 kB
├ ○ /refund                              1.42 kB         104 kB
├ ○ /signup                              1.15 kB         104 kB
... 29 routes total ...
+ First Load JS shared by all             102 kB
```

**Overall:** Clean build. 29 routes. No lint errors. No type errors.
~110 KB first-load JS — well under modern performance budgets.

---

## What was specifically checked for this release

The branding overhaul (commits `b57e89a` → `1f13a0e` → `5f91c86`)
introduced four changes that needed verification:

### 1. Bot picture removed everywhere ✅

Confirmed no `<Image src="/jobybots-logo.png" />` rendered on customer
pages. The old PNG bot illustration is no longer referenced.

### 2. New J monogram + rotating gear ✅

`components/Logo.tsx` now renders `[GearMark] + [BrandMark] + wordmark`.
The gear is inline SVG with `animation: jobybots-gear-spin 8s linear
infinite` — spins on the hero and in the header. Respects
`prefers-reduced-motion`.

Browser tab icon (`/icon.svg`) is the standalone J monogram in a dark
rounded square — clean and recognizable at 16×16.

### 3. HTTPS / HSTS / CSP jargon removed ✅

Grep'd the customer-facing pages. Remaining mentions of "rate-limited":
- `app/page.tsx` line 222: customer-friendly phrasing "rate-limited so
  Gmail stays happy"
- `components/DashboardLive.tsx` line 33: shows up in the demo log
  ("Sending 45 personalized emails (rate-limited)") — operational
  context, not security jargon

No remaining mentions of HSTS, CSP, X-Frame-Options, or "Encrypted in
transit" on any customer page.

### 4. Gemini AI is the headline ✅

- Hero: orange-pulsing "Powered by Google Gemini AI" pill above the H1
- 9-card "What the AI does" section
- Demo page: 6-stage AI pipeline explainer
- Dashboard mock: purple "✨ Gemini …" activity log entries

---

## Known non-issues (intentional)

- **Demo video slot at `/demo` shows "Demo video uploading soon"** —
  this is intentional; the live AI search animation above it carries
  the message until a real recording lands. Drop a YouTube URL into
  Vercel as `NEXT_PUBLIC_DEMO_VIDEO_URL` to swap in the real video.
- **Workspace-root warning during `npm run build`** — Next.js detects
  two lockfiles (root + `website/`). Harmless. Doesn't affect Vercel
  builds.
- **`/admin` returns 307** — that's correct; it redirects unauthed
  visitors to `/admin/login`.

---

## Sign-off

Site is **production-ready** for paying customers. Bot is **AI-enabled
end-to-end** with verified Gemini integration. Customer journey is
documented in `docs/CUSTOMER_JOURNEY.md`.

Next iteration items (not blocking):
- Record the 90-second demo video (storyboard in
  `docs/DEMO_VIDEO_STORYBOARD.md`).
- Capture real screenshots for `docs/CUSTOMER_JOURNEY.md` (slots
  defined in the doc).
- Add a few real customer testimonials to the home page once they
  start coming in.
