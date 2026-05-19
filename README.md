# INTEC Brussel - Project Handover

Production-ready multilingual static website for INTEC Brussel, focused on training programs, registration flow, vacancies, contact, legal compliance pages, and partner access.

## Document Control

| Field | Value |
|---|---|
| Project | INTEC Brussel |
| Repository Type | Static multi-page frontend |
| Last Updated | May 19, 2026 |
| Prepared By | **Haydar Tarek** |
| LinkedIn | https://www.linkedin.com/in/haydartarek-dev/ |
| Handover Status | Ready for operational takeover and ongoing maintenance |

## Project Snapshot

- Dutch/English public website with shared i18n runtime.
- Shared design system based on CSS tokens (`:root`) and reusable UI components.
- Shared JavaScript runtime for navigation, forms, accordions, countdowns, vacancies, and newsletter.
- Static-hosting friendly with no build step required.

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | `assets/css/base.css`, `assets/css/main.css` |
| Runtime | `assets/js/main.js` |
| Localization | `assets/js/i18n/nl.js`, `assets/js/i18n/en.js` |
| Data | `data/design-tokens.json`, `data/jobs.json` |

## Production Structure

```text
intec_brussel_project/
├─ index.html
├─ opleidingen.html
├─ inschrijven.html
├─ overons.html
├─ wiezijnwe.html
├─ contact.html
├─ digipunt.html
├─ vacatures.html
├─ python.html
├─ support.html
├─ security.html
├─ systeembeheerder.html
├─ privacy.html
├─ terms.html
├─ accessibility.html
├─ cvdb/
│  └─ index.html
├─ assets/
│  ├─ css/
│  │  ├─ base.css
│  │  └─ main.css
│  ├─ js/
│  │  ├─ main.js
│  │  └─ i18n/
│  │     ├─ nl.js
│  │     └─ en.js
│  ├─ img/
│  └─ pdf/
│     └─ jaarverslag-2024.pdf
├─ data/
│  ├─ design-tokens.json
│  └─ jobs.json
├─ robots.txt
├─ sitemap.xml
└─ sw.js
```

## Local Run

Run from project root using any static server.

```bash
python -m http.server 5500
```

Alternative options:

1. VS Code Live Server
2. `npx serve .`

Open:

```text
http://127.0.0.1:5500/
```

## Deployment Notes

- Deploy repository root as static hosting output.
- Keep relative paths unchanged.
- Keep filename casing unchanged (Linux hosting is case-sensitive).
- Use HTTPS in production for service worker registration behavior.

## SEO and Runtime Surface

- `robots.txt` and `sitemap.xml` are part of production runtime.
- Canonical, Open Graph, and Twitter metadata are implemented across pages.
- `sw.js` is registered by runtime only on HTTPS.

## Frontend Runtime Contracts

- Language contract:
  - Default dictionary from `assets/js/i18n/nl.js`.
  - English dictionary loaded on demand by `assets/js/main.js`.
- Vacancies contract:
  - Data source: `data/jobs.json`.
- Design token contract:
  - Data source: `data/design-tokens.json`.
- Countdown contract:
  - HTML placeholders with shared JS rendering logic.
- Newsletter contract:
  - Shared submit logic from `NewsletterValidation` in `assets/js/main.js`.

## Newsletter Integration (Supabase)

Storage target:

- `public.newsletter_subscribers`

Required columns:

- `email` (`text`, unique)
- `source_page` (`text`)
- `language` (`text`)
- `subscribed_at` (`timestamptz`)

Runtime config (from `INTEC.config` in `assets/js/main.js`):

- `newsletterSupabaseUrl`
- `newsletterSupabaseAnonKey`
- `newsletterSupabaseTable`

Alternative runtime globals (before `main.js`):

- `window.INTEC_SUPABASE_URL`
- `window.INTEC_SUPABASE_ANON_KEY`
- `window.INTEC_SUPABASE_TABLE`

Verification checklist:

1. Submit a valid email from a footer newsletter form.
2. Confirm network `POST` to `/rest/v1/newsletter_subscribers`.
3. Confirm inserted row in Supabase Table Editor.

## Intake Registration Integration (Supabase RPC)

Storage target:

- `public.intake_registrations`

Submission endpoint:

- `/rest/v1/rpc/submit_intake_registration`

Why RPC (not direct table insert):

- Server-side validation is enforced in Postgres function logic.
- Duplicate prevention is handled server-side (same email + course within 15 minutes).
- RLS stays strict on table access while allowing controlled insert flow.

Runtime config (from `INTEC.config` in `assets/js/main.js`):

- `registrationSupabaseUrl`
- `registrationSupabaseAnonKey`
- `registrationSupabaseRpc`

Optional runtime globals (before `main.js`):

- `window.INTEC_REGISTRATION_SUPABASE_URL`
- `window.INTEC_REGISTRATION_SUPABASE_ANON_KEY`
- `window.INTEC_REGISTRATION_SUPABASE_RPC`

