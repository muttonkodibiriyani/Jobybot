"""GulfTalent scraper for UAE/MENA jobs.

GulfTalent is one of the largest recruitment portals in the Gulf region.
We hit their public job search HTML page and parse it with BeautifulSoup.
No API key needed.
"""
from __future__ import annotations

import urllib.parse
from typing import Any, Dict, List

from bs4 import BeautifulSoup
from loguru import logger

from core.net_safety import safe_get
from .base import JobSource

HEADERS = {
    "User-Agent": "Mozilla/5.0 Chrome/120 Jobybot",
    "Accept-Language": "en-US,en",
}

# Map our market names to GulfTalent country slugs.
COUNTRY_SLUGS = {
    "uae":          "united-arab-emirates",
    "u.a.e.":       "united-arab-emirates",
    "united arab":  "united-arab-emirates",
    "saudi":        "saudi-arabia",
    "ksa":          "saudi-arabia",
    "qatar":        "qatar",
    "bahrain":      "bahrain",
    "kuwait":       "kuwait",
    "oman":         "oman",
    "egypt":        "egypt",
}


def _country_for(location: str) -> str | None:
    loc = location.lower()
    for key, slug in COUNTRY_SLUGS.items():
        if key in loc:
            return slug
    return None


class GulfTalent(JobSource):
    """Scrapes https://www.gulftalent.com — public job listings."""

    name = "GulfTalent"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        country = _country_for(location)
        if not country:
            return []
        jobs: List[Dict[str, Any]] = []
        try:
            url = (
                f"https://www.gulftalent.com/{country}/jobs/"
                f"keyword/{urllib.parse.quote_plus(title)}"
            )
            r = safe_get(url, headers=HEADERS)
            soup = BeautifulSoup(r.text, "lxml")

            # GulfTalent renders job cards inside <div class="job-listing">
            cards = soup.select("div.job-listing, li.job-listing, article.job")
            if not cards:
                # Fallback to anchor-based heuristic
                cards = soup.select("a[href*='/jobs/'][href$='.html']")

            for card in cards[:15]:
                try:
                    if card.name == "a":
                        anchor = card
                        j_title = anchor.get_text(strip=True)
                        company = "Confidential"
                    else:
                        anchor = card.select_one("a[href*='/jobs/']")
                        if not anchor:
                            continue
                        j_title = anchor.get_text(strip=True)
                        co_tag = card.select_one(".company, .recruiter, span.text-muted")
                        company = co_tag.get_text(strip=True) if co_tag else "Confidential"

                    if not j_title or len(j_title) < 4:
                        continue
                    href = anchor.get("href", "")
                    if href and not href.startswith("http"):
                        href = "https://www.gulftalent.com" + href

                    jobs.append({
                        "id":       self.make_id("gulftalent", j_title, company),
                        "source":   self.name,
                        "title":    j_title[:200],
                        "company":  company[:150],
                        "location": location,
                        "url":      href,
                    })
                except Exception:
                    continue
        except Exception as e:
            logger.debug(f"GulfTalent: {type(e).__name__}: {e}")
        return jobs
