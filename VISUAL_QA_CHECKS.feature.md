# ============================================================================
# CSS_REFACTORING_MASTER.feature
# ============================================================================
# Complete BDD specification for INTEC Brussel CSS refactoring
# Integrates with VISUAL_QA_CHECKS.feature for comprehensive coverage
# ============================================================================

Meta:
  Repository: INTEC 2025 — Frontend Design System
  Target File: assets/css/main.css
  Current Size: 3000+ lines
  Goal: Reduce to ~1800 lines with zero visual regression
  Related: VISUAL_QA_CHECKS.feature (visual verification suite)
  Policy: All CSS changes must pass BDD scenarios AND visual QA checks

  # Progress Tracker
  | Phase | Description | Status |
  | ----- | ----------- | ------ |
  | 0     | Policy Reconciliation | ✅ Done |
  | 1     | Variable Cleanup      | 🟡 Pending QA |
  | 2     | Grid Refactor         | 🟡 In Progress |
  | 3     | Card Refactor         | 🔜 Next |

  # Policy Amendment (Hybrid Mode)
  
  NOTE: The project adopts a Hybrid Mode for QA artifacts. Runnable copies of visual QA scripts and helpers MAY exist in `/scripts/` or `docs/` for CI and developer use, but full archival copies (script source, execution guide, and reports) MUST be embedded as Appendices inside this `VISUAL_QA_CHECKS.feature.md` file for review and compliance. This preserves the single-file audit trail while keeping practical runnable tooling available.

  NOTE (Phase 8): Detailed QA Integration & Completion Summary has been added to `docs/PHASE_8_QA_COMPLETION.md` (archival). Maintainers may choose to keep a summarized version in this feature file when final verification is complete.

# ============================================================================
# PHASE 1: CSS VARIABLES CLEANUP
# ============================================================================

Feature: Eliminate duplicate and legacy CSS variables
  As a frontend developer
  I want to consolidate CSS custom properties
  So the design system uses one source of truth for each token

  Background:
    Given the `:root` block contains 80+ CSS variables
    And many variables are aliases pointing to the same values
    And some variables use outdated naming conventions
    And the refactor must maintain all visual outputs

  Scenario: Remove redundant color aliases
    Given the following duplicate color variables exist:
      | Legacy Variable       | Canonical Replacement      | Usage Count |
      | --color-iris          | --color-secondary          | 15          |
      | --color-text          | --color-text-primary       | 45          |
      | --color-text-muted    | --color-text-secondary     | 68          |
      | --color-bg            | --color-background         | 23          |
      | --color-aqua-soft     | --color-muted-surface      | 12          |
    When I perform a find-and-replace operation
    Then all instances must be replaced with canonical tokens
    And the legacy variables must be deleted from `:root`
    And visual regression tests must pass
    And VISUAL_QA_CHECKS.feature scenarios must validate:
      | Component      | Visual Check                    |
      | .two-column    | Background colors unchanged     |
      | .faq-grid      | Border and shadow consistency   |
      | .timeline--four| Text color hierarchy preserved  |

  Scenario: Consolidate typography tokens
    Given these typography aliases exist:
      | Alias          | Target               |
      | --font-sans    | --font-primary       |
      | --text-body    | --font-size-base     |
    When I replace all references
    Then the final `:root` block must contain only:
      """css
      /* Typography - Canonical Only */
      --font-primary: "Inter", "Segoe UI", sans-serif;
      --font-size-xs: 0.75rem;
      --font-size-sm: 0.875rem;
      --font-size-base: 1rem;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.5rem;
      --font-size-2xl: 2rem;
      --font-size-3xl: 2.5rem;
      --font-weight-normal: 400;
      --font-weight-medium: 500;
      --font-weight-bold: 700;
      """
    And all components must use these tokens directly

  Scenario: Unify spacing scale
    Given spacing variables are scattered:
      | Variable              | Usage        | Keep? |
      | --space-xs to --space-2xl | Primary   | ✅    |
      | --space-section           | Legacy    | ❌    |
      | --space-card              | Legacy    | ❌    |
      | --gap-cards               | Legacy    | ❌    |
      | --gap-elements            | Legacy    | ❌    |
    When I consolidate the spacing system
    Then replace all usage:
      """
      --space-card      → var(--space-lg)
      --gap-cards       → var(--space-md)
      --gap-elements    → var(--space-sm)
      --space-section   → clamp(3rem, 5vw, 5rem)
      """
    And delete unused variables
    And verify in VISUAL_QA_CHECKS:
      | Component       | Spacing Verification          |
      | .two-column     | Padding matches design tokens |
      | .faq-grid       | Gap between cards correct     |
      | .timeline--four | Step spacing preserved        |

