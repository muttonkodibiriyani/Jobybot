"""Tests for db module."""
import os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from pathlib import Path
from core import db


@pytest.fixture(autouse=True)
def temp_db(tmp_path, monkeypatch):
    """Isolate each test in its own temp DB."""
    p = tmp_path / "test.db"
    monkeypatch.setattr(db, "DB_PATH", p)
    db.init_db()
    yield p


def test_init_creates_tables():
    assert db.DB_PATH.exists()


def test_upsert_new_job_returns_true():
    job = {
        "id": "abc123", "source": "linkedin", "title": "PM",
        "company": "Acme", "url": "https://x", "location": "Dubai",
    }
    assert db.upsert_job(job) is True


def test_upsert_duplicate_returns_false():
    job = {"id": "abc", "source": "x", "title": "PM", "company": "A", "url": "u"}
    assert db.upsert_job(job) is True
    assert db.upsert_job(job) is False


def test_log_and_check_email():
    assert not db.already_emailed("a@b.com")
    db.log_email("a@b.com", "Acme", "Employer", "hi")
    assert db.already_emailed("a@b.com")


def test_cache_email():
    assert db.get_cached_email("Acme") is None
    db.cache_email("Acme", "acme.com", "careers@acme.com")
    assert db.get_cached_email("Acme") == "careers@acme.com"


def test_emails_sent_today_starts_zero():
    assert db.emails_sent_today() == 0
