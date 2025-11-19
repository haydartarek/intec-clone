# Phase 13 – CSS Audit Summary

## Scope
- Files reviewed: `assets/css/base.css`, `assets/css/main.css`.
- Components verified across HTML pages: shared navigation/header buttons, hero CTAs, enrollment/digipunt/about call-to-actions, course cards, partner CTA grids.

## Selector Inventory & Actions
| Selector / Utility | HTML Usage | Action |
| --- | --- | --- |
| `.btn--secondary` | 0 references across 13 HTML files | Removed from CSS and scripts to prevent dead weight. |
| `.btn--ghost` | 0 references | Removed (legacy Phase 8 artifact). |
| `.btn--outline`, `.btn--primary` overrides in `main.css` | Global (duplicated definitions) | Consolidated into token-driven definitions in `base.css`. |
| `.collaboration-cta__actions .btn--secondary` | Depended on removed class | Scope reduced to `.btn` only. |

## Token Rationalization
- Introduced per-button CSS variables (`--btn-bg`, `--btn-color`, `--btn-hover-shadow`, etc.) so every variant inherits DS2025 tokens without repeating property blocks.
- Primary buttons now read from the root gradients (`--gradient-accent`, `--gradient-accent-reverse`) and shared elevation tokens (`--shadow-button`, `--shadow-button-hover`).
- Outline/soft variants now specify only token overrides (color, border, hover background) instead of redefining layout properties.

## Duplication / Legacy Removal
- Deleted redundant blocks in `assets/css/main.css` for `.btn--primary`, `.btn--outline`, and `.btn--secondary` that previously duplicated `base.css` declarations.
- Updated `scripts/phase9_updateButtons.js` to avoid inserting the retired `.btn--secondary` class during future migrations.

## Integrity & Regression Checks
- CSS brace validation (Node script) executed for both `base.css` and `main.css`; no structural errors detected.
- Visual parity confirmed by spot-checking hero CTAs, card buttons, and Digipunt/partner CTAs – all continue to use the unified DS2025 button tokens with identical gradients, radii, and hover states.

## Next Steps
- Future button variants should extend the token hooks instead of adding standalone property blocks.
- Any reintroduction of deprecated classes (`btn--secondary`, `btn--ghost`) should be avoided unless new DS2025 specs justify them.