# ============================================================================
# PHASE 2: GRID SYSTEM CONSOLIDATION
# ============================================================================

Feature: Create unified responsive grid system
  As a frontend developer
  I want one canonical grid implementation
  So layout patterns are predictable and maintainable

  Background:
    Given multiple grid definitions exist with identical rules
    And grid responsive behavior is duplicated across components
    And the system must support 1-4 column layouts

  Scenario: Merge duplicate grid definitions
    Given these duplicate selectors exist:
      | Selector    | Definition Count | Lines |
      | .grid-2     | 3                | 45    |
      | .grid-3     | 2                | 30    |
      | .grid-4     | 1                | 15    |
      | .grid-auto  | 2                | 28    |
    When I create a unified grid system
    Then replace all with:
      """css
      /* ===== UNIFIED GRID SYSTEM ===== */
      .grid {
        display: grid;
        gap: var(--space-md);
      }
      
      /* Column Variants */
      .grid-cols-1 { grid-template-columns: 1fr; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
      
      /* Responsive Auto Grid */
      .grid-auto {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
      
      /* Gap Utilities */
      .gap-sm { gap: var(--space-sm); }
      .gap-md { gap: var(--space-md); }
      .gap-lg { gap: var(--space-lg); }
      """
    And total lines saved must be: 90+

  Scenario: Consolidate grid media queries
    Given 15+ separate media queries handle grid responsiveness
    When I unify responsive behavior
    Then create single ruleset:
      """css
      /* ===== GRID RESPONSIVE BEHAVIOR ===== */
      @media (width <= 1024px) {
        .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
      }
      
      @media (width <= 768px) {
        .grid-cols-2,
        .grid-cols-3,
        .grid-cols-4 {
          grid-template-columns: 1fr;
        }
      }
      """
    And delete all scattered grid media queries
    And verify with VISUAL_QA_CHECKS:
      | Viewport | Grid Test                         |
      | 1366px   | Multi-column grids display        |
      | 768px    | 3-4 col grids become 2-col        |
      | 375px    | All grids stack to single column  |

  Scenario: Update HTML usage patterns
    Given HTML uses mixed grid classes:
      | Old Pattern                    | New Pattern                |
      | `<div class="grid-2">`         | `<div class="grid grid-cols-2">` |
      | `<div class="course-grid">`    | `<div class="grid grid-cols-2">` |
      | `<div class="program-grid">`   | `<div class="grid grid-cols-3">` |
    When I update all HTML files
    Then patterns must be consistent
    And old grid classes deprecated
    And visual output must remain identical

# ============================================================================
# PHASE 3: CARD COMPONENT SYSTEM
# ============================================================================

