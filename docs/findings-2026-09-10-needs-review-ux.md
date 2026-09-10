# Needs Review UX reset, 2026-09-10

## Decision

Needs Review is a decision session, not an analyst workspace.

The current three-column view gives the queue, evidence, provenance, decision controls, protections, production status, and completion state similar visual weight. That makes a small number of owner rulings feel like a large information-management task.

The prototype changes the default interaction to one ruling at a time.

## Prototype behavior

- One active ruling fills the working area.
- The question and short context are the primary content.
- Decision choices sit directly below the question.
- Choosing an answer saves through the existing Brand Brain handler and advances to the next unresolved ruling.
- Previous and Next move through the set without changing answers.
- Evidence, reasoning, confidence, relationships, and source detail move behind a single `Why am I seeing this?` disclosure.
- `View all decisions` opens a compact drawer instead of keeping the queue visible at all times.
- Completed decisions remain editable.
- After the final required ruling, the decision view gives way to a completion state and the existing `Review Brand Brain draft` action.
- Passive protection status is hidden when nothing is pending. Proposed protections still render.
- The persistent Brand Brain production-status bar and section tabs are removed during the focused review session. An `Exit review` action returns to the Brand Brain overview.
- The global sidebar is collapsed while the review session is active.

## Architecture boundary

The prototype does not duplicate Brand Brain state and does not change persistence or review semantics. `app/app.js` still owns review questions, selections, resolution labels, persistence, and the final review transition.

`app/review-focus.js` reshapes the existing rendered review DOM after each app render and reuses the existing `data-action` handlers. `app/review-focus.css` owns the focused composition.

This boundary is deliberate for the design test. If the interaction survives use against real client brains, fold the composition into `renderBrandBrain()` and its feature CSS rather than keeping a DOM adapter as the permanent implementation.

## Larger Brand Brain implication

The same hierarchy problem appears in Guidance. Today and Evolved now produce two complete world readers, while source counts, category trails, basis labels, confidence, comments, artifact metadata, and approval state remain visible at once.

The next pass should treat Today as the readable default and Evolved as a change layer. Show the future direction where it materially differs from Today, with a dedicated comparison mode for people who want the full two-world read. Provenance and system metadata should sit behind disclosure rather than beside primary guidance.

No Guidance IA change is included in this prototype. The goal here is to validate the interaction rule on Needs Review first.
