# Findings, 2026-09-02: can shape wording, and matching the can already in the frame

- Base commit: `c2873ae07a0eb44901af79cabfd7b8bb7a17ed1d`, asserted before any work. HEAD had not moved.
- Files changed: `src/production/package.js`, `src/production/service.js`, `test/production-seedream.test.js`, `docs/image-pipeline-contract.md`, this document.

## What the render showed

The render after the previous session fixed both things it was meant to fix. The real label survived into the final image and the rest of the frame was preserved exactly, so grounding is not in question here. Two problems remain, one on each call, and each shows in a different image.

Call one drew a standard stubby can in plain silver. The placeholder sentence asked for a "12 oz sleek can". Sleek is the can trade's name for the tall narrow format, and the model read it as an adjective meaning polished and streamlined. The trade term does not carry (Verified: owner identified this from the scene image).

Call two returned a replacement can roughly twice as wide and three times as tall as the can it replaced. The proportions are not distorted, it is scaled up. The product photo fills its own frame, and the model took the size from there rather than from the can already in the scene (Verified: owner read this off the final image; Reasoned: the framing of the product photo is the mechanism, since the swap is otherwise faithful).

## The two edits

**Item 1, `sceneProductPlaceholder` in `src/production/package.js`.** The returned string is now:

```
This scene includes a plain unmarked tall narrow can at its real size.
```

Two words go. Sleek goes because the model reads it as a finish. The volume goes because a number of ounces is not a visible property of a picture, and it is the same category of word as sleek. The guard on an empty product name is unchanged.

**Item 2, `productPlacementInstruction` in `src/production/service.js`.** The returned string is now:

```
Replace the can in Figure 1 with the can in Figure 2. Match the size and position of the can already in Figure 1. Keep the label upright and readable. Everything else in Figure 1 stays exactly as it is.
```

One sentence added in second position, nothing else changed. The noun stays hardcoded to "can" per the standing ruling, and `productName` stays in the signature and stays ignored.

The comment blocks above both functions were rewritten to record why the wording moved, since the existing comments explained the old strings and would have misdescribed the code.

## What the tests carried

The brief asked whether any test asserts the placeholder string, and expected two tests carrying the placement instruction. Three assertions carry the two strings, not two:

- `test/production-seedream.test.js` L379, the recorded `placementInstruction` on the two-call package.
- `test/production-seedream.test.js` L394, the direct assertion on `productPlacementInstruction` across three argument shapes.
- `test/production-seedream.test.js` L471, `assert.match` on the scene prompt for the placeholder sentence. This one asserts the placeholder and was not listed in the brief.

All three were updated. The adjacent `assert.doesNotMatch` on the pre-minimal placeholder wording at L472 is unaffected and stays.

Two findings documents also quote the old strings: `docs/findings-2026-09-02-scene-placeholder-and-recovery.md` and `docs/findings-2026-09-02-edit-grounding.md`. Both were left as written. They are dated records of what the strings were on the renders they describe, and editing them would make the record of those renders wrong.

## Single-call parity

Neither string reaches the single-call path. `sceneProductPlaceholder` is called at exactly one site, `package.js` L663, behind `scenePass ? ... : compileProductSectionForImage(product)`, and `scenePass` defaults to false. `productPlacementInstruction` is called at exactly one site, `service.js` L433, inside the two-call branch (Verified by tree-wide grep for both identifiers).

That was checked rather than left as an argument. A temporary harness compiled the package with `scenePass` at its default across four placements, Social post, Website hero, Sales enablement, and Brand template, each locked and unlocked, each with and without a product record carrying a visual direction and exclusions. All sixteen compiled prompts are byte identical before and after the edits, and none of them contains either the old or the new placeholder wording. The harness was not committed.

The engine choice does not enter this. `resolveRenderEngine` selects which model receives the prompt and never what the prompt says, so one compiled-prompt comparison covers both engines (Verified: `renderEngines` and `resolveRenderEngine` in `service.js` take no part in compilation; stated in the contract's engine-table entry).

## Test suite

Full suite run before and after. 167 tests both times, 166 pass, one fail. The single failure is `fixtures/copy-audit-mechanism-test.mjs`, failing for a missing key. It fails identically at the base commit, is pre-existing, and was left alone per the brief.

## What these two do and do not do together

They sit on different calls and each shows in a different image, so the next render reads both cleanly. The scene image answers item 1 and the final image answers item 2.

They are not independent in effect. If item 1 works and call one draws a tall narrow can, the swap has less proportion change to make, and the final image may come out closer to right partly for that reason. That is expected and was not designed around.

## Out of scope, still open

The dead parity harnesses and the missing byte-identity gate recorded in `docs/findings-2026-09-02-edit-grounding.md` are untouched and still unfixed. They get their own session.