Feature: Build unified card component architecture
  As a frontend developer
  I want all card variants to extend a base `.card` class
  So styling is DRY and modifications cascade properly

  Background:
    Given 12+ card definitions exist with 80% identical styles
    And cards include: .card, .course-card, .program-card, .about-card,
        .counter-card, .vacatures-card, .highlight-box, .contact-panel,
        .tip-card, .faq-item
    And each card must support hover, focus, and responsive states

  Scenario: Create base card component
    When I define the canonical `.card` component
    Then the structure must be:
      """css
      /* ===== BASE CARD COMPONENT ===== */
      .card {
        background: var(--color-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        transition: all var(--transition-base);
      }
      
      /* Card Structure */
      .card__header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }
      
      .card__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
      }
      
      .card__footer {
        margin-top: auto;
        padding-top: var(--space-md);
        border-top: 1px solid var(--border-color);
      }
      
      /* Card Variants */
      .card--elevated {
        box-shadow: var(--shadow-lg);
      }
      
      .card--compact {
        padding: var(--space-md);
      }
      
      .card--ghost {
        background: transparent;
        border: none;
        box-shadow: none;
      }
      
      /* Card States */
      .card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      
      .card:focus-within {
        outline: 3px solid var(--color-accent);
        outline-offset: 2px;
      }
      """
    And integration with VISUAL_QA_CHECKS must verify:
      | Component       | Visual Check                    |
      | .two-column     | Cards lift on hover             |
      | .faq-grid       | Shadow depth consistent         |
      | .timeline--four | Focus outline appears correctly |

  Scenario: Deprecate legacy card variants
    Given these card classes need migration:
      | Old Class         | New Pattern                      | Occurrences |
      | .course-card      | `.card .card--elevated`          | 8           |
      | .program-card     | `.card`                          | 12          |
      | .about-card       | `.card`                          | 6           |
      | .counter-card     | `.card .card--compact`           | 4           |
      | .highlight-box    | `.card`                          | 10          |
      | .contact-panel    | `.card`                          | 3           |
    When I refactor HTML markup
    Then all instances must use base `.card` + modifiers
    And old classes must be removed from CSS
    And lines saved: 200+

  Scenario: Validate card hover effects
    Given all cards must have consistent interaction states
    When I test hover, focus, and active states
    Then verify using VISUAL_QA_CHECKS.feature:
      """gherkin
      Scenario: Card interaction states
        When hovering over any `.card`
        Then the card must lift by -4px
        And box-shadow must change to var(--shadow-md)
        And transition duration must be var(--transition-base)
        
        When focusing a card with keyboard
        Then outline must be 3px solid var(--color-accent)
        And outline-offset must be 2px
        
        When prefers-reduced-motion is enabled
        Then all transforms must be disabled
        And only opacity changes allowed
      """

# ============================================================================
# PHASE 4: HERO SECTION UNIFICATION
# ============================================================================

