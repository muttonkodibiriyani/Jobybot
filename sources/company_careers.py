"""Company career-page aggregator (Greenhouse + Lever + Workable + Ashby).

Thousands of companies use these ATS providers under their `/careers` pages.
All of them publish open job listings as public JSON endpoints — no API key,
no auth, no scraping fragility. This source iterates a curated company list
and returns matching roles.

Add more companies any time by editing COMPANIES below. The bot will
automatically pick up the new ones on the next cycle.
"""
from __future__ import annotations

from typing import Any, Dict, List, Tuple

from loguru import logger

from core.net_safety import safe_get
from .base import JobSource

HEADERS = {
    "User-Agent": "Mozilla/5.0 Jobybot/1.0 (+https://jobybots.com)",
    "Accept":     "application/json",
}

# (ATS, company_slug, friendly_name)
# Greenhouse:    https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
# Lever:         https://api.lever.co/v0/postings/{slug}?mode=json
# Workable:      https://apply.workable.com/api/v3/accounts/{slug}/jobs
# Ashby:         https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false
COMPANIES: List[Tuple[str, str, str]] = [
    # ─── Greenhouse ───────────────────────────────────────────────
    ("greenhouse", "airbnb",      "Airbnb"),
    ("greenhouse", "stripe",      "Stripe"),
    ("greenhouse", "doordash",    "DoorDash"),
    ("greenhouse", "instacart",   "Instacart"),
    ("greenhouse", "robinhood",   "Robinhood"),
    ("greenhouse", "discord",     "Discord"),
    ("greenhouse", "reddit",      "Reddit"),
    ("greenhouse", "asana",       "Asana"),
    ("greenhouse", "anthropic",   "Anthropic"),
    ("greenhouse", "openai",      "OpenAI"),
    ("greenhouse", "chime",       "Chime"),
    ("greenhouse", "twilio",      "Twilio"),
    ("greenhouse", "datadog",     "Datadog"),
    ("greenhouse", "elastic",     "Elastic"),
    ("greenhouse", "snowflake",   "Snowflake"),
    ("greenhouse", "mongodb",     "MongoDB"),
    ("greenhouse", "okta",        "Okta"),
    ("greenhouse", "atlassian",   "Atlassian"),
    ("greenhouse", "amplitude",   "Amplitude"),
    ("greenhouse", "miro",        "Miro"),
    ("greenhouse", "notion",      "Notion"),
    ("greenhouse", "loom",        "Loom"),
    ("greenhouse", "linear",      "Linear"),
    # ─── Lever ────────────────────────────────────────────────────
    ("lever", "ramp",         "Ramp"),
    ("lever", "scale",        "Scale AI"),
    ("lever", "perplexityai", "Perplexity"),
    ("lever", "lattice",      "Lattice"),
    ("lever", "deel",         "Deel"),
    ("lever", "remote",       "Remote.com"),
    ("lever", "vercel",       "Vercel"),
    ("lever", "supabase",     "Supabase"),
    ("lever", "hex",          "Hex Technologies"),
    # ─── Workable (many MENA / EU SMBs) ───────────────────────────
    ("workable", "careem",     "Careem"),
    ("workable", "kitopi",     "Kitopi"),
    ("workable", "tabby",      "Tabby"),
    ("workable", "tamara",     "Tamara"),
    ("workable", "anghami",    "Anghami"),
    ("workable", "trella",     "Trella"),
    # ─── Ashby ────────────────────────────────────────────────────
    ("ashby", "cursor",      "Cursor"),
    ("ashby", "openai",      "OpenAI (Ashby)"),
    ("ashby", "ramp-careers", "Ramp (Ashby)"),
]


def _norm_loc(loc: str) -> str:
    return loc.lower().strip()


def _location_matches(target: str, posting: str) -> bool:
    """Loose location-match: 'UAE' should match 'Dubai, United Arab Emirates' etc."""
    if not posting:
        return True
    t = _norm_loc(target)
    p = _norm_loc(posting)
    # Quick country aliases — short codes used by our config vs full names in postings
    aliases = {
        "uae":          ["uae", "united arab", "dubai", "abu dhabi", "sharjah"],
        "saudi":        ["saudi", "ksa", "riyadh", "jeddah"],
        "singapore":    ["singapore", "sg"],
        "germany":      ["germany", "de", "berlin", "munich", "deutschland"],
        "netherlands":  ["netherlands", "nl", "amsterdam", "rotterdam"],
        "ireland":      ["ireland", "dublin"],
        "canada":       ["canada", "ca", "toronto", "vancouver", "montreal"],
        "uk":           ["uk", "united kingdom", "london", "manchester", "england"],
        "sweden":       ["sweden", "stockholm"],
        "australia":    ["australia", "au", "sydney", "melbourne"],
        "remote":       ["remote", "anywhere", "global"],
    }
    for key, keys in aliases.items():
        if key in t:
            return any(k in p for k in keys)
    return t in p or p in t or "remote" in p


