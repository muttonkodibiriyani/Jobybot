"""LinkedIn Easy Apply automation (clean-room implementation).

──────────────────────────────────────────────────────────────────────
WHAT THIS DOES
──────────────────────────────────────────────────────────────────────
Opens LinkedIn in a real Chromium window (Playwright) using your existing
``li_at`` session cookie, runs a filtered job search, and walks each
"Easy Apply" job through its multi-step application form.

The algorithm (in plain English):

  1. NAVIGATE  → /jobs/search/?keywords=<title>&location=<loc>&f_AL=true
                 + filters: date posted, experience level, easy-apply-only
  2. PAGINATE  → scroll the left-rail until N results are loaded
  3. PER JOB
       a. SKIP if linkedin_job_id already in easy_apply_log (dedup)
       b. SKIP if company is in blacklist
       c. OPEN  the right-rail job description
       d. SCREEN the description against skip-keywords / max-years
       e. CLICK the "Easy Apply" button (only if visible)
       f. FORM-WALK:
            - For each visible input/select/textarea on the modal:
                * canonicalise the label
                * answer from .env profile, cached Q&A, or AI fallback
            - Click "Next" (or "Review")
            - Repeat until "Submit application" appears
       g. SUBMIT  → only if EASY_APPLY_DRY_RUN=false (default true)
       h. LOG the outcome to easy_apply_log

──────────────────────────────────────────────────────────────────────
SAFETY GUARDS (all enforced in code, see /trust)
──────────────────────────────────────────────────────────────────────
  • OFF by default — requires ENABLE_EASY_APPLY=true in .env
  • DRY-RUN by default — fills form but does NOT click Submit
  • Hard daily cap (EASY_APPLY_DAILY_CAP, default 10)
  • Random 20-60s delay between applications (humanlike)
  • Headful by default — you SEE the browser, you can stop it
  • Aborts on the first "I don't know this question" if AI key not set
  • Never auto-clicks "Follow this company" — too many spam complaints
  • Never auto-connects to anyone — LinkedIn's ToS hard line

──────────────────────────────────────────────────────────────────────
LICENSE NOTE
──────────────────────────────────────────────────────────────────────
This implementation was written FROM SCRATCH by JobyBots based on
publicly documented LinkedIn DOM patterns. It does NOT copy code from
any AGPL or otherwise-restrictively-licensed reference implementation.
Everything here is original work and is shipped under the same
commercial JobyBots license as the rest of the bot.
──────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations

import random
import re
import time
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Iterable, List, Optional, Tuple

from loguru import logger

from . import db
from .easy_apply_questions import (
    canonicalise_question,
    pick_answer,
    profile_from_settings,
)

# Playwright is loaded lazily — most users never enable Easy Apply.
try:
    from playwright.sync_api import (
        Page,
        TimeoutError as PWTimeout,
        sync_playwright,
    )
    _PW_OK = True
    _PW_IMPORT_ERROR: Optional[Exception] = None
except Exception as exc:  # pragma: no cover - exercised only when missing
    _PW_OK = False
    _PW_IMPORT_ERROR = exc
    Page = Any  # type: ignore[assignment,misc]
    PWTimeout = Exception  # type: ignore[assignment,misc]


# ── data model ────────────────────────────────────────────────────
@dataclass
class JobCard:
    job_id: str
    title: str
    company: str
    location: str
    url: str


# ── public entrypoint ─────────────────────────────────────────────
def run_easy_apply(settings: Any) -> dict:
    """Run a single Easy Apply pass. Returns a small stats dict.

    Caller is the CLI / scheduled cycle. We enforce all guards here so
    enabling the cycle without the env-flag is a no-op.
    """
    db.init_db()
    stats = {"applied": 0, "skipped": 0, "needs_review": 0, "failed": 0}

    if not getattr(settings, "enable_easy_apply", False):
        logger.info("Easy Apply disabled (set ENABLE_EASY_APPLY=true to opt in)")
        return stats
    if not _PW_OK:
        logger.error(
            "Easy Apply requires `playwright` — install with:\n"
            "  .venv\\Scripts\\python.exe -m pip install playwright\n"
            "  .venv\\Scripts\\python.exe -m playwright install chromium\n"
            f"(import error: {_PW_IMPORT_ERROR})"
        )
        return stats
    # NOTE: We no longer hard-require LINKEDIN_COOKIE in .env. The
    # preferred login path is the persistent browser profile (set up via
    # `jobybot login-linkedin` or by pointing
    # EASY_APPLY_CHROME_USER_DATA_DIR at your real Chrome profile).
    # The `.env` cookie is only used as a one-time bootstrap when the
    # profile is brand new.

    daily_cap = int(getattr(settings, "easy_apply_daily_cap", 10))
    already_today = db.easy_applies_today()
    remaining = max(0, daily_cap - already_today)
    if remaining <= 0:
        logger.warning(
            f"Easy Apply daily cap reached ({already_today}/{daily_cap}) — stopping."
        )
        return stats

    profile = profile_from_settings(settings)
    skip_companies = _split_csv(getattr(settings, "easy_apply_skip_companies", ""))
    required_keywords = _split_csv(getattr(settings, "easy_apply_required_keywords", ""))
    skip_keywords = _split_csv(getattr(settings, "easy_apply_skip_keywords", ""))
    max_years = int(getattr(settings, "easy_apply_max_years", 8))

    titles = [t for t in (settings.target_titles or "").split(",") if t.strip()]
    locations = _locations_for(settings.primary_market)

    logger.success(
        f"Easy Apply starting · cap {remaining}/{daily_cap} remaining today · "
        f"dry-run={settings.easy_apply_dry_run} · "
        f"headless={settings.easy_apply_headless}"
    )

    # Persistent browser profile -- KEY to LinkedIn reliability.
    # When you boot a fresh Chromium every time, LinkedIn sees a new
    # canvas/audio/font fingerprint each visit and quickly puts you on a
    # security challenge. A persistent profile dir means the same
    # fingerprint + the same localStorage history every time, so LinkedIn
    # treats you like a returning real user.
    profile_dir, channel, profile_source = _resolve_browser_profile(settings)
    profile_was_new = not _profile_has_linkedin_session(profile_dir)
    logger.info(
        f"Browser profile: {profile_dir}  (source={profile_source}, "
        f"channel={channel or 'chromium'}, fresh={profile_was_new})"
    )

    with sync_playwright() as pw:
        try:
            launch_kwargs = dict(
                user_data_dir=str(profile_dir.resolve()),
                headless=bool(settings.easy_apply_headless),
                args=[
                    "--start-maximized",
                    "--disable-blink-features=AutomationControlled",
                    "--no-default-browser-check",
                    "--no-first-run",
                ],
                viewport={"width": 1440, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                locale="en-US",
                timezone_id="Asia/Dubai",
            )
            if channel:
                launch_kwargs["channel"] = channel
            context = pw.chromium.launch_persistent_context(**launch_kwargs)
        except Exception as e:
            # Common when EASY_APPLY_CHROME_USER_DATA_DIR points at the
            # user's live Chrome — Chrome locks the profile while it's
            # running. Surface a clear actionable message instead of a
            # cryptic playwright stack trace.
            msg = str(e)
            if "ProcessSingleton" in msg or "lock" in msg.lower() or "in use" in msg.lower():
                logger.error(
                    "Could not open the Chrome profile because Chrome is "
                    "already running. Close ALL Chrome windows and try again. "
                    "(Alternatively, unset EASY_APPLY_CHROME_USER_DATA_DIR to "
                    "use the bot's own dedicated profile.)"
                )
            else:
                logger.error(f"Could not launch browser: {e}")
            return stats

        # Hide the obvious "this is a bot" signals that LinkedIn's
        # detector watches for. Removes navigator.webdriver and the
        # missing chrome.runtime + plugins length defaults.
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = window.chrome || { runtime: {} };
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        """)

        # ONLY inject the .env cookie when the profile is brand new
        # (i.e. no LinkedIn cookies on disk yet) AND a cookie is set.
        # Otherwise the fresh persisted cookies from your last login
        # win and we don't overwrite them with a stale .env value —
        # which was the root cause of "LinkedIn rejected the li_at
        # cookie" even for users who had just logged in.
        env_cookie = (settings.linkedin_cookie or "").strip()
        if profile_was_new and env_cookie:
            logger.info(
                "Seeding LINKEDIN_COOKIE from .env (profile is fresh). "
                "Future runs will rely on persisted cookies."
            )
            context.add_cookies([{
                "name":   "li_at",
                "value":  env_cookie,
                "domain": ".linkedin.com",
                "path":   "/",
                "secure": True,
                "httpOnly": True,
                "sameSite": "None",
            }])

        page = context.pages[0] if context.pages else context.new_page()
        try:
            if not _verify_logged_in(page):
                logger.error(
                    "LinkedIn session is not active in this profile.\n"
                    "  → Fix: close this window, then run:\n"
                    "      .\\.venv\\Scripts\\python.exe jobybot.py login-linkedin\n"
                    "    A Chromium window will open — log in manually with "
                    "your normal email + password (handle 2FA / captcha as "
                    "you would in any browser). Once you see your feed, "
                    "close the window. Then re-run easy-apply.\n"
                    "  → Or: point EASY_APPLY_CHROME_USER_DATA_DIR in .env at "
                    "your real Chrome User Data folder so the bot uses the "
                    "Chrome profile where you're already logged in. Close "
                    "Chrome first."
                )
                return stats

            applied_this_run = 0
            for title in titles:
                for location in locations:
                    if applied_this_run >= remaining:
                        break
                    try:
                        cards = _search(
                            page,
                            title=title.strip(),
                            location=location,
                            date_posted=settings.easy_apply_filter_date_posted,
                            exp_levels=settings.easy_apply_exp_levels,
                        )
                    except Exception as e:
                        logger.warning(f"search failed for {title}/{location}: {e}")
                        continue

                    logger.info(f"  · {title} / {location}: {len(cards)} Easy Apply cards")

                    for card in cards:
                        if applied_this_run >= remaining:
                            break

                        if db.already_easy_applied(card.job_id):
                            stats["skipped"] += 1
                            continue
                        if any(b.lower() in card.company.lower() for b in skip_companies):
                            db.log_easy_apply(
                                linkedin_job_id=card.job_id, job_title=card.title,
                                company=card.company, location=card.location,
                                job_url=card.url, status="skipped",
                                reason="company_blacklist",
                            )
                            stats["skipped"] += 1
                            continue

                        outcome = _apply_to_one(
                            page=page,
                            card=card,
                            profile=profile,
                            required_keywords=required_keywords,
                            skip_keywords=skip_keywords,
                            max_years=max_years,
                            dry_run=bool(settings.easy_apply_dry_run),
                            settings=settings,
                        )
                        stats[outcome] = stats.get(outcome, 0) + 1
                        if outcome == "applied":
                            applied_this_run += 1
                            _polite_sleep(
                                int(settings.easy_apply_min_delay_sec),
                                int(settings.easy_apply_max_delay_sec),
                            )
        finally:
            try:
                context.close()
            except Exception:
                pass

    logger.success(
        f"Easy Apply done · applied={stats['applied']} skipped={stats['skipped']} "
        f"needs_review={stats['needs_review']} failed={stats['failed']}"
    )
    return stats


