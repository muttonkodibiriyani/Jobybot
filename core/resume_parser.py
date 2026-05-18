"""Resume PDF parser → structured profile JSON."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Set

import pdfplumber
from loguru import logger

PROFILE_PATH = Path("data") / "resume_profile.json"

# Common tech / business skills to detect
SKILL_KEYWORDS = {
    # Data & cloud
    "sql", "python", "java", "javascript", "typescript", "scala", "r",
    "azure", "aws", "gcp", "google cloud", "databricks", "snowflake",
    "spark", "hadoop", "airflow", "kafka", "etl", "elt",
    "powerbi", "power bi", "tableau", "looker", "qlik",
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "scikit-learn",
    # PM / agile
    "agile", "scrum", "kanban", "jira", "confluence", "okrs", "kpi",
    "stakeholder management", "product strategy", "roadmap",
    "user research", "a/b testing", "analytics",
    # Domain
    "retail", "e-commerce", "ecommerce", "fintech", "saas", "b2b", "b2c",
    "loyalty", "crm", "marketing", "supply chain",
    # AI
    "ai", "llm", "openai", "anthropic", "claude", "gemini", "rag",
    "copilot", "automation", "agentic",
    # General
    "rest api", "microservices", "kubernetes", "docker", "ci/cd",
    "git", "github", "azure devops",
}

# Role title synonyms
TITLE_SYNONYMS = {
    "product manager":           ["pm", "product owner", "po", "product lead"],
    "senior product manager":    ["sr product manager", "lead product manager"],
    "data product manager":      ["data pm", "analytics product manager"],
    "ai product manager":        ["ml product manager", "ai pm"],
    "business analyst":          ["ba", "business systems analyst"],
    "senior business analyst":   ["sr business analyst", "lead business analyst"],
    "technical product owner":   ["tpo", "technical po"],
    "solution architect":        ["solutions architect", "enterprise architect"],
    "program manager":           ["programme manager", "program lead"],
    "digital transformation manager": ["digital lead", "transformation lead"],
    "data engineer":             ["data platform engineer"],
    "data scientist":            ["ml engineer", "ai engineer"],
}


def parse_pdf(pdf_path: Path) -> str:
    """Extract all text from PDF."""
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)


def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found: Set[str] = set()
    for skill in SKILL_KEYWORDS:
        # Word boundary match
        if re.search(rf"\b{re.escape(skill)}\b", lower):
            found.add(skill)
    return sorted(found)


def extract_years(text: str) -> int:
    """Find total years of experience mentioned."""
    patterns = [
        r"(\d+)\+?\s*years?\s*(of\s*)?experience",
        r"(\d+)\+?\s*yrs?\s*(of\s*)?experience",
        r"experience\s*[:\-]?\s*(\d+)\+?\s*years?",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return 0


def extract_titles(text: str) -> List[str]:
    """Find role titles mentioned."""
    lower = text.lower()
    found = []
    for title, syns in TITLE_SYNONYMS.items():
        if title in lower:
            found.append(title)
            continue
        for s in syns:
            if s in lower:
                found.append(title)
                break
    return found


def extract_email(text: str) -> str:
    m = re.search(r"[\w\.\-]+@[\w\.\-]+\.\w+", text)
    return m.group(0) if m else ""


def extract_phone(text: str) -> str:
    m = re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", text)
    return m.group(0).strip() if m else ""


def extract_education(text: str) -> List[str]:
    edu = []
    for line in text.split("\n"):
        ll = line.lower()
        if any(kw in ll for kw in ["b.tech", "bachelor", "b.e.", "m.tech",
                                    "master", "mba", "phd", "iit ", "nit ",
                                    "iiit", "university", "college"]):
            edu.append(line.strip())
    return edu[:5]  # top 5


def build_profile(pdf_path: Path) -> Dict[str, Any]:
    """Parse PDF and write resume_profile.json."""
    logger.info(f"Parsing resume: {pdf_path}")
    text = parse_pdf(pdf_path)

    profile = {
        "raw_text_length": len(text),
        "skills":     extract_skills(text),
        "years_exp":  extract_years(text),
        "titles":     extract_titles(text),
        "email":      extract_email(text),
        "phone":      extract_phone(text),
        "education":  extract_education(text),
    }

    PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROFILE_PATH.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    logger.success(
        f"Profile built: {len(profile['skills'])} skills, "
        f"{profile['years_exp']} yrs, titles={profile['titles']}"
    )
    return profile


def load_profile() -> Dict[str, Any]:
    if not PROFILE_PATH.exists():
        return {"skills": [], "years_exp": 0, "titles": []}
    return json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
