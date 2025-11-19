# INTEC Clone – Design Token Workflow

Phase 3 introduces automation around the design-token system so CSS changes stay aligned with the canonical palette in `assets/css/base.css`.

## Commands

```bash
npm run tokens:extract
```
> Parses `:root` in `assets/css/base.css` and emits `data/design-tokens.json` with every custom property plus metadata (generation timestamp + source file).

```bash
npm run tokens:lint
```
> Scans the hand-authored CSS files (`assets/css/main.css`, `assets/css/components.css`, `assets/css/static.css`) and fails if:
> - A literal hex color slips into those files.
> - A `var(--token)` reference does not exist in the generated manifest.

Run the extract step whenever `base.css` changes so the manifest stays fresh, and add the lint to your CI to block regressions.

## Using tokens inside JavaScript (Phase 4)

`assets/js/main.js` now exposes a lightweight bridge for runtime access to CSS variables:

```javascript
// Retrieve the computed value of a custom property
const primary = window.INTEC.tokens.get('--color-primary');

// Access raw manifest entries (straight from data/design-tokens.json)
const raw = window.INTEC.tokens.raw('color-primary');

// React when the JSON manifest finishes loading
window.INTEC.tokens.ready().then((manifest) => {
	console.log('Tokens available', manifest.tokens);
});
```

The bridge automatically figures out the correct path to `data/design-tokens.json`, falls back to computed styles if the fetch fails (e.g., when previewing from the filesystem), and caches lookups for stability.