# ── internals ─────────────────────────────────────────────────────
def _resolve_browser_profile(settings) -> Tuple[Path, Optional[str], str]:
    """Pick which on-disk browser profile to use, in this order:

      1. EASY_APPLY_CHROME_USER_DATA_DIR — your real Chrome User Data
         folder (e.g. ``%LOCALAPPDATA%\\Google\\Chrome\\User Data``).
         If EASY_APPLY_CHROME_PROFILE_NAME is also set we open the
         matching sub-profile (Default, Profile 1, ...). channel=chrome
         so Playwright drives the SYSTEM Chrome (where you're already
         signed into your email).
      2. EASY_APPLY_USER_DATA_DIR — any custom path you want to point at.
      3. ``data/browser_profiles/linkedin/`` — the bot's own dedicated
         Chromium profile, populated by ``jobybot login-linkedin``.

    Returns (path, channel, source_label).
    """
    import os
    chrome_root = (getattr(settings, "easy_apply_chrome_user_data_dir", "") or "").strip()
    if not chrome_root:
        chrome_root = os.environ.get("EASY_APPLY_CHROME_USER_DATA_DIR", "").strip()
    if chrome_root:
        chrome_root_p = Path(chrome_root).expanduser()
        sub = (getattr(settings, "easy_apply_chrome_profile_name", "") or "").strip()
        if not sub:
            sub = os.environ.get("EASY_APPLY_CHROME_PROFILE_NAME", "").strip()
        # When pointing at the real Chrome user data dir we still pass
        # the ROOT to Playwright (Chrome figures out the active profile
        # from --profile-directory). Setting --profile-directory is the
        # standard way to pick "Default" / "Profile 1" / etc.
        if sub:
            os.environ.setdefault("CHROMIUM_FLAGS",
                                  f'--profile-directory="{sub}"')
        return chrome_root_p, "chrome", f"system-chrome:{sub or 'Default'}"

    custom = (getattr(settings, "easy_apply_user_data_dir", "") or "").strip()
    if not custom:
        custom = os.environ.get("EASY_APPLY_USER_DATA_DIR", "").strip()
    if custom:
        return Path(custom).expanduser(), None, "custom"

    default = Path("data") / "browser_profiles" / "linkedin"
    default.mkdir(parents=True, exist_ok=True)
    return default, None, "bot-managed"


