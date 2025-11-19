# Technical SEO Report — Phase 17

_Date:_ 18 November 2025  
_Author:_ Phase 17 automation (scripts in `scripts/`)

## 1. Sitemap & Robots Integrity
- Generated `sitemap.xml` covering 12 public marketing pages + new `privacy.html`. Priorities and changefreq values follow Google guidelines (home = 1.0 daily, long-tail pages = 0.4–0.9 monthly/yearly).  
- Created `robots.txt` allowing public crawl, blocking `assets/js/i18n/*backup*`, `scripts/`, and `tmp/`. Added absolute sitemap hint.
- Canonical audit (`grep canonical`) confirmed every page points at `https://www.intecbrussel.be/...` and new `privacy.html` is included.

## 2. Indexation Controls
- Added `<meta name="robots" content="noindex, nofollow">` to `cvdb/index.html` (partner portal). All other pages are indexable (verified via `grep noindex`).  
- Created `privacy.html` so every GDPR reference now resolves internally; all footer/privacy links converted to relative paths via `scripts/fixPrivacyLinks.js`.

## 3. Link Health Audit
- Implemented `scripts/linkAudit.js` (Cheerio-based). Latest run (`node scripts/linkAudit.js`) scans 14 HTML files, validates anchors, and permits static assets (PDF, etc.).  
- Output: `link-audit-report.json` — summary shows `brokenLinks: 0`, `missingAnchors: 0`, `uncheckedExternalLinks: 65` (external URLs flagged for manual monitoring).  
- Added FAQ anchor (`#faq`) and resolved the `/privacy` dead link by shipping the dedicated page.

## 4. Schema Markup
- Embedded JSON-LD on `index.html` for both `Organization` + `WebSite` (with `SearchAction`).  
- Added BreadcrumbList schema to `python.html`, `security.html`, `support.html`, and `systeembeheerder.html`.  
- Stored reference copies inside `reports/schema/` for documentation:
  - `homepage.jsonld`
  - `breadcrumb-python.jsonld`
  - `breadcrumb-security.jsonld`
  - `breadcrumb-support.jsonld`
  - `breadcrumb-sysadmin.jsonld`

## 5. Performance & LCP Enhancements
- Header logos normalized via `scripts/fixHeaderLogo.js` to enforce `data-critical`, `loading="eager"`, `fetchpriority="high"`, and `decoding="async"`.  
- Added `data-critical="true"` to all hero images so they retain `fetchpriority="high"` while secondary imagery now defaults to `loading="lazy"`.  
- Created `scripts/auditImages.js` to track lazy-loading compliance; final run outputs `reports/image-performance-report.json` with `issues: 0` (proof that all non-critical images lazy-load and critical ones include fetch priority).

## 6. Content Additions
- Inserted FAQ section (with NL/EN i18n strings) to satisfy footer anchor usage and improve DS2025 heading logic.  
- Added full `privacy.html` with bilingual-ready content, canonical metadata, and accessible layout.

## 7. Deliverables Summary
- `sitemap.xml`
- `robots.txt`
- `privacy.html`
- `link-audit-report.json`
- `reports/schema/*.jsonld`
- `reports/image-performance-report.json`
- `reports/technical-seo-report.md` (this document)

## 8. Recommendations / Next Steps
1. Hook the `SearchAction` endpoint (`?search=`) to an actual on-site search or filtering experience to fully leverage the structured data declaration.
2. Monitor external social/video links called out in `link-audit-report.json` during the next quarterly review.
3. Consider mirroring the Organization JSON-LD on secondary landing pages if future analytics call for it (currently centralized on the homepage).
