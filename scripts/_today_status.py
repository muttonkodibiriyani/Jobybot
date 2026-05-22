#!/usr/bin/env python3
"""Tiny diagnostic — what did the bot actually do today?"""
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "data" / "jobybot.db"
c = sqlite3.connect(DB)

today = c.execute("SELECT date('now','localtime')").fetchone()[0]
print(f"=== Today is {today} (local) ===\n")

print("Emails sent today:           ",
      c.execute("SELECT COUNT(*) FROM emails_sent WHERE sent_at LIKE ?",
                (today + "%",)).fetchone()[0])

print("Jobs found today:            ",
      c.execute("SELECT COUNT(*) FROM jobs WHERE found_at LIKE ?",
                (today + "%",)).fetchone()[0])

print("Total jobs in DB:            ",
      c.execute("SELECT COUNT(*) FROM jobs").fetchone()[0])

print("Total emails sent (all-time):",
      c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0])

print("\nJobs found today by source:")
for r in c.execute(
    "SELECT source, COUNT(*) FROM jobs WHERE found_at LIKE ? GROUP BY source ORDER BY 2 DESC",
    (today + "%",)
).fetchall():
    print(f"  {r[0]:25s} {r[1]}")

print("\nRun-log events (last 24h):")
for r in c.execute(
    "SELECT event, COUNT(*) FROM run_log WHERE at > datetime('now','-1 day') GROUP BY event ORDER BY 2 DESC LIMIT 15"
).fetchall():
    print(f"  {r[0]:25s} {r[1]}")

print("\nWhy nothing was sent today (top skip reasons):")
for r in c.execute(
    "SELECT detail, COUNT(*) FROM run_log WHERE at > datetime('now','-1 day') AND event LIKE 'skip%' GROUP BY substr(detail, instr(detail,'(')+1, 30) ORDER BY 2 DESC LIMIT 8"
).fetchall():
    line = (r[0] or "")[:80]
    print(f"  [{r[1]:3d}] {line}")