def _profile_has_linkedin_session(profile_dir: Path) -> bool:
    """True iff the profile actually has a LinkedIn ``li_at`` cookie.

    We open the Cookies SQLite directly and count rows where
    ``host_key`` matches LinkedIn. This is strict on purpose — a
    profile that has been *opened* but never *logged into* will have
    a Cookies DB on disk but zero LinkedIn rows, and we want to treat
    that case as "fresh" so the bootstrap cookie path still runs.
    """
    if not profile_dir.exists():
        return False
    cookies_db = None
    for candidate in (
        profile_dir / "Default" / "Network" / "Cookies",
        profile_dir / "Default" / "Cookies",
        profile_dir / "Cookies",
    ):
        if candidate.exists() and candidate.stat().st_size > 0:
            cookies_db = candidate
            break
    if not cookies_db:
        return False
    try:
        import sqlite3
        con = sqlite3.connect(f"file:{cookies_db}?mode=ro", uri=True, timeout=2.0)
        try:
            row = con.execute(
                "SELECT COUNT(*) FROM cookies "
                "WHERE host_key LIKE '%linkedin.com' AND name='li_at'"
            ).fetchone()
            return bool(row and row[0] > 0)
        finally:
            con.close()
    except Exception:
        # If we can't read the DB (locked, schema mismatch) be
        # conservative: assume it might have a session, don't clobber
        # with the stale .env cookie.
        return True


