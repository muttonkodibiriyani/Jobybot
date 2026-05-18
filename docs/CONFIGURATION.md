# Configuration Reference

All Jobybot behaviour is controlled via `.env` in the project root.

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `USER_NAME` | Your full name (appears in From + sign-off) | `"Darapu Tharakeswara Reddy"` |
| `USER_EMAIL` | Your contact email (recipients reply here) | `you@gmail.com` |
| `USER_PHONE` | E.164 format phone | `+971501234567` |
| `USER_LINKEDIN` | Your LinkedIn URL | `https://linkedin.com/in/...` |
| `USER_LOCATION` | "City, Country" | `"Dubai, UAE"` |
| `USER_VISA` | Visa / work-authorisation status | `"UAE Resident Visa"` |
| `USER_NOTICE` | Notice period | `"1 month"` |
| `RESUME_PATH` | Path to your CV PDF (absolute or relative) | `./resume.pdf` |
| `USER_SUMMARY` | 1-2 sentence elevator pitch | `"7yrs in MENA retail data..."` |
| `GMAIL_ADDRESS` | Same as USER_EMAIL or a separate Gmail | `you@gmail.com` |
| `GMAIL_APP_PASSWORD` | **App Password**, not regular Gmail password. [Get one →](https://myaccount.google.com/apppasswords) | `xxxx xxxx xxxx xxxx` |

## Targeting

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_TITLES` | `"Product Manager,..."` | Comma-separated job titles you want |
| `PRIMARY_MARKET` | `UAE` | Your main market |
| `SECONDARY_MARKETS` | `"Singapore,Germany,Netherlands,Ireland,Canada,UK"` | Backup markets (Australia also available) |

## Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `DAILY_EMAIL_CAP` | `80` | Max emails sent in 24h |
| `HOURLY_JOB_LIMIT` | `20` | Max new jobs added per source per cycle |
| `MATCH_THRESHOLD` | `50` | Min match score (0-100) to keep a job |
| `RUN_INTERVAL_MINUTES` | `60` | Scheduler cycle frequency |
| `MIN_DELAY_SEC` | `30` | Min delay between emails |
| `MAX_DELAY_SEC` | `120` | Max delay between emails |

## Sources (true/false)

| Variable | Description |
|----------|-------------|
| `ENABLE_LINKEDIN_SEARCH` | LinkedIn public guest jobs API |
| `ENABLE_INDEED` | Indeed across 8 countries |
| `ENABLE_NAUKRIGULF` | NaukriGulf (UAE-only) |
| `ENABLE_BAYT` | Bayt (UAE/MENA) |
| `ENABLE_REMOTEOK` | RemoteOK public API |

## Follow-ups

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_FOLLOWUP` | `true` | Send follow-up emails |
| `FOLLOWUP_DAYS` | `7` | Days to wait before follow-up |

## Misc

| Variable | Default | Description |
|----------|---------|-------------|
| `DAILY_SUMMARY_HOUR` | `9` | Local hour to email yourself summary |
| `LOG_LEVEL` | `INFO` | DEBUG, INFO, WARNING, ERROR |
