"""Hacker News "Who is hiring?" thread scraper.

Every month a top-voted "Ask HN: Who is hiring?" thread lands on
HN's front page. The top-level comments are companies posting roles,
almost always with a direct apply email (`apply@`, `jobs@`,
`hiring@` or a named recruiter). This is one of the highest
email-discovery yields on the entire internet — basically pre-curated
recruiter mailboxes.

We fetch the current month's thread via Algolia HN Search (no auth)
and return one job per comment, with the comment body as the
"description". The email_finder waterfall will pluck the mailto from
the description directly via T1's regex pass — no Gemini required.
"""
from __future__ import annotations

import datetime as dt
import html
import re
from typing import Any, Dict, List

from loguru import logger

from core.net_safety import safe_get
from .base import JobSource


_TITLE_RE = re.compile(r"^\s*([^\n|()]+)", re.MULTILINE)
_EMAIL_RE = re.compile(r"\b([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b")
_URL_RE = re.compile(r"https?://[^\s<>\"\']+")


class HNWhoIsHiring(JobSource):
    """Pull the most recent Who is hiring? thread and emit one job per
    top-level comment that contains a recognisable role line."""

    name = "HN-WhoIsHiring"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        try:
            # 1. Find the most recent "Ask HN: Who is hiring?" story
            now = dt.datetime.utcnow()
            search_url = (
                "https://hn.algolia.com/api/v1/search_by_date?"
                "query=Ask%20HN%3A%20Who%20is%20hiring&"
                "tags=story&hitsPerPage=3"
            )
            r = safe_get(search_url, timeout=10)
            if not r or r.status_code != 200:
                return jobs
            hits = (r.json() or {}).get("hits", [])
            story_id = None
            for h in hits:
                title_text = (h.get("title") or "").lower()
                if "who is hiring" in title_text and h.get("objectID"):
                    story_id = h["objectID"]
                    break
            if not story_id:
                return jobs

            # 2. Fetch the full story tree (HN public API)
            r = safe_get(
                f"https://hn.algolia.com/api/v1/items/{story_id}", timeout=15
            )
            if not r or r.status_code != 200:
                return jobs
            tree = r.json() or {}
            comments = tree.get("children") or []

            role_words = [w.strip().lower() for w in title.split() if len(w) > 2]
            loc_lower = (location or "").lower()
            for c in comments[:300]:
                body = c.get("text") or ""
                if not body:
                    continue
                body_text = html.unescape(re.sub(r"<[^>]+>", " ", body))
                low = body_text.lower()

                # Loose role filter: at least one of the role keywords
                # must appear. Comment authors usually put the title in
                # the first line.
                if role_words and not any(w in low for w in role_words):
                    continue

                # Loose location filter: if the comment mentions a
                # specific city/country, prefer matches. We DON'T filter
                # out comments that say REMOTE or that just don't mention
                # a city — those are valuable too.
                if loc_lower and loc_lower not in low and "remote" not in low:
                    if "worldwide" not in low and "global" not in low:
                        continue

                first_line = (body_text.split("\n", 1)[0] or "")[:200].strip()
                m = _TITLE_RE.search(first_line)
                role_title = (m.group(1).strip() if m else first_line)[:160]
                company = ""
                if " | " in first_line:
                    company = first_line.split(" | ", 1)[0][:120].strip()
                if not company:
                    company = "HN Hiring"

                # Pull any email or URL from the body so the email-finder
                # has something to work with. The T1 careers-page tier
                # will read the description directly.
                emails = _EMAIL_RE.findall(body_text)
                urls = _URL_RE.findall(body_text)
                url = urls[0] if urls else (
                    f"mailto:{emails[0]}" if emails else
                    f"https://news.ycombinator.com/item?id={c.get('id')}"
                )

                jid = self.make_id("hn", str(c.get("id")))
                jobs.append({
                    "id":          jid,
                    "source":      self.name,
                    "title":       role_title,
                    "company":     company,
                    "location":    location or "Worldwide",
                    "url":         url,
                    "description": body_text[:5000],
                })
                if len(jobs) >= 30:
                    break
        except Exception as e:
            logger.debug(f"HN Who is hiring: {type(e).__name__} {e}")
        return jobs
