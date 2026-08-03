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

## `/` Brand Brain overview and onboarding states

Entry: `app/index.html` with `state.screen = "brain-overview"`, `"brain-sources"`, or `"brain-processing"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `brainSectionNav()`
  - `brainWorkspace()`
  - `renderBrainOverview()`
  - `renderBrainSources()`
    - `sourceComposer()`
    - `sourceGroupRow()`
    - source authority, intended guidance area, conditional influence, usage instruction, and exclusion controls
  - `renderBrainProcessing()`
    - `startBrainSynthesis()`
    - `applySynthesisResult()`
    - local `/api/brand-brain/synthesize` request
  - `sampleSourceGroups`
  - `synthesisSteps`
  - delegated input, change, click, file-reading, live synthesis, persistence, and deterministic-sample listeners
- `app/styles.css`

## `/` Brand guidance and history states

Entry: `app/index.html` with `state.screen = "brain-guidance"` or `"brain-history"`

- `app/app.js`
  - `shell()`
  - `brainSectionNav()`
  - `renderBrainGuidance()`
    - `guidanceCommentBlock()`
    - `guidanceArtifactCard()`
    - `renderBrainArtifactReader()`
      - `renderDossierArtifact()`
      - `renderLivedArtifact()`
      - `renderStoryArtifact()`
      - `artifactFeedback()`
  - `renderBrainHistory()`
  - `guidanceSections`
  - six guidance tabs plus full Brand Dossier, Lived World, and Story Architecture readers with inline feedback, approval, and revision listeners
- `app/styles.css`

## `/` Core brand guidance state

Entry: `app/index.html` with `state.screen = "brain-canon"`

- `app/app.js`
  - `shell()`
  - `pageHeader()`
  - `renderCanonPromotion()` (internal function name retained)
    - `brainEvidenceCard()`
  - delegated input and click listeners
- `app/styles.css`
