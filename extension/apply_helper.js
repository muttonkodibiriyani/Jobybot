// Jobybot Apply Helper — bookmarklet / content-script.
// SAFE: runs in your browser, fills visible form fields, you click Submit.
// Used by docs/BOOKMARKLET.md and extension/manifest.json (MV3).
(function () {
  const PROFILE = {
    firstName: "Tharakeswara",
    lastName: "Reddy",
    fullName: "Tharakeswara Reddy",
    email: "your-email@gmail.com",
    phone: "+971-XXXXXXXXX",
    countryCode: "+971",
    city: "Dubai",
    country: "United Arab Emirates",
    linkedin: "https://www.linkedin.com/in/your-handle",
    portfolio: "",
    resumeUrl: "https://example.com/your-resume.pdf",
    yearsExperience: "10",
    currentCompany: "Available on request",
    currentTitle: "Senior Product Manager",
    visaStatus: "Authorized to work",
    coverLetter:
      "Hi — applying for this role. My resume covers the relevant " +
      "experience; happy to discuss specifics on a quick call.",
  };

  // Field-key → profile-value map (case-insensitive, partial-match)
  const MAP = [
    [/first\s*name|firstname|fname/i, PROFILE.firstName],
    [/last\s*name|lastname|surname|lname/i, PROFILE.lastName],
    [/full\s*name|^name$|your\s*name|applicant.*name/i, PROFILE.fullName],
    [/e[-_ ]?mail/i, PROFILE.email],
    [/phone|mobile|contact[-_ ]?number/i, PROFILE.phone],
    [/country[-_ ]?code/i, PROFILE.countryCode],
    [/city|town/i, PROFILE.city],
    [/country$/i, PROFILE.country],
    [/linkedin/i, PROFILE.linkedin],
    [/portfolio|website|github/i, PROFILE.portfolio],
    [/resume|cv\b|attachment/i, PROFILE.resumeUrl],
    [/years.*exp|experience.*year/i, PROFILE.yearsExperience],
    [/current.*company|present.*employer/i, PROFILE.currentCompany],
    [/current.*title|job\s*title/i, PROFILE.currentTitle],
    [/visa|work\s*authorization|sponsor/i, PROFILE.visaStatus],
    [/cover|message|why.*role|tell.*about/i, PROFILE.coverLetter],
  ];

  function pickValue(el) {
    const text = [
      el.name, el.id, el.placeholder, el.getAttribute("aria-label"),
      (el.labels && el.labels[0] && el.labels[0].innerText) || "",
    ].join(" ").toLowerCase();
    for (const [re, val] of MAP) if (re.test(text) && val) return val;
    return null;
  }

  function setValue(el, val) {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter && setter.set) setter.set.call(el, val);
    else el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.style.outline = "2px solid #FF6B00";
    setTimeout(() => (el.style.outline = ""), 1500);
  }

  let filled = 0;
  document
    .querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea")
    .forEach((el) => {
      if (el.disabled || el.readOnly) return;
      const v = pickValue(el);
      if (v && !el.value) {
        setValue(el, v);
        filled++;
      }
    });

  const banner = document.createElement("div");
  banner.textContent = `Jobybot: filled ${filled} field(s). Review and click Submit.`;
  banner.style.cssText =
    "position:fixed;bottom:20px;right:20px;background:#0B0B0B;color:#fff;" +
    "padding:12px 18px;border-radius:10px;font:600 14px -apple-system,Segoe UI;" +
    "z-index:2147483647;box-shadow:0 8px 24px rgba(0,0,0,.3)";
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4500);
})();
