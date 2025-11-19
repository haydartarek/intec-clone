# Phase 2 · Token Unification

## Objectives
- Extend the `:root` palette so every recurring shade/gradient has a canonical token.
- Replace literal color/gradient values across `assets/css/main.css` with the new tokens without changing visual intent.
- Remove redundant `var()` fallbacks now that tokens are authoritative.
- Backfill documentation + verification so future phases can rely on a stable design system.

## Token Additions & Adjustments (`assets/css/base.css`)
- Added missing semantic text tiers (`--color-text-label`, `--color-text-meta`, `--color-text-intro`, etc.) so typography variants no longer reach for ad-hoc hex codes.
- Introduced accent families for warm/emerald/dusk shades plus mint + lilac surface ramps; cards, CTA bands, and hero sections now share these primitives.
- Captured state palettes for success/warning/danger, including `--color-danger-soft-bg` for error emphasis blocks.
- Centralized gradient aliases (`--gradient-hero`, `--gradient-cta`, `--gradient-accent`, etc.) so section backdrops are token-driven.
- Expanded glass/shadow/radius tokens to align hover/focus treatments across components.

## Refactor Scope (`assets/css/main.css`)
- Hero, CTA, placeholder, course, and footer sections now reference the gradient + text tokens; literal `linear-gradient(#fff…)` declarations were removed.
- Card ecosystems (about, benefit, feature, course, program) consume the new text/neutral tokens for headings, body copy, and borders.
- Buttons, nav, and language switcher now rely on the canonical accent tokens for hover/active/focus styles; redundant `var(--color-*, #fallback)` forms were simplified.
- Data-driven modules (vacature placeholder, trust badges, status pills) received semantic tokens for error/muted states, plus restored iconography after the bulk replacement pass.
- Emoji/bullet pseudo-elements were reintroduced intentionally (default ASCII rule honored elsewhere) to keep previously shipped visual cues.

## Verification
- `rg "#[0-9a-fA-F]{3,6}" assets/css/main.css` → **no matches** (literal hex values fully removed).
- Spot-checked hero/CTA/card sections in-browser to confirm gradients, badges, and icon bullets render with the intended tokens.
- Ensured new tokens are declared once in `base.css`; no duplicate definitions exist across other stylesheets.

## Outstanding / Next Steps
1. Extend the audit to auxiliary styles (`assets/css/components.css`, etc.) so Phase 2 coverage spans the entire CSS stack.
2. Consider extracting token documentation into a JSON manifest for automated checks (future Phase 3 candidate).
3. Add regression tests (visual diff or lint rule) to prevent reintroduction of literal hex/rgba values outside `:root`.
