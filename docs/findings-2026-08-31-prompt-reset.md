# Finding: compiled image prompt reset to a scene-majority shape

Date: 2026-08-31
Scope: the scene-path compiled image prompt only. Template and sales-enablement paths compile byte identical to the commit before this one, checked across four shapes including guardrails, product rules, brief exclusions, and a template asset.

## What was cut from the scene-path prompt

Four things stopped compiling into the render prompt. None of them left the system. All of them remain in the brain, in treatments, and in every governed record.

1. The human texture floor. The clauses describe portrait-distance anatomy, most frames are near to mid distance, and the 2026-08-31 review found the frontal framing, not missing anatomy language, was the plastic-face cause. (Reasoned, from the 2026-08-31 render review.) The clauses stay in `prompt-craft.js` with a dated comment so reversal is one revert.
2. The world block ("The world this brand lives in"). The scene writer stays briefed by the visual grammar per ADR 0016 step 4, and the grammar still lives in the brain and in every governed record. Only the render prompt stops reciting it as a block.
3. The refusal recital ("What this brand is not"). Refusals remain governed records per ADR 0017 and keep reaching treatments and storage. The prompt stops reciting them.
4. The long-form protection compilation, including guardrail recitals, product exclusion recitals, and the brief exclusions line.

## What replaced it

1. A face rule, compiled as its own People section immediately after Capture, only when the person check fires. Exact text is `FACE_FRAMING_RULE` in `prompt-craft.js`.
2. A compact Protection block, `sceneProtectionBlock` in `prompt-craft.js`: one always-on text safety clause, and, when a locked asset is present, one asset fidelity sentence, one single-readable-unit sentence, and one state-lock sentence. When authored display copy compiles, the "do not render any text" sentence is dropped and the display copy block governs rendered text.

The scene-path prompt is now six parts: Assignment, Capture (the look line alone, or the capture character floor when no look is selected), People (conditional), Product knowledge (unchanged), Protection (compact), Output (unchanged).

## ADRs this touches

- ADR 0016: the grammar no longer compiles as a prompt block. The scene-writer briefing from step 4 is unchanged.
- ADR 0017: refusals remain governed records and stop being recited into the prompt.
- ADR 0018: the failed 500 to 900 word gate is back in force as a target for the scene path, restated here as 400 to 600 words excluding display copy.

## Accepted gate limit (from the face rule)

A scene that implies people without naming them, the festival case, misses the `frameCarriesPeople` word-list check and gets no face rule. (Verified against the check as written.) That miss is accepted for now. The fix lives forward in the scene writer naming people explicitly, not in widening the word list.

## Additional findings recorded during the change

1. Brief exclusions no longer reach the scene prompt. The compact block's sentence list is exhaustive, and the "Also avoid" line was part of the protection compilation it replaced. The exclusions field still validates, still lands in `brief.exclusions` on the package record, and still reaches the constraint audit. If the owner wants a per-job authored avoid channel back in the prompt, that is a deliberate later addition, not a silent one here. (Verified from the committed code.)
2. The constraint audit reads the compiled prompt text. Guardrails and brief exclusions on the scene path now audit as status `review`, which is the honest record that they were not carried in the prompt. The review interface currently surfaces only `excluded` and `warning` audit statuses, so this produces no user-facing flag and blocks nothing. No check was weakened; the audit reports the new reality as it is. (Verified from `app/app.js` and `auditConstraints`.)
3. The compact block uses product wording for every locked asset kind. A locked wordmark or portrait now compiles "The supplied product image governs artwork and geometry" and the state-lock sentence, because the spec's condition is locked asset presence, matching the condition that drives `neutralizeStateLanguage` today. Whether non-product assets deserve their own compact sentence is an owner judgment for a later session. (Verified; the affected test was updated to assert this shape.)
4. The ADR 0017 step 4 parity harness (`fixtures/adr-0017-step4-parity.mjs`) can no longer pass at head, because the "What this brand is not" section it reads no longer compiles. That harness was the transition gate for its own commit, and per instrument discipline the failed state stands as history rather than being retrofitted.

## Test suite

Before the change: 126 tests, 120 passing, 6 failing. Five failures were stale prompt assertions predating this session; one (`fixtures/copy-audit-mechanism-test.mjs`) needs `OPENAI_API_KEY` and is unrelated to prompts. After the change: 125 passing, 1 failing, the unrelated one, reported and left as it is. Six prompt assertions were updated to assert the new compiled shape (the five stale ones plus one this change made stale), each carrying a one-line comment naming this change.

## Word counts (approximate)

The real fixture inputs (approved brains, accepted protections, product records) are gitignored client state per ADR 0004 and are not in the committed tree, so these compiles used stand-in brains assembled only from committed fixture material: the ADR 0016 step 1 grammar fixtures and the ADR 0017 refusal fixtures. No look was selected, so Capture compiles the full capture character floor at 208 words; a selected look would compile one line. Product knowledge is absent because product records are unavailable. Counts are therefore approximate. (Assumed close to real; verify by running the phase 0 capture harness where the inputs exist.)

- mycopop-park-lifestyle: 702 words (Assignment 242, Capture 208, People 57, Creative references 15, Protection 145, Output 28). Above the 400 to 600 target, driven by the authored scene and the no-look capture floor.
- mycopop-fourpack-product: 561 words.
- dialog-health-office-interior: 495 words.
- dialog-health-patient-message: 493 words.

The range is a report, not a blocker. The owner judges renders, not counts.

## Reversal path

One revert of this commit restores the previous prompt shape. Nothing was deleted: the human texture clauses, `worldDirection`, `rejectsDirection`, and the long-form protection compilation all remain in the tree, uncalled on the scene path.

## Amendment, later on 2026-08-31: the person gate is retired

The word-list person gate (`PERSON_WORDS` and `frameCarriesPeople`) is deleted and the face framing rule now compiles on every scene render. The festival assignment, "At a music festival like bonaroo or cochella," is the recorded miss that forced the change: it names no person, the gate returned false, and a person appeared in the render with no framing rule. (Verified from the render review.) The rule opens with "When a person appears," so it is self-conditional, and the roughly 57 word cost on personless scenes is accepted because the clause constrains a person only if one appears. The invitation risk, that a paragraph about faces coaxes a person into a frame that was never asked to have one, is Assumed low, and the owner's fixture renders are the check. Template and sales-enablement paths stay excluded from the People section exactly as they are from Capture. The festival scene is held as a regression test.
