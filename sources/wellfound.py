"""Wellfound (formerly AngelList Talent) — startup jobs feed.

Wellfound does NOT have a public JSON API, but their search pages
return server-rendered HTML with a __NEXT_DATA__ JSON blob we can
parse without authentication. Startups are the best discovery target
for the email pipeline because they tend to publish recruiter emails
directly on their site (no "submit via portal" gatekeeping).
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List

from loguru import logger

from core.net_safety import safe_get
from .base import JobSource


_NEXT_DATA = re.compile(
    r'<script\s+id="__NEXT_DATA__"\s+type="application/json"\s*>(.+?)</script>',
    re.DOTALL,
)

_LOC_SLUGS = {
    "dubai": "dubai",
    "abu dhabi": "abu-dhabi",
    "uae": "united-arab-emirates",
    "united arab emirates": "united-arab-emirates",
    "saudi arabia": "saudi-arabia",
    "riyadh": "riyadh",
    "qatar": "qatar",
    "bahrain": "bahrain",
    "oman": "oman",
    "london": "london",
    "united kingdom": "united-kingdom",
    "uk": "united-kingdom",
    "singapore": "singapore",
    "india": "india",
    "bangalore": "bangalore",
    "bengaluru": "bangalore",
    "hyderabad": "hyderabad",
    "mumbai": "mumbai",
    "remote": "remote",
    "worldwide": "",
}


class Wellfound(JobSource):
    """Public startup-job pages. No auth, polite single-page hit."""

    name = "Wellfound"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        loc_key = (location or "").lower().strip()
        slug = _LOC_SLUGS.get(loc_key, loc_key.replace(",", "").replace(" ", "-"))
        role = title.lower().strip().replace(" ", "-")

        # Build the public search URL. Empty slug → global feed.
        if slug:
            url = f"https://wellfound.com/role/l/{role}/{slug}"
        else:
            url = f"https://wellfound.com/role/{role}"

        try:
            r = safe_get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    "Accept": "text/html,application/xhtml+xml",
                },
                timeout=10,
            )
            if r is None or r.status_code != 200:
                return jobs
            m = _NEXT_DATA.search(r.text or "")
            if not m:
                return jobs
            data = json.loads(m.group(1))
            # Wellfound's data shape changes — walk all dict leaves and
            # pick anything that looks like a job listing.
            listings = _walk_for_listings(data)
            for j in listings[:30]:
                jid = self.make_id(
                    "wellfound", str(j.get("id") or j.get("slug") or j.get("title", "")[:32])
                )
                jobs.append({
                    "id":          jid,
                    "source":      self.name,
                    "title":       (j.get("title") or "")[:200],
                    "company":     (j.get("company") or "Unknown")[:160],
                    "location":    (j.get("location") or location or "Remote")[:160],
                    "url":         (j.get("url") or "")[:500],
                    "description": (j.get("description") or "")[:5000],
                })
        except Exception as e:
            logger.debug(f"Wellfound {title}/{location}: {type(e).__name__} {e}")
        return jobs


def _walk_for_listings(node: Any, out: List[Dict[str, Any]] | None = None) -> List[Dict[str, Any]]:
    """Recursively pull job-shaped dicts from the __NEXT_DATA__ tree.

    We treat any dict that has BOTH 'title' and ('startup' OR 'company')
    fields as a listing. This keeps us resilient to Wellfound's shape
    changes (they rewire the data tree every few months).
    """
    if out is None:
        out = []
    if isinstance(node, list):
        for v in node:
            _walk_for_listings(v, out)
        return out
    if not isinstance(node, dict):
        return out

    title = node.get("title") or node.get("name")
    if title and (node.get("startup") or node.get("company") or node.get("companyName")):
        comp = node.get("company") or node.get("startup") or {}
        comp_name = ""
        if isinstance(comp, dict):
            comp_name = comp.get("name") or comp.get("displayName") or ""
        elif isinstance(comp, str):
            comp_name = comp
        loc = node.get("locationNames") or node.get("location") or ""
        if isinstance(loc, list):
            loc = ", ".join(str(x) for x in loc[:3])
        url = node.get("url") or node.get("applyUrl") or ""
        if url and not url.startswith("http"):
            url = "https://wellfound.com" + url
        out.append({
            "id": node.get("id") or node.get("slug"),
            "title": title,
            "company": comp_name or node.get("companyName") or "",
            "location": loc,
            "url": url,
            "description": node.get("description") or node.get("excerpt") or "",
        })
    for v in node.values():
        _walk_for_listings(v, out)
    return out
