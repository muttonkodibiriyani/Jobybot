"""NaukriGulf scraper for UAE/Gulf jobs."""
from __future__ import annotations

import urllib.parse
from typing import Any, Dict, List

import requests
from bs4 import BeautifulSoup
from loguru import logger

from .base import JobSource

HEADERS = {
    "User-Agent": "Mozilla/5.0 Chrome/120 Jobybot",
    "Accept-Language": "en-US,en",
}


class NaukriGulf(JobSource):
    name = "NaukriGulf"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        # Only meaningful for UAE/Gulf
        if "uae" not in location.lower() and "dubai" not in location.lower() \
           and "abu dhabi" not in location.lower():
            return []
        jobs: List[Dict[str, Any]] = []
        try:
            url = (
                "https://www.naukrigulf.com/jobs-in-uae?"
                f"keyword={urllib.parse.quote_plus(title)}"
                "&experience=5-10"
            )
            r = requests.get(url, headers=HEADERS, timeout=6)
            soup = BeautifulSoup(r.text, "lxml")
            for card in soup.select(".ni-job-tuple, li.jobTuple, .job-listing")[:15]:
                try:
                    t  = card.select_one("a.title, h3 a, .jobtitle a")
                    co = card.select_one(".company-name, .comp-name, .companyInfo span")
                    if not t:
                        continue
                    j_title = t.get_text(strip=True)
                    company = co.get_text(strip=True) if co else "Unknown"
                    href = t.get("href", "")
                    if not href.startswith("http"):
                        href = "https://www.naukrigulf.com" + href
                    jobs.append({
                        "id":       self.make_id("naukri", j_title, company),
                        "source":   self.name,
                        "title":    j_title,
                        "company":  company,
                        "location": location,
                        "url":      href,
                    })
                except Exception:
                    continue
        except requests.exceptions.RequestException as e:
            logger.debug(f"NaukriGulf: {type(e).__name__}")
        return jobs
