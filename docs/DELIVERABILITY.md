# Email Deliverability & GDPR — How Jobybot keeps your sender reputation safe

This page explains every defence Jobybot now uses so your emails actually
land in recruiter inboxes (not Gmail jail) and you don't get into legal
trouble in Europe.

## 1. The problem we just fixed
Cold-emailing `careers@company.com` is fine in UAE, India, Singapore, and most
of APAC. It is **not** fine in the EU/UK without a clear legitimate-interest
basis (GDPR / UK PECR). And every email you send to a wrong address damages
your Gmail sender reputation — eventually Google will throttle or block you.

## 2. What Jobybot does now (automatic, no setup)
| Layer | What it does | Where |
|---|---|---|
| **Syntax check** | Rejects obvious garbage before SMTP. | `core/email_validator.py` |
| **MX lookup** | Confirms the domain actually accepts email (with Cloudflare/Google fallback DNS). | `core/email_validator.py` |
| **Free-provider role filter** | Refuses `hr@gmail.com`, `careers@yahoo.com`, etc. — those are almost always fake. | `core/email_validator.py` |
| **Validation cache** | DNS result cached per address so we don't re-resolve on every send. | `validation_cache` table |
| **Bounce tracker** | Reads your Gmail inbox for `Mailer-Daemon` / `postmaster` NDRs, parses the failed recipient, and quarantines it forever. | `core/bounce_tracker.py` |
| **SMTP-rejection capture** | If Gmail returns a 5xx for a recipient, that address is also quarantined. | `core/email_sender.py` |
| **GDPR mode** | Markets marked `gdpr_strict: true` are **never** emailed — Jobybot still searches their jobs and adds them to your inbox so you can apply via the official career site. | `markets/*.json` + `jobybot.py:is_gdpr_market` |

GDPR-strict markets shipping today: **Germany, Netherlands, Ireland, Sweden, UK**.

## 3. New one-click commands

| File | What it does |
|---|---|
| `CHECK_BOUNCES.bat` | Reads your Gmail mailbox, marks every bounced address as invalid. Run this daily. |
| `DASHBOARD.bat` | Opens the live HTML dashboard (auto-refreshes every 60 s). |

The dashboard shows: emails today / cap, jobs found today, total bounces,
jobs by source, the last 100 events, top matched jobs, and the most recent
bounce log.

## 4. Finding more correct emails (deep digital footprint)
For high-value mid-scale companies, Jobybot already does:
1. Known-domain overrides (`core/email_finder.py:KNOWN_DOMAINS`)
2. Domain-from-company-name guess + MX verification
3. Pattern: `careers@`, falls back to `jobs@`, `hr@`, `recruit@`, `talent@`

Add a company you care about to `KNOWN_DOMAINS` once and Jobybot will get
it right forever.

## 5. What we deliberately did *not* build
- **SMTP RCPT TO probing** — most servers grey-list or blocklist the prober's
  IP, hurting your reputation more than the bounces would.
- **Hunter.io / NeverBounce calls** — paid, $0.005-$0.01 / address. Easy to
  add later in `email_validator.verify_paid()` if you decide to subscribe.

## 6. India / UAE / Singapore — still safe to email
These markets have no GDPR equivalent for B2B. Jobybot continues to email
recruiters there at the 200/day cap (configurable in `.env`).

## 7. Tuning the daily cap
Edit `.env`:
```
DAILY_EMAIL_CAP=200
```
Gmail Free accounts hard-cap at 500/day; staying below 250 keeps reputation
healthy. The dashboard's progress bar shows today/cap live.
