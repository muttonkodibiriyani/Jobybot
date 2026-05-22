"""License enforcement: one purchase = one machine.

WHY THIS EXISTS
---------------
JobyBots is sold as a one-time ₹2,999 lifetime license. The biggest leak
in that model is "I'll just share the ZIP with friends." This module:

  1. Computes a stable machine fingerprint (no PII, just a SHA-256 of
     hostname + MAC address + OS + Python version).
  2. On the first bot cycle, calls the website's
     ``/api/license/bind`` endpoint with {license_email, fingerprint}.
     Server stores the mapping. Subsequent calls from a DIFFERENT
     fingerprint for the SAME license get rejected with a clear message.
  3. The customer can re-bind (e.g. new laptop) by going to /portal and
     clicking "Move my license" — that wipes the stored fingerprint so
     the next call from the new machine takes over.

PRIVACY
-------
We never send hostname, MAC, or any raw identifier. Only the SHA-256 hash.
The website can't reverse it. We don't even log the hash beyond the bind
table. This is the same model Apple uses for "Activate this device for
purchases" — proof of single ownership, no surveillance.

FAIL-OPEN
---------
If the network is down, or the website is unreachable, the bot KEEPS
WORKING (we don't punish customers for our outage). It only enforces when
it gets a clean "rejected" answer. This is documented on /security.
"""
from __future__ import annotations

import hashlib
import json
import os
import platform
import socket
import sys
import time
import uuid
from pathlib import Path
from typing import Optional, Tuple

from loguru import logger
import urllib.request
import urllib.error

LICENSE_FILE = Path("data") / "license.json"
DEFAULT_API = os.environ.get(
    "JOBYBOTS_LICENSE_API", "https://jobybots.com/api/license/bind"
)
USER_AGENT = "JobyBots-bot/1.0"
TIMEOUT_SEC = 6.0


def _machine_fingerprint() -> str:
    """SHA-256 of (hostname + MAC + OS + Python) — stable across reboots,
    different on every machine. No raw identifier ever leaves the box."""
    try:
        mac = uuid.getnode()
    except Exception:
        mac = 0
    raw = "|".join([
        socket.gethostname() or "unknown",
        f"{mac:012x}",
        platform.system(),
        platform.release(),
        platform.machine(),
        f"py{sys.version_info.major}.{sys.version_info.minor}",
    ])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _load_local_state() -> dict:
    if not LICENSE_FILE.exists():
        return {}
    try:
        return json.loads(LICENSE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_local_state(state: dict) -> None:
    LICENSE_FILE.parent.mkdir(parents=True, exist_ok=True)
    LICENSE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    try:
        os.chmod(LICENSE_FILE, 0o600)
    except Exception:
        pass


def _post_json(url: str, payload: dict) -> Tuple[int, dict]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as r:
            raw = r.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(raw)
            except Exception:
                data = {"raw": raw}
            return r.status, data
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode("utf-8"))
        except Exception:
            data = {"error": str(e)}
        return e.code, data
    except urllib.error.URLError as e:
        return 0, {"error": str(e)}


def verify_or_bind(license_email: Optional[str] = None,
                   api_url: str = DEFAULT_API) -> Tuple[bool, str]:
    """Returns (allowed, reason). Fail-open on network errors.

    Customer's license_email comes from .env (USER_EMAIL is the default).
    """
    state = _load_local_state()
    if state.get("self_hosted") is True:
        return True, "self_hosted"  # opt-out flag for power users

    fp = _machine_fingerprint()
    if state.get("fingerprint") == fp and state.get("license_email"):
        # Locally cached — already bound on this machine. Skip the network call
        # to keep cycles fast and offline-friendly.
        return True, "cached"

    email = (license_email or os.environ.get("USER_EMAIL") or "").strip().lower()
    if not email:
        # No license email known yet — let the bot run. The website call
        # will happen on the next cycle when .env is filled in.
        return True, "no_email_yet"

    status, data = _post_json(api_url, {"email": email, "fingerprint": fp})
    if status == 0:
        # Network down. Fail open.
        logger.warning("license server unreachable — allowing this cycle")
        return True, "network_down"

    if status == 200 and data.get("ok"):
        _save_local_state({
            "license_email": email,
            "fingerprint": fp,
            "bound_at": time.time(),
            "server_says": data.get("status", "bound"),
        })
        return True, data.get("status", "bound")

    if status == 409:
        # Already bound to a DIFFERENT machine.
        msg = (data.get("message")
               or "This license is registered to another machine. "
                  "Go to https://jobybots.com/portal -> Move my license, "
                  "or contact support.")
        return False, msg

    # Other error (404, 401, 500) — fail open for now; we don't want a bad
    # deploy to lock everyone out. Surface it loudly in the log.
    logger.warning(f"license check returned {status}: {data}")
    return True, f"server_error_{status}"


def cli_check() -> int:
    """`python -m core.license_check` entrypoint for SETUP scripts + doctor."""
    from config import get_settings
    try:
        s = get_settings()
        ok, reason = verify_or_bind(license_email=s.user_email)
    except Exception as e:
        logger.warning(f"license check skipped (no settings yet): {e}")
        ok, reason = True, "no_settings"
    print(f"license_check: ok={ok} reason={reason}")
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(cli_check())
