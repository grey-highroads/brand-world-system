# Routes and View States

## Framework

- Framework: browser-native HTML/CSS/JavaScript
- Router: none
- Entry URL: `/` served from `app/index.html`
- Entry script: `app/app.js`
- Shared layout: `shell(content)` in `app/app.js`

The application is a single-page prototype. `state.screen` selects a render function, and delegated `data-action` click handlers call `navigate(screen)`. The same local server exposes `/api/brand-brain/synthesize`, `/api/brand-brain/save`, and `/api/brand-brain` for the live synthesis and reload path.

## View map

| Logical view | State value | Renderer | Purpose |
| --- | --- | --- | --- |
| Production chooser | `chooser` | `renderChooser()` | Choose a configured deliverable workflow |
| Production brief | `brief` | `renderBrief()` | Define scene, exclusions, placement, format, and creative inputs |
| Preflight | `preflight` | `renderPreflight()` | Inspect compiled prompt, sources, generation inputs, and policy contract |
| Generated result | `result` | `renderResult()` | Review the static output placeholder and evaluation results |
| Brand Brain overview | `brain-overview` | `renderBrainOverview()` | Orient new and returning users around onboarding, readiness, and the next action |
| Brand Brain sources | `brain-sources` | `renderBrainSources()` | Add one type-first source with safe file limits, required usage instructions, and a proposed-update path that preserves the approved version |
| Brand Brain synthesis | `brain-processing` | `renderBrainProcessing()` | Show visible progress while the local server reads sources and produces structured guidance, review questions, and artifacts |
| Brand Brain review | `brain` | `renderBrandBrain()` | Approve clean assets, review flagged items and a brand-rule proposal, and save local decisions |
| Brand guidance | `brain-guidance` | `renderBrainGuidance()` | Move between editable category guidance and full cross-category artifact readers with section-level feedback before approval |
| Brand Brain history | `brain-history` | `renderBrainHistory()` | Inspect source batches, decisions, feedback, and saved versions |
| Core brand guidance | `brain-canon` | `renderCanonPromotion()` | Preview impact and record a separate change to core guidance without modeling V1 roles or permissions |

## Full view dispatcher

```js
function render() {
  if (state.screen === "brain-overview") root.innerHTML = renderBrainOverview();
  else if (state.screen === "brain-sources") root.innerHTML = renderBrainSources();
  else if (state.screen === "brain-processing") root.innerHTML = renderBrainProcessing();
  else if (state.screen === "brain") root.innerHTML = renderBrandBrain();
  else if (state.screen === "brain-guidance") root.innerHTML = renderBrainGuidance();
  else if (state.screen === "brain-history") root.innerHTML = renderBrainHistory();
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

Brand Brain is a first-class sidebar destination using the shared shell. Its persistent section navigation is Overview, Sources, Needs review, Brand guidance, and History. The implemented states cover empty onboarding, type-first single-source intake, real local OpenAI synthesis, incremental additions against an approved baseline, batch review, evidence detail, a brand-rule decision, a tabbed stored guidance version, three full cross-category artifact readers with inline feedback, production approval, reloadable local storage, history, and a separate change to core guidance. Production-grade jobs, rule exceptions, full version retrieval, and supersession remain planned.