Verification checklist:

1. Submit the intake form on `inschrijven.html`.
2. Confirm network `POST` to `/rest/v1/rpc/submit_intake_registration`.
3. Confirm JSON status response: `created`, `duplicate`, or `invalid`.
4. Confirm inserted row in `public.intake_registrations` when status is `created`.

## Feature Log

### `feat(newsletter): integrate Supabase newsletter subscribers storage`

- Added Supabase newsletter integration.
- Created support for `newsletter_subscribers` table.
- Added runtime config support:
  - `newsletterSupabaseUrl`
  - `newsletterSupabaseAnonKey`
  - `newsletterSupabaseTable`
- Added fallback `window` globals support.
- Implemented newsletter form submission via Supabase REST API.
- Added `source_page` and `language` tracking.
- Added duplicate email handling.
- Added subscription timestamp support.
- Verified `POST` requests to `/rest/v1/newsletter_subscribers`.
- Confirmed inserts inside Supabase Table Editor.

## Static Hosting Reliability (405 Fix)

Issue addressed:

- `405 Not Allowed` on static hosts when form submitted before JS handlers were attached.

Hardening applied:

- All newsletter forms use `action="" method="get"` in HTML.
- `NewsletterValidation.init()` executes in the early initialization path.
- Runtime enforces safe attributes (`method=get`, `action=""`) before binding submit handlers.

Result:

- No direct `POST` form submission to static page routes.
- Newsletter flow remains on JS + Supabase path.

## Supabase MCP Setup (Codex)

If `codex` is not recognized in PowerShell:

```powershell
$codex = "$env:LOCALAPPDATA\OpenAI\Codex\bin\codex.exe"
& $codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=cdupvdbgvjluexrodaho"
& $codex mcp login supabase
& $codex mcp list
```

Expected:

- `supabase` -> `Status: enabled`, `Auth: OAuth`

## Performance Notes

- Hero and major visual assets were optimized and normalized for delivery.
- Non-critical runtime modules are deferred after critical initialization.
- Image loading strategy is split between critical above-the-fold and lazy below-the-fold content.

## Browser Support

Validated target browsers:

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)

## Playwright QA Validation

Local setup used for automated QA:

```bash
npm init -y
npm install -D playwright
npx playwright install chromium
```

Full QA suites executed (latest run):

- `smoke-matrix` (16 pages × 3 breakpoints = 48 checks)
- `language-persistence` (NL/EN switch and reload persistence)
- `mobile-nav` (open/close/escape state behavior)
- `partner-carousel` (next/transform movement)
- `intake-accordion` (toggle stability)
- `registration-form` (invalid/created/duplicate flows)
- `contact-form` (invalid + RPC created + Gmail compose popup)
- `newsletter-form` (invalid + submit status + endpoint response)
- `vacancies` (listing + detail + apply link)

Final QA result:

- Total suites: `9`
- Passed suites: `9`
- Failed suites: `0`
- Console/runtime regressions in matrix: `0`
- Horizontal overflow regressions in matrix: `0`

Confirmed backend/runtime outcomes:

- Registration RPC: `/rest/v1/rpc/submit_intake_registration` -> `{"status":"created"}` and `{"status":"duplicate"}`
- Contact RPC: `/rest/v1/rpc/submit_contact_message` -> `{"status":"created"}`
- Contact flow opens Gmail compose draft to configured inbox (`heydertarek2000@gmail.com`)
- Newsletter flow responds through Supabase path with visible UI status

Defect discovered and fixed during QA:

- Root cause: form pattern validation was sanitizing all input values before regex checks, which could create false failures for non-numeric fields.
- Fix: numeric sanitization is now applied only to numeric-rule fields in `assets/js/main.js`, while text/email fields are validated on their original trimmed value.

## Maintenance Guidelines

- Reuse existing design tokens and avoid hardcoded visual values when a token exists.
- Keep NL/EN dictionaries synchronized for any new UI copy.
- Verify references before removing assets, classes, selectors, or scripts.
- Re-check responsive behavior after major layout edits.
- Keep `robots.txt` and `sitemap.xml` aligned with live URLs.
- Rule: **Outbound email links must be webmail URLs, not mailto**.

## Post-Deploy Validation Checklist

1. Hard refresh once (`Ctrl+F5`) after deployment.
2. Open contact page and submit footer newsletter form.
3. Confirm no `405 Not Allowed` appears in browser.
4. Confirm success status text appears in UI.
5. Confirm inserted row in `newsletter_subscribers`.

## Handover Sign-Off

- Handover owner: **Haydar Tarek**
- Role: Senior Full-Stack Developer / Frontend Architect / QA
- Contact: https://www.linkedin.com/in/haydartarek-dev/
- Status: Project is production-clean and ready for operational maintenance.
