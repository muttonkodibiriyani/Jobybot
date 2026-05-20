"""Quick diagnostic of why the email blast is silent."""
import sqlite3, json
from pathlib import Path

c = sqlite3.connect("data/jobybot.db")

sent_today = c.execute("SELECT COUNT(*) FROM emails_sent WHERE date(sent_at)=date('now')").fetchone()[0]
sent_all   = c.execute("SELECT COUNT(*) FROM emails_sent").fetchone()[0]
last_sent  = c.execute("SELECT MAX(sent_at) FROM emails_sent").fetchone()[0]
print(f"Emails sent today:    {sent_today}")
print(f"Emails sent all time: {sent_all}")
print(f"Last sent at:         {last_sent}")

uae = json.loads(Path("markets/primary_uae.json").read_text(encoding="utf-8"))
contacts = uae.get("contacts", [])
print(f"\nUAE total contacts:   {len(contacts)}")

already = 0
fresh   = 0
last_per_addr = []
for ct in contacts:
    em = ct["email"]
    row = c.execute("SELECT MAX(sent_at) FROM emails_sent WHERE recipient=?", (em,)).fetchone()
    if row and row[0]:
        already += 1
        last_per_addr.append((em, row[0]))
    else:
        fresh += 1

print(f"  already emailed:    {already}")
print(f"  fresh (never sent): {fresh}")

print("\nLast 10 UAE contacts already emailed:")
for em, ts in sorted(last_per_addr, key=lambda x: x[1], reverse=True)[:10]:
    print(f"  {ts}  →  {em}")
