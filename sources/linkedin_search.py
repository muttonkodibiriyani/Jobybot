"""LinkedIn public guest jobs search — no login required."""
from __future__ import annotations

import re
import urllib.parse
from typing import Any, Dict, List

import requests
from bs4 import BeautifulSoup
from loguru import logger

from .base import JobSource

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


class LinkedInSearch(JobSource):
    name = "LinkedIn"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        try:
            url = (
                "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
                f"?keywords={urllib.parse.quote(title)}"
                f"&location={urllib.parse.quote(location)}"
                "&f_AL=true"
                "&start=0"
            )
            r = requests.get(url, headers=HEADERS, timeout=6)
            if r.status_code != 200:
                logger.debug(f"LinkedIn {location} {title}: HTTP {r.status_code}")
                return jobs
            soup = BeautifulSoup(r.text, "lxml")

            for card in soup.select("li, div.base-card")[:25]:
                try:
                    # job id
                    jid = ""
                    a = card.select_one("a[data-tracking-control-name*='guest_job_search'], a.base-card__full-link, a[href*='/jobs/view/']")
                    if a:
                        href = a.get("href", "")
                        m = re.search(r"/view/[^/]*?-(\d{8,12})/?", href)
                        if m:
                            jid = m.group(1)
                        else:
                            m2 = re.search(r"currentJobId=(\d+)", href)
                            if m2:
                                jid = m2.group(1)

                    title_el = card.select_one(".base-search-card__title, h3")
                    company_el = card.select_one(".base-search-card__subtitle, h4")
                    loc_el = card.select_one(".job-search-card__location")

                    if not (title_el and (jid or a)):
                        continue

                    j_title = title_el.get_text(strip=True)
                    company = company_el.get_text(strip=True) if company_el else "Unknown"
                    j_loc   = loc_el.get_text(strip=True) if loc_el else location

                    if not jid:
                        jid = self.make_id(self.name, j_title, company)
                    else:
                        jid = f"linkedin_{jid}"

                    j_url = f"https://www.linkedin.com/jobs/view/{jid.split('_')[-1]}/"

                    jobs.append({
                        "id":       jid,
                        "source":   self.name,
                        "title":    j_title,
                        "company":  company,
                        "location": j_loc,
                        "url":      j_url,
                    })
                except Exception:
                    continue
        except requests.exceptions.RequestException as e:
            logger.debug(f"LinkedIn {location}: {type(e).__name__}")
        except Exception as e:
            logger.debug(f"LinkedIn parse error: {e}")
        return jobs
