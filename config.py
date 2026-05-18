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
    daily_email_cap:      int = Field(80)
    hourly_job_limit:     int = Field(20)
    match_threshold:      int = Field(50)
    run_interval_minutes: int = Field(60)
    min_delay_sec:        int = Field(30)
    max_delay_sec:        int = Field(120)

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
