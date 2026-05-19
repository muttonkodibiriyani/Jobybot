"""One-off: scan Gmail for bounce NDRs and quarantine bad recipients."""
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from config import get_settings  # noqa: E402
from core import db                # noqa: E402
from core.bounce_tracker import scan_bounces  # noqa: E402


def main() -> int:
    s = get_settings()
    db.init_db()
    n = scan_bounces(s.gmail_address, s.gmail_app_password)
    print(f"Marked {n} bounced address(es) as invalid.")
    rows = db.get_invalid_emails(20)
    if rows:
        print("\nLatest invalid emails:")
        for r in rows:
            print(f"  {r['email']:40s}  {r['reason'][:50]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
