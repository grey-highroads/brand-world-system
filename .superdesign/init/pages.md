# Page Dependency Trees

## `/` Production chooser

Entry: `app/index.html`

- `app/app.js`
  - `shell()`
    - `currentCrumb()`
    - `navItem()`
    - `escapeHtml()`
  - `pageHeader()`
  - `renderChooser()`
- `app/styles.css`

## `/` Product lifestyle brief state

Entry: `app/index.html` with `state.screen = "brief"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderBrief()`
    - `referenceEditor()`
    - `renderSourcePicker()`
    - `option()`
  - `placementFormats`
  - `referenceLibrary`
  - delegated input/change/click listeners
- `app/styles.css`

## `/` Preflight state

Entry: `app/index.html` with `state.screen = "preflight"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderPreflight()`
    - `compiledComponents()`
    - `promptSections()`
    - `referenceInput()`
    - `referenceResolution()`
  - `plainPrompt()`
  - `copyPrompt()`
  - `downloadPackage()`
- `app/styles.css`

## `/` Result state

Entry: `app/index.html` with `state.screen = "result"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderResult()`
- `app/styles.css`

## `/` Brand Brain review state

Entry: `app/index.html` with `state.screen = "brain"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderBrandBrain()`
    - `selectedBrainException()`
    - `brainQueueItem()`
    - `brainEvidenceCard()`
    - `brainDecisionAction()`
  - `brainBatch`
  - `brainExceptions`
  - delegated click listeners
- `app/styles.css`

The queue includes conflicting guidance, a possible duplicate, a possible brand principle, and a proposed brand rule. Visible labels use marketer-facing language while the internal fixture preserves precise governance terms.

## `/` Core brand guidance state

Entry: `app/index.html` with `state.screen = "brain-canon"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderCanonPromotion()` (internal function name retained)
    - `brainEvidenceCard()`
  - delegated input and click listeners
- `app/styles.css`
