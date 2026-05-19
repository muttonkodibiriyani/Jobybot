# One-click apply (bookmarklet + browser extension)

Two safe ways to pre-fill any job application form in your browser. You stay
in control: Jobybot fills the visible fields, you review, you click Submit.

## Option A — Browser bookmarklet (works in any browser, no install)

1. Edit `extension/apply_helper.js` — set `PROFILE` to your real details.
2. Run once to produce a single-line bookmarklet:
   ```powershell
   .\.venv\Scripts\python.exe scripts\build_bookmarklet.py
   ```
   It writes `data/bookmarklet.txt` — copy the whole `javascript:` URL.
3. In Chrome / Edge / Firefox: Bookmarks → Add → paste the URL as the address,
   call it "Jobybot Fill".
4. Open any LinkedIn Easy Apply / Indeed / Bayt / Workday / Greenhouse /
   Lever apply page, click the bookmark. Orange-outlined fields = filled.
5. Review, fix anything you want changed, click Submit.

## Option B — Chrome / Edge extension (one click toolbar button)

The folder `extension/` is a complete Manifest V3 extension.

1. Edit `extension/apply_helper.js` and set your `PROFILE`.
2. Chrome → `chrome://extensions` → toggle **Developer mode** on (top right) →
   **Load unpacked** → choose the `extension/` folder.
3. Pin the **Jobybot Apply Helper** icon to the toolbar.
4. On any job application page, click the icon. Done.

Edge users: `edge://extensions` → same steps.

## What gets filled (auto-detected)
First name, last name, full name, email, phone, country code, city, country,
LinkedIn URL, portfolio, resume URL, years of experience, current company,
current title, visa status, cover letter / "Why this role" textarea.

## What's intentionally NOT auto-clicked
The **Submit** button. Always. This keeps you on the right side of every
platform's ToS, keeps your LinkedIn account safe, and gives you a moment
to spot the occasional weird field that needs a custom answer.
