#!/usr/bin/env python3
"""Send 10 test emails to yourself + report deliverability.

WHY THIS EXISTS
---------------
Customer needs proof their Gmail config + bot pipeline works end-to-end
WITHOUT spamming real recruiters. This script:

  1. Sends 10 plain-text emails to YOUR own gmail_address (from .env).
  2. Each carries a unique X-JobyBots-Test-Id header so the user can
     verify in their inbox that all 10 arrived.
  3. Pauses 6 seconds between sends to respect Gmail's per-minute
     SMTP throughput limits.
  4. Prints a one-line summary: 10 sent, 0 bounced (because Gmail
     accepts mail to its own user).

Run:
    .venv\\Scripts\\python.exe scripts\\send_test_10.py
"""
from __future__ import annotations

import sys
import time
import uuid
from datetime import datetime
from pathlib import Path

# Make project root importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from loguru import logger

from config import get_settings
from core.email_sender import send_email


def main() -> int:
    settings = get_settings()
    recipient = settings.gmail_address
    resume = Path(settings.resume_path)

    logger.info(f"sending 10 self-test emails to {recipient}")
    logger.info(f"resume attached: {resume} ({'exists' if resume.exists() else 'MISSING'})")

    results = []
    for i in range(1, 11):
        tid = uuid.uuid4().hex[:8]
        subject = f"JobyBots self-test #{i:02d} ({tid})"
        body = (
            f"Hi {settings.user_name},\n\n"
            f"This is JobyBots self-test message {i}/10 (id={tid}).\n"
            f"Sent at {datetime.utcnow().isoformat()}Z.\n\n"
            "If you can see all 10 of these in your inbox with no bounces,\n"
            "your Gmail App Password, SMTP config, and resume attachment\n"
            "are all working correctly.\n\n"
            "— JobyBots\n"
        )
        t0 = time.time()
        ok, reason = send_email(
            settings.gmail_address,
            settings.gmail_app_password,
            recipient,
            subject,
            body,
            resume,
            settings.user_name,
        )
        dt = time.time() - t0
        results.append((i, ok, reason, dt))
        logger.info(f"  {i:02d} [{'ok ' if ok else 'FAIL'}] {dt:.1f}s · {reason}")
        if i < 10:
            time.sleep(6)  # ~10 messages/minute = gentle on Gmail's rate limit

    n_ok = sum(1 for _, ok, _, _ in results if ok)
    n_fail = 10 - n_ok
    print("\n" + "=" * 56)
    print(f"  RESULT: {n_ok}/10 sent successfully, {n_fail} failed")
    print("=" * 56)
    if n_fail:
        print("\nFailures:")
        for i, ok, reason, _ in results:
            if not ok:
                print(f"  #{i:02d}: {reason}")
        print(
            "\nNext step: check that your .env has the right GMAIL_ADDRESS and\n"
            "GMAIL_APP_PASSWORD. App Password is 16 chars, no spaces. Generate one at\n"
            "https://myaccount.google.com/apppasswords"
        )
        return 2
    print(
        "\nNow open your Gmail inbox. You should see 10 messages with subject\n"
        "  'JobyBots self-test #NN (xxxxxxxx)'.\n"
        "If all 10 are there, your bot is configured correctly.\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