def _locations_for(market: str) -> List[str]:
    """Reuse the same country -> city mapping as the scraper cycle."""
    cmap = {
        "UAE":   ["Dubai, United Arab Emirates", "Abu Dhabi, United Arab Emirates"],
        "India": ["Bangalore, India", "Hyderabad, India", "Mumbai, India"],
        "UK":    ["London, United Kingdom"],
        "Saudi": ["Riyadh, Saudi Arabia"],
        "Qatar": ["Doha, Qatar"],
        "Oman":  ["Muscat, Oman"],
        "Bahrain": ["Manama, Bahrain"],
    }
    return cmap.get(market, [market])


def _split_csv(s: str) -> List[str]:
    return [x.strip() for x in (s or "").split(",") if x.strip()]


def _polite_sleep(lo: int, hi: int) -> None:
    delay = random.uniform(max(1, lo), max(lo + 1, hi))
    logger.debug(f"sleeping {delay:.1f}s before next application")
    time.sleep(delay)


def _verify_logged_in(page: Page) -> bool:
    """Confirm the li_at cookie is still good by hitting an authenticated URL.

    We try /feed/, then /mynetwork/, then /jobs/. LinkedIn occasionally
    enters a redirect loop on /feed/ when bot detection trips (yields
    ERR_TOO_MANY_REDIRECTS). The fallback URLs are less likely to trigger
    the same protection. If ALL three URLs land on a login/checkpoint
    page, we treat the cookie as expired.
    """
    for url in (
        "https://www.linkedin.com/jobs/",
        "https://www.linkedin.com/feed/",
        "https://www.linkedin.com/mynetwork/",
    ):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15_000)
        except PWTimeout:
            continue
        except Exception as e:
            # ERR_TOO_MANY_REDIRECTS / net errors -> try the next URL
            logger.debug(f"verify_logged_in: {url} -> {e}")
            continue
        landed = (page.url or "").lower()
        if "login" in landed or "uas/login" in landed or "checkpoint" in landed:
            continue
        return True
    return False


