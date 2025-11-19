# Phase 9 – Component Harmonization

## Execution Plan

1. **Establish DS2025 component tokens** – normalize buttons, cards, grids, banners, CTA rows, feature blocks, info sections, and forms against the token set defined in `assets/css/base.css`.
2. **Unify button API** – enforce `btn` + `btn--modifier` naming, remove legacy `btn-*` aliases, and ensure header, CTA, and form actions all rely on the same semantic sizing modifiers.
3. **Normalize card structure** – require every card-like element to include the base `card` class plus a `card--{variant}` modifier, and translate nested elements to the shared `card__*` API where applicable.
4. **Align CTA/banners/feature/info layouts** – consolidate section wrappers (`section`, `section--surface`, `section--highlight`) and ensure CTA stacks, partners callouts, and hero banners share identical spacing, grid templates, and icon treatments.
5. **Standardize form components** – introduce `form-field`, `form-control`, and `form-note` conventions so all forms (contact, intake, registration) consume the same primitives while keeping validation hooks intact.
6. **Remove unused/duplicate variants** – drop legacy selectors (`.btn-primary`, `.course-card`, etc.) once HTML adopts the new API, and delete dead CSS blocks left behind by earlier phases.
7. **Document final API** – capture inventories, before/after diffs, and the new naming map in this report to satisfy the Phase 9 output contract.

Component inventory generated via `node scripts/componentInventory.js` is stored in `reports/phase9_component_inventory.json`.
