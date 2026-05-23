"""PID lockfile for the long-running `jobybot.py schedule` daemon.

Why this exists
---------------
The Windows installer creates TWO ways to start the scheduler:

  1. Startup shortcut  -> _run_scheduler.bat -> `jobybot.py schedule`
  2. JobybotDaily task -> _run_scheduler.bat -> would try to start it again

Without coordination these race each other and you end up with two daemons
writing to the same SQLite file, sending duplicate emails, and confusing the
dashboard. The Mac launchd setup has the same risk.

The lockfile in `data/scheduler.lock` contains the PID of the running daemon
plus the start time. Any wrapper script can call `is_alive()` to decide
whether to start a new daemon or skip.

The lockfile is **best-effort**: it survives crashes, gets cleaned up on
graceful shutdown, and self-heals if the recorded PID no longer exists.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

LOCK_PATH = Path("data") / "scheduler.lock"


def _pid_alive(pid: int) -> bool:
    """Cross-platform 'is this PID still running' check."""
    if pid <= 0:
        return False
    if sys.platform.startswith("win"):
        try:
            import ctypes
            import ctypes.wintypes as wt
            PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
            STILL_ACTIVE = 259
            h = ctypes.windll.kernel32.OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION, False, pid
            )
            if not h:
                return False
            try:
                code = wt.DWORD()
                if ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(code)) == 0:
                    return False
                return code.value == STILL_ACTIVE
            finally:
                ctypes.windll.kernel32.CloseHandle(h)
        except Exception:
            return False
    try:
        os.kill(pid, 0)
        return True
    except (ProcessLookupError, PermissionError, OSError):
        return False


def read() -> Optional[dict]:
    """Return the lockfile dict, or None if absent / unreadable."""
    if not LOCK_PATH.exists():
        return None
    try:
        return json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def is_alive() -> Tuple[bool, Optional[int]]:
    """Return (alive_bool, pid_or_None). Auto-cleans stale lockfiles."""
    data = read()
    if not data:
        return (False, None)
    pid = int(data.get("pid", 0))
    if _pid_alive(pid):
        return (True, pid)
    # stale
    try:
        LOCK_PATH.unlink(missing_ok=True)
    except Exception:
        pass
    return (False, None)


def acquire() -> None:
    """Write the current PID into the lockfile."""
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "pid": os.getpid(),
        "started_at": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "platform": sys.platform,
    }
    LOCK_PATH.write_text(json.dumps(payload), encoding="utf-8")


def release() -> None:
    """Remove our own lockfile on graceful shutdown."""
    data = read()
    if data and int(data.get("pid", 0)) == os.getpid():
        try:
            LOCK_PATH.unlink(missing_ok=True)
        except Exception:
            pass
