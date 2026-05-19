"""RemoteOK — free public API, no auth."""
from __future__ import annotations

from typing import Any, Dict, List

from loguru import logger

from core.net_safety import safe_get
from .base import JobSource


class RemoteOK(JobSource):
    name = "RemoteOK"

    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        jobs: List[Dict[str, Any]] = []
        try:
            r = safe_get(
                "https://remoteok.com/api",
                headers={"User-Agent": "Jobybot/1.0"},
            )
            if r.status_code != 200:
                return jobs
            data = r.json()
            # First item is metadata
            entries = data[1:] if data and isinstance(data[0], dict) and "legal" in data[0] else data

            tl = title.lower()
            for j in entries[:200]:
                try:
                    pos = (j.get("position") or "").lower()
                    if not any(w in pos for w in tl.split()):
                        continue
                    jid = f"remoteok_{j.get('id') or j.get('slug') or pos}"
                    jobs.append({
                        "id":          jid,
                        "source":      self.name,
                        "title":       j.get("position") or "",
                        "company":     j.get("company") or "Unknown",
                        "location":    j.get("location") or "Remote",
                        "url":         j.get("url") or j.get("apply_url") or "",
                        "description": j.get("description") or "",
                    })
                except Exception:
                    continue
        except Exception as e:
            logger.debug(f"RemoteOK: {type(e).__name__}")
        return jobs[:20]
