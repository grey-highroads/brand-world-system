# Finding: the scene call draws a plain product, and recovery waits for the render

Date: 2026-09-02
Scope: the two-call Seedream path's first call, and the client's behavior when the generate connection drops. Single-call renders on both engines are unchanged in every byte. The placement call is untouched.

Two defects surfaced in one job and are fixed together here.

## Defect one: the scene call rendered a giant product

**The evidence.** The before image on the job record shows the scene call's output with the can at roughly half the frame. No reference image was attached to that call at all, so the oversize cannot be the reference framing problem recorded in `docs/findings-2026-09-02-two-call-seedream.md`. Something in the prompt asked for it. (Verified from the job record.)

**The cause.** The scene prompt inherited the full Product knowledge section, which compiles the product record's visual direction. On this product that direction asks for the vertical branding and the flavor, energy, caffeine-free, and volume statements to be visible. A model that has been told those statements must read has one way to comply: make the can big enough to carry legible text. It was not ignorant of scale, it was obeying a legibility instruction. (Reasoned from the compiled prompt and the before image. The mechanism is the most direct explanation of both, and the next live render is what confirms it.)

**Why the instruction was never needed.** The scene call's product is replaced by the placement call. Whatever label the scene call draws is discarded. Every word of label direction in call one is spent on an object that does not survive to the deliverable.

**The fix.** `compileBrandWorldImagePackage` takes a `scenePass` option, default false. When it is true and the job names a product, the Product knowledge section body compiles as:

> This scene includes {product name}, shown as a plain unmarked version of the product at its true physical size relative to hands, furniture, and surroundings. No label, lettering, or artwork is needed on it; the real product artwork is applied in a separate step.

Nothing else changes. `prepareProductionPackage` sets the option on the second compile, beside the `lockedAsset: null` it already passed. This is a mode of the one compiler rather than a fork, so the invariant that the scene prompt is never a second prompt to maintain still holds: one flag, one expression, one section body.

## Defect two: the app abandoned a render that was still working

**The arithmetic.** The generate connection drops around 60 seconds. That cause is external and is tolerated rather than fought. The recovery loop then polled 20 times at 1.5 seconds and gave up after 30 seconds. A two-call render takes roughly four minutes. Thirty seconds of patience for a four minute job means the screen reports failure while the render is barely a fifth of the way through. Tonight's job completed successfully about three minutes after the screen said it had not. (Verified by hand.)

**The fix.** `recoverProductionJob` now polls until the job reports complete or error, with an eight minute ceiling. Eight minutes sits above the server's own 300 second `maxDuration`, so a job that could still be running is still waited for and a job that cannot be running no longer holds the screen. The interval is 2500 ms: each attempt reads the current-job record from blob storage, and a render measured in minutes gains nothing from tighter polling.

**The mixed state.** The screen previously derived its failure state from `state.production.status`, which the dropped connection had set to `error` while the job itself still reported `working`. That produced error text beside a Working badge on the same screen. The failure branch now reads the job's own status, and falls back to the local status only when there is no job to ask. A dropped connection sets no error state on its way into recovery at all; only an exhausted recovery does, and it marks the job record it holds as errored so the screen has one status to read rather than two.

## What the next live render should show

1. The scene image carries a plain unmarked product at a size that reads as real next to hands and furniture.
2. The finished image carries the real label, applied by the placement call.
3. The connection drops around sixty seconds and the screen stays in the rendering state, then resolves to the finished image when the job completes.

If the product is still oversized in the scene image with the placeholder compiling, the cause is not the label demands and the visual direction is not the lever. That is the falsifiable half of the reasoning above.

## Verification

**Byte identity of single-call compiles.** A pristine head checkout was cloned beside the working tree and both compilers were run over the four frozen fixture scene shapes in `fixtures/adr-0018-phase0-scenes.json`, locked and unlocked, against a synthetic brain and a synthetic product record whose visual direction carries the same kind of label statement demands as the live record. All eight compiles are byte identical. The engine name never reaches the compiler, so engine coverage follows from that rather than from separate runs. (Verified.)

**Tests added.**

- `test/production-seedream.test.js`: a two-call render with an approved product record. The scene prompt contains the placeholder with the product name, contains no `Visual direction:` line and none of the label statement demands, and equals the recorded `twoCall.scenePrompt`. The single-call prompt on the same job still carries the full product section. Call two's prompt is identical to `productPlacementInstruction("Yuzu Ginger can")`.
- `test/production-seedream.test.js`: the scene pass changes the Product knowledge body and no other section, and `scenePass: false` compiles identically to omitting the option.
- `test/browser-prototype.test.js`: a job reporting `working` keeps the rendering state even with a local error string set, which is the mixed screen made unreachable. A job reporting `error` renders the failure state with its retry control. A third test pins the two recovery constants.

**What is not covered by test.** The polling loop itself runs on a real clock and the vm harness's `setTimeout` never fires its callback, so a full recovery run would hang rather than pass. The loop is verified by reading and by the next live render. The two tests that matter, the ones covering which status decides the screen, do run.

**Suite.** Before: 157 tests, 156 pass, 1 fail. After: 162 tests, 161 pass, 1 fail. The single failure is `fixtures/copy-audit-mechanism-test.mjs` in both runs, which depends on credentials absent from this environment and is ambient state 10.

## The contract

`docs/image-pipeline-contract.md` is updated in this commit, per the same-commit rule for the two modules it covers. It gains a delta block describing the scene pass, the placeholder and why it exists, the recovery arithmetic, and the failure-state derivation. Three existing statements that described the scene prompt as the compiler with one argument dropped now name the mode as well, and the stale `recoverProductionJob` anchor, which read L7438 against a function at L8072, is corrected. Every anchor cited was read from the tree rather than carried forward from the old text.

## Out of scope, untouched

Queue mode. The 60 second connection cut itself. Any prompt change beyond the placeholder. Look language. Engine changes.
