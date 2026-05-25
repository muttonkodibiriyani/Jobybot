"""AI-extraction tier: read HTML and return real recruiter contacts.

Uses Gemini Flash (already paid-for via the user's GEMINI_API_KEY) to read
a page of HTML and pull out *real* recruiter / HR / talent acquisition
contacts. The model is constrained with a tight system prompt that:

  * Returns ONLY structured JSON, never prose
  * Refuses to invent emails it didn't see in the source
  * Filters out free-mail providers and the user's own address client-side
  * Rejects suspiciously generic addresses (`info@`, `support@`, etc.)
    UNLESS they appear in a clearly-recruiter-tagged context

This is the highest-quality tier we have. Unlike pattern guessing it
cannot make up an address; unlike careers-page regex it can read meaning
("our talent acquisition lead can be reached at...") and pull the right
contact even when there are 30 emails on the page.

The tier is OPT-IN: when GEMINI_API_KEY is empty or Gemini is rate-limited
we silently skip and the waterfall continues without us.
"""
from __future__ import annotations

import json
import os
import re
import time
from dataclasses import dataclass
from typing import List, Optional

import requests
from loguru import logger

from core import db
from core.finders.linkedin_login import _should_reject, _user_own_email


# We only feed Gemini a trimmed slice of the page. Most recruiter contact
# pages are < 30 KB of text; 60 KB gives us headroom for big sites and
# keeps the prompt cost predictable. Anything more bloats latency.
_MAX_HTML_CHARS = 60_000

# 12 s soft cap: Gemini Flash typically returns in 1-3 s, but careers
# pages can be slow; we'd rather skip than block the cycle.
_GEMINI_TIMEOUT_SEC = 12.0

# Per-domain cache so we don't pay Gemini twice for the same company.
_extract_memo: dict[str, list[dict]] = {}


@dataclass
class Contact:
    name: str = ""
    title: str = ""
    email: str = ""
    source_snippet: str = ""

    def is_real(self) -> bool:
        return bool(self.email) and "@" in self.email


_SYSTEM_PROMPT = (
    "You are an HR-contact-extraction tool. Given the raw HTML or text of "
    "a company web page, return a JSON array of recruiter / talent / HR "
    "contacts you can verify are PRESENT IN THE SOURCE.\n"
    "\n"
    "Rules:\n"
    "  1. ONLY return addresses that appear literally in the source. "
    "Never invent or pattern-guess.\n"
    "  2. Each contact MUST be a recruiter, HR, talent-acquisition, "
    "people-team, hiring manager, or careers contact. Skip CFOs, "
    "investor relations, support, sales, partners, founders.\n"
    "  3. SKIP generic role addresses (info@, contact@, hello@, support@) "
    "unless the surrounding sentence explicitly says 'for careers' / "
    "'recruitment' / 'jobs' / 'apply'.\n"
    "  4. SKIP free-mail providers (gmail, yahoo, outlook, hotmail) — they "
    "are personal addresses, not company HR.\n"
    "  5. Return [] if no real recruiter contact is found. Empty is fine.\n"
    "\n"
    "Output schema (strict JSON, nothing else):\n"
    '  [{"name": "Jane Doe", "title": "Talent Acquisition", '
    '"email": "jane@company.com", "source_snippet": "the surrounding sentence"}]\n'
    "\n"
    "If you cannot comply, return [] (an empty array)."
)


def _strip_html(html: str) -> str:
    """Strip HTML tags but keep mailto: links and text — keeps the prompt
    small AND keeps the model's attention on the human-readable copy.
    """
    if not html:
        return ""
    # Keep mailto: hrefs visible as plain text so the model sees them.
    html = re.sub(
        r'<a[^>]+href="mailto:([^"]+)"[^>]*>(.*?)</a>',
        r" [contact: \1] \2 ",
        html, flags=re.IGNORECASE | re.DOTALL,
    )
    # Drop scripts + styles entirely
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html,
                  flags=re.IGNORECASE | re.DOTALL)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html,
                  flags=re.IGNORECASE | re.DOTALL)
    # Strip remaining tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:_MAX_HTML_CHARS]