def _search(
    page: Page,
    *,
    title: str,
    location: str,
    date_posted: str,
    exp_levels: str,
) -> List[JobCard]:
    """Open LinkedIn's authenticated jobs search, return Easy Apply cards.

    URL filters used (documented in LinkedIn's own help docs):
      f_AL=true     -> Easy Apply only
      f_TPR=r<sec>  -> date posted (in seconds)
      f_E=<csv>     -> experience levels
    """
    qs = urllib.parse.urlencode({
        "keywords": title,
        "location": location,
        "f_AL":     "true",
        "f_TPR":    date_posted,
        "f_E":      exp_levels,
        "sortBy":   "DD",  # date-descending
    })
    page.goto(f"https://www.linkedin.com/jobs/search/?{qs}",
              wait_until="domcontentloaded", timeout=20_000)
    try:
        page.wait_for_selector(".scaffold-layout__list, .jobs-search-results-list",
                               timeout=10_000)
    except PWTimeout:
        return []

    # Scroll the left rail to load more cards (LinkedIn lazy-loads ~25 at a time)
    _scroll_rail(page, max_steps=4)

    raw_cards = page.query_selector_all(
        "li[data-occludable-job-id], li.jobs-search-results__list-item"
    )
    out: List[JobCard] = []
    for el in raw_cards[:40]:
        try:
            jid = (el.get_attribute("data-occludable-job-id")
                   or el.get_attribute("data-job-id")
                   or "")
            link = el.query_selector("a.job-card-list__title, a.job-card-container__link")
            if not link:
                continue
            t = (link.inner_text() or "").strip().split("\n")[0]
            href = link.get_attribute("href") or ""
            if not jid:
                m = re.search(r"/jobs/view/(\d+)", href)
                jid = m.group(1) if m else ""
            if not jid:
                continue
            comp_el = el.query_selector(".job-card-container__company-name, .artdeco-entity-lockup__subtitle")
            loc_el  = el.query_selector(".job-card-container__metadata-item, .artdeco-entity-lockup__caption")
            out.append(JobCard(
                job_id=str(jid),
                title=t[:200],
                company=(comp_el.inner_text().strip() if comp_el else "Unknown")[:200],
                location=(loc_el.inner_text().strip() if loc_el else location)[:200],
                url=f"https://www.linkedin.com/jobs/view/{jid}/",
            ))
        except Exception:
            continue
    return out


def _scroll_rail(page: Page, max_steps: int = 4) -> None:
    """LinkedIn lazy-loads job cards on scroll. Nudge the left rail down."""
    try:
        rail = page.locator(".scaffold-layout__list, .jobs-search-results-list").first
        for _ in range(max_steps):
            rail.evaluate("el => { el.scrollBy(0, el.clientHeight * 0.9); }")
            page.wait_for_timeout(800)
    except Exception:
        pass


