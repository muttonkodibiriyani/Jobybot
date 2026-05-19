"""Indeed scraper — works for multiple countries via ccTLD."""
from __future__ import annotations

import urllib.parse
from typing import Any, Dict, List

from bs4 import BeautifulSoup
from loguru import logger

from core.net_safety import safe_get
from .base import JobSource

# country → indeed domain
TLD = {
    "uae":         "ae.indeed.com",
    "singapore":   "sg.indeed.com",
    "germany":     "de.indeed.com",
    "netherlands": "nl.indeed.com",
    "ireland":     "ie.indeed.com",
    "canada":      "ca.indeed.com",
    "australia":   "au.indeed.com",
    "uk":          "uk.indeed.com",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


class Indeed(JobSource):
    name = "Indeed"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        country = location.split(",")[-1].strip().lower()
        if country in ("uae", "united arab emirates"):
            country = "uae"
        if country == "uk" or "united kingdom" in country:
            country = "uk"
        if country == "usa" or "united states" in country:
            country = "uk"  # not supported, skip
            return jobs
        tld = TLD.get(country, "ae.indeed.com")

        try:
            url = (
                f"https://{tld}/jobs?"
                f"q={urllib.parse.quote_plus(title)}"
                f"&l={urllib.parse.quote_plus(location)}"
                "&sort=date&fromage=14"
            )
            r = safe_get(url, headers=HEADERS)
            soup = BeautifulSoup(r.text, "lxml")

            for card in soup.select(".job_seen_beacon, .result")[:20]:
                try:
                    title_el = card.select_one("h2.jobTitle a, h2 a")
                    if not title_el:
                        continue
                    j_title = title_el.get_text(strip=True)

                    comp_el = card.select_one(".companyName, [data-testid='company-name']")
                    company = comp_el.get_text(strip=True) if comp_el else "Unknown"

                    loc_el = card.select_one(".companyLocation, [data-testid='text-location']")
                    j_loc  = loc_el.get_text(strip=True) if loc_el else location

                    href = title_el.get("href", "")
                    if not href.startswith("http"):
                        href = f"https://{tld}{href}"

                    jid = self.make_id("indeed", j_title, company, country)
                    jobs.append({
                        "id":       jid,
                        "source":   self.name,
                        "title":    j_title,
                        "company":  company,
                        "location": j_loc,
                        "url":      href,
                    })
                except Exception:
                    continue
        except Exception as e:
            logger.debug(f"Indeed {country}: {type(e).__name__}")
        except Exception as e:
            logger.debug(f"Indeed parse: {e}")
        return jobs
