# Findings: edit-call grounding, and showing the prompt that was actually sent

Date: 2026-09-02
Base: `main` at `7d17a5163fc9769bdac6ec1bbaf74a1ee15c017d`. Asserted before any work; HEAD had not moved.

## What this session changed

Six changes. Two are render fixes on the Seedream edit call. Three remove text that addressed the system rather than describing anything to render. One fixes a display that had been showing the owner a prompt the model never received.

## The two render fixes

Both come from the fal schema for `bytedance/seedream/v5/pro/edit`, read on 2026-09-02 at `https://fal.ai/models/bytedance/seedream/v5/pro/edit/llms.txt`. (Verified: source read this session, per the brief.)

**No `image_size` on an edit.** The endpoint defaults the field to `auto_2K`, which means the output follows the input image. We were overriding it with an explicit pixel size on every call. Specifying an output size on an edit reads as a request to generate rather than to change one object in a frame we supplied. The key is now omitted rather than sent as `auto_2K`, so the documented default applies.

`baseInput` in `src/renderers/seedream-images.js` no longer sets the field. `buildSeedreamTextToImageRequest` adds it to the body after the base object, which preserves key insertion order, so the serialized text-to-image body is unchanged. `seedreamImageSize` is untouched and still exported.

This also changes single-call Seedream renders that carry a reference image, since those route to the edit endpoint as well. That is intended. The rule now is that edits follow their input and generations get a size.

**The placement instruction names its figures.** The endpoint's own prompt convention identifies inputs by figure number; its published example is "Replace the product in Figure 1 with that in Figure 2." Our instruction named no figures, so the model received two images and had to work out for itself which one was the scene and which one was the product.

Before:

```
Replace the can with the supplied can image. Keep the label upright and readable.
```

After:

```
Replace the can in Figure 1 with the can in Figure 2. Keep the label upright and readable. Everything else in Figure 1 stays exactly as it is.
```

Call-site ordering was confirmed before the edit and is unchanged. `generateProductionImage` builds `referenceImages` as the scene first and the locked asset second, so Figure 1 is the scene and Figure 2 is the product. That ordering is now load-bearing in a way it was not before: the figure numbers are only true because of it.

The noun stays hardcoded to "can" per the standing owner ruling. `productName` stays in the signature, still ignored. The orientation sentence stays and gets tested for removal after grounding is proven, since the evidence for it was collected while the edit was ungrounded.

## The three text removals

**Instagram portrait craft, `app/app.js`.** The first sentence explained to a person why 4:5 is the default, and the scroll and caption clauses were the same kind of thing. All three were being sent to an image model. The composition consequences are kept.

Before:

```
The largest shape in the Instagram feed, which is why it is the default. It arrives top edge first as someone scrolls, so put the subject in the upper two thirds and let the lower third carry ground, shadow, or open space. Vertical depth reads better here than side to side composition. Caption text sits directly beneath, so the bottom edge should feel finished rather than cut off.
```

After:

```
Put the subject in the upper two thirds and let the lower third carry ground, shadow, or open space. Vertical depth reads better here than side to side composition. The bottom edge should feel finished rather than cut off.
```

Only the `ig-portrait` entry changed. Other format entries read similarly and were out of scope.

**Face framing rule, `src/production/prompt-craft.js`.** "Primary scale" is our vocabulary, not a visible fact.

Before, first sentence: `When a person appears at primary scale, they are engaged with a task or the scene rather than presenting to the camera.`

After, first sentence: `A person close enough to see clearly is engaged with a task or the scene rather than presenting to the camera.`

The two sentences after it are unchanged.

**Empty Creative references section, `src/production/package.js`.** When no reference is attached the section now returns `null` and is dropped by the existing filter at the end of the section array, which is the pattern several neighboring entries already use. Both sentences it used to emit addressed the system rather than describing anything to render.

Removed body: `No creative source image is attached. Resolve open visual choices from the approved Brand Brain.`

## The display fix

`renderPreflight` rendered `generationPackage.sections`, which is the single-call compile. On a Seedream job with a locked asset that prompt is never sent; the scene call sends a different compile from `scenePass: true`. The owner had been reviewing text that did not reach the model.