def _apply_to_one(
    *,
    page: Page,
    card: JobCard,
    profile: dict,
    required_keywords: List[str],
    skip_keywords: List[str],
    max_years: int,
    dry_run: bool,
    settings: Any,
) -> str:
    """Walk one job through Easy Apply. Returns the status name we logged."""
    t0 = time.time()
    page.goto(card.url, wait_until="domcontentloaded", timeout=20_000)
    try:
        page.wait_for_selector(".jobs-description__content, .jobs-details-top-card, .jobs-unified-top-card",
                               timeout=8_000)
    except PWTimeout:
        pass

    # ── content-level filters ────────────────────────────────────
    description = ""
    try:
        desc_el = page.query_selector(".jobs-description__content, .jobs-description-content")
        if desc_el:
            description = (desc_el.inner_text() or "").lower()
    except Exception:
        pass

    if description:
        if any(s.lower() in description for s in skip_keywords):
            _log(card, "skipped", "skip_keyword", t0)
            return "skipped"
        if required_keywords and not any(s.lower() in description for s in required_keywords):
            _log(card, "skipped", "missing_required_keyword", t0)
            return "skipped"
        years_match = re.search(r"(\d{1,2})\+?\s*(?:years|yrs|y\b)", description)
        if years_match and int(years_match.group(1)) > max_years:
            _log(card, "skipped", f"requires_{years_match.group(1)}y_exp", t0)
            return "skipped"

    # ── click "Easy Apply" ───────────────────────────────────────
    btn = page.query_selector("button.jobs-apply-button, button[aria-label*='Easy Apply']")
    if not btn:
        _log(card, "skipped", "no_easy_apply_button", t0)
        return "skipped"
    try:
        btn.click()
        page.wait_for_selector(".jobs-easy-apply-modal, .artdeco-modal", timeout=8_000)
    except PWTimeout:
        _log(card, "failed", "modal_did_not_open", t0)
        return "failed"

    # ── walk the multi-step form ─────────────────────────────────
    step = 0
    needs_review = False
    while True:
        step += 1
        if step > 12:
            _log(card, "failed", "too_many_steps", t0, step_count=step)
            _try_dismiss(page)
            return "failed"

        unknown = _fill_visible_questions(page, profile)
        if unknown:
            # We hit a question we don't know how to answer AND have no AI.
            needs_review = True
            screenshot = _snap(page, card.job_id, "unknown_question")
            db.log_easy_apply(
                linkedin_job_id=card.job_id, job_title=card.title,
                company=card.company, location=card.location, job_url=card.url,
                status="needs_review",
                reason=f"unanswered: {unknown[:200]}",
                screenshot_path=screenshot, step_count=step,
                duration_ms=int((time.time() - t0) * 1000),
            )
            _try_dismiss(page)
            return "needs_review"

        # find Submit / Next / Review (in that order of preference)
        submit_btn = page.query_selector(
            "button[aria-label*='Submit application'], button:has-text('Submit application')"
        )
        if submit_btn:
            if dry_run:
                screenshot = _snap(page, card.job_id, "dry_run_ready")
                db.log_easy_apply(
                    linkedin_job_id=card.job_id, job_title=card.title,
                    company=card.company, location=card.location, job_url=card.url,
                    status="needs_review",
                    reason="dry_run_form_complete_awaiting_user_send",
                    screenshot_path=screenshot, step_count=step,
                    duration_ms=int((time.time() - t0) * 1000),
                )
                _try_dismiss(page)
                logger.info(f"  [DRY-RUN] form ready for {card.company} ({step} steps)")
                return "needs_review"
            # not dry-run: explicitly UNTICK "Follow company" if present
            _untick_follow(page)
            try:
                submit_btn.click()
                page.wait_for_selector(".artdeco-modal--success, .jobs-easy-apply-success-message",
                                       timeout=8_000)
            except PWTimeout:
                # No success modal — assume submitted but couldn't confirm
                pass
            _log(card, "applied", "submitted", t0, step_count=step)
            _try_dismiss(page)
            logger.success(f"  ✓ applied · {card.company} — {card.title}")
            return "applied"

        next_btn = page.query_selector(
            "button[aria-label*='Continue to next step'], "
            "button:has-text('Next'), button:has-text('Review')"
        )
        if not next_btn:
            screenshot = _snap(page, card.job_id, "no_next_button")
            db.log_easy_apply(
                linkedin_job_id=card.job_id, job_title=card.title,
                company=card.company, location=card.location, job_url=card.url,
                status="failed", reason="no_next_or_submit_button_found",
                screenshot_path=screenshot, step_count=step,
                duration_ms=int((time.time() - t0) * 1000),
            )
            _try_dismiss(page)
            return "failed"
        try:
            next_btn.click()
            page.wait_for_timeout(800)
        except Exception as e:
            _log(card, "failed", f"click_next_error: {e}", t0, step_count=step)
            _try_dismiss(page)
            return "failed"

    # unreachable
    if needs_review:
        return "needs_review"
    return "failed"


