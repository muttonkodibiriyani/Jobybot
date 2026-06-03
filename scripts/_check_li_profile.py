"""Quick health check for the LinkedIn browser profile."""
import _root  # noqa
from pathlib import Path
import time
from core.easy_apply import _profile_has_linkedin_session, _resolve_browser_profile
from config import get_settings

s = get_settings()
profile_dir, channel, source = _resolve_browser_profile(s)

print()
print(f"  Profile dir : {profile_dir.resolve()}")
print(f"  Source      : {source}  (channel={channel or 'chromium'})")
print(f"  Exists      : {profile_dir.exists()}")

if profile_dir.exists():
    for c in (profile_dir / "Default" / "Network" / "Cookies",
              profile_dir / "Default" / "Cookies",
              profile_dir / "Cookies"):
        if c.exists():
            age_h = (time.time() - c.stat().st_mtime) / 3600
            print(f"  Cookies DB  : {c}  size={c.stat().st_size}  age={age_h:.1f}h")

print(f"  Has session : {_profile_has_linkedin_session(profile_dir)}")

# .env cookie status
env_path = Path(".env")
cookie_val = ""
if env_path.exists():
    for line in env_path.read_text(errors="ignore").splitlines():
        if line.strip().startswith("LINKEDIN_COOKIE="):
            cookie_val = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
print(f"  .env cookie : len={len(cookie_val)}")