`prepareProductionPackage` now stores `sceneSections: scenePackage.sections` alongside `scenePrompt`, because the interface renders the section array rather than the flat string. `renderPreflight` renders those sections when `twoCall` is present, under the heading "Sent to build the scene," and shows `twoCall.placementInstruction` beneath as a second block under "Sent to place the product." The section-count pill counts the scene sections. `copyPrompt` copies what is displayed: on a two-call job, the scene prompt then the placement instruction, separated by a blank line. Single-call preflight renders and copies exactly as before.

## The parity fence did not exist in runnable form

The brief expected items 3, 4, and 5 to move parity baselines that are held byte identical, and expected the before and after text to be recorded against them. Neither parity harness runs.

Both were run in a clean worktree at `7d17a516` before any edit of this session, so both conditions are pre-existing:

- `fixtures/adr-0017-step4-parity.mjs` throws `ReferenceError: clean is not defined` at `fixtures/adr-0017-step4-parity-baseline.js:57`, inside `selectAestheticMode`. The frozen baseline compiler copy calls a helper it does not define, so the harness dies before it compares anything. This is the fixture that would have caught items 4 and 5.
- `fixtures/adr-0018-phase0-capture.mjs` throws on a missing input file, `fixtures/adr-0018-phase0-inputs/mycopop-brain.json`, which is not in the repo.

Neither file was touched this session, on the owner's instruction. They are recorded here to be handled separately.

A related fact worth writing down: `node --test` does not pick up either harness. It matches `fixtures/copy-audit-mechanism-test.mjs` on the filename pattern, but `*-parity.mjs` and `*-capture.mjs` do not match, so neither has been gating anything in the suite run. How long the ADR 0017 baseline has been dead is not established. (Reasoned from the two observations above; the commit that broke it has not been located.)

Because the fence could not be exercised, the before and after evidence below was taken directly instead, by importing the compiler at `7d17a516` and the compiler at head into one process and diffing their section output on the same inputs.

## Recorded compiler diff, items 4 and 5

Reference-free scene job, synthetic brain, same inputs to both compilers.

```
BEFORE sections: Assignment, Capture, People, Creative references, Protection, Output
AFTER  sections: Assignment, Capture, People, Protection, Output
```

Prompt length on that fixture: 375 words before, 357 after.

Section bodies that moved are the two quoted above. Every other section is byte identical.

## Test suite

Baseline at `7d17a516`, after `npm install`: 165 tests, 164 pass, 1 fail. The failure is `fixtures/copy-audit-mechanism-test.mjs`, which fails for a missing key and is pre-existing ambient state. It was left alone.

Three tests failed after the edits, all predicted from items 2 and 4: the face-rule assertion in `test/production-openai.test.js`, and two placement-instruction string assertions in `test/production-seedream.test.js`. Those three were updated to the new text.

Three tests were added: no `image_size` on an edit request body, no Creative references section when no reference is attached, and no occurrence of "primary scale" in a compiled prompt.

After: 167 tests, 166 pass, 1 fail, the same pre-existing failure.

## Reference-present path, confirmed after the push

The truthy branch of item 5 is byte identical to the compiler at `7d17a516`. Checked by importing both compilers into one process and compiling the same inputs at one reference and at two. In both cases the Creative references section body matches exactly, the section holds position three in the array, and the full section order is unchanged. (Verified by compile, 2026-09-02.)

One reference:

```
Material board. Guiding influence for Mood. Calibrates feeling only. Do not carry over: Logos These sources guide only the named qualities and do not replace the approved Brand Brain.
```

Two references:

```
Material board. Guiding influence for Mood. Calibrates feeling only. Do not carry over: Logos Light board. Strong influence for Lighting. Sets the light. These sources guide only the named qualities and do not replace the approved Brand Brain.
```

No revert is required.

## Open at the close of this session

Both parity harnesses are unrunnable and neither is picked up by `node --test`. Left in place on the owner's instruction, to be handled separately. Until they are fixed, the compiler has no byte-identity gate running in the suite.

The orientation sentence in the placement instruction is still untested for removal. Its evidence was collected while the edit was ungrounded, so it gets tested after grounding is proven on real render output, not before.