Feature: Consolidate hero component variants
  As a frontend developer
  I want one hero component with modifiers
  So each page variant doesn't require separate definitions

  Background:
    Given 4 hero implementations exist:
      | Selector                          | Lines | Pages Using      |
      | .hero-section                     | 120   | index.html       |
      | body:not(.page--program) .hero    | 150   | about, contact   |
      | body.page--program .hero          | 180   | programs/*       |
      | .hero--with-form                  | 90    | inschrijven.html |
    And these share 70% identical styles
    And visual output must remain pixel-perfect

  Scenario: Create base hero component
    When I build the canonical `.hero` component
    Then structure must be:
      """css
      /* ===== BASE HERO COMPONENT ===== */
      .hero {
        position: relative;
        padding-block: clamp(3rem, 6vw, 5rem);
        background: var(--gradient-shell);
        overflow: hidden;
      }
      
      .hero::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
          120% 140% at 85% 0%,
          rgb(255 255 255 / 95%),
          transparent 65%
        );
        z-index: 0;
      }
      
      .hero__container {
        position: relative;
        z-index: 1;
        max-width: var(--max-width-content);
        margin-inline: auto;
        padding-inline: var(--space-lg);
      }
      
      .hero__grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-xl);
        align-items: center;
        background: rgb(255 255 255 / 94%);
        border-radius: var(--radius-lg);
        padding: var(--space-xl);
        box-shadow: var(--shadow-xl);
      }
      
      .hero__content {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }
      
      .hero__title {
        font-size: clamp(2.5rem, 5vw, 3.6rem);
        line-height: 1.1;
        color: var(--color-primary-dark);
        font-weight: 800;
      }
      
      .hero__description {
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: var(--color-text-secondary);
        line-height: 1.75;
      }
      
      .hero__actions {
        display: flex;
        gap: var(--space-md);
        flex-wrap: wrap;
      }
      
      .hero__visual {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      """

  Scenario: Implement hero variants via modifiers
    Given different pages need hero variations
    When I add modifier classes
    Then create these variants:
      """css
      /* ===== HERO VARIANTS ===== */
      
      /* Program Pages */
      .hero--program .hero__grid {
        grid-template-columns: 1.05fr 0.95fr;
        background: rgb(255 255 255 / 82%);
        backdrop-filter: blur(24px);
      }
      
      .hero--program .hero__title::first-letter {
        background: linear-gradient(135deg, var(--color-accent), var(--color-secondary));
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      /* Contact Page */
      .hero--contact .hero__grid {
        grid-template-columns: 1.1fr 0.9fr;
      }
      
      /* Registration with Form */
      .hero--form .hero__grid {
        grid-template-columns: 1fr 1fr;
        align-items: start;
      }
      """
    And HTML must use: `<section class="hero hero--program">`

  Scenario: Unify hero responsive behavior
    Given hero sections have scattered media queries
    When I consolidate responsive rules
    Then create single responsive block:
      """css
      /* ===== HERO RESPONSIVE ===== */
      @media (width <= 1024px) {
        .hero__grid {
          grid-template-columns: 1fr;
          text-align: center;
        }
        
        .hero__content {
          align-items: center;
        }
        
        .hero__visual {
          order: -1;
        }
      }
      
      @media (width <= 768px) {
        .hero {
          padding-block: clamp(2.5rem, 5vw, 3.5rem);
        }
        
        .hero__grid {
          padding: var(--space-lg);
        }
        
        .hero__title {
          font-size: clamp(2.2rem, 7vw, 2.8rem);
        }
      }
      
      @media (width <= 640px) {
        .hero__actions {
          flex-direction: column;
          width: 100%;
        }
        
        .hero__actions .button {
          width: 100%;
        }
      }
      """
    And verify with VISUAL_QA_CHECKS:
      | Viewport | Hero Test                           |
      | 1366px   | Two-column grid with visual balance |
      | 768px    | Single column, centered content     |
      | 375px    | Stacked layout, full-width buttons  |

  Scenario: Remove complex body selectors
    Given these selectors exist:
      """css
      body:not(.page--program) :is(.hero, .about-hero, .register-hero)
      body.page--program .hero
```
    When I refactor to use simple classes
    Then replace with direct selectors:
      | Old Selector                              | New Selector          |
      | body:not(.page--program) .hero            | .hero                 |
      | body.page--program .hero                  | .hero.hero--program   |
      | body:not(.page--program) .about-hero      | .hero.hero--about     |
    And specificity must decrease by 2-3 levels
    And performance improvement: ~15%

# ============================================================================
# PHASE 5: UTILITY CLASSES SYSTEM
# ============================================================================

Feature: Build comprehensive utility class library
  As a frontend developer
  I want reusable utility classes for common patterns
  So repetitive styles are eliminated

  Background:
    Given hover effects are duplicated 25+ times
    And spacing utilities are inconsistent
    And text styling lacks standardization

  Scenario: Create hover effect utilities
    Given these hover patterns repeat:
      | Pattern                         | Occurrences |
      | transform: translateY(-4px)     | 28          |
      | box-shadow: var(--shadow-md)    | 25          |
      | transform: scale(1.05)          | 12          |
    When I create utility classes
    Then define:
      """css
      /* ===== HOVER UTILITIES ===== */
      .hover-lift {
        transition: transform var(--transition-base),
                    box-shadow var(--transition-base);
      }
      
      .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      
      .hover-lift-sm:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
      }
      
      .hover-lift-lg:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-lg);
      }
      
      .hover-scale:hover {
        transform: scale(1.05);
      }
      
      .hover-glow:hover {
        box-shadow: 0 0 20px var(--color-accent);
      }
      
      /* Disable for reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .hover-lift:hover,
        .hover-lift-sm:hover,
        .hover-lift-lg:hover,
        .hover-scale:hover {
          transform: none;
        }
      }
      """
    And apply to components:
      | Component       | Utility Added    |
      | .card           | hover-lift       |
      | .button         | hover-lift-sm    |
      | .logo-card      | hover-scale      |

  Scenario: Standardize spacing utilities
    Given inconsistent margin/padding patterns exist
    When I create spacing utility system
    Then define complete scale:
      """css
      /* ===== SPACING UTILITIES ===== */
      
      /* Margin Top */
      .mt-0  { margin-top: 0 !important; }
      .mt-xs { margin-top: var(--space-xs) !important; }
      .mt-sm { margin-top: var(--space-sm) !important; }
      .mt-md { margin-top: var(--space-md) !important; }
      .mt-lg { margin-top: var(--space-lg) !important; }
      .mt-xl { margin-top: var(--space-xl) !important; }
      
      /* Margin Bottom */
      .mb-0  { margin-bottom: 0 !important; }
      .mb-xs { margin-bottom: var(--space-xs) !important; }
      .mb-sm { margin-bottom: var(--space-sm) !important; }
      .mb-md { margin-bottom: var(--space-md) !important; }
      .mb-lg { margin-bottom: var(--space-lg) !important; }
      .mb-xl { margin-bottom: var(--space-xl) !important; }
      
      /* Padding */
      .p-0   { padding: 0 !important; }
      .pt-sm { padding-top: var(--space-sm) !important; }
      .pt-md { padding-top: var(--space-md) !important; }
      .pt-lg { padding-top: var(--space-lg) !important; }
      
      .pb-sm { padding-bottom: var(--space-sm) !important; }
      .pb-md { padding-bottom: var(--space-md) !important; }
      .pb-lg { padding-bottom: var(--space-lg) !important; }
      
      .px-sm { padding-inline: var(--space-sm) !important; }
      .px-md { padding-inline: var(--space-md) !important; }
      .px-lg { padding-inline: var(--space-lg) !important; }
      
      .py-sm { padding-block: var(--space-sm) !important; }
      .py-md { padding-block: var(--space-md) !important; }
      .py-lg { padding-block: var(--space-lg) !important; }
      """

  Scenario: Create text styling utilities
    When I build typography utilities
    Then define comprehensive system:
      """css
      /* ===== TEXT UTILITIES ===== */
      
      /* Alignment */
      .text-left   { text-align: left !important; }
      .text-center { text-align: center !important; }
      .text-right  { text-align: right !important; }
      
      /* Colors */
      .text-primary   { color: var(--color-primary) !important; }
      .text-secondary { color: var(--color-text-secondary) !important; }
      .text-accent    { color: var(--color-accent) !important; }
      .text-muted     { color: var(--color-text-secondary) !important; }
      .text-inverse   { color: var(--color-text-inverse) !important; }
      
      /* Sizes */
      .text-xs   { font-size: var(--font-size-xs) !important; }
      .text-sm   { font-size: var(--font-size-sm) !important; }
      .text-base { font-size: var(--font-size-base) !important; }
      .text-lg   { font-size: var(--font-size-lg) !important; }
      .text-xl   { font-size: var(--font-size-xl) !important; }
      
      /* Weights */
      .font-normal { font-weight: var(--font-weight-normal) !important; }
      .font-medium { font-weight: var(--font-weight-medium) !important; }
      .font-bold   { font-weight: var(--font-weight-bold) !important; }
      """

  Scenario: Replace inline styles with utilities
    Given HTML contains inline hover/spacing styles
    When I refactor to use utilities
    Then examples:
      | Before                                      | After                           |
      | `style="margin-bottom: 1.5rem"`             | `class="mb-md"`                 |
      | Duplicate hover in 10 components            | `class="hover-lift"`            |
      | `style="padding: 2.5rem"`                   | `class="p-lg"`                  |
    And total inline styles eliminated: 80+

# ============================================================================
# PHASE 6: MEDIA QUERY CONSOLIDATION
# ============================================================================

Feature: Unify breakpoints and responsive patterns
  As a frontend developer
  I want consistent breakpoints across all components
  So responsive behavior is predictable

  Background:
    Given 60+ media query blocks exist
    And breakpoints vary: 479px, 480px, 639px, 640px, 767px, 768px, 991px, 1024px
    And many rules are duplicated across queries

  Scenario: Standardize breakpoint system
    Given inconsistent breakpoint values
    When I define canonical breakpoints
    Then use only these values:
      """css
      /* ===== CANONICAL BREAKPOINTS ===== */
      
      /* Mobile First */
      @media (width >= 640px)  { /* sm - Small tablets */ }
      @media (width >= 768px)  { /* md - Tablets */ }
      @media (width >= 1024px) { /* lg - Laptops */ }
      @media (width >= 1280px) { /* xl - Desktops */ }
      
      /* Desktop First (for legacy compatibility) */
      @media (width <= 1023px) { /* < lg */ }
      @media (width <= 767px)  { /* < md */ }
      @media (width <= 639px)  { /* < sm */ }
      """
    And eliminate these breakpoints:
      | Remove  | Reason                    |
      | 479px   | Too close to 480px        |
      | 480px   | Use 640px instead         |
      | 639px   | Too close to 640px        |
      | 991px   | Use 1024px instead        |
      | 1199px  | Use 1280px instead        |

  Scenario: Group related responsive rules
    Given media queries are scattered throughout file
    When I consolidate by breakpoint
    Then structure must be:
      """css
      /* ===== RESPONSIVE: TABLET & BELOW (< 1024px) ===== */
      @media (width <= 1023px) {
        /* Navigation */
        .site-header__inner {
          grid-template-columns: auto auto auto;
        }
        
        .nav-toggle {
          display: inline-flex;
        }
        
        /* Layout */
        .hero__grid,
        .two-column,
        .faq-grid {
          grid-template-columns: 1fr;
        }
        
        /* Grids */
        .grid-cols-3,
        .grid-cols-4 {
          grid-template-columns: repeat(2, 1fr);
        }
        
        /* Components */
        .timeline--four {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      /* ===== RESPONSIVE: MOBILE (< 768px) ===== */
      @media (width <= 767px) {
        /* Typography */
        :root {
          --space-section: clamp(3rem, 5vw, 4rem);
        }
        
        /* Layout */
        .grid-cols-2,
        .grid-cols-3,
        .grid-cols-4 {
          grid-template-columns: 1fr;
        }
        
        /* Components */
        .hero__actions,
        .cta-band__actions {
          flex-direction: column;
        }
        
        .button {
          width: 100%;
        }
      }
      
      /* ===== RESPONSIVE: SMALL MOBILE (< 640px) ===== */
      @media (width <= 639px) {
        /* Fine-tune spacing */
        .hero {
          padding-block: clamp(2.5rem, 5vw, 3rem);
        }
        
        /* Full-width actions */
        .hero__actions,
        .about-hero__cta {
          width: 100%;
        }
      }
      """
    And lines saved by consolidation: 150+

  Scenario: Validate responsive breakpoints with QA
    Then verify using VISUAL_QA_CHECKS.feature:
      """gherkin
      Scenario: Responsive breakpoint validation
        Given these viewport sizes:
          | Device          | Width | Breakpoint |
          | iPhone SE       | 375px | < sm       |
          | iPad Mini       | 768px | md         |
          | iPad Pro        | 1024px| lg         |
          | Desktop         | 1366px| xl         |
        
        When testing each component:
          | Component       | Expected Behavior                  |
          | .two-column     | 2 cols → 1 col at 768px            |
          | .faq-grid       | 2 cols → 1 col at 768px            |
          | .timeline--four | 4 cols → 2 cols → 1 col            |
          | .hero__grid     | 2 cols → 1 col centered at 1024px  |
        
        Then all transitions must be smooth
        And no content overflow allowed
        And touch targets minimum 44x44px on mobile
      """

# ============================================================================
# PHASE 7: LEGACY CODE REMOVAL
# ============================================================================

Feature: Remove obsolete and commented code
  As a frontend developer
  I want to eliminate dead code and confusing comments
  So the stylesheet is clean and maintainable

  Background:
    Given the file contains legacy comments and unused code
    And some rules are marked with "TODO" or "FIXME"
    And Arabic/Unicode characters exist in comments

  Scenario: Remove non-English and garbled comments
    Given these problematic comments exist:
      """css
      /* ???????? ?????? ??????? ?????? ??????? */
      /* ??? ??????? ???????: ???? ???? ???? */
      /* NOTE: Duplicate hero/section rules exist... */
      /* 2) ?? ??? <details><summary> (??? ?????/???????) */
```
    When I clean the comments
    Then remove all non-ASCII comments
    And replace TODO/NOTE comments with clear action items:
      | Old Comment                           | New Action                                  |
      | /* NOTE: Duplicate hero rules... */   | Issue #123: Consolidate hero definitions    |
      | /* TODO: Clean this up */             | Issue #124: Refactor button variants        |
    And keep only semantic section headers:
```css
      /* ============================================================================
         SECTION NAME: Brief description
         ============================================================================ */
```

  Scenario: Remove duplicate selectors
    Given duplicate selector warnings exist:
      | Selector              | Occurrences | Action         |
      | .text-center          | 2           | Keep last only |
      | .faq-grid             | 3           | Merge all      |
      | ::selection           | 2           | Keep one       |
    When I consolidate duplicates
    Then each selector must appear exactly once
    And earlier definitions must be removed
    And visual output