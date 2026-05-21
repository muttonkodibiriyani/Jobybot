# dev.to Article — JobyBots

> Cross-publish to dev.to + hashnode + your personal blog the same day.
> Tag with: `python`, `ai`, `automation`, `nextjs`, `webdev`.

## Title

**How I Built a Local-First AI Job-Hunting Agent in 90 Days (Python + Next.js + Gemini)**

## Cover image

[Architecture diagram: laptop → 8 sources → Gemini → SMTP → recruiter]

## Body

---

In February 2026 I quit my job and started looking for the next one. After sending 200 manual cold emails over a month and getting 6 replies, I went home and started building JobyBots.

This is the technical writeup. Code snippets, architecture diagrams, design choices, and a few war stories.

## The stack

**Bot (runs on user's laptop)**
- Python 3.11 + Click CLI
- SQLite (single-file DB)
- requests + BeautifulSoup (8 source scrapers)
- dnspython + smtplib (SMTP RCPT probe)
- imaplib (bounce tracker)
- APScheduler (hourly cycles)
- Loguru (structured logs)
- Pydantic v2 (settings from .env)
- Gemini Flash (cover letter generation)

**Website (payment + license)**
- Next.js 15 + TypeScript + Tailwind
- Vercel hosting
- Stripe (international cards) + UPI QR (India)
- Cloudflare Worker (license JWT validation, $0/mo)

**Total infra cost: $0/mo.** Every recurring expense lives on the customer's side.

## Architecture: the agent loop

Every 30 minutes:

```
        ┌──────────────────────────────────────────────────┐
        │                  JobyBots CLI                    │
        │  (runs on user's laptop, APScheduler driven)     │
        └─────────────────────┬────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼────┐    ┌─────▼────┐    ┌─────▼────┐
        │  Search  │    │ Bounce   │    │  Match   │
        │ 8 sources│    │  scan    │    │  score   │
        │ parallel │    │  (IMAP)  │    │ (Gemini) │
        └─────┬────┘    └─────┬────┘    └─────┬────┘
              │               │               │
              └───────┬───────┴───────────────┘
                      │
              ┌───────▼────────┐
              │   Email find   │
              │   (5-tier      │
              │   waterfall)   │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │  AI cover      │
              │  letter        │
              │  (Gemini)      │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │   Gmail SMTP   │
              │   (200/day cap)│
              └────────────────┘
```

## Design choice #1: Local-first

Every job-application SaaS asks you to upload your résumé. I didn't want to be the operator of a database with 5,000 strangers' CVs, and I didn't want my customers to trust me with that.

So JobyBots is a Python package on YOUR laptop. The user's résumé, Gmail App Password, and Gemini API key live in a folder on the user's machine. The bot talks directly to Gmail SMTP / Google AI Studio / job boards — no proxy through my servers.

Implications:
- I cannot sell or leak data I don't have.
- One-time pricing works (no recurring infra to recoup).
- Customer's Gmail reputation is their own (good and bad).
- Updates require a new installer (we ship via signed `.zip` on the website).

## Design choice #2: Pydantic settings

Every configuration lives in a single `.env` file at the project root. `config.py` exposes a typed Pydantic Settings object:

```python
class Settings(BaseSettings):
    user_name: str = Field(...)
    user_email: str = Field(...)
    gmail_address: str = Field(...)
    gmail_app_password: str = Field(...)
    daily_email_cap: int = Field(200)
    
    # Email finder v2
    email_finder_tier: str = Field("t2")
    smtp_probe_enabled: bool = Field(True)
    linkedin_cookie: str = Field("")
    
    model_config = SettingsConfigDict(env_file=".env")
```

One-source-of-truth config. Default values mean missing keys don't crash the bot.

## Design choice #3: The 5-tier email-finder waterfall

Finding the recruiter's actual email address is the hardest part. JobyBots tries:

```python
def find_email_v2(company, *, job_url, market, linkedin_cookie, enable_smtp_probe):
    # T0 — cache
    cached = db.get_cached_email(company)
    if cached and not db.is_invalid_email(cached):
        return Discovery(email=cached, tier="t0_cache")
    
    # T1 — careers page scrape
    t1 = _try_t1_careers_page(company, domain_hint)
    if t1 and not _smtp_rejects(t1.email):
        return t1
    
    # T2 — LinkedIn cookie lookup
    t2 = _try_t2_linkedin(company, job_url, domain_hint, cookie)
    if t2 and not _smtp_rejects(t2.email):
        return t2
    
    # T3 — country-aware pattern
    t3 = _try_t3_patterns(company, market, domain_hint)
    if t3:
        return t3
    
    return Discovery(email=None)
```

Every tier writes an audit row to `email_discovery_log`. The dashboard shows per-tier success rates so the customer can see exactly where addresses are being found.

## Design choice #4: Subject rotation for deliverability

200 emails/day with the same subject line tanks your Gmail sender reputation within a week. JobyBots ships 12 templates picked deterministically per `(company, category)`:

```python
TEMPLATES = (
    "{role} at {company}",
    "{role} role — {name}",
    "Application: {role} ({company})",
    "{role} | {name} | {years}yrs | {city}",
    "Hi {company} — interest in your {role} role",
    # ... 7 more
)

def pick_subject(company, category, name, years, location):
    idx = _stable_hash(company + category) % len(TEMPLATES)
    return TEMPLATES[idx].format(...)
```

Stable hash means re-runs pick the same subject (consistency); different companies get different subjects (no bulk-mail pattern).

## Design choice #5: IMAP-based bounce tracker

When an email bounces, Gmail sends an NDR to your inbox. JobyBots reads those NDRs via IMAP and quarantines the bad address.

The hard part: modern Gmail NDRs have multiple sender patterns AND multiple subject patterns. My original v1 only checked `From: Mailer-Daemon` and missed 242 historical bounces.

The v2 rewrite handles:

```python
BOUNCE_SENDERS = (
    "mailer-daemon", "postmaster", "mail delivery subsystem",
    "delivery-status", "bounce", "mimecast", "proofpoint", # ...
)

BOUNCE_SUBJECT_PHRASES = (
    "delivery status notification",
    "undeliverable", "address not found",
    "your email was not processed",
    "your message couldn't be delivered",
    "permanent failure", "550 ", # ...
)
```

Plus a *subject-correlation* fallback: if a bounce-shaped reply arrives whose subject equals one of our outgoing subjects, we mark the original recipient as invalid even if we can't parse the bounce body.

## Design choice #6: SMTP RCPT probe

Before sending, the bot opens an SMTP conversation to the recipient's MX, sends `MAIL FROM` and `RCPT TO`, then immediately `QUIT`s. No `DATA` is ever transmitted — no email is delivered.

The trick: large providers (Gmail, Microsoft, Mimecast) accept all RCPTs to defeat email enumeration, so a 2xx is only a weak positive. But a 5xx is a strong negative — those addresses are permanently invalid and we cache them.

```python
def probe(email, *, from_address, helo_host, timeout=7.0):
    domain = email.rsplit("@", 1)[1]
    mx = _best_mx(domain)
    with smtplib.SMTP(mx, 25, timeout=timeout) as s:
        s.ehlo(helo_host)
        s.mail(from_address)
        code, msg = s.rcpt(email)
        s.quit()
    return str(code), msg
```

## Design choice #7: Dashboard auto-refresh

The dashboard is a static HTML file regenerated after every cycle:

```python
def render_dashboard(daily_cap):
    s = db.stats_summary()
    events = db.get_run_log(100)
    discovery_recent = db.recent_discovery(50)
    
    html = f"""<!DOCTYPE html>
    <html>
    <head><meta http-equiv="refresh" content="15"></head>
    <body>...</body></html>"""
    
    DASHBOARD_HTML.write_text(html, encoding="utf-8")
```

`meta http-equiv="refresh"` instead of polling JS. Customers open `data/dashboard.html` in a browser tab and watch it update every 15 seconds.

Beautiful in its simplicity. Zero JavaScript. Works offline. Doesn't need an HTTP server.

## What I learned

1. **Build deliverability hygiene FIRST.** Daily caps, RCPT probe, subject rotation, bounce tracker — all of these compound. Skipping any one of them eats into reply rates within days.
2. **Cache aggressively.** Match scores. Email validations. SMTP probes. Domain MX records. Anything that costs > 100ms to compute should be cached after the first run.
3. **Pydantic Settings + .env is a perfect customer interface.** Five fields, plain text, easy to edit. No GUI needed.
4. **SQLite scales further than you think.** 47 customers × 90 days × 200 emails/day = 850,000 rows in `emails_sent`. SQLite handles it without breaking a sweat.
5. **The hard part isn't AI. It's deliverability.** The Gemini integration was 2 days of work. The bounce tracker rewrite was 2 weeks.

## What's in v2

(Phase 4 of the build, currently in progress.)

- Programmatic SEO pages (12 of them)
- Long-form blog content (5 posts of 2,000+ words)
- 60+ AI tool directory submissions
- ProductHunt launch
- Lighthouse CI gating Performance ≥ 90 / SEO 100

If you're in the modern job-application grind — or if you're a builder who's curious how local-first AI agents work — give JobyBots a look.

jobybots.com — ₹2,999 lifetime. 7-day refund. Built in Dubai.

Happy to answer any technical questions in the comments.