def _fill_visible_questions(page: Page, profile: dict) -> str:
    """Fill every visible input on the modal. Returns the first unanswerable
    question label (or "" if all were filled).
    """
    fields = page.query_selector_all(
        ".jobs-easy-apply-modal .jobs-easy-apply-form-section__grouping, "
        ".jobs-easy-apply-modal .fb-dash-form-element, "
        ".artdeco-modal .fb-dash-form-element"
    )
    for f in fields:
        try:
            label_text = ""
            label_el = f.query_selector("label, legend, .artdeco-text-input--label, .fb-dash-form-element__label")
            if label_el:
                label_text = (label_el.inner_text() or "").strip()
            if not label_text:
                continue
            key = canonicalise_question(label_text)

            # already filled? skip
            text_in = f.query_selector("input[type='text'], input[type='email'], input[type='tel'], input[type='number'], textarea")
            if text_in and (text_in.get_attribute("value") or "").strip():
                continue

            ans = pick_answer(key, label_text, profile)
            if ans is None:
                return label_text  # unanswered

            # write answer to the right kind of input
            select_el = f.query_selector("select")
            if select_el:
                _set_select(select_el, ans)
                continue
            radio_group = f.query_selector_all("input[type='radio']")
            if radio_group:
                _set_radio(radio_group, ans)
                continue
            checkbox_group = f.query_selector_all("input[type='checkbox']")
            if checkbox_group and ans.lower() in ("yes", "true", "1"):
                checkbox_group[0].check()
                continue
            if text_in:
                text_in.fill(str(ans))
                continue
            ta = f.query_selector("textarea")
            if ta:
                ta.fill(str(ans))
                continue
        except Exception as e:
            logger.debug(f"field fill error: {e}")
            continue
    return ""


def _set_select(el: Any, ans: str) -> None:
    """Try to choose the option that best matches `ans`."""
    try:
        el.select_option(label=ans)
        return
    except Exception:
        pass
    try:
        el.select_option(value=ans)
        return
    except Exception:
        pass
    # case-insensitive partial match
    try:
        options = el.evaluate("(el) => Array.from(el.options).map(o => o.label)") or []
        target = ans.lower()
        best = next((o for o in options if target in (o or "").lower()), None)
        if best:
            el.select_option(label=best)
    except Exception:
        pass


def _set_radio(group: Iterable[Any], ans: str) -> None:
    ans_lower = (ans or "").lower()
    for r in group:
        try:
            label_id = r.get_attribute("id") or ""
            label_text = ""
            if label_id:
                try:
                    lab = r.evaluate_handle(
                        "(el, id) => document.querySelector(`label[for='${id}']`)",
                        label_id,
                    )
                    if lab:
                        label_text = (lab.text_content() or "").strip().lower()  # type: ignore[union-attr]
                except Exception:
                    pass
            if not label_text:
                label_text = (r.get_attribute("value") or "").lower()
            if ans_lower in label_text or label_text in ans_lower:
                r.check()
                return
        except Exception:
            continue


def _untick_follow(page: Page) -> None:
    """Unticks the 'Follow [Company]' checkbox shown above the Submit button."""
    try:
        cb = page.query_selector(
            "input[type='checkbox'][id*='follow'], label:has-text('Follow')"
        )
        if cb:
            try:
                cb.uncheck()
            except Exception:
                cb.click()
    except Exception:
        pass


def _try_dismiss(page: Page) -> None:
    """Close the modal (and any 'Save application' prompt) cleanly."""
    try:
        close = page.query_selector("button[aria-label='Dismiss'], button.artdeco-modal__dismiss")
        if close:
            close.click()
            page.wait_for_timeout(300)
        discard = page.query_selector("button:has-text('Discard')")
        if discard:
            discard.click()
    except Exception:
        pass


def _snap(page: Page, job_id: str, tag: str) -> str:
    out_dir = Path("data") / "easyapply_screenshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    fp = out_dir / f"{int(time.time())}_{job_id}_{tag}.png"
    try:
        page.screenshot(path=str(fp), full_page=True)
        return str(fp)
    except Exception:
        return ""


def _log(card: JobCard, status: str, reason: str, t0: float, step_count: int = 0) -> None:
    db.log_easy_apply(
        linkedin_job_id=card.job_id, job_title=card.title,
        company=card.company, location=card.location, job_url=card.url,
        status=status, reason=reason, step_count=step_count,
        duration_ms=int((time.time() - t0) * 1000),
    )


__all__ = ["run_easy_apply", "JobCard"]