def _fetch_greenhouse(slug: str) -> List[Dict[str, Any]]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    r = safe_get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return []
    return r.json().get("jobs", [])


def _fetch_lever(slug: str) -> List[Dict[str, Any]]:
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    r = safe_get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return []
    return r.json() if isinstance(r.json(), list) else []


def _fetch_workable(slug: str) -> List[Dict[str, Any]]:
    url = f"https://apply.workable.com/api/v3/accounts/{slug}/jobs"
    r = safe_get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return []
    payload = r.json() if r.text else {}
    return payload.get("results", payload.get("jobs", [])) or []


def _fetch_ashby(slug: str) -> List[Dict[str, Any]]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false"
    r = safe_get(url, headers=HEADERS, timeout=15)
    if r.status_code != 200:
        return []
    return r.json().get("jobs", []) or []


class CompanyCareers(JobSource):
    """Hits Greenhouse, Lever, Workable and Ashby boards for a curated list."""

    name = "CompanyCareers"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        title_l = title.lower()
        out: List[Dict[str, Any]] = []

        for ats, slug, friendly in COMPANIES:
            try:
                if ats == "greenhouse":
                    postings = _fetch_greenhouse(slug)
                    for p in postings:
                        loc = (p.get("location") or {}).get("name") or ""
                        if title_l not in (p.get("title") or "").lower():
                            continue
                        if not _location_matches(location, loc):
                            continue
                        out.append({
                            "id":       self.make_id("gh", slug, str(p.get("id"))),
                            "source":   self.name,
                            "title":    p.get("title") or "",
                            "company":  friendly,
                            "location": loc or location,
                            "url":      p.get("absolute_url") or "",
                            "description": (p.get("content") or "")[:4000],
                        })
                elif ats == "lever":
                    postings = _fetch_lever(slug)
                    for p in postings:
                        loc = (p.get("categories") or {}).get("location") or ""
                        if title_l not in (p.get("text") or "").lower():
                            continue
                        if not _location_matches(location, loc):
                            continue
                        out.append({
                            "id":       self.make_id("lever", slug, p.get("id", "")),
                            "source":   self.name,
                            "title":    p.get("text") or "",
                            "company":  friendly,
                            "location": loc or location,
                            "url":      p.get("hostedUrl") or "",
                            "description": (p.get("descriptionPlain") or "")[:4000],
                        })
                elif ats == "workable":
                    postings = _fetch_workable(slug)
                    for p in postings:
                        loc = (p.get("location") or {}).get("location_str") or (p.get("location") or {}).get("city") or ""
                        if title_l not in (p.get("title") or "").lower():
                            continue
                        if not _location_matches(location, loc):
                            continue
                        out.append({
                            "id":       self.make_id("wk", slug, p.get("shortcode", "")),
                            "source":   self.name,
                            "title":    p.get("title") or "",
                            "company":  friendly,
                            "location": loc or location,
                            "url":      p.get("url") or p.get("application_url") or "",
                            "description": (p.get("description") or "")[:4000],
                        })
                elif ats == "ashby":
                    postings = _fetch_ashby(slug)
                    for p in postings:
                        loc = p.get("locationName") or ""
                        if title_l not in (p.get("title") or "").lower():
                            continue
                        if not _location_matches(location, loc):
                            continue
                        out.append({
                            "id":       self.make_id("ashby", slug, p.get("id", "")),
                            "source":   self.name,
                            "title":    p.get("title") or "",
                            "company":  friendly,
                            "location": loc or location,
                            "url":      p.get("jobUrl") or "",
                            "description": (p.get("descriptionPlain") or "")[:4000],
                        })
            except Exception as e:
                logger.debug(f"CompanyCareers {ats}/{slug}: {type(e).__name__}: {e}")
                continue

        return out
