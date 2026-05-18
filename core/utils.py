"""Shared utilities."""
from __future__ import annotations

import random
import time
from typing import Callable, TypeVar

from loguru import logger

T = TypeVar("T")


def jitter_sleep(min_sec: int, max_sec: int) -> None:
    """Random delay to avoid bot detection / rate limits."""
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)


def retry(times: int = 3, delay: float = 2.0):
    """Simple retry decorator."""
    def deco(fn: Callable[..., T]) -> Callable[..., T]:
        def wrapper(*args, **kwargs) -> T:
            last = None
            for i in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:
                    last = e
                    if i < times - 1:
                        logger.debug(f"{fn.__name__} retry {i+1}: {e}")
                        time.sleep(delay * (i + 1))
            raise last  # type: ignore[misc]
        return wrapper
    return deco
