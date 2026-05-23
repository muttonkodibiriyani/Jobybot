"""Build dashboard.html and open it in the default browser."""
import webbrowser
from pathlib import Path
import sys

import _root  # noqa: F401

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from config import get_settings  # noqa: E402
from core import db                # noqa: E402
from core.dashboard import render_dashboard  # noqa: E402


def main() -> int:
    s = get_settings()
    db.init_db()
    render_dashboard(s.daily_email_cap, s.run_interval_minutes)
    p = Path("data") / "dashboard.html"
    print(f"Dashboard: {p.resolve()}")
    webbrowser.open(p.resolve().as_uri())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
