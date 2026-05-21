"""
AI-tailored cover letter + recruiter email body generation.

Uses the same Gemini → Groq → template fallback chain as ai_search.
If no LLM is available, returns a clean templated email so the bot
still works without any API keys.
"""
from __future__ import annotations

import logging
from typing import Optional

from core.ai_search import _gemini_chat, _groq_chat

_log = logging.getLogger("ai_writer")


def _template_email(
    user_name: str,
    user_summary: str,
    job_title: str,
    company: str,
) -> str:
    return (
        f"Hi,\n\n"
        f"I came across your opening for {job_title} at {company} and would love to apply.\n\n"
        f"Quick context on me: {user_summary}\n\n"
        f"I've attached my résumé. I'd be happy to share more about how my experience "
        f"maps to this role at a time that works for you.\n\n"
        f"Best regards,\n{user_name}"
    )


def tailored_email(
    user_name: str,
    user_summary: str,
    resume_text: str,
    job_title: str,
    job_description: str,
    company: str = "",
    *,
    recruiter_first_name: str = "",
    gemini_key: str = "",
    groq_key: str = "",
    model_gemini: str = "gemini-flash-latest",
    model_groq: str = "llama-3.3-70b-versatile",
) -> str:
    """
    Generate a personalised 4-6 sentence recruiter email tailored to the
    job description and the candidate's résumé.

    If ``recruiter_first_name`` is supplied (typically from the LinkedIn
    finder), the email opens with "Hi <first_name>," instead of the generic
    "Hi," — this is a significant deliverability + reply-rate win.

    Always returns a non-empty string — falls back to template on failure.
    """
    salutation = f"Hi {recruiter_first_name.strip().split()[0]}," if recruiter_first_name.strip() else "Hi,"

    prompt = (
        f"Write a concise, professional 4-6 sentence recruiter email from a "
        f"job candidate (signed off as '{user_name}') applying for the following "
        f"role. Tone: confident, warm, no fluff. NO subject line, NO 'Dear sir/madam', "
        f"NO 'I hope this email finds you well'. "
        f"Open with EXACTLY this salutation on its own line: \"{salutation}\". "
        f"In sentence 2, reference ONE specific requirement from the JD that the "
        f"résumé strongly demonstrates, with a concrete number / outcome where possible. "
        f"In sentence 3-4 mention the candidate's location, visa status, and notice if "
        f"clearly relevant. End with a low-friction ask (e.g. 'Open to a quick chat?'). "
        f"Sign off with 'Best regards,\\n{user_name}'.\n\n"
        f"=== RÉSUMÉ ===\n{resume_text[:5000]}\n\n"
        f"=== JOB ===\nTitle: {job_title}\nCompany: {company}\nDescription:\n{job_description[:3000]}\n"
    )

    raw: Optional[str] = None
    if gemini_key:
        # json_response=False because we want a free-form email body,
        # not a JSON object.
        raw = _gemini_chat(prompt, gemini_key, model=model_gemini, json_response=False)
    if not raw and groq_key:
        raw = _groq_chat(prompt, groq_key, model=model_groq, json_response=False)

    if not raw or len(raw.strip()) < 40:
        return _template_email(user_name, user_summary, job_title, company)

    text = raw.strip()
    # Strip code fences / quotes if the model added them
    if text.startswith("```"):
        text = text.strip("`").lstrip("text").strip()

    # Guarantee a sign-off
    if user_name not in text:
        text += f"\n\nBest regards,\n{user_name}"
    return text


def summarise_resume(
    resume_text: str,
    *,
    gemini_key: str = "",
    groq_key: str = "",
    model_gemini: str = "gemini-flash-latest",
    model_groq: str = "llama-3.3-70b-versatile",
) -> str:
    """One-line "elevator pitch" summary of the user's résumé, for emails."""
    prompt = (
        "Write a single 25-word sentence describing the candidate's seniority, "
        "primary skill set, and recent industries. No fluff, no preamble, no "
        "'Here is...'. Just the sentence itself.\n\n"
        f"=== RÉSUMÉ ===\n{resume_text[:6000]}\n"
    )
    raw: Optional[str] = None
    if gemini_key:
        raw = _gemini_chat(prompt, gemini_key, model=model_gemini, json_response=False)
    if not raw and groq_key:
        raw = _groq_chat(prompt, groq_key, model=model_groq, json_response=False)
    if not raw:
        return ""
    return raw.strip().split("\n")[0][:300]
