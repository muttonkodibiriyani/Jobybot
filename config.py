"""Jobybot configuration via Pydantic settings."""
from __future__ import annotations

from pathlib import Path
from typing import List

from pydantic import Field, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All Jobybot configuration loaded from .env."""

    # User identity
    user_name:     str  = Field(..., description="Your full name")
    user_email:    str  = Field(..., description="Your contact email")
    user_phone:    str  = Field(..., description="Your phone in E.164")
    user_linkedin: str  = Field(..., description="Your LinkedIn URL")
    user_location: str  = Field("Dubai, UAE", description="City, Country")
    user_visa:     str  = Field("UAE Resident Visa")
    user_notice:   str  = Field("1 month")
    user_summary:  str  = Field("Experienced professional with proven track record.")
    resume_path:   Path = Field(Path("./resume.pdf"))

    # Gmail SMTP
    gmail_address:      str = Field(...)
    gmail_app_password: str = Field(...)

    # Targets
    target_titles:     str = Field("Product Manager,Senior Product Manager,Business Analyst")
    primary_market:    str = Field("UAE")
    secondary_markets: str = Field("Singapore,Germany,Netherlands,Ireland,Canada,UK")

    # Limits
    # ------------------------------------------------------------------
    # 50/day is the Gmail SMTP-safe limit for *cold* outreach.
    #  • Gmail consumer accounts: 500 messages/day hard cap, but anything
    #    > ~50 unsolicited recipients/day flips you into the spam-classifier
    #    bucket and starts quarantining new sends. (Workspace = 2 000/day
    #    but the same cold-outreach heuristic applies.)
    #  • 50 is also Google's recommended "warmup ceiling" for new senders.
    #  • Customers can raise via DAILY_EMAIL_CAP in their .env once their
    #    domain reputation is established.
    daily_email_cap:      int = Field(50)
    hourly_job_limit:     int = Field(20)
    match_threshold:      int = Field(50)
    run_interval_minutes: int = Field(60)
    min_delay_sec:        int = Field(30)
    max_delay_sec:        int = Field(120)

    # ── Review-queue (DRAFT_MODE) ────────────────────────────────
    # When True, instead of sending emails the bot writes them to the
    # pending_emails table and the customer reviews + sends them from the
    # Queue UI (http://localhost:7868). Default ON because (a) it protects
    # the customer's sender reputation, (b) they explicitly opt-in to every
    # outbound message, and (c) it removes "the bot sent something I didn't
    # like" support tickets.
    draft_mode:           bool = Field(True, description="If True, queue emails for human review instead of sending directly.")
    queue_server_port:    int  = Field(7868, description="Local-only port for the review-queue web UI.")

    # Sources
    enable_linkedin_search: bool = Field(True)
    enable_indeed:          bool = Field(True)
    enable_naukrigulf:      bool = Field(True)
    enable_bayt:            bool = Field(True)
    enable_gulftalent:      bool = Field(True)
    enable_remoteok:        bool = Field(True)
    enable_company_careers: bool = Field(True)

    # Follow-ups
    enable_followup: bool = Field(True)
    followup_days:   int  = Field(7)

    # Misc
    daily_summary_hour: int = Field(9)
    log_level:          str = Field("INFO")

    # AI providers (all free-tier friendly; bot works without any of them
    # but enabling Gemini unlocks the smart match scoring + tailored cover
    # letters that the website advertises).
    gemini_api_key:  str = Field("", description="Google AI Studio key — https://aistudio.google.com/apikey")
    gemini_model:    str = Field("gemini-flash-latest")
    groq_api_key:    str = Field("", description="Optional Groq fallback — https://console.groq.com/keys")
    groq_model:      str = Field("llama-3.3-70b-versatile")
    ai_enabled:      bool = Field(True, description="Master switch. False disables all LLM calls.")
    ai_min_match:    int  = Field(60, description="Score below which jobs are dropped entirely.")

    # Email-finder v2 settings
    # ---------------------------------------------------------------
    # `EMAIL_FINDER_TIER` controls how aggressive discovery is:
    #   off       -> use only the curated market JSON files (legacy behaviour)
    #   t1        -> + careers-page scrape (highest precision, fully ToS-safe)
    #   t2        -> + LinkedIn cookie-based HR lookup  (Tier 3 in the plan)
    #   t3        -> + country-aware pattern guessing  (lowest precision)
    # SMTP RCPT probe always runs on top of T1-T3 unless disabled.
    email_finder_tier:   str  = Field("t2", description="off | t1 | t2 | t3")
    smtp_probe_enabled:  bool = Field(True)
    linkedin_cookie:     str  = Field("", description="LinkedIn `li_at` session cookie for T2 finder. Get it from chrome devtools -> Application -> Cookies -> https://www.linkedin.com -> li_at.")
    linkedin_finder_daily_cap: int = Field(30)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Convenience properties
    @property
    def titles_list(self) -> List[str]:
        return [t.strip() for t in self.target_titles.split(",") if t.strip()]

    @property
    def secondary_list(self) -> List[str]:
        return [c.strip() for c in self.secondary_markets.split(",") if c.strip()]

    @property
    def all_markets(self) -> List[str]:
        return [self.primary_market] + self.secondary_list


def get_settings() -> Settings:
    """Load and return settings singleton."""
    return Settings()  # type: ignore[call-arg]
