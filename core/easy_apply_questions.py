"""Easy Apply question answering — patterns + cache + AI fallback.

We see the same ~30 question shapes 99% of the time on LinkedIn Easy
Apply forms. This module:

  1. Tries to canonicalise the label text (strip punctuation, lowercase,
     normalise common phrasings)
  2. Looks up a curated PATTERN -> profile-field map
  3. Falls back to the local Q&A cache (DB) so once-answered questions
     stay consistent
  4. Falls back to Gemini if a Gemini key is configured, with a strict
     few-shot prompt that forces a short, plain-text answer
  5. Otherwise returns None — the caller logs "needs_review" and stops

No question text or answer is ever sent to JobyBots servers. The AI call
goes directly from the customer's machine to Google AI Studio.
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional, Tuple

from loguru import logger

from . import db


# ── canonical key ───────────────────────────────────────────────
_PUNCT_RE = re.compile(r"[^a-z0-9\s]+")
_WHITESPACE_RE = re.compile(r"\s+")


def canonicalise_question(label: str) -> str:
    """Lowercase + strip punctuation + collapse whitespace.

    "How many years of experience do you have with Python?" ->
        "how many years of experience do you have with python"
    """
    s = (label or "").lower()
    s = _PUNCT_RE.sub(" ", s)
    s = _WHITESPACE_RE.sub(" ", s).strip()
    return s[:200]


# ── profile shape (built from Settings) ─────────────────────────
def profile_from_settings(settings: Any) -> Dict[str, str]:
    """Return a flat dict the pattern map references by key."""
    first, last = _split_name(getattr(settings, "user_name", ""))
    return {
        "name":          str(getattr(settings, "user_name", "")),
        "first_name":    first,
        "last_name":     last,
        "email":         str(getattr(settings, "user_email", "")),
        "phone":         str(getattr(settings, "user_phone", "")),
        "location":      str(getattr(settings, "user_location", "")),
        "city":          str(getattr(settings, "user_location", "")).split(",")[0].strip(),
        "country":       (str(getattr(settings, "user_location", "")).split(",")[-1].strip()
                          if "," in str(getattr(settings, "user_location", "")) else ""),
        "linkedin":      str(getattr(settings, "user_linkedin", "")),
        "summary":       str(getattr(settings, "user_summary", "")),
        "visa":          str(getattr(settings, "user_visa", "")),
        "notice":        str(getattr(settings, "user_notice", "")),
        "years":         str(getattr(settings, "profile_years_experience", 7)),
        "auth_to_work":  "Yes" if getattr(settings, "profile_authorized_to_work", True) else "No",
        "sponsorship":   "Yes" if getattr(settings, "profile_require_sponsorship", False) else "No",
        "notice_days":   str(getattr(settings, "profile_notice_period_days", 30)),
        "desired_salary": str(getattr(settings, "profile_desired_salary", 0)),
        "_gemini_key":   str(getattr(settings, "gemini_api_key", "") or ""),
        "_ai_enabled":   "1" if getattr(settings, "ai_enabled", True) else "0",
    }


def _split_name(full: str) -> Tuple[str, str]:
    parts = (full or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _desired_salary_or_zero(profile: Dict[str, str]) -> Optional[str]:
    v = profile.get("desired_salary", "0")
    return v if v and v != "0" else None  # let AI handle if not set


# ── pattern map ─────────────────────────────────────────────────
# Each entry: (matcher: str | re.Pattern, profile_key | static_value | callable)
# The matcher is checked against the canonicalised label with `in` (str)
# or `re.search` (Pattern). The first hit wins, so list more-specific
# rules before more-general ones.
PATTERNS: List[Tuple[Any, Any]] = [
    # — identity —
    (re.compile(r"\bfirst name\b"),  "first_name"),
    (re.compile(r"\blast name\b"),   "last_name"),
    (re.compile(r"\bfull name\b|^name$"),     "name"),
    (re.compile(r"\bemail\b|^e mail$"),       "email"),
    (re.compile(r"\bmobile\b|\bphone\b|\bcontact (number|no)\b"), "phone"),
    (re.compile(r"\blinkedin( url| profile)?\b"), "linkedin"),
    (re.compile(r"\b(current )?city\b|where are you( currently)? located"), "city"),
    (re.compile(r"\b(current )?country\b|country of residence"),  "country"),
    (re.compile(r"\b(current )?location\b|home address"), "location"),

    # — work authorisation / sponsorship —
    (re.compile(r"\bauthori(s|z)ed to work\b|\blegally authori(s|z)ed\b|\bright to work\b"), "auth_to_work"),
    (re.compile(r"\bsponsorship\b|\brequire (a )?visa\b|\bvisa sponsorship\b"), "sponsorship"),
    (re.compile(r"\bvisa( status| type)?\b|\bresidence visa\b"), "visa"),

    # — experience —
    (re.compile(r"\byears? of (experience|exp\.?)\b|\boverall experience\b|\btotal experience\b|\bhow many years\b"), "years"),

    # — notice / availability —
    (re.compile(r"\bnotice period\b|\bavailability\b|\bwhen can you start\b|\bstart date\b"), "notice"),

    # — salary —
    (re.compile(r"\bcurrent (salary|ctc)\b|\bcurrent compensation\b|\bcurrent annual\b"), _desired_salary_or_zero),
    (re.compile(r"\b(expected|desired) (salary|ctc)\b|\bsalary expectation\b|\bcompensation expectation\b"), _desired_salary_or_zero),

    # — cover letter / why interested —
    (re.compile(r"\bcover letter\b|\bwhy.*interested\b|\bwhy.*role\b|\babout yourself\b|\bsummary\b"), "summary"),
]


def _pattern_lookup(key_canon: str, profile: Dict[str, str]) -> Optional[str]:
    for matcher, target in PATTERNS:
        hit = (
            (isinstance(matcher, str) and matcher in key_canon)
            or (hasattr(matcher, "search") and matcher.search(key_canon))
        )
        if not hit:
            continue
        if callable(target):
            try:
                v = target(profile)
                if v:
                    return str(v)
            except Exception:
                continue
            continue
        v = profile.get(target, "")
        if v:
            return str(v)
    return None


# ── AI fallback ─────────────────────────────────────────────────
_AI_SYSTEM_PROMPT = (
    "You are an honest job-application assistant filling in a single LinkedIn "
    "Easy Apply form field for ME. Reply with ONLY the answer text, no "
    "explanation, no quotes, no preamble. If the field expects a number, "
    "reply with the number. If it expects yes/no, reply 'Yes' or 'No'. "
    "Keep textual answers under 80 words. Never fabricate credentials I "
    "don't have."
)


def _ai_answer(label: str, profile: Dict[str, str]) -> Optional[str]:
    key = profile.get("_gemini_key") or os.environ.get("GEMINI_API_KEY") or ""
    if not key or profile.get("_ai_enabled") == "0":
        return None
    try:
        import google.generativeai as genai  # lazy import
        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            "gemini-flash-latest",
            system_instruction=_AI_SYSTEM_PROMPT,
        )
        user_prompt = (
            f"My profile:\n"
            f"  Name: {profile.get('name','')}\n"
            f"  Years of experience: {profile.get('years','')}\n"
            f"  Location: {profile.get('location','')}\n"
            f"  Visa: {profile.get('visa','')}\n"
            f"  Notice period: {profile.get('notice','')}\n"
            f"  Summary: {profile.get('summary','')}\n\n"
            f"Question on the form: {label}\n\n"
            f"My answer:"
        )
        resp = model.generate_content(user_prompt)
        text = (resp.text or "").strip()
        if not text or len(text) > 1500:
            return None
        # strip surrounding quotes the model sometimes adds
        if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
            text = text[1:-1]
        return text or None
    except Exception as e:
        logger.debug(f"AI answer failed: {e}")
        return None


# ── unified entry-point ─────────────────────────────────────────
def pick_answer(key_canon: str, label_raw: str, profile: Dict[str, str]) -> Optional[str]:
    """Return the answer to use, or None if we don't know.

    Priority:
      1. saved/cached answer (DB) — keeps answers consistent across cycles
      2. pattern match against profile
      3. AI fallback (if Gemini key)
      4. None -> caller marks the application as 'needs_review'
    """
    # 1. cache
    cached = db.get_easy_apply_answer(key_canon)
    if cached and cached.get("answer"):
        return str(cached["answer"])

    # 2. pattern
    ans = _pattern_lookup(key_canon, profile)
    if ans:
        db.save_easy_apply_answer(
            key_canon, answer=ans, input_kind="auto",
            source="pattern", question_raw=label_raw,
        )
        return ans

    # 3. AI fallback
    ans = _ai_answer(label_raw, profile)
    if ans:
        db.save_easy_apply_answer(
            key_canon, answer=ans, input_kind="auto",
            source="ai", question_raw=label_raw,
        )
        return ans

    # 4. give up
    return None


__all__ = [
    "canonicalise_question",
    "pick_answer",
    "profile_from_settings",
]
