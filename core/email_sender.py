"""Gmail SMTP sender with attachment support and dedup."""
from __future__ import annotations

import smtplib
import ssl
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path
from typing import Tuple

from loguru import logger

from . import db
from .cover_letter import render, subject_for


def send_email(
    sender:    str,
    password:  str,
    recipient: str,
    subject:   str,
    body:      str,
    resume_path: Path,
    sender_name: str,
) -> Tuple[bool, str]:
    """Send a single email with PDF attached. Returns (ok, reason)."""

    msg             = MIMEMultipart()
    msg["From"]     = f"{sender_name} <{sender}>"
    msg["To"]       = recipient
    msg["Reply-To"] = sender
    msg["Subject"]  = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    if resume_path.exists():
        with resume_path.open("rb") as f:
            att = MIMEBase("application", "octet-stream")
            att.set_payload(f.read())
        encoders.encode_base64(att)
        att.add_header(
            "Content-Disposition",
            f'attachment; filename="{resume_path.name}"',
        )
        msg.attach(att)

    ctx = ssl.create_default_context()
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(sender, password)
            s.sendmail(sender, recipient, msg.as_bytes())
        return True, "sent"
    except smtplib.SMTPAuthenticationError as e:
        return False, f"auth: {e}"
    except smtplib.SMTPRecipientsRefused:
        return False, "recipient_refused"
    except smtplib.SMTPResponseException as e:
        return False, f"smtp_{e.smtp_code}: {e.smtp_error}"
    except OSError as e:
        return False, f"network: {e}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def send_application(
    settings,
    recipient: str,
    company: str,
    category: str,
    profile,
    followup: int = 0,
    job_id: str | None = None,
) -> bool:
    """High-level: render + send + log. Returns True if sent."""

    if db.already_emailed(recipient, followup):
        logger.debug(f"Already emailed {recipient} (followup={followup})")
        return False

    if db.emails_sent_today() >= settings.daily_email_cap:
        logger.warning("Daily email cap reached — skipping")
        return False

    ctx = {
        "name":     settings.user_name,
        "email":    settings.user_email,
        "phone":    settings.user_phone,
        "linkedin": settings.user_linkedin,
        "location": settings.user_location,
        "visa":     settings.user_visa,
        "notice":   settings.user_notice,
        "summary":  settings.user_summary,
        "years":    profile.get("years_exp", 7),
        "company":  company,
        "days":     settings.followup_days,
    }

    cat = "Followup" if followup else category
    body    = render(cat, ctx)
    subject = subject_for(category, settings.user_name, ctx["years"])
    if followup:
        subject = f"Following up — {subject}"

    ok, reason = send_email(
        settings.gmail_address,
        settings.gmail_app_password,
        recipient,
        subject,
        body,
        Path(settings.resume_path),
        settings.user_name,
    )

    if ok:
        db.log_email(recipient, company, category, subject, job_id, followup)
        logger.success(f"→ {recipient} ({company})")
    else:
        logger.warning(f"✗ {recipient}: {reason}")

    return ok
