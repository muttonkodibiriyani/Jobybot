"""Count jobs added today."""
import datetime
import os
import sqlite3
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

db = os.path.join("data", "jobybot.db")
if not os.path.exists(db):
    print("Jobs added today: 0")
    sys.exit(0)

today = datetime.date.today().isoformat()
c = sqlite3.connect(db)
n = c.execute(
    "SELECT COUNT(*) FROM jobs WHERE found_at LIKE ?", (today + "%",)
).fetchone()[0]
print(f"Jobs added today: {n}")
c.close()