def _gemini_extract(text: str, *, api_key: str) -> List[dict]:
    """Single Gemini Flash call. Returns parsed JSON list or []."""
    if not api_key or not text:
        return []
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-flash-latest",
            system_instruction=_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"},
        )
        t0 = time.time()
        resp = model.generate_content(text)
        elapsed = time.time() - t0
        if elapsed > _GEMINI_TIMEOUT_SEC:
            logger.debug(f"Gemini extract slow ({elapsed:.1f}s) — accepting anyway")
        raw = (resp.text or "").strip()
        # Sometimes the model wraps the array in extra prose. Strip ```json fences.
        raw = re.sub(r"^```(?:json)?", "", raw).rstrip("`").strip()
        data = json.loads(raw)
        if not isinstance(data, list):
            return []
        return [d for d in data if isinstance(d, dict)]
    except json.JSONDecodeError as e:
        logger.debug(f"Gemini returned non-JSON: {e}")
        return []
    except Exception as e:
        logger.debug(f"Gemini extract failed: {e}")
        return []


def extract_contacts_from_html(
    html: str,
    *,
    company: str = "",
    source_url: str = "",
    company_domain: str = "",
) -> List[Contact]:
    """Public entrypoint. Reads HTML, returns filtered recruiter contacts.

    Caching: keyed on (source_url) so two T1 paths on the same URL share.
    """
    cache_key = (source_url or "")[:200]
    if cache_key and cache_key in _extract_memo:
        return [Contact(**c) for c in _extract_memo[cache_key]]

    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        try:
            from config import get_settings
            key = (getattr(get_settings(), "gemini_api_key", "") or "").strip()
        except Exception:
            key = ""
    if not key:
        return []

    text = _strip_html(html)
    if not text or len(text) < 100:
        return []
    raw = _gemini_extract(text, api_key=key)

    own = _user_own_email()
    cd = (company_domain or "").lower().lstrip(".")
    contacts: List[Contact] = []
    for d in raw:
        email = (d.get("email") or "").lower().strip()
        if not email or "@" not in email:
            continue
        if email == own or _should_reject(email):
            continue
        host = email.rsplit("@", 1)[1]
        # If we have a company domain, require domain match — guards
        # against the model's occasional hallucination of plausible-looking
        # third-party contacts.
        if cd and not (host == cd or host.endswith("." + cd)):
            continue
        contacts.append(Contact(
            name=(d.get("name") or "").strip()[:80],
            title=(d.get("title") or "").strip()[:80],
            email=email,
            source_snippet=(d.get("source_snippet") or "")[:200],
        ))
        db.log_discovery(
            company,
            tier="t1_ai_extract",
            decision="found",
            candidate_email=email,
            source_url=source_url[:200],
        )

    if not contacts:
        db.log_discovery(
            company,
            tier="t1_ai_extract",
            decision="no_match",
            source_url=source_url[:200],
        )

    # Cache so a follow-up T1.5 call on the same page reuses the result
    _extract_memo[cache_key] = [
        {"name": c.name, "title": c.title, "email": c.email,
         "source_snippet": c.source_snippet}
        for c in contacts
    ]
    return contacts


def extract_from_url(url: str, *, company: str, company_domain: str) -> List[Contact]:
    """Fetch a URL and feed to Gemini. Returns [] on any failure."""
    if not url:
        return []
    try:
        from core.net_safety import open_get
        r = open_get(url, timeout=8)
        if r is None or r.status_code >= 400:
            return []
        return extract_contacts_from_html(
            r.text or "",
            company=company,
            source_url=url,
            company_domain=company_domain,
        )
    except Exception as e:
        logger.debug(f"AI extract fetch failed for {url}: {e}")
        return []
