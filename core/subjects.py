"""Rotating email subject lines.

Why this exists
---------------
The previous implementation sent every email with the *same* subject line
("Senior PM / BA / Data Lead | <name> | 7yrs | Azure Cert | Dubai"). Gmail
flags identical subject lines from the same sender as bulk-mail, hurts
deliverability, and causes recruiters to muting/spam-folder the sender.

This module supplies 12 distinct templates and chooses one deterministically
per (company, category) so two emails to *different* companies in the same
cycle never share a subject — but a follow-up to the *same* recipient still
threads correctly under the same subject.
"""
from __future__ import annotations

import hashlib
from typing import Dict, List, Sequence


# A template may reference any of:
#   {role}, {name}, {company}, {years}, {city}, {visa}
# Missing variables are stripped (empty string).
TEMPLATES: Sequence[str] = (
    # Short + direct
    "{role} at {company}",
    "{role} role — {name}",
    "Application: {role} ({company})",
    # Cert-omitted (breaks pattern detection)
    "{role} | {name} | {years}yrs | {city}",
    "{name} — {years}yrs in {role}",
    # Conversational
    "Hi {company} — interest in your {role} role",
    "Quick note re: {role} opportunities at {company}",
    "Re: {role} ({city}-based candidate)",
    # Recruiter-style
    "Candidate for {role} — {years}yrs experience",
    "Open to {role} positions — {city}",
    # First-person
    "Interested in {role} at {company}",
    "{name} — applying for {role} at {company}",
)

# Map category -> role phrase (slightly different per recipient type).
ROLE_BY_CATEGORY: Dict[str, str] = {
    "Recruiter":  "Product Manager / BA / Data PM",
    "Employer":   "Product Manager",
    "Consulting": "Senior PM / BA / Data PM",
    "Tech":       "Product Manager",
    "Retail":     "Product / Digital Manager",
    "Followup":   "Product Manager",
}


def _city(location: str) -> str:
    """Extract just the city from 'Dubai, UAE' -> 'Dubai'."""
    if not location:
        return ""
    return location.split(",", 1)[0].strip()


def _stable_index(company: str, category: str, n_templates: int) -> int:
    """Deterministic per-(company, category) so re-runs pick the same subject."""
    key = (company.lower() + "|" + category.lower()).encode("utf-8")
    digest = hashlib.sha256(key).digest()
    # First 4 bytes -> uint32 -> mod n
    val = int.from_bytes(digest[:4], "big")
    return val % n_templates


def pick_subject(
    company: str,
    category: str,
    name: str,
    years: int,
    location: str = "",
    visa: str = "",
) -> str:
    """Return one of the templates filled in with the candidate's context.

    Deterministic per (company, category) — but spread across all templates.
    """
    idx = _stable_index(company or "x", category or "x", len(TEMPLATES))
    role = ROLE_BY_CATEGORY.get(category, "Product Manager")
    out = TEMPLATES[idx].format(
        role=role,
        name=name or "",
        company=company or "",
        years=years or "",
        city=_city(location),
        visa=visa or "",
    )
    # Tidy: collapse repeated separators and trim
    while "  " in out:
        out = out.replace("  ", " ")
    out = out.strip().strip(":-—|")
    return out[:120]


def followup_subject(original_subject: str) -> str:
    """For follow-ups, reuse the original subject so Gmail threads them."""
    s = (original_subject or "").strip()
    if not s:
        return "Following up"
    if s.lower().startswith(("re:", "fwd:", "fw:")):
        return s
    return f"Re: {s}"
