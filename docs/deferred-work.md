# Deferred work register

Things deliberately left undone, with the reason and the condition that should bring them back. This is not a backlog of ideas. Every entry here was a real decision made during a working session, recorded so the reasoning survives and so nobody re-litigates it from scratch or ships it by accident.

Three rules govern this file:

- An entry is added at the moment the decision is made, not later from memory.
- Every entry names what would have to be true for the work to become worth doing.
- An entry that ships is deleted, not marked done. Git history holds the record.

Entries are grouped by what kind of debt they are, since the kinds have different consequences. Prototype-only behavior is the sharpest category: it works for a demo and would be wrong in front of a paying client.

---

## Prototype-only behavior

Things that hold up in a demo and would not survive real use. These are the entries most likely to cause harm if forgotten, because nothing about the interface signals that they are temporary.

### Dismissal state does not persist

Drift notices on the Design Studio chooser can be dismissed, and dismissal is keyed to the version that raised the notice, so a later brain approval or product revision surfaces it again. The dismissal itself lives in memory and resets on reload.

The Snapshot drift rows dismiss the same way, per output rather than per notice, keyed to the version that raised the row.

Fine for a demo. Wrong for production, where a user dismisses something on Monday and expects it to stay dismissed on Tuesday.

Bring it back when: a real client is using the deployed app for daily work. The fix is a field on the client record, so it is server work rather than a UI change.

### Candidate rules do not survive a reload

Feedback broader than "fix this one" queues as a candidate rule in `state.production.candidateRules`. The queue is session-scoped. Carried over from the sprint close and still open.

Bring it back when: candidate rules get a cross-job governance surface, since a queue nobody can review across jobs has no value even when persisted.

### Campaigns are seeded into state and shared across clients

Campaigns compile correctly into a production job and do not persist. Outputs and brains reach Blob storage; campaigns do not.

They are also not client-scoped. The seed list is a constant, so every client sees the same campaigns, which contradicts the namespace boundary ADR 0011 enforces everywhere else. The seed currently holds one Dialog Health campaign, which means a different client would see a healthcare RCS campaign in their own workspace.

Bring it back when: a second client needs its own campaigns, or a campaign needs to outlive the session that created it. Client scoping and persistence are the same piece of work and should land together, since a persisted campaign with no client id would have to be migrated afterward.

---

## Stylesheet debt

### The card adjacency rule

`.card + .card { margin-top: 18px }` is correct when cards stack in a column and wrong inside a grid, where it applies to every card except the first. The result is a row whose first item sits higher and taller than its neighbours, which reads as a display bug.

The current fix cancels the margin inside nineteen named grid containers. That list is the debt: a new grid holding `.card` children inherits the bug until somebody adds it to the list.

The durable fix is to delete the adjacency rule and give every stacking container an explicit `gap`, which is how the rest of the design system already works. That is a stylesheet-wide pass with real regression surface, so it was not folded into a UI session.

Bring it back when: the next deliberate design-system pass, or the second time somebody hits the bug in a new grid.

### Orphaned selectors from cut components

`.guidance-source-summary` and its child rules remain in `styles.css` after the "How this section was shaped" card was cut from Brand guidance. Left in place in case the content returns somewhere.

Bring it back when: the same stylesheet pass as the entry above. Cutting dead CSS piecemeal costs more review attention than it saves.

### Hover treatments are inconsistent across selectable cards

The intake doors on Sources use a colored stroke on the dark surface, which reads as selectable rather than merely hovered. Studio category cards, source material options, and the guidance cells on Snapshot each do something different.

Bring it back when: working through the Design Studio screens, where most of the remaining selectable cards live.

---

## Incomplete paths

Work that functions but stops short of where it should land.

### Brands and sub-brands below the client

The source intake has no way to say which brand or sub-brand a source belongs to. Every source belongs to the client. Dialog Health has a sample brand, and enterprise clients routinely have sub-brands with their own marks and their own guidance.

Adding a picker is the small part. The real work is the entity: what a sub-brand inherits from its parent, whether it gets its own brain or a scoped view of one, what happens when parent and child guidance conflict, and how production resolves which applies to a job. That is a data model decision, not an intake field.

Bring it back when: a client needs to produce for two brands under one account, or when the segment axis work makes scoped resolution a solved problem that a brand axis could reuse.

### Protected asset variations are recorded but not chosen automatically

