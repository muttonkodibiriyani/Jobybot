"""Show the last N events from run_log + last N emails sent.

Used to inspect a running cycle without blocking on its stdout buffer.
"""
import _root  # noqa: F401
import sqlite3
import sys

n = int(sys.argv[1]) if len(sys.argv) > 1 else 25

c = sqlite3.connect("data/jobybot.db")
c.row_factory = sqlite3.Row

print(f"\n  -- last {n} run_log events --")
rows = c.execute(
    "SELECT event, detail, at FROM run_log ORDER BY at DESC LIMIT ?", (n,)
).fetchall()
for r in rows:
    print(f"  {r['at'][:19]}  {r['event']:<28s} {(r['detail'] or '')[:70]}")

print(f"\n  -- last {n} emails sent --")
rows = c.execute(
    "SELECT sent_at, recipient, company, followup, subject "
    "FROM emails_sent ORDER BY sent_at DESC LIMIT ?", (n,)
).fetchall()
for r in rows:
    flag = "FU" if r["followup"] else "  "
    subj = (r["subject"] or "")[:55]
    print(f"  {r['sent_at'][:19]} [{flag}] {r['recipient'][:35]:<35s} | {subj}")

print(f"\n  -- emails sent TODAY --")
n_today = c.execute(
    "SELECT COUNT(*) AS n FROM emails_sent WHERE sent_at >= date('now')"
).fetchone()["n"]
print(f"  total: {n_today}")
