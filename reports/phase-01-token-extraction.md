# Phase 1 · Token Extraction

## Structural Analysis
- Base token source: `assets/css/base.css` defines 70+ color variables, responsive typography scale, space/spacing aliases, radii, glassmorphism variables, borders, and transitions. These already cover most primitive needs but are not yet enforced globally.
- Secondary stylesheets (`assets/css/main.css`, others) frequently bypass these tokens, hard-coding accent colors (#0f828a, #25bdb7), surface fills (#ffffff/#f8fcfc), and typography overrides, creating silent drift from the Design System source of truth.
- Component classes (hero, header, cards, forms, benefits) share repeated visual patterns (gradients, accent borders, card chrome) that could resolve to existing tokens (`--color-primary`, `--shadow-card`, `--radius-lg`) once unified references are in place.
- Token categories missing coverage: semantic neutrals (gray ramps for backgrounds/borders), extended gradients, state overlays, and measurement tokens for component heights (header, nav, hero). These gaps explain current hard-coded literals in `main.css`.

## Token Inventory (Authoritative in `assets/css/base.css`)

### Colors & Semantic State
| Token | Value |
| --- | --- |
| `--color-primary` | `#0f828a` |
| `--color-primary-dark` | `#0b5c61` |
| `--color-primary-soft` | `rgba(15, 130, 138, 0.08)` |
| `--color-accent` | `#25bdb7` |
| `--color-accent-soft` | `#e8f9f8` |
| `--color-aqua-soft` | `#f0fbfb` |
| `--color-text` | `#0d2e30` |
| `--color-text-muted` | `#2d5456` |
| `--color-text-light` | `#4a6b6d` |
| `--color-text-invert` | `#ffffff` |
| `--color-heading` | `#0a2628` |
| `--color-text-alt` | `rgba(13, 46, 48, 0.82)` |
| `--color-text-blue` | `#0f5f63` |
| `--color-text-gray` | `#5f7582` |
| `--color-text-teal` | `#0f999f` |
| `--color-bg` | `#f8fcfc` |
| `--color-bg-white` | `#ffffff` |
| `--color-bg-alt` | `#f4fafa` |
| `--color-surface` | `#ffffff` |
| `--color-surface-alt` | `#f6fbfb` |
| `--color-border` | `#cfe3e2` |
| `--color-border-strong` | `#b0d1cf` |
| `--color-success` | `#16a34a` |
| `--color-warning` | `#d88c00` |
| `--color-info` | `#0077b6` |
| `--color-error` | `#dc2626` |
| `--color-danger` | `#d63d50` |
| `--color-footer-bg` | `#06262b` |
| `--color-footer-bg-bottom` | `#04161a` |
| `--color-footer-text` | `rgba(255, 255, 255, 0.9)` |
| Glass tokens | `--color-glass-*`, `--glass-shadow`, etc. |
| Gradient tokens | `--gradient-shell`, `--hero-accent-line` |

### Typography & Scale
| Token | Value |
| --- | --- |
| `--font-sans` | `"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif` |
| Text scale | `--text-hero`, `--text-h1` … `--text-body-sm`, `--text-label`, `--text-3xl`, `--text-stats` |
| Font weights | `--weight-regular`, `--weight-medium`, `--weight-semibold`, `--weight-bold` |
| Line heights | `--leading-tight`, `--leading-snug`, `--leading-normal`, `--leading-relaxed` |

### Spacing & Layout
| Token | Value |
| --- | --- |
| Core spacing | `--space-xs` … `--space-4xl` |
| Section spacing | `--space-section`, `--space-section-tight`, `--space-section-compact`, `--space-section-about` |
| Card spacing | `--space-card`, `--card-padding`, `--card-gap` |
| Gaps | `--gap-sm`, `--gap-md`, `--gap-lg`, `--gap-cards`, `--gap-elements` |
| Container | `--space-container`, `--container-max-width`, `--max-width` |

### Radius, Shadow, Motion
| Token | Value |
| --- | --- |
| Radii | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`, `--card-border-radius` |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-card`, `--shadow-hover`, `--shadow-card-hover`, `--shadow-button`, `--shadow-button-hover`, `--shadow-glass` |
| Transitions | `--transition-fast`, `--transition-base`, `--transition-slow`, `--transition-colors`, `--transition-card` |

### Component / System Tokens
| Token | Purpose |
| --- | --- |
| `--touch-target-min` | Minimum hit area |
| `--lang-pill-size`, `--lang-gap`, `--lang-padding` | Language switcher control |
| `--icon-size-sm`, `--icon-size-md`, `--icon-size-lg` | Icon sizing |
| `--carousel-*` | Carousel controls |
| `--card-header-height` | Card layout |
| `--blur-glass`, `--glass-border` | Glassmorphism stack |

## Non-tokenized / Hard-coded Values to Capture Next
| Raw Value | Usage Hotspot | Recommended Token |
| --- | --- | --- |
| `#0f828a` | Hero eyebrow, buttons, cards, nav toggle (main.css) | Alias to `--color-primary` |
| `#25bdb7` | Gradients, buttons, CTA bars | Alias to `--color-accent` |
| `#ffffff` / `#fff` | Card backgrounds, nav overlays, forms | Use `--color-bg-white` / `--color-surface` |
| `#f8fcfc` / `#f4fffe` | Section backgrounds, placeholders | Map to `--color-bg`, create `--color-bg-highlight` |
| `#0b2f32` | Body text overrides, forms | Map to `--color-heading` or define `--color-text-strong` |
| `#2b4446`, `#345454` | Paragraph accents, placeholders | Define `--color-text-alt-2` |
| `#eee` | Nav link separators | Define `--color-border-light` |
| `rgba(0,0,0,.05-.25)` | Shadows and borders in `main.css` | Map to `--shadow-*` tokens |
| Gradients `linear-gradient(135deg, #f4fffe 0%, #ffffff 100%)` etc. | Vacatures placeholder, CTA backgrounds | Define gradient tokens (`--gradient-cta`, `--gradient-hero`) |
| `color-mix(in oklab, var(--color-primary) 80%, #0b2f32)` | Button hover mixing raw literal | Introduce semantic hover tokens |

## Next-Step Readiness
- Token manifest above will feed Phase 2 (Token Unification) to replace literal values in `assets/css/main.css` and component blocks with the canonical variables.
- Hard-coded palette hotspots (Hero, Header/Nav, Forms, Cards, CTA, Placeholder, Footer) are now enumerated, enabling mechanical refactors without visual drift.
- Missing neutrals/gradient/state tokens should be defined in `:root` before or during Phase 2 to prevent future reintroduction of literals.
