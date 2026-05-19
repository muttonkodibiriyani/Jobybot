# Jobybot — Documentation Index

**Repository:** https://github.com/muttonkodibiriyani/Jobybot

Everything you need, in order.

---

## Website & sales

| Item | Link |
|------|------|
| Marketing site (Next.js) | [`website/README.md`](../website/README.md) |
| Build installer ZIP | `scripts/package-release.ps1` |

---

## Start here

| Audience | Document | Purpose |
|----------|----------|---------|
| **Non-technical** | [HOW_TO_RUN.md](../HOW_TO_RUN.md) | First install on Windows (15 min) |
| **Daily use** | [RUNBOOK.md](RUNBOOK.md) | Start, stop, 30-min schedule, apply jobs, troubleshoot |
| **All PowerShell** | [POWERSHELL_COMPLETE.md](POWERSHELL_COMPLETE.md) | Every command — copy-paste with examples |
| **Quick cheat sheet** | [COMMANDS.md](../COMMANDS.md) | Shorter command list (sections 1–20) |
| **Overview** | [USER_GUIDE.md](USER_GUIDE.md) | What the bot does + one-click `.bat` files |

---

## One-click files (Windows)

| File | Action |
|------|--------|
| [SETUP_FOR_FRIENDS.bat](../SETUP_FOR_FRIENDS.bat) | New laptop: install + auto-schedule |
| [START_AUTOSCHEDULE.bat](../START_AUTOSCHEDULE.bat) | Start 24/7 bot + login auto-start |
| [RUN_BOT_NOW.bat](../RUN_BOT_NOW.bat) | One cycle: search + email now |
| [JOBYBOT.bat](../JOBYBOT.bat) | Interactive menu |
| [TEST_ALL_COMMANDS.bat](../TEST_ALL_COMMANDS.bat) | Test all PowerShell scripts |
| [SECURITY_CHECK.bat](../SECURITY_CHECK.bat) | Lock `.env` + security audit |
| [SYNC_GITHUB.bat](../SYNC_GITHUB.bat) | Pull updates from GitHub |

---

## PowerShell scripts (`powershell/`)

| Script | Purpose |
|--------|---------|
| `01-Is-Running.ps1` | Is the bot running? |
| `02-Stats.ps1` | Jobs / emails / daily cap |
| `03-Top-Jobs.ps1` | Top 20 matched jobs |
| `04-Recent-Emails.ps1` | Last 20 emails sent |
| `05-Jobs-By-Source.ps1` | Count per website |
| `06-List-All-Jobs.ps1` | All jobs in database |
| `07-Jobs-Today.ps1` | Jobs added today |
| `08-LinkedIn-Jobs.ps1` | LinkedIn jobs only |
| `08-Indeed-Jobs.ps1` | Indeed jobs only |
| `08-Bayt-Jobs.ps1` | Bayt jobs only |
| `09-Doctor.ps1` | Health check |
| `10-Test-Email.ps1` | Send test email |
| `11-Tail-Log.ps1` | Live log |
| `12-Open-Inbox.ps1` | Open apply inbox HTML |
| `13-Stop-Bot.ps1` | Stop (pause) |
| `14-Emergency-Shutdown.ps1` | Stop + remove auto-start |
| `15-Start-Background.ps1` | Start hourly scheduler |
| `16-Daily-Check.ps1` | Status + stats + log |
| `17-Run-One-Cycle.ps1` | Search + email |
| `18-Search-Only.ps1` | Scrape jobs only |
| `19-Email-Only.ps1` | Send emails only |
| `20-Edit-Env.ps1` | Edit settings |

Shared library: `powershell/Jobybot-Init.ps1`

---

## Configuration & reference

| Document | Purpose |
|----------|----------|
| [CONFIGURATION.md](CONFIGURATION.md) | Every `.env` variable |
| [MARKETS.md](MARKETS.md) | UAE + secondary countries strategy |
| [SECURITY.md](SECURITY.md) | Secrets, permissions, safety |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Gmail, caps, errors |
| [SHARE_WITH_FRIENDS.md](../SHARE_WITH_FRIENDS.md) | Share without leaking your `.env` |

---

## Change schedule (1 hour → 30 minutes)

Edit `.env`:

```env
RUN_INTERVAL_MINUTES=30
```

Restart bot — see [RUNBOOK.md](RUNBOOK.md) **Restart** section.

---

## Job sources (scraped)

| Site | `.env` flag |
|------|-------------|
| LinkedIn (public guest) | `ENABLE_LINKEDIN_SEARCH=true` |
| Indeed | `ENABLE_INDEED=true` |
| Bayt | `ENABLE_BAYT=true` |
| Naukri Gulf | `ENABLE_NAUKRIGULF=true` |
| RemoteOK | `ENABLE_REMOTEOK=true` |

**Apply on job boards:** open `data/click_apply_inbox.html` (manual Easy Apply links).

**Email limit:** `DAILY_EMAIL_CAP=200` (default).

---

## CLI (advanced)

```bash
python jobybot.py init      # setup + Gmail test
python jobybot.py run       # one cycle
python jobybot.py schedule  # 24/7 loop
python jobybot.py search    # jobs only
python jobybot.py email     # emails only
python jobybot.py stats     # counts
python jobybot.py doctor    # health check
```

---

## Support

Issues: https://github.com/muttonkodibiriyani/Jobybot/issues
