"""Regression: known_domain() must NOT fuzzy-match wrong companies."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from core.email_finder import known_domain  # noqa: E402

CASES = [
    # (company,           expected_domain or None)
    ("Talabat",           "talabat.com"),
    ("Talabat Middle East","talabat.com"),
    ("Noon",              "noon.com"),
    ("Snoonu",            None),                # was wrongly noon.com
    ("Snoonu Q.P.S.C.",   None),
    ("Mashreq Bank",      "mashreqbank.com"),
    ("Mashreq",           "mashreqbank.com"),
    ("Honeywell",         None),                # was wrongly ey.com
    ("Sapient",           None),                # was wrongly sap.com
    ("Dubai Holding",     None),                # was wrongly du.ae
    ("DU Telecom",        "du.ae"),
    ("EY MENA",           "ey.com"),
    ("Bayan Pay",         None),
    ("Emirates NBD",      "emiratesnbd.com"),
    ("First Abu Dhabi Bank","bankfab.com"),
    ("FAB",               "bankfab.com"),
    ("Fabric Studios",    None),
    ("Etisalat e&",       "etisalat.ae"),
]

def main() -> int:
    ok = 0
    fail = 0
    for company, expected in CASES:
        got = known_domain(company)
        passed = got == expected
        marker = "PASS" if passed else "FAIL"
        print(f"  {marker}  known_domain({company!r:30s}) -> {got!s:24s}  expected={expected!s}")
        if passed:
            ok += 1
        else:
            fail += 1
    print(f"\n{ok}/{ok+fail} passed")
    return 0 if fail == 0 else 1

if __name__ == "__main__":
    raise SystemExit(main())
