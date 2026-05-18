"""Score a job against a resume profile."""
from __future__ import annotations

import re
from typing import Any, Dict

from .resume_parser import TITLE_SYNONYMS


def normalise(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", " ", (s or "").lower())


def title_match_score(job_title: str, my_titles: list[str]) -> int:
    """0-30 based on title overlap with my titles + synonyms."""
    jt = normalise(job_title)
    score = 0
    for t in my_titles:
        tt = normalise(t)
        if tt in jt:
            score = max(score, 30)
            continue
        # check synonyms
        for syn in TITLE_SYNONYMS.get(t, []):
            if normalise(syn) in jt:
                score = max(score, 25)
    # generic role matches
    pm_kw = ["product manager", "product owner", "business analyst",
             "solution architect", "program manager", "transformation"]
    for kw in pm_kw:
        if kw in jt:
            score = max(score, 15)
    return score


def skills_match_score(job_text: str, my_skills: list[str]) -> int:
    """0-30 based on skill keyword overlap."""
    if not my_skills:
        return 0
    text = normalise(job_text)
    hits = sum(1 for s in my_skills if re.search(rf"\b{re.escape(s)}\b", text))
    pct = hits / max(len(my_skills), 1)
    if pct >= 0.40:
        return 30
    if pct >= 0.20:
        return 20
    if pct >= 0.10:
        return 10
    if hits >= 2:
        return 5
    return 0


def location_match_score(job_location: str, target_locations: list[str]) -> int:
    """0-20."""
    if not job_location:
        return 5  # neutral
    jl = job_location.lower()
    for loc in target_locations:
        for token in loc.lower().split(","):
            token = token.strip()
            if token and token in jl:
                return 20
    if "remote" in jl:
        return 15
    return 0


def seniority_match_score(job_title: str, my_years: int) -> int:
    """0-20 — seniority keywords vs my years."""
    jt = job_title.lower()
    senior_kw = ["senior", "sr.", "sr ", "lead", "principal", "staff",
                 "head of", "director"]
    junior_kw = ["junior", "jr.", "jr ", "graduate", "trainee", "intern",
                 "entry"]
    is_senior = any(k in jt for k in senior_kw)
    is_junior = any(k in jt for k in junior_kw)

    if my_years >= 5:
        if is_senior:
            return 20
        if is_junior:
            return 0
        return 12
    elif my_years >= 2:
        if is_junior:
            return 5
        return 15
    else:
        if is_junior:
            return 20
        return 8


def score_job(
    job: Dict[str, Any],
    profile: Dict[str, Any],
    target_locations: list[str],
) -> int:
    """Total match score 0-100."""
    title       = job.get("title", "")
    description = job.get("description", "") or ""
    location    = job.get("location", "")

    t = title_match_score(title, profile.get("titles", []))
    s = skills_match_score(title + " " + description, profile.get("skills", []))
    l = location_match_score(location, target_locations)
    se = seniority_match_score(title, profile.get("years_exp", 0))

    return t + s + l + se
