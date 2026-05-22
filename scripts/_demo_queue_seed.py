"""Seed 3 sample pending-review emails so the dashboard + queue UI demo nicely.

Safe to re-run: it inserts new rows tagged `[DEMO]` so they're easy to spot.
Skip them in the queue UI to remove from the dashboard.
"""
import _root  # noqa: F401
from core import db

db.init_db()

samples = [
    {
        "recipient": "talent.acquisition@example-uae.com",
        "company":   "Etihad Airways",
        "category":  "uae",
        "subject":   "[DEMO] Application — Senior Product Manager (UAE)",
        "body":      "Hi team,\n\nI'm Tharakeswara Reddy, applying for Senior Product Manager. 14 years across telecom & airline product, AI-led roadmaps. Résumé attached.\n\nBest,\nThar",
        "job_id":    None,
        "job_title": "Senior Product Manager",
        "job_url":   "https://www.etihad.com/careers",
        "followup":  0,
    },
    {
        "recipient": "hr@example-saudi.com",
        "company":   "Saudi Aramco",
        "category":  "saudi",
        "subject":   "[DEMO] Application — Solution Architect (Saudi Arabia)",
        "body":      "Hi team,\n\nApplying for Solution Architect role. AWS / Azure cert, 12 yrs enterprise architecture in O&G + retail. Résumé attached.\n\nBest,\nThar",
        "job_id":    None,
        "job_title": "Solution Architect",
        "job_url":   "https://www.aramco.com/careers",
        "followup":  0,
    },
    {
        "recipient": "careers@example-qatar.com",
        "company":   "Qatar Airways",
        "category":  "qatar",
        "subject":   "[DEMO] Application — Business Analyst (Qatar)",
        "body":      "Hi team,\n\nApplying for Business Analyst role. PSPO + PMP, 10 yrs aviation & loyalty programs. Résumé attached.\n\nBest,\nThar",
        "job_id":    None,
        "job_title": "Business Analyst",
        "job_url":   "https://careers.qatarairways.com",
        "followup":  0,
    },
]

inserted = 0
for s in samples:
    try:
        rid = db.queue_pending_email(**s)
        if rid:
            inserted += 1
            print(f"  + queued (id={rid}): {s['company']:<22s}  {s['subject']}")
        else:
            print(f"  = already queued/sent: {s['company']}")
    except Exception as e:
        print(f"  ! skip {s['company']}: {e}")

print(f"\nDone. Inserted {inserted} demo email(s).")
print("Open http://127.0.0.1:7868 (run REVIEW_QUEUE.bat) to review/edit/send them.")
