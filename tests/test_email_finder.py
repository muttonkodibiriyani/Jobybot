"""Tests for email finder."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.email_finder import clean_company, guess_domain, known_domain


def test_clean_company():
    assert "talabat" in clean_company("Talabat LLC")
    assert "deloitte" in clean_company("Deloitte Middle East")


def test_known_domain_talabat():
    assert known_domain("Talabat UAE") == "talabat.com"


def test_known_domain_deloitte():
    assert known_domain("Deloitte ME") == "deloitte.com"


def test_known_domain_unknown_returns_none():
    assert known_domain("Random Unknown Company Xyz") is None


def test_guess_domain():
    g = guess_domain("Acme Corp")
    assert g == "acme.com"
