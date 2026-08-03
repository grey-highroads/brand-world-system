# Routes and View States

## Framework

- Framework: browser-native HTML/CSS/JavaScript
- Router: none
- Entry URL: `/` served from `app/index.html`
- Entry script: `app/app.js`
- Shared layout: `shell(content)` in `app/app.js`

The application is a single-page prototype. `state.screen` selects a render function, and delegated `data-action` click handlers call `navigate(screen)`.

## View map

| Logical view | State value | Renderer | Purpose |
| --- | --- | --- | --- |
| Production chooser | `chooser` | `renderChooser()` | Choose a configured deliverable workflow |
| Production brief | `brief` | `renderBrief()` | Define scene, exclusions, placement, format, and creative inputs |
| Preflight | `preflight` | `renderPreflight()` | Inspect compiled prompt, sources, generation inputs, and policy contract |
| Generated result | `result` | `renderResult()` | Review the static output placeholder and evaluation results |
| Brand Brain review | `brain` | `renderBrandBrain()` | Approve clean assets, review flagged items and a brand-rule proposal, and save local decisions |
| Core brand guidance | `brain-canon` | `renderCanonPromotion()` | Preview impact and record a separate change to core guidance without modeling V1 roles or permissions |

## Full view dispatcher

```js
function render() {
  if (state.screen === "brain") root.innerHTML = renderBrandBrain();
  else if (state.screen === "brain-canon") root.innerHTML = renderCanonPromotion();
  else if (state.screen === "brief") root.innerHTML = renderBrief();
  else if (state.screen === "preflight") root.innerHTML = renderPreflight();
  else if (state.screen === "result") root.innerHTML = renderResult();
  else root.innerHTML = renderChooser();
}

function navigate(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
```

## Brand Brain route family

Brand Brain is a first-class sidebar destination using the shared shell. The implemented states cover batch intake, plain-language review, evidence detail, a scoped brand-rule decision, approval for helpful use, and a separate change to core brand guidance. Rule exceptions and supersession remain planned.
