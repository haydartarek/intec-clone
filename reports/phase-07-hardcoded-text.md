# Phase 7 - Hard-Coded Text Detection

## Objectives
- Extend the translation audit so it surfaces visible copy that is still hard-coded in HTML instead of going through `data-i18n*` bindings.
- Provide actionable metadata (file, element context, text snippet) that helps triage what needs to be translated next.
- Keep the workflow aligned with `npm run translations:audit` so developers and CI can rely on a single command for coverage plus hard-coded text detection.

## Implementation
- Augmented `scripts/auditTranslations.js` with a DOM text scanner that walks every HTML entry point, skips script/style/template tags, and flags text nodes containing natural-language words when they are not within an element that has a `data-i18n*` attribute.
- Added helper utilities to normalize whitespace, recognize i18n ancestors, and store per-file findings (with a capped sample list of 50 entries per file so the report stays readable).
- Emitted the new data into `reports/translation-audit.json` under `stats.hardCoded*` and a `hardCodedText` object that includes counts plus contextual samples for each HTML file.
- Updated the CLI summary to print the total number of hard-coded nodes and the top offending files so the issue is visible even without opening the JSON artifact.

## Findings Snapshot
- **321** hard-coded text nodes detected across **13/13** tracked HTML entry points.
- Course detail pages dominate the findings: `python.html` (91 nodes), `security.html` (86), and `systeembeheerder.html` (86) still render most copy directly in Dutch.
- Smaller but still notable items include metadata titles (`index.html`, `inschrijven.html`, `overons.html`), gender labels on `inschrijven.html`, and repeated footer signatures ("INTEC Brussel."). These give us a concrete backlog for wiring to existing or new keys.
- Email addresses and brand mentions currently show up as hard-coded text; we can decide later whether to treat them as acceptable constants or move them into the locale files for consistency.

## Verification
```bash
npm run translations:audit
```
- HTML files checked: 13
- Missing keys (EN/NL): 0 / 0
- Unused keys (EN/NL): 577 / 577 (unchanged from Phase 6)
- Hard-coded text nodes: 321 across 13 files (top: `python.html`, `security.html`, `systeembeheerder.html`)
- Updated artifact: `reports/translation-audit.json`

## Next Steps
1. Triage the `hardCodedText` section to group related content (course intros, CTA blocks, meta tags) and wire them to the existing localization pattern.
2. Add a small allowlist/ignore mechanism for constants such as `info@intecbrussel.be` if we decide they do not need translation but should stay quiet in the report.
3. Once the largest offenders are migrated to i18n, re-run the audit and use the declining `hardCodedTextNodes` metric as the KPI for Phase 8.