Logos carry an asset kind and, for logos and lockups, a required variation. The variation makes the production picker readable when a brand has five logo files, and it is the same data an automatic chooser would need.

Nothing chooses automatically. A job cannot ask for the monochrome mark because it knows the background is busy, because placement runs through the model rather than a compositor that can reason about the background.

Bring it back when: deterministic compositing lands. The intake data is already in the contract, so the work is on the production side only.

### Remaking a drifted output has no Design Studio path

Snapshot used to offer "Remake with current guidance" on drift rows. It restored the brief from an output record and navigated to the legacy production brief, because studio setup state is not reconstructible from an output record. That route was removed: the drift rows now offer Open evaluation and Dismiss, and retrying belongs to the evaluation screen where the findings are.

There is still no path from a drifted output back into the Design Studio setup that produced it.

Bring it back when: the Design Studio setup screens are worked through, since the fix is to record enough setup state on the output to rebuild it.

### Outputs made before package persistence cannot be evaluated

The compiled package is now written per job at generation time, which is what makes past work reviewable. Outputs generated before that change have no saved package and show a plain message instead of an evaluation screen.

No backfill is possible. The package was never stored. Recorded so nobody spends time looking for a migration.

### Product picker exists only on sales enablement

Social image, ad image, and website image flows do not expose the product picker. Wiring it follows the established pattern.

Bring it back when: one of those flows needs product-specific claims.

---

## Renderer constraints

### Resizing is not implemented, so catalog sizes are chosen to avoid it

gpt-image-2 accepts arbitrary resolutions when both sides are divisible by 16, the aspect ratio is within 3:1, and the pixel count falls between 655,360 and 8,294,400. Several familiar web sizes fail those rules: 800x600 and 800x800 are below the pixel floor, and 630 is not divisible by 16.

Rather than add an image-resizing dependency, the website catalog uses the nearest natively valid size at the same aspect ratio. Every format renders at exactly the dimensions the interface promises, with no post-processing.

This holds for website images. It will not hold everywhere. Print collateral at 300dpi, retina email images designed at 2x and displayed at 1x, and any format whose exact pixel dimensions are fixed by a third party will eventually need a real resize step.

Bring it back when: a required format cannot be expressed as a natively valid size, or feedback shows the delivered dimensions are causing work downstream. The tool would be sharp, which is a native binary and the first non-JavaScript dependency in the project, so it needs a throwaway deploy to verify before it enters the render path.

### Transparent backgrounds are unavailable on the current model

gpt-image-2 does not support transparent backgrounds, and requests specifying one are rejected.

Presentation elements, product floating shots, and sales collateral elements all assume transparent PNG, and the "better building blocks" position rests on producing elements that layout tools compose. Two unbuilt studio categories depend on this.

Bring it back when: those categories are built. The options are a background-removal step after generation, generating on a solid color and keying it out, or a render path that supports transparency natively. This is a real architectural decision rather than a small fix.

---

## Display copy in renders (ADR 0014 part two)

### Screen-bearing scenes carry a rule collision with no scale constraint

The screen orientation rules in `prompt-craft.js` require that a device screen faces the camera directly and stays fully visible and readable, and that a person be positioned beside or behind it presenting outward rather than holding it in a viewing grip. Renders on 2026-08-11 violated the pose rule and oversized the device.

Two causes, both in the rules rather than in the renderer:

- **No rule caps the device's share of the frame.** "Fully visible and readable" gives the model a reason to enlarge it and nothing to stop at.
- **Legibility and natural posture conflict, with no resolution order.** A person reading their own phone angles it toward themselves; a screen facing the camera requires presenting it outward. Asked for both, the model produces a pose that is neither. The behavior seen in earlier sessions where screen content lifts off the device into a floating overlay is likely the same collision resolving the other way.

The fix is a scale constraint plus a stated resolution order for which requirement wins. Evidence in `evaluations/2026-08-11-display-copy-first-renders.md`.

### Invented screen content is ungoverned

Every screen-bearing render on 2026-08-11 filled its screen with invented text, and the severity rose as scene direction improved. One produced an internally consistent analytics dashboard with fabricated performance figures. Another produced a patient message from an invented, verified-badged surgical center containing post-operative instructions including a specific lifting limit.

The narrowed text safety rule states that apart from authored display copy, no other words are invented. It does not hold, because it was written for background surfaces and a product demonstration scene makes the screen the subject.

