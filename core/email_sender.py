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
from .cover_letter import render
from .subjects import pick_subject, followup_subject
from .email_validator import validate_email


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
    recruiter_first_name: str = "",
    job_title: str = "",
    job_description: str = "",
) -> bool:
    """High-level: render + send + log. Returns True if sent.

    If ``recruiter_first_name`` is provided (typically discovered by the
    LinkedIn finder), the generated email opens with the recruiter's first
    name, which materially lifts reply rates.
    """

    if db.already_emailed(recipient, followup):
        logger.debug(f"Already emailed {recipient} (followup={followup})")
        return False

    if db.emails_sent_today() >= settings.daily_email_cap:
        logger.warning("Daily email cap reached — skipping")
        return False

    valid, reason = validate_email(recipient)
    if not valid:
        logger.warning(f"skip {recipient} ({reason})")
        db.log_event("skip_invalid_email", f"{recipient}: {reason}")
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
        "recruiter_first_name": recruiter_first_name or "",
    }

    cat = "Followup" if followup else category
    body = render(cat, ctx)

    # AI-tailored body (uses Gemini if key present + job_description provided)
    if (
        not followup
        and getattr(settings, "ai_enabled", True)
        and getattr(settings, "gemini_api_key", "")
        and job_title
        and job_description
    ):
        try:
            from .ai_writer import tailored_email
            ai_body = tailored_email(
                user_name=settings.user_name,
                user_summary=settings.user_summary,
                resume_text=profile.get("resume_text", "")[:6000],
                job_title=job_title,
                job_description=job_description,
                company=company,
                recruiter_first_name=recruiter_first_name,
                gemini_key=settings.gemini_api_key,
                groq_key=getattr(settings, "groq_api_key", ""),
                model_gemini=getattr(settings, "gemini_model", "gemini-flash-latest"),
                model_groq=getattr(settings, "groq_model", "llama-3.3-70b-versatile"),
            )
            if ai_body and len(ai_body.strip()) > 40:
                body = ai_body
        except Exception as e:
            logger.debug(f"AI tailoring failed, falling back: {e}")

    if followup:
        # Re-use the most recent outgoing subject for the recipient so the
        # follow-up threads correctly in their Gmail.
        prior = None
        try:
            with db._conn() as c:  # type: ignore[attr-defined]
                r = c.execute(
                    "SELECT subject FROM emails_sent WHERE recipient=? "
                    "AND followup=0 ORDER BY sent_at DESC LIMIT 1",
                    (recipient,),
                ).fetchone()
                prior = r["subject"] if r else None
        except Exception:
            prior = None
        subject = followup_subject(prior or "Application")
    else:
        subject = pick_subject(
            company=company,
            category=category,
            name=settings.user_name,
            years=ctx["years"],
            location=settings.user_location,
            visa=settings.user_visa,
        )

    # DRAFT MODE: queue for human review instead of sending. The customer
    # approves each message from the local Queue UI (http://localhost:7868)
    # before a single byte hits Gmail. This protects sender reputation and
    # gives the customer the final say on every outbound email.
    if getattr(settings, "draft_mode", False):
        queued_id = db.queue_pending_email(
            recipient=recipient,
            company=company,
            category=cat,
            subject=subject,
            body=body,
            job_id=job_id,
            job_title=job_title,
            job_url="",
            followup=followup,
        )
        if queued_id:
            db.log_event(
                "email_queued",
                f"{recipient} ({company}) | {subject[:60]} | queue#{queued_id}",
            )
            logger.info(f"queued #{queued_id} → {recipient} ({company}) — awaiting review")
            return True  # successfully queued is "ok" from the cycle's POV
        return False

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
        db.log_event("email_sent", f"{recipient} ({company}) | {subject[:60]}")
        logger.success(f"→ {recipient} ({company}) — \"{subject[:60]}\"")
    else:
        # SMTP-level rejection — quarantine the address so we never retry
        if reason.startswith("recipient_refused") or reason.startswith("smtp_5"):
            db.mark_invalid_email(recipient, reason)
        db.log_event("email_failed", f"{recipient}: {reason}")
        logger.warning(f"failed {recipient}: {reason}")

    return ok
