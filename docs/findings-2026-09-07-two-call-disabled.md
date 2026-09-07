# The two-call render stops triggering

- Date: 2026-09-07
- Base commit: `1005cb632fc62553f2f1e77fb830ed419a636721`
- Modules: `src/production/service.js`, `docs/image-pipeline-contract.md`, `test/production-seedream.test.js`
- Status: shipped

## What changed

One line in `src/production/service.js`. The condition that split a Seedream render in two when the job locked an asset now reads `twoCallEnabled && plannedEngine.name === "seedream" && lockedAsset`, with `const twoCallEnabled = false;` declared directly above it. Every render is one call.

Nothing was deleted.

## Why

The two-call render existed to withhold the product from the scene call and swap the real asset in afterward. It worked because the scene pass replaced the Product knowledge section with a plain-product placeholder: call one drew a plain unmarked can, and call two replaced that can with the real one.

That premise died at `c8664ba3`, where no product section compiles on any scene render and the writer names the product in its prose instead. Under that shape call one draws an invented product from the writer's description, and call two is handed a frame that may hold two cans and asked to replace "the can" in it. The branch was left inconsistent with the pipeline around it by a change made elsewhere.

The owner has ruled single call with the locked asset as the render path.

## What a locked-asset Seedream job does now

It sends the compiled single-call prompt with the locked asset supplied as a reference image. That routes to the Seedream edit endpoint by the ordinary rule that any reference image routes there, so the endpoint recorded on the job is unchanged. One image is written rather than two, so there is no `{jobId}-scene` intermediate and the discard path has one image to find.

`generationPackage.twoCall` is absent, so the preflight falls through to `generationPackage.sections` and shows the single-call prompt. That required no change in `app/app.js`: the preflight already reads `twoCall?.sceneSections?.length ? twoCall.sceneSections : generationPackage.sections`, and the falsy branch is the one that now runs.

## What is preserved, and how it returns

Set `twoCallEnabled` to true. That is the whole return.

Preserved and still reachable from that one value: the branch body that builds the `twoCall` record; `productPlacementInstruction` and its three sentences; the `scenePass` compile mode in `src/production/package.js` and the compile that sets it; the render dispatch's two-call arm; the scene image write under `{jobId}-scene`; the scene image delete in `#outputArtifactPathnames` in `src/production/store.js`; and the preflight's two-call display.

The failure the split was built for is expected to return with it. A single Seedream edit call carrying the product as a reference returned the product oversized, because the reference fills its own frame and that framing carries into the generated scene. That is recorded in `docs/findings-2026-09-02-two-call-seedream.md` and it is the thing to watch on the first locked-asset renders under the single call. If it comes back, the branch is one value away, though it will need the product placeholder question answered before it is worth turning on: the reason it is off is that call one no longer draws a stand-in.

## Keeping the preserved code from rotting

Disabled code that nothing runs stops working quietly, and the next person to flip the flag inherits the debugging. `test/production-seedream.test.js` therefore carries a test that reads `src/production/service.js`, asserts `const twoCallEnabled = false;` appears exactly once, writes a copy with the flag set true and its relative imports rewritten to absolute ones into the OS temp directory, imports that copy, and runs a full locked-asset Seedream job through it. It asserts both calls, both endpoints, the fixed placement instruction, the image order on call two, the `twoCall` record, and both written images. The temp file is removed in a `finally`.

That test fails if someone deletes the branch, renames the flag, declares it in more than one place, or lets the preserved code drift out of working order. It is deliberately not a dependency-injection seam on `prepareProductionPackage`, because a second way to turn the branch on is a second thing to keep in step with the first.

## Tests touched

All in `test/production-seedream.test.js`.

- `a locked asset on Seedream renders the scene first and then places the product` becomes `a locked asset on Seedream renders in one call with the asset supplied`. It asserts one call, the edit endpoint, one supplied image, and that the prompt is the compiled package prompt rather than the placement instruction.
- `the record carries both prompts, both endpoints, and both images` becomes `a locked asset on Seedream records no two-call plan and writes one image`. It asserts `twoCall` is absent, the locked asset is still on the package, the compile is still the three-section scene shape, the endpoint is still the edit endpoint, and one image is written.
- `the scene call asks for a plain product at true size and carries no label demands` becomes `the product record's label demands do not reach the renderer`. Its premise was call one, and there is no call one. What it was really pinning is still worth holding, so it now asserts the single call's prompt carries none of the product record's four legible-statement demands and none of its exclusions.
- `flipping twoCallEnabled restores the two-call render` is new and is the coverage described above. The assertions it carries are the ones lifted from the two rewritten tests, so nothing that was checked about the two-call path stopped being checked.

Untouched and still passing: `the placement instruction names both figures and ignores the product name`, which tests `productPlacementInstruction` directly and does not depend on the branch running.

## Verification

- `node --check` on `src/production/service.js` and `test/production-seedream.test.js`.
- Full suite: 166 tests, 165 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, is pre-existing, and was left alone.
- No temp file left behind after the suite run, checked.
- No em dashes in any touched file, scanned mechanically for the em dash, en dash, horizontal bar and minus sign plus the escaped and HTML entity forms.
