"""Cover letter generator: 5 variants, personalised via Jinja2."""
from __future__ import annotations

import random
from pathlib import Path
from typing import Dict

from jinja2 import Template

# Inline templates as fallback if files are missing
INLINE = {
    "Recruiter": """\
Dear Recruiter,

I am writing to introduce myself and express interest in any roles you may be
sourcing — particularly Product Manager, Data Product Manager, AI Product
Manager, or Senior Business Analyst positions.

{{ summary }}

Key credentials:
• Currently {{ location }}, {{ visa }}, {{ notice }} notice
• Open to roles in UAE, Singapore, Germany, Netherlands, Ireland and Canada
• CV attached

Would welcome a brief intro call at your convenience.

Best regards,
{{ name }}
{{ email }} | {{ phone }}
{{ linkedin }}""",

    "Employer": """\
Dear {{ company }} Talent Team,

I would like to express interest in product, data, or digital roles at
{{ company }}.

{{ summary }}

Key strengths:
• End-to-end product ownership (discovery → delivery → scale)
• Stakeholder management at C-suite level
• {{ location }}, {{ visa }}, {{ notice }} notice
• CV attached

Happy to follow up with a brief intro call.

Best regards,
{{ name }}
{{ email }} | {{ phone }}
{{ linkedin }}""",

    "Consulting": """\
Dear Talent Acquisition Team,

Writing to express interest in Product Management, Data, or Digital
Transformation roles at {{ company }}.

{{ summary }}

Profile:
• {{ years }}+ years experience, prior consulting exposure welcome
• Open to Consultant / Manager / Senior Manager / Principal levels
• {{ location }}, {{ visa }}, {{ notice }} notice
• CV attached

Would welcome a conversation.

Best regards,
{{ name }}
{{ email }} | {{ phone }}
{{ linkedin }}""",

    "Tech": """\
Dear {{ company }} Talent Team,

I'm interested in Product Manager, Data PM, or AI PM roles at {{ company }}.

{{ summary }}

Strong technical foundation with proven delivery on data products, AI agents,
and digital transformation.

{{ location }} | {{ visa }} | {{ notice }} notice.
CV attached.

Best regards,
{{ name }}
{{ email }} | {{ phone }}
{{ linkedin }}""",

    "Retail": """\
Dear {{ company }} Careers Team,

Reaching out regarding Product Manager, Data PM, or Digital Transformation
roles at {{ company }}.

{{ summary }}

Deep retail/loyalty/e-commerce domain knowledge.

{{ location }} | {{ visa }} | {{ notice }} notice.
CV attached.

Best regards,
{{ name }}
{{ email }} | {{ phone }}
{{ linkedin }}""",

    "Followup": """\
Hi,

Following up on my email from {{ days }} days ago regarding product / data /
digital roles. Sharing my CV again in case the original went to spam.

{{ summary }}

Still open to opportunities and would welcome a brief chat at your
convenience.

Best regards,
{{ name }}
{{ email }} | {{ phone }}""",
}


def render(category: str, context: Dict[str, str]) -> str:
    """Render a cover letter for the given category."""
    tpl_dir = Path(__file__).parent.parent / "templates"
    fname = f"cover_{category.lower()}.txt"
    fpath = tpl_dir / fname

    if fpath.exists():
        tpl_str = fpath.read_text(encoding="utf-8")
    else:
        tpl_str = INLINE.get(category, INLINE["Employer"])

    return Template(tpl_str).render(**context)


def subject_for(category: str, name: str, years: int) -> str:
    """Build email subject."""
    role = (
        "Senior PM / BA / Data Lead"
        if category in ("Recruiter", "Consulting")
        else "Product / Data / AI Roles"
    )
    return f"{role} | {name} | {years}yrs | Azure Cert | Dubai"
