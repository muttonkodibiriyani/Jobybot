"""
AI-powered job matching using free LLM APIs.

Tries providers in order:
  1. Google Gemini (free 60 req/min, 1500 req/day — https://aistudio.google.com/apikey)
  2. Groq llama-3.3-70b (free, fast — https://console.groq.com/keys)
  3. Local fallback: keyword-overlap scoring (no AI, no API key needed)

The first provider with a valid key wins. If everything fails, we never
break the bot — we just return a sensible default score so the search
keeps running.

This module is intentionally dependency-free at import time: it lazy-imports
the HTTP client so missing libs never crash startup.
"""
from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

_log = logging.getLogger("ai_search")

# Cache LLM scoring results per (resume_hash, job_url) so repeated cycles
# don't burn API quota on jobs we've already seen.
_score_cache: dict[str, "MatchResult"] = {}


@dataclass
class MatchResult:
    """Result of scoring a single job against a résumé."""

    score: int  # 0-100
    reason: str  # one-line plain-English why
    source: str  # which provider produced this ("gemini", "groq", "fallback")


def _gemini_chat(
    prompt: str,
    api_key: str,
    model: str = "gemini-flash-latest",
    *,
    json_response: bool = True,
) -> Optional[str]:
    """Call Google Gemini REST API. Returns text or None on failure.

    Uses the `X-goog-api-key` header instead of `?key=...` query string
    so the key never lands in proxy logs or HTTP referers. Defaults to
    `gemini-flash-latest`, which always points at the newest free-tier
    Flash model.
    """
    try:
        import httpx  # lazy import
    except Exception:  # pragma: no cover
        _log.warning("httpx not installed; cannot call Gemini")
        return None

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    gen_cfg: dict = {"temperature": 0.2}
    if json_response:
        gen_cfg["responseMimeType"] = "application/json"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": gen_cfg,
    }
    try:
        with httpx.Client(timeout=20.0) as cli:
            r = cli.post(
                url,
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "X-goog-api-key": api_key,
                },
            )
            if r.status_code != 200:
                _log.debug("gemini %s -> %s", r.status_code, r.text[:200])
                return None
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:  # pragma: no cover
        _log.debug("gemini error: %s", e)
        return None


def _groq_chat(
    prompt: str,
    api_key: str,
    model: str = "llama-3.3-70b-versatile",
    *,
    json_response: bool = True,
) -> Optional[str]:
    """Call Groq's free OpenAI-compatible endpoint."""
    try:
        import httpx
    except Exception:
        return None
    payload: dict = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    if json_response:
        payload["response_format"] = {"type": "json_object"}
    try:
        with httpx.Client(timeout=20.0) as cli:
            r = cli.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            if r.status_code != 200:
                _log.debug("groq %s -> %s", r.status_code, r.text[:200])
                return None
            return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        _log.debug("groq error: %s", e)
        return None


def _keyword_score(resume_text: str, job_text: str) -> MatchResult:
    """No-AI fallback. Counts overlapping keywords; better than nothing."""
    r = {w.lower() for w in resume_text.split() if len(w) > 4}
    j = {w.lower() for w in job_text.split() if len(w) > 4}
    if not r or not j:
        return MatchResult(50, "No résumé text available for keyword match", "fallback")
    overlap = len(r & j)
    total = len(j)
    score = min(95, int((overlap / max(1, total)) * 200))
    return MatchResult(
        score=max(40, score),
        reason=f"Keyword overlap: {overlap} terms shared with job description.",
        source="fallback",
    )


def score_job(
    resume_text: str,
    job_title: str,
    job_description: str,
    company: str = "",
    *,
    gemini_key: str = "",
    groq_key: str = "",
    model_gemini: str = "gemini-flash-latest",
    model_groq: str = "llama-3.3-70b-versatile",
    cache_key: str = "",
) -> MatchResult:
    """
    Score how well a job matches the résumé. Returns a MatchResult.

    `cache_key` is typically the job URL — if you pass it, the result is
    cached in-memory so subsequent calls in the same process don't hit
    the API again for the same job.
    """
    if cache_key and cache_key in _score_cache:
        return _score_cache[cache_key]

    prompt = (
        "You are JobyBots' job-matching AI. Score this job against the résumé "
        "from 0 to 100. Higher = better fit. Return ONLY valid JSON of the form "
        '{"score": <int 0-100>, "reason": "<one-line plain English why>"}.\n\n'
        f"=== RÉSUMÉ ===\n{resume_text[:6000]}\n\n"
        f"=== JOB ===\nTitle: {job_title}\nCompany: {company}\nDescription:\n{job_description[:4000]}\n"
    )

    raw: Optional[str] = None
    source = "fallback"
    gemini_key = gemini_key or os.getenv("GEMINI_API_KEY", "")
    groq_key = groq_key or os.getenv("GROQ_API_KEY", "")

    if gemini_key:
        raw = _gemini_chat(prompt, gemini_key, model=model_gemini)
        if raw:
            source = "gemini"
    if not raw and groq_key:
        raw = _groq_chat(prompt, groq_key, model=model_groq)
        if raw:
            source = "groq"

    result: Optional[MatchResult] = None
    if raw:
        # Strip code fences if the model added them
        raw_clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            data = json.loads(raw_clean)
            score = int(data.get("score", 0))
            score = max(0, min(100, score))
            reason = str(data.get("reason", ""))[:280]
            result = MatchResult(score=score, reason=reason, source=source)
        except Exception as e:
            _log.debug("ai response parse failed (%s): %r", e, raw[:200])

    if result is None:
        # Be gentle to the user — fall back, don't fail.
        result = _keyword_score(resume_text, f"{job_title} {job_description}")

    if cache_key:
        _score_cache[cache_key] = result

    # Spread out API calls a touch to be polite under free-tier limits.
    if source in ("gemini", "groq"):
        time.sleep(0.25)

    return result
