"""Ensure helper scripts run from Jobybot project root."""
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
