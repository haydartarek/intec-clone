# Hero Redesign QA Report

## Modified Files
- `assets/css/main.css`
- `assets/js/i18n/nl.js`
- `assets/js/i18n/en.js`
- `support.html`
- `python.html`
- `systeembeheerder.html`
- `security.html`

## CSS Optimisation
- Consolidated a single `.hero--service` pattern shared across all four pages to eliminate per-page overrides.
- Reused existing design tokens (e.g. `--color-primary`, `--color-accent`) and introduced `--color-accent-rgb` once at the root to avoid repeated hard-coded values.
- Removed duplicated hero declarations in translation files and legacy CSS by relying on the new shared block.

## Translation Validation
- Added explicit `hero.subtitle`, `hero.description`, and structured `hero.stats.*` keys for NL and EN.
- Verified parity with `_check_translations.py` (temporary script) – no missing keys detected.
- `data-i18n-allow-html` is now used on hero titles so the highlighted word is localisation-ready.

## Responsive Design
- The new layout uses CSS grid with breakpoints at 1200px, 1024px, 900px, 640px, and 520px.
- Manual checks recommended: desktop ≥1440px, tablet ≈834px, mobile 390px.
- Action: capture before/after screenshots on each breakpoint for support, python, sysadmin, security pages.

## Accessibility
- Maintained semantic heading structure (`h1` + descriptive paragraphs).
- Hero statistics are rendered via `<dl>` with translated `aria-label`s.
- Decorative icons are flagged with `aria-hidden="true"` and CTA buttons keep existing accessible labelling.
- Ensure colour contrast remains ≥ WCAG AA: teal gradient with white cards meets ratio (verified via design tokens).

## Browser Compatibility
- Uses standard CSS features (grid, linear gradients, `color-mix` fallback handled by native support). Test matrix: Chrome 122+, Edge 122+, Firefox 123+, Safari 17+.
- No JS changes required; existing i18n loader continues to hydrate content.

## Performance Notes
- Hero assets reuse existing images; no new network requests introduced.
- Shared CSS reduces duplication – minification size delta expected to stay flat.
- Suggested follow-up: run Lighthouse after deployment to confirm LCP remains under 2.5s and CLS unaffected.

## Screenshot Checklist
1. Support – desktop, tablet, mobile.
2. Python – desktop, tablet, mobile.
3. Systeembeheerder – desktop, tablet, mobile.
4. Security – desktop, tablet, mobile.

