"""Ensure helper scripts run from Jobybot project root.

Also injects the root onto sys.path so `from config import ...` and
`from core import ...` resolve cleanly regardless of how the script
was launched.
"""
from pathlib import Path
import os
import sys

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
