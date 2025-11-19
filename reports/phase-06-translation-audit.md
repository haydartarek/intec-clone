# Phase 6 · Translation Audit & Coverage

## Objectives
- Build automated visibility into how `assets/js/i18n/{nl,en}.js` map to every public page listed in `Fix.json`.
- Highlight missing translations before they ship and surface the long tail of unused keys for future clean-up.
- Patch the most visible i18n gaps (hero meta data, CTA buttons, stats cards) so both languages stay aligned.

## Tooling
- Added `scripts/auditTranslations.js`, which parses all HTML entry points, inventories every `data-i18n*` attribute, and compares the result with both locale files via a sandboxed `vm` loader.
- Persisted the full findings to `reports/translation-audit.json` (598→603 referenced keys after fixes) so we can diff usage over time without re-running searches manually.
- Exposed the workflow through `npm run translations:audit` for local and CI usage; the command prints a concise summary (missing keys, unused keys, counts) and regenerates the JSON artifact.

## Fixes Delivered
- Wired the final stats card on `index.html` into the translation system using the existing `home.stats.communication*` keys (previously hard-coded Dutch only).
- Activated the secondary partner CTA (`home.partnerCallout.learn`) and pointed it to `contact.html`, reducing unused-key noise while giving EN/NL parity in that hero.
- Added localized meta title/description keys (`partners.meta.*`) plus bindings in `cvdb/index.html`, ensuring the secure partner portal advertises consistent metadata in both languages.

## Verification
```bash
npm run translations:audit
```
- HTML files scanned: 13
- Unique keys referenced: 603
- Missing EN/NL keys: 0 / 0
- Unused keys: 577 / 577 (down from 580 each before the fixes)
- Fresh report: `reports/translation-audit.json`

## Next Steps
1. Integrate the audit command into CI so PRs can’t introduce untranslated keys or regress coverage.
2. Extend the scanner to flag hard-coded text nodes (not only `data-i18n*` attributes) for deeper content parity.
3. Use the JSON report to retire obviously dead keys (e.g., legacy program variants) once stakeholders confirm they’re safe to remove.
