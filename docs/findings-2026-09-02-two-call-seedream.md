# Finding: Seedream renders a locked asset in two calls

Date: 2026-09-02
Scope: the Seedream render path when a locked asset is present. Seedream with no locked asset is unchanged. Both OpenAI paths are unchanged. The compiler is not touched at all.

## The evidence that forced the change

1. Every single-call Seedream render that carried the product as a reference image put the product in the frame oversized. The reference image fills its own frame, and that framing carried into the generated scene. (Verified by hand across renders on 2026-09-01 and 2026-09-02.)
2. A render of the same scene with no reference image at all got scale and realism right. The picnic render is the recorded case. (Verified by hand on 2026-09-02.)
3. A separate edit call, given that scene render and the real product image, reproduced the label correctly. (Verified by hand on 2026-09-02.)
4. One of those hand-run edits came back with the label upside down. The instruction now carries an orientation clause naming Figure 2 as the reference for which way up the label reads. (Verified by hand on 2026-09-02.)

Taken together: the model gets scale right when nothing is supplied and gets the label right when something is supplied, and no single call gets both. So the render is split.

## What was built

When the engine is Seedream and a locked asset is present, one render request now makes two sequential model calls.

**Call one, the scene.** Text to image. The locked asset is withheld. Creative references and a template asset, when present, still travel with this call, since they exist to steer the scene. When there are none, the call carries no images at all and hits the text-to-image endpoint.

The prompt for this call is the compiled prompt with the locked asset withheld. `prepareProductionPackage` builds one `compileInputs` object, compiles the real package from it, and compiles the scene prompt by calling the same compiler a second time with `lockedAsset: null`. The compiler is not forked, not branched, and not given a new argument. It already produces exactly the shape this call needs for any job that locks nothing. The locked asset stays on the package and on the stored record, because the job did lock one.

Product knowledge still compiles into call one. That is deliberate: it tells the model to draw a stand-in product at world scale, which is what gives call two something correctly sized to replace.

**Call two, the placement.** The edit endpoint, with `image_urls` in scene-then-asset order, because the instruction names the two images by figure number. The instruction is fixed text, not compiled text, held in `productPlacementInstruction` in `src/production/service.js`. The product name is substituted from the product record when the job names one and is the word "product" otherwise. The result of this call is the deliverable.

## The judgment I made that is reversible in one line

Creative references and template assets go with call one rather than call two. They exist to steer the scene, and call two is a swap operation that is told to leave everything else alone. Only the locked asset moves to call two. The filter is `allReferenceEntries.filter((entry) => !entry.isLockedAsset)` in `generateProductionImage`; moving a class of reference to the second call is a change to that one expression.

## What the record carries

The generation package gains a `twoCall` block holding the scene prompt, the placement instruction, both endpoints, the model, and the id and pathname of the stored scene image. Both prompts are therefore on the record, so a reviewer can read what each call was asked for.

The scene render is written to storage through `productionStore.writeImage` under the job id with a `-scene` suffix, which puts it at the same path shape and the same client namespace as any finished render. No new storage function and no new blob shape. A failure writing it is swallowed, because the deliverable already exists by that point and losing the intermediate should not cost it.

`app/app.js` shows the scene render under the final image on the production record detail, labeled "Scene before product placement". It points at the existing stable image route, so no new API function was added and the 12-function ceiling is untouched.

The record's `endpoint` field still resolves through `chooseSeedreamImageEndpoint` over the full entry list, which returns the edit endpoint when a locked asset is present. The final call is an edit call, so the existing reference-guided provenance label reads correctly. The regex fix from 2026-09-01 was not touched. (Verified by test.)

## Two sentences that still say "supplied" in the scene-call prompt

The acceptance criterion asked that the scene-call prompt carry no supplied-image protection sentences. Three of the four go away, and two sentences remain that name a supplied image. Neither was removed, and here is why.

1. In Protection: "Do not render any text into the image beyond what appears on the supplied product." This is `SCENE_NO_RENDERED_TEXT`, which compiles on every scene render whether or not a locked asset is present. It is not gated on the locked asset.
2. In Product placement: "The supplied product image is the subject of this frame." This compiles when the brief sets `assetType` to `product`, which is also not gated on the locked asset.

Both sentences appear today in every no-locked-asset render on both engines. Changing either would change the OpenAI no-locked-asset prompt, which this work is required to leave byte identical. So they stand, and the scene call inherits the same wording any unlocked job gets. Whether either sentence should be reworded is an owner ruling for a later session, not a silent fix here. (Verified by compiling the fixture-shaped scenes on both trees; see the acceptance section below.)

The three sentences that do drop are the asset fidelity sentence, the single-readable-unit sentence, and the state lock sentence. Those are the ones that told the model an exact product image was in front of it.

## Timing

Both calls run inside one request. Observed single-call time is around 110 seconds and `maxDuration` is 300, so two sequential calls fit with margin on most pulls. (Verified for the single-call figure from prior sessions; the two-call total is Reasoned from it, since no timed production pull has run against this build yet.)

If slow pulls start hitting the ceiling, the fallback is fal's queue mode. It is deliberately not built now.

## Cost

Roughly double, to about 14 cents per locked-asset render. (Stated by the owner in the build instruction; I did not independently price the fal endpoints, so verify against a fal invoice before quoting the figure to anyone.)

## Two things left open

1. **The pipeline contract was not updated.** `docs/image-pipeline-contract.md` describes `prepareProductionPackage` and the render invocation with line references around L489 to L504, and describes the render as a single call. Those line numbers have shifted and that description is now incomplete for the Seedream locked-asset path. The standing rule is that the contract is updated in the same commit as any module change it covers. The build instruction for this session named the files the diff may touch and did not include the contract, and made "diff touches only the named files" an acceptance check. I followed the instruction and left the contract alone. It needs one follow-up instruction to bring it current.
2. **Discarding an output leaves the scene image behind.** `deleteOutputArtifacts` deletes `{jobId}/output.png` and `{jobId}/package.json`. The scene render lives at `{jobId}-scene/output.png` and is not in that list, so discarding a two-call output orphans one image in Blob. `src/production/store.js` was not in the named file list, so this was not changed. (Verified from the committed code.)

## Tests

Five tests were added to `test/production-seedream.test.js`:

1. A locked asset on Seedream produces exactly two calls. Call one hits the text-to-image endpoint, carries no `image_urls`, and its prompt contains none of the three locked-asset protection sentences. Call two hits the edit endpoint with two images in scene-then-asset order and carries the fixed instruction.
2. The record carries both prompts, both endpoints, the model, the scene image id, and both images were written to storage under the two expected ids.
3. `productPlacementInstruction` substitutes a product name when one is supplied and falls back to "product" when the name is missing or blank, and carries the orientation clause.
4. Seedream with no locked asset renders in one call and records no `twoCall` block.
5. OpenAI with a locked asset renders in one call, uses the compiled package prompt, and records no `twoCall` block.

Suite before: 147 tests, 146 pass, 1 fail. Suite after: 152 tests, 151 pass, 1 fail. The single failure is `fixtures/copy-audit-mechanism-test.mjs` in both runs, which depends on credentials that are not present in this environment. It is unchanged by this work.
