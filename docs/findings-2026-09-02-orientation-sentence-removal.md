# Findings, 2026-09-02: the label orientation sentence comes out

- Base commit: `0d1dccdc7f640483154c8e5e1a5a3227798a302f`, asserted before any work. HEAD had not moved.
- Files changed: `src/production/service.js`, `test/production-seedream.test.js`, `docs/image-pipeline-contract.md`, this document.
- One change. Nothing else shipped in this session.

## The change

`productPlacementInstruction` in `src/production/service.js` now returns:

```
Replace the can in Figure 1 with the can in Figure 2. Match the size and position of the can already in Figure 1. Everything else in Figure 1 stays exactly as it is.
```

The label orientation sentence is removed. The other three are unchanged, in the same order, single-spaced. The noun stays hardcoded to "can" per the standing ruling, and `productName` stays in the signature and stays ignored.

The current string in the tree at `0d1dccdc` matched the brief exactly, so nothing had to be worked around.

## Why the sentence goes

Two reasons, and they are separate.

The owner ruled it out on its own terms: a candid photograph does not have perfect product facing, and when it does the picture reads as staged (Verified: owner ruling). That reason would stand even if the sentence were working.

The evidence that put it there no longer applies. The label mounted upside down on 2026-09-01 and mirrored on both evening renders of 2026-09-02, and the sentence returned under the terms the earlier cut set, which allow a removed clause back alone when its failure recurs with render evidence. All of that evidence was collected while the edit call was ungrounded, before figure numbering told the model which supplied image was the scene. The render of 2026-09-02 at 11:09 PM came back grounded, with correct label orientation, correct scale, and a preserved frame (Verified: owner read the render), so the condition the sentence answered is gone.

The two reasons point the same way here, but they are not interchangeable. If labels come back wrong on a grounded render, the second reason reopens and the first does not. The sentence returns only on that evidence.

## What carried the string

The last session recorded three assertions carrying the placement and placeholder strings, at L379, L394, and an `assert.match` at L471, and asked me to find the current set rather than trust those numbers. Two assertions carry this string:

- `test/production-seedream.test.js` L379, the recorded `placementInstruction` on the two-call package.
- `test/production-seedream.test.js` L397 before this edit, L398 after, the direct assertion on `productPlacementInstruction` across three argument shapes. The last session's note said L394. The comment above that assertion grew in the same commit that moved the string, which is what shifted it, and it moved one line further here for the same reason.

Both were updated. The third assertion from the last session, at L477 after this edit, asserts the scene placeholder sentence, which is a different string on the other call. It is untouched and still passes.

No other test refers to label orientation (Verified by tree-wide grep for the string, for "upright", and for "orientation" across `test/`).

Two findings documents quote the older forms of the string, `docs/findings-2026-09-02-scene-placeholder-and-recovery.md` and `docs/findings-2026-09-02-edit-grounding.md`, and one quotes the four-sentence form, `docs/findings-2026-09-02-can-shape-and-scale.md`. All three are left as written. They are dated records of what the string was on the renders they describe.

## Comment block

The block above the function explained the removed sentence at length and now records its absence and the terms of its return instead. One further correction while in there: the block described the preservation sentence as "the third sentence", which was already stale by one after the matching sentence was added earlier the same day. It is named rather than numbered now, so the comment does not go stale again on the next edit to the string.

## Single-call parity

The string reaches one call site, `service.js` L433, inside the two-call branch (Verified by tree-wide grep for the identifier). Nothing on the single-call path reads it.

Checked rather than argued. A temporary harness compiled the package with `scenePass` at its default across four placements, Social post, Website hero, Sales enablement, and Brand template, each locked and unlocked, each with and without a product record carrying a visual direction and exclusions. All sixteen compiled prompts are byte identical before and after the edit, and none of them contains any placement-instruction wording. The harness was not committed.

Engine choice does not enter the comparison. `resolveRenderEngine` selects which model receives the prompt and never what the prompt says, so one comparison covers both engines.

## Test suite

Full suite run before and after the edit. 167 tests both times, 166 pass, one fail. The single failure is `fixtures/copy-audit-mechanism-test.mjs`, failing for a missing key. It fails identically at the base commit, is pre-existing, and was left alone per the brief.

## Out of scope, still open

Product-record and brief exclusions are ruled for removal from image prompts on both paths and are untouched here. The dead parity harnesses and the missing byte-identity gate are untouched. The product record dropping attached images on re-synthesis is a recorded defect and is not addressed here.
