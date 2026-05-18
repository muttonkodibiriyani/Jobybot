"""Tests for cover letter rendering."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.cover_letter import render, subject_for


CTX = {
    "name": "Jane Doe", "email": "jane@gmail.com", "phone": "+971501234567",
    "linkedin": "linkedin.com/in/jane",
    "location": "Dubai, UAE", "visa": "UAE Resident", "notice": "1 month",
    "summary": "Senior PM with 7 years experience.",
    "years": 7, "company": "Acme", "days": 7,
}


def test_render_recruiter():
    out = render("Recruiter", CTX)
    assert "Jane Doe" in out
    assert "Recruiter" in out


def test_render_employer_includes_company():
    out = render("Employer", CTX)
    assert "Acme" in out
    assert "Jane Doe" in out


def test_render_tech():
    out = render("Tech", CTX)
    assert "Acme" in out


def test_render_followup():
    out = render("Followup", CTX)
    assert "7" in out
    assert "Jane Doe" in out


def test_subject_for():
    s = subject_for("Recruiter", "Jane Doe", 7)
    assert "Jane Doe" in s
    assert "7" in s
