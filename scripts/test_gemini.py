"""Quick smoke test for the Gemini integration.

Run: python scripts/test_gemini.py

Reads GEMINI_API_KEY from .env (or shell env), scores a real-looking job
against a real-looking résumé, prints the result. Use this any time you
want to confirm the AI is working before kicking off a full cycle.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Make project root importable regardless of where the script is run from
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except Exception:
    pass  # dotenv is optional here

from core.ai_search import score_job  # noqa: E402
from core.ai_writer import tailored_email  # noqa: E402

RESUME = (
    "Senior Data Product Manager with 7+ years at Alshaya Group in Dubai. "
    "Led AURA loyalty platform serving 100+ MENA retail brands. Built AWS "
    "data lake (S3, Athena, Glue), Power BI executive dashboards, and "
    "Copilot Studio AI agents. Azure Data Engineer Associate certified. "
    "B.Tech from IIT Patna. UAE Resident Visa, 1 month notice."
)

JOB = {
    "title": "Senior Product Manager — AI & Data Platform",
    "company": "Careem",
    "description": (
        "We're hiring a senior PM to lead our AI/data platform across "
        "rides, food, and payments. You'll own roadmap for ML features, "
        "real-time analytics, and embedded AI inside the Careem super-app. "
        "Required: 6+ years PM, strong AWS/data lake experience, "
        "shipped ML or AI features in production, MENA market knowledge."
    ),
}


def main() -> int:
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        print("⚠️  GEMINI_API_KEY is not set. Add it to your .env file.")
        return 2

    print(f"✓ Found Gemini key: {key[:8]}…{key[-4:]}")
    print(f"✓ Model: {os.getenv('GEMINI_MODEL', 'gemini-flash-latest')}")
    print()

    print("Scoring sample job against sample résumé…")
    result = score_job(
        resume_text=RESUME,
        job_title=JOB["title"],
        job_description=JOB["description"],
        company=JOB["company"],
        gemini_key=key,
        model_gemini=os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
    )
    print(f"\n  score : {result.score}/100")
    print(f"  source: {result.source}")
    print(f"  reason: {result.reason}\n")

    if result.source == "fallback":
        print("❌ AI did not respond — falling back to keyword score.")
        print("   Check your key at https://aistudio.google.com/apikey.")
        return 1

    print("Drafting tailored recruiter email…\n")
    email = tailored_email(
        user_name="Tharakeswara Reddy",
        user_summary="Senior Data PM building AI products across MENA retail.",
        resume_text=RESUME,
        job_title=JOB["title"],
        job_description=JOB["description"],
        company=JOB["company"],
        gemini_key=key,
        model_gemini=os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
    )
    print("─" * 60)
    print(email)
    print("─" * 60)
    print("\n✅ Gemini is wired in and working.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
