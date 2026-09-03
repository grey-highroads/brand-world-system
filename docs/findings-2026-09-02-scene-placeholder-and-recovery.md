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

## Addendum, 2026-09-02: both prompts cut to minimal instructions

The placement instruction and the scene placeholder each carried several directives at once, and those directives worked against each other in the render. The giant-can render pair of 2026-09-02 verified it. The owner ruled for minimal instructions on both: the placement instruction is now `Replace the can with the supplied can image.` and the scene placeholder is now `This scene includes a plain unmarked can at its real size.` The noun is hardcoded to "can" because cans are what we are testing, and the `productName` argument to `productPlacementInstruction` is accepted and ignored. Each removed clause was written to answer one observed failure: the orientation clause for an upside-down label, the sealed clause for an opened can, the size and position clauses for a stand-in that moved, and the placeholder's size relationships for a can that filled half the frame. Any of them returns individually, with render evidence, only if that failure recurs. Both strings compile only on the two-call path, so the single-call prompt is untouched by this change and byte identity there was not re-proved. A product-record form field replaces the hardcoded noun when this proves out.

## Addendum, 2026-09-02 evening: the two renders under the minimal instructions

Two renders ran on the job record after the cut above. Both used the minimal placement instruction and the minimal placeholder. Three failures came back, and each of the first three changes below answers one of them.

**What the renders showed.** (Verified by looking at both images.)

1. The scene call drew a standard-proportioned can. The placement call then fitted the real can onto it, matching the stand-in at the grip width and running the height to the real can's aspect, which roughly doubled it. The stand-in was the wrong shape rather than the wrong scale, so the size language in the placeholder was never the lever.
2. The label came back mirrored on both renders. It had mounted upside down on 2026-09-01 under the verbose instruction. The failure now has three occurrences across both instruction lengths.
3. The 7:38 PM scene image showed the placeholder can painted with CAFFEINE FREE, set verbatim from the product record's avoid sentence, which was still compiling into the scene call's Protection block.

**Change 1, the placeholder names the shape.** `sceneProductPlaceholder` returns `This scene includes a plain unmarked 12 oz sleek can at its real size.` "Sleek can" is the can trade's name for the format, which is why it is the phrase rather than a description of the proportions.

**Change 2, the orientation sentence returns alone.** `productPlacementInstruction` returns `Replace the can with the supplied can image. Keep the label upright and readable.` The cut set the terms for this: a removed clause comes back individually, with render evidence, when its failure recurs. Orientation recurred under both instruction lengths. Nothing else that was cut returns with it.

**Change 3, product-record exclusions stop compiling on the scene pass.** An avoid sentence naming label text has nothing to protect on a pass that draws a blank stand-in, and the renderer read it as an instruction to draw the text. The brief's exclusions still compile on the scene pass, because they are the owner's depiction intent for the scene itself and the scene pass is the pass that draws the scene. The gate sits at the single call site in `package.js` that passes the product's values into `sceneProtectionBlock`, which is also the only place that knows which pass is compiling. `prompt-craft.js` is unchanged. The constraint audit was checked for honesty before the change was made: `auditConstraints` reads only the brief's exclusions against the prompt it was compiled with, and the scene package's audit is discarded by the service, which reads only `.prompt`. Dropping the product's values on the scene pass therefore makes no audit report a carriage that did not happen. (Verified by reading `package.js` L722 to L726 and `service.js` L403 to L416.)

## Change 4: the assignment sentence boundary, verified

An outside review claimed a compiled assignment could read `holding a soda can The largest shape in the Instagram feed` with no boundary. **The claim reproduces.** (Verified by compile.) Head compiled:

```
Create one 4:5 portrait brand world image for Instagram feed. a hand holding a soda can The largest shape in the Instagram feed, which is why it is the default.
```

**The join is not in the compiler.** The format's craft paragraph is appended to the authored scene text in `app/app.js`, at two sites: the social-format branch that fires when a format is picked, and the website-format branch that fires on the studio brief. Both joined with a bare space. By the time the brief reaches the compiler the two texts are already one string, so a compiler-side fix cannot separate them. Fixing the reported defect meant editing `app/app.js`, which the brief did not name. The owner accepted the out-of-list edit after the fact.

**The fix.** `joinSceneAndCraft` in `app/app.js` adds a period only when the scene text does not already end in `.`, `!`, or `?`. `sentenceBoundary` in `package.js` applies the same rule to the scene entry of the Assignment join, which is the same defect one layer down for any scene text that arrives unpunctuated from any other path.

**Which inputs change.** Only briefs whose scene text does not end in terminal punctuation. All four frozen fixture scenes are already punctuated, so all four compile to the same bytes. A scene ending in a question mark keeps its question mark.

**One adjacent defect, recorded and not fixed.** The same Assignment join runs the composition and lighting entries together with no boundary:

```
a hand holding a soda can. Composition: Low three quarter view Lighting: Late sun Present in the scene: A chipped mug.
```

This one is compiler-authored rather than caused by malformed input, so fixing it would change prompts for well-formed briefs. That is outside this brief's bound of "only for inputs that were malformed." Owner ruling: it goes through the ritual on its own, with a before and after compile diff, as its own small brief. (Verified by compile, not fixed.)

## Verification, evening changes

**Byte identity of single-call compiles.** A pristine head checkout at `7826c539` was extracted beside the working tree and both compilers were run over the four frozen fixture scene shapes in `fixtures/adr-0018-phase0-scenes.json`, locked and unlocked, against a synthetic brain and a synthetic product record carrying two exclusions. All eight compiles are byte identical. (Verified.)

**Tests changed and added.**

- `test/production-seedream.test.js`: the three string pins updated to the new placeholder and the new placement instruction, each with a one-line comment naming this change.
- `test/production-seedream.test.js`: the scene-pass equivalence test now expects Product knowledge and Protection to differ, and still pins that `scenePass: false` compiles identically to omitting the option.
- `test/production-seedream.test.js`: a scene-pass compile with a product carrying exclusions contains neither exclusion string nor the product-record avoid clause, while the single-call compile on the same inputs still carries both.
- `test/production-seedream.test.js`: the assignment closes an unpunctuated scene sentence, leaves a punctuated one byte identical, and leaves a question mark alone.
- `test/browser-prototype.test.js`: `joinSceneAndCraft` pinned across an unpunctuated scene, a punctuated scene, a question, an empty scene, and an empty craft paragraph.

**Suite.** Before: 162 tests, 161 pass, 1 fail. After: 165 tests, 164 pass, 1 fail. The single failure is `fixtures/copy-audit-mechanism-test.mjs` in both runs, which depends on credentials absent from this environment.

**Still open, untouched.** The scene call's overall length. It remains the standing open question and nothing here addresses it.

## Out of scope, untouched, evening changes

All other prompt content, the scene call's length, engines, recovery, storage, schema fields.
