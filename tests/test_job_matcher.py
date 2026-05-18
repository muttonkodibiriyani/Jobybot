"""Tests for the job matcher."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.job_matcher import (
    title_match_score, skills_match_score,
    location_match_score, seniority_match_score, score_job,
)


def test_title_match_exact():
    s = title_match_score("Senior Product Manager", ["senior product manager"])
    assert s == 30


def test_title_match_synonym():
    s = title_match_score("Product Owner", ["product manager"])
    assert s >= 25


def test_title_match_unrelated():
    s = title_match_score("Plumber", ["product manager"])
    assert s == 0


def test_skills_match():
    s = skills_match_score("We need azure python sql experience",
                            ["azure", "python", "sql", "tableau", "agile"])
    assert s >= 20


def test_skills_match_low():
    s = skills_match_score("Carpentry skills needed",
                            ["python", "azure"])
    assert s == 0


def test_location_match():
    s = location_match_score("Dubai, UAE", ["Dubai, UAE"])
    assert s == 20


def test_location_remote():
    s = location_match_score("Remote", ["Berlin, Germany"])
    assert s == 15


def test_seniority_senior_for_senior():
    s = seniority_match_score("Senior Product Manager", my_years=7)
    assert s == 20


def test_seniority_junior_rejected_for_senior():
    s = seniority_match_score("Junior Product Manager", my_years=7)
    assert s == 0


def test_score_job_total():
    job = {
        "title": "Senior Product Manager",
        "description": "Azure, Python, SQL, Agile, retail product",
        "location": "Dubai, UAE",
    }
    profile = {
        "titles":    ["senior product manager"],
        "skills":    ["azure", "python", "sql", "agile", "retail"],
        "years_exp": 7,
    }
    s = score_job(job, profile, ["Dubai, UAE"])
    assert s >= 80
