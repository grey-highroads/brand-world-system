# Theme Context

## Compact token summary

### Technology

- Vanilla CSS in `app/styles.css` plus the system-wide consolidation layer in `app/polish.css`; no Tailwind, CSS modules, component library, or theme provider.
- Dark, dense desktop product shell with responsive collapse at 1040px and 760px.

### Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink-950` | `#202833` | darkest shell and toast |
| `--ink-900` | `#242d39` | deep neutral |
| `--ink-800` | `#293442` | deep neutral |
| `--ink-700` | `#3a4655` | borders and controls |
| `--paper-50` | `#2e3643` | cards |
| `--paper-100` | `#28303a` | page background |
| `--paper-200` | `#374250` | secondary borders |
| `--paper-300` | `#465365` | primary borders |
| `--text` | `#dedddc` | primary text |
| `--muted` | `#939ba8` | descriptions and metadata |
| `--coral` | `#e6845a` | primary action and active navigation |
| `--coral-dark` | `#f0a07c` | coral text on dark surfaces |
| `--celery` | `#72b8d7` | secondary action and information |
| `--celery-ink` | `#b9e7f7` | information text |
| `--lavender` | `#9188c7` | governed/compiled state |
| `--success` | `#68c69b` | verified state |
| `--danger` | `#ef765e` | prohibitions and destructive actions |

### Typography

- Display and body: `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Body: 14px / 1.5
- Page titles: 25–30px, weight 650, `-0.025em`
- Card titles: 17px, weight 650
- Labels and metadata: 9–12px, weights 650–800

### Geometry and effects

- Radius: 4px small, 5px medium, 8px large; pills use 999px.
- Small shadow: `0 1px 2px rgb(8 13 20 / 0.22), 0 8px 24px rgb(8 13 20 / 0.12)`
- Medium shadow: `0 18px 48px rgb(8 13 20 / 0.26)`
- Sidebar width: 242px desktop, 210px medium, collapses to a top brand strip on mobile.
- Workspace maximum width: 1320px; shared desktop inset 32px and mobile inset 16px.
- Shared spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, and 48px.
- Main screen grids and section stacks use 24px gaps; fields use 16px gaps.
- Shared card padding is 20px desktop and 16px mobile.
- Standard controls are 40px high; compact and large variants are 32px and 44px.

### Motion and accessibility

- Hover transitions: 140–160ms for transform, shadow, border, and background.
- Focus ring: 3px translucent lavender with 2px offset.
- `prefers-reduced-motion` reduces animation and transition durations to 0.01ms.
- Live synthesis failures reuse the existing danger color and compact action patterns; no new visual language or provider-specific decoration is introduced.
- Type-first source options use existing nested surfaces, blue metadata marks, coral selected borders, and text labels; type is never communicated through color alone.
- Approved-baseline update callouts use the existing lavender governed state and remain visually secondary to the source task.

### Brand guidance category accents

- Brand foundation: `--lavender`
- Identity: `--celery`
- World and story: `--coral`
- Voice and messaging: `--success`
- Creative direction: `--coral-dark`
- Creative rules: `--danger`

Category color is always paired with the tab label and active border, so color is not the only navigation signal.

## Raw source: canonical token and global blocks

Source files: `app/styles.css` provides the product palette and feature composition; `app/polish.css` provides the approved shared spacing, surfaces, controls, semantic states, and readability floor. Pass both to future design calls using the line-range policy.

```css
:root {
  --ink-950: #202833;
  --ink-900: #242d39;
  --ink-800: #293442;
  --ink-700: #3a4655;
  --paper-50: #2e3643;
  --paper-100: #28303a;
  --paper-200: #374250;
  --paper-300: #465365;
  --text: #dedddc;
  --muted: #939ba8;
  --coral: #e6845a;
  --coral-dark: #f0a07c;
  --celery: #72b8d7;
  --celery-ink: #b9e7f7;
  --lavender: #9188c7;
  --gold: #e6845a;
  --success: #68c69b;
  --danger: #ef765e;
  --white: #ffffff;
  --shadow-sm: 0 1px 2px rgb(8 13 20 / 0.22), 0 8px 24px rgb(8 13 20 / 0.12);
  --shadow-md: 0 18px 48px rgb(8 13 20 / 0.26);
  --radius-sm: 4px;
  --radius-md: 5px;
  --radius-lg: 8px;
  --display: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --sans: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }

html {
  min-width: 320px;
  background: var(--paper-100);
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  color: var(--text);
  background: var(--paper-100);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.5;
}

button, input, textarea, select {
  color: inherit;
  font: inherit;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 3px solid rgb(169 160 255 / 0.42);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```