Three directions were identified and none chosen: screen content becomes governed copy, declared and audited like a headline; screen-bearing scenes get a hard rule that device screens carry no readable text; or screen content is permitted but flagged in findings as ungoverned text requiring review. There is a hook in `inferScreenBearing` for whichever way it goes.

**Deferred deliberately**, per the owner: the iteration waits for a real client to say what is a dealbreaker rather than being solved speculatively. Recorded with the qualification raised at the time, that a fabricated named healthcare organization issuing fabricated clinical instructions is a different class from audit noise, because the failure is not a threshold needing calibration.

### Display copy character budgets are reasoned, not measured

The characters-per-line figures in `src/copy/display-budget.js` come from typographic practice rather than measurement against rendered output. The first run allowed roughly 114 characters for a headline that set at 27 and broke across three lines, so the budget was not constraining anything.

The budget has since been reframed from a fit ceiling to a legibility floor, which is the correct model, but the numbers behind it are unchanged. Correct them using actual line breaks from real renders rather than arithmetic.

### Read-back verification for rendered copy does not exist

ADR 0014 part two specifies that the system reads rendered text back out of the image and compares it against the intended string, failing on mismatch. It is not built. The person is currently the verification step: the result screen shows the intended string beside the image and states that nothing checks it, and the compiled record carries `verified: false`, never set true by assertion.

When it is built, the measurement needs two numbers, not one. The exact-match rate by string class sets the retry cost. The rate at which verification passes a string that was actually wrong determines whether stakes matter at all. Mismatches should be scored by kind, malformed characters against substituted words, because the first is a quality problem and the second is a governance problem.

---

## Content and prompt debt

### Review questions written under earlier synthesis instructions

The synthesis instructions gained explicit plain-language rules for review question `summary`, `method`, and `rationale`, including a banned-word list. Questions generated before that change keep their original wording, since they are stored in the brain.

Re-synthesizing rewrites them and bumps the version. Whether that trade is worth making is a per-client judgment, not a default.

### Interface renames must reach the prompts

When the interface renamed exact asset to protected asset, the synthesis instructions kept the old term and the model wrote "exact asset" into copy users read. Fixed, and recorded here as a standing check rather than a task: **a user-facing vocabulary change is not complete until the prompts use the new word.**

### Slots holding model output need to survive long text

The artifact reader clipped its own content because two heading slots were fed model-generated strings. The SLAKE fixture has short values in both fields, so the fault only appeared once a real brand's synthesis filled them properly.

Standing check rather than a task: **any slot that renders model output should be tested against text several times longer than the fixture provides.**

### The studio reference picker offers a narrow slice and cannot upload

Reported broken in the live app on 2026-08-15: the creative inputs picker in the studio would not let the user upload or choose from previously uploaded sources. What the code confirms: the picker offers only sources that already contain a PNG, JPG, or WEBP file stored in Blob. Link sources never appear, document sources never appear, and the picker has no upload of its own. A client whose inspiration went in as links or documents sees an empty list. Whether a further live failure sits on top of the filter is not yet established.

The larger design answer is ADR 0016: declared influences reach every render automatically through the visual grammar, so the picker stops being the only channel where an intake influence touches an image. The owner decided on 2026-08-15 that the picker stays manual and deliberate: a per-job tool for the specific case of wanting the renderer to look at a particular image. Automating it was considered and dropped, because the benefit of image conditioning on top of grammar text is untested, the two frames that reached their target look did it with text alone, and the image channel is the ungoverned one. Revisit only if the evaluation loop shows grammar text falling short of a look, with that measurement in hand. Fixing the picker's filter and empty state remains worthwhile at low priority, since the deliberate channel survives.

---

## Known deficiencies with owners elsewhere

Recorded for completeness. These are not this workstream's to fix.

- **`resolveClientId` is a security placeholder.** Every API route resolves the client from a cookie with no session validation. ADR 0011 names the shared-password gate as a known deficiency with a planned replacement. Jim's authentication slice.
- **Deterministic composition is specified and not implemented.** The glossary states that a locked asset should never be regenerated when it can be composed deterministically. The live path sends protected assets through the OpenAI edits endpoint, which is model-based placement. This one matters commercially, because "your logo is placed, never redrawn" is the natural thing to say and the implementation does not currently guarantee it.
- **The 12-function Vercel Hobby ceiling.** Held so far by dispatching new operations through existing handlers. A new serverless function requires freeing a slot or moving to Pro.
