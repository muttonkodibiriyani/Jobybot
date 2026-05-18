"""Abstract base class for job sources."""
from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from typing import Any, Dict, List


class JobSource(ABC):
    """Each scraper implements ``search(title, location)``."""

    name: str = "base"

    @abstractmethod
    def search(self, title: str, location: str) -> List[Dict[str, Any]]:
        """
        Return list of job dicts:
        {
          "id": str,         # deterministic, unique within source
          "source": str,     # source name
          "title": str,
          "company": str,
          "location": str,
          "url": str,
          "description": str (optional)
        }
        """
        raise NotImplementedError

    @staticmethod
    def make_id(source: str, *parts: str) -> str:
        h = hashlib.md5(("|".join(parts)).encode("utf-8")).hexdigest()[:16]
        return f"{source}_{h}"
