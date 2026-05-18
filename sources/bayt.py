"""Bayt scraper for UAE/MENA."""
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


class Bayt(JobSource):
    name = "Bayt"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        if "uae" not in location.lower() and "saudi" not in location.lower() \
           and "qatar" not in location.lower():
            return []
        jobs: List[Dict[str, Any]] = []
        try:
            url = (
                f"https://www.bayt.com/en/uae/jobs/"
                f"{urllib.parse.quote_plus(title.lower().replace(' ','-'))}-jobs/"
            )
            r = requests.get(url, headers=HEADERS, timeout=6)
            soup = BeautifulSoup(r.text, "lxml")
            for card in soup.select("li[data-job-id], div.has-pointer-d")[:15]:
                try:
                    t  = card.select_one("h2.m0.t-large a, h2 a")
                    co = card.select_one(".t-default.t-small, .t-nowrap")
                    if not t:
                        continue
                    j_title = t.get_text(strip=True)
                    company = co.get_text(strip=True) if co else "Unknown"
                    href = t.get("href", "")
                    if not href.startswith("http"):
                        href = "https://www.bayt.com" + href
                    jobs.append({
                        "id":       self.make_id("bayt", j_title, company),
                        "source":   self.name,
                        "title":    j_title,
                        "company":  company,
                        "location": location,
                        "url":      href,
                    })
                except Exception:
                    continue
        except requests.exceptions.RequestException as e:
            logger.debug(f"Bayt: {type(e).__name__}")
        return jobs
