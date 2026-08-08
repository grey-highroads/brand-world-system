# UI contribution guide

How new feature code should work with the existing design system.

## Why this exists

A designer did a consolidation pass across the full prototype (commit `ccf440f`, `app/polish.css`). That pass established a token system, a spacing grid, and a set of surface and control patterns that every screen now shares. Before the pass, screens drifted apart visually because each one made its own spacing, color, and border decisions. The pass fixed that.

New feature code that bypasses the token system reintroduces the same drift. It costs a second cleanup pass, and the second pass is harder because it has to reconcile the original tokens with whatever the new code invented. This guide prevents that.

## The two CSS files

**`app/styles.css`** owns feature-specific layout: screen compositions, component shapes, grid definitions, responsive breakpoints, and any CSS that belongs to a named feature (the brain review screen, the preflight sidebar, the studio setup). New features add their CSS here.

**`app/polish.css`** owns the shared visual layer: spacing rhythm, surface treatments, control sizing, border styles, pill/status semantics, card composition, and typography scale. It was written to apply the approved visual treatment without changing information architecture. New features do not add CSS here. They consume it.

When the two files conflict on a visual property (padding, border-radius, background, font-size on a shared class), `polish.css` wins. It loads second and its values are the approved ones.

## Tokens to use

All values come from the `:root` block in `polish.css`. These are the ones that matter most:

**Spacing.** `--space-1` (4px) through `--space-12` (48px). Use these for padding, margin, and gap. The most common are `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), and `--space-6` (24px). Do not write `padding: 14px` when `--space-4` (16px) is the nearest token.

**Layout rhythm.** `--card-padding` for card interiors. `--section-gap` for vertical space between cards and sections. `--field-gap` for space between form fields. `--cluster-gap` for tight groups of related elements.

**Surfaces.** `--surface-card` for card backgrounds. `--surface-inset` for inset panels within cards (the darker recessed areas). `--surface-control` for form inputs.

**Borders.** `--border-subtle` for default borders. `--border-strong` for emphasized borders (hover states, input fields). Never write `border: 1px solid var(--paper-200)` when `var(--border-subtle)` means the same thing and survives a palette change.

**Controls.** `--control-sm` (32px), `--control-md` (40px), `--control-lg` (44px) for button and input heights. `--radius-sm`, `--radius-md`, `--radius-lg` for corners.

**Colors.** `--text` for body text. `--muted` for secondary text. `--coral`, `--lavender`, `--celery`, `--success`, `--warning`, `--danger` for semantic accents. The pill classes (`pill-success`, `pill-warning`, `pill-governed`, etc.) handle status badges.

## Rules

**No inline `style=""` attributes in HTML.** Every visual decision belongs in a CSS class. Inline styles are invisible to the design system, cannot be overridden by polish.css, and scatter visual logic across 5,000+ lines of JavaScript. If you need a one-off spacing adjustment, create a utility class that uses a token.

**No hardcoded pixel values in new CSS.** Use the spacing tokens. If the design calls for a value that does not match any token, pick the nearest one and accept the 2px difference. The visual consistency across screens matters more than the exact value on one element.

**No raw color variables when a semantic alias exists.** `var(--paper-200)` is a palette value. `var(--border-subtle)` is a semantic alias for the same value. Use the alias. If the palette changes, the alias updates everywhere; the raw variable does not.

**No fallback values on established tokens.** `var(--surface-inset, #27313e)` is unnecessary when polish.css already defines `--surface-inset`. The fallback was written defensively during initial development. Now that the token system is stable, fallbacks on known tokens add noise.

**Match existing component patterns.** Before writing a new card, field, pill, toggle, or list, search styles.css and polish.css for the existing version. The card pattern (`.card` + `.card-header` + `h2`), the field pattern (`.field` + `label` + input), the additive-link pattern, the collapsible-card pattern, the exact-list pattern: these all exist and handle spacing, typography, and surface treatment consistently. A new component that reinvents these patterns will look slightly different even if the author tries to match them.

**Fetch CSS files before editing them.** The designer's polish pass introduced a utility class system that earlier file copies do not contain. Always pull the current `polish.css` and `styles.css` from the repo before making changes, or the edit will overwrite work that has already been reviewed and approved.

## When you need something new

If the design requires a pattern that does not exist (the studio platform chips, the format resolution panel, the toggle row), add it to `styles.css` as a new block that uses the token vocabulary from `polish.css`. Follow the naming convention of the feature: `.studio-*` for Design Studio components, `.brain-*` for Brand Brain components. Group the new CSS together rather than scattering it among existing rules.

If the design requires a new token (a spacing value or color that genuinely does not fit the existing grid), add it to the `:root` block in `polish.css` alongside the existing tokens, not in a separate file or an inline declaration. This is rare. The existing grid covers almost everything.
