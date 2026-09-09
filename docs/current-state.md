# BWS current state

> Status: Current as of head `f96d8d5436`, 2026-09-09. Built by three architect read sessions from open files, every claim with a file and line. The "Sections not reached" list at the end is exact. Extend this file; do not restart it. When code changes, the line numbers here go stale and the session that changed the code fixes the entries it touched.


- Date: 2026-09-09
- Repo: `grey-highroads/brand-world-system`, branch `main`, head `f96d8d5436e6b66d3eedb6c520f25025092ed63d`
- Author: architect session, reading only. Written for Grey.
- Method: every claim below carries `file:line` from a file read in this session. Where a file was not reached, the entry says `not read` and nothing else. Pass 1 claims that were not re-verified are marked and kept separate from verified ones.
- Companion: `bws-current-state-pass-1.md`. Corrections to it are noted in place and listed in the session report.

**Read this first.** The brief asked for a line-by-line read of the whole repository, which is roughly 700,000 tokens of source and documents. That does not fit in one session. This document records what was read completely and names what was not. The reading order in the brief was followed, so the parts that determine behavior are the parts that got read.

---

## 1. The render path today

### 1.1 `src/production/package.js` (962 lines, read completely)

The compiler. `compileBrandWorldImagePackage` is the single export that builds a render package, declared at `package.js:468`.

**Sections that compile on a scene render.** The section array is assembled at `package.js:632-780` and filtered by `.filter((section) => section && section.body)` at `package.js:780`. On a scene render (neither `isTemplate` nor `isSalesEnablement`, set at `package.js:494-495`), exactly these survive:

| Section | Line | Condition |
| --- | --- | --- |
| Assignment | `package.js:633-652` | always |
| Capture | `package.js:658-664` | not template, not sales enablement |
| Display copy | `package.js:764-769` | when `displayCopyCompiles` is true (`package.js:622`) |
| Output | `package.js:770-779` | always |

This confirms pass 1's claim, and adds the ordering: Display copy sits between Capture and Output because of array position, not because of any sort.

**Sections gated to template and sales-enablement paths only.** Each carries a ternary on `(isTemplate || isSalesEnablement)`:

- Brand foundation, `package.js:684-687`
- Product knowledge, `package.js:693-696`
- Guidance sections spread, `package.js:697-699`
- Campaign direction, `package.js:706`
- Campaign continuity, `package.js:707`
- Banner / product composition, `package.js:708`
- Visual materials (palette only), `package.js:713-718`
- Creative references, `package.js:730-735`
- Protection, `package.js:736-756`

So the correct statement is not that these sections stopped compiling. They stopped compiling **on the scene path** and still compile on template and sales enablement. Pass 1 says this for Protection but states the others as unqualified stops. Corrected here.

**The Assignment body on a scene render** is built at `package.js:646-651` from five joined pieces: the `Create one ${format} brand world image for ${placement}.` sentence, the scene through `sentenceBoundary`, then optional `Composition:`, `Lighting:`, and `Present in the scene:` clauses drawn from `brief.sceneComposition`, `brief.sceneLighting`, `brief.sceneProps` (read at `package.js:479-481`). Pass 1's open defect 6 asked whether the Assignment join still runs composition and lighting together without a boundary. It does not: each has its own labelled clause and the four-field shape is still live in the compiler. The defect as recorded is stale, though whether the writer still populates those fields is a `generate-copy.js` question.

**Capture body**, `package.js:663`: `selectedLook ? selectedLook.line : CAPTURE_CHARACTER`. The look's line replaces the floor rather than stacking, and the human texture floor is gone from this expression.

**`selectedLook` resolution**, `package.js:612-613`: `resolveLook(look) || (peoplelessScene ? resolveLook(SCENE_NO_PEOPLE_DEFAULT_LOOK) : null)`. `peoplelessScene` is `briefKind === "scene_no_people"` at `package.js:490`, and `briefKind` comes from `brief.kind` at `package.js:489`. This verifies pass 1's `scene_no_people` claim in the compiler: the default look substitution is real and lives here.

**Retained and uncalled in this file** (confirmed by reading the definition and searching for call sites in this file; cross-file callers checked in section 11):

- `worldDirection`, defined `package.js:357-383`. Comment at `package.js:615-620` states it stopped compiling 2026-08-31 and is kept for one-revert reversal.
- `rejectsDirection`, defined `package.js:394-405`. Comment at `package.js:719-723` states the same for the refusals recital.
- `sceneProductPlaceholder`, defined `package.js:443-447`. Comment at `package.js:422-426` states it is uncalled since 2026-09-07.
- `compileProductSectionForImage`, defined `package.js:410-420`, is still called at `package.js:695` but only on the template and sales paths. Pass 1 lists it as retained uncalled. **That is wrong.** It is called.
- `referenceDirection`, defined `package.js:449-453`, is still called at `package.js:733`, template and sales paths only. Pass 1 lists it as retained uncalled. **Also wrong.**

**`scenePass` still exists** as a parameter at `package.js:468` with default `false`. The comment at `package.js:462-467` describes it as the compile mode for call one of a two-call render. Nothing inside the function body reads `scenePass` after the 09-07 cut: the only behavior it was meant to change was the Product knowledge body, which is now gated to template and sales paths regardless. **This is a finding.** The parameter is accepted and ignored.

**`FACE_FRAMING_RULE`** is imported at `package.js:10` and appears nowhere else in the file. An imported and unused symbol, kept deliberately per the comment at `package.js:665-671`.

**Format sizes** are a literal map at `package.js:214-240`, read through `ownEntry` at `package.js:459` with a `1024x1024` fallback. The comment at `package.js:456-458` says the bare lookup was replaced because an unvalidated format string could resolve an inherited property and hand a function to the renderer.

**Governance that still runs on every path.** `auditConstraints` at `package.js:785-789` runs against the assembled `prompt` string, so on a scene render it audits a prompt that no longer contains the guardrails. That is the mechanism behind pass 1's defect 2, and it is honest by construction rather than broken. `resolveTreatments` at `package.js:802` and `checkRequirements` at `package.js:803` read the brain in full and are unaffected by the prompt cuts.

**Copy contract.** `compileCopyContract` at `package.js:870-898` returns `{}` when no copy outputs are declared, which is what keeps image-only packages byte-identical. `display.verified` is hardcoded `false` at `package.js:890` with a comment saying it is never set true by assertion. This confirms pass 1's ADR 0014 claim in code.


### 1.2 `src/production/prompt-craft.js` (599 lines, read completely)

The craft layer. Nine exports, of which the compiler calls some and not others.

**Called by `package.js`:** `protectionBlock` (`prompt-craft.js:164`, called at `package.js:532`), `inferPackageFormat` (`:41`, called at `package.js:514`), `neutralizeStateLanguage` (`:502`, called at `package.js:521`), `inferScreenBearing` (`:70`, called at `package.js:515,517`), `neutralizeScreenOrientation` (`:544`, called at `package.js:526`), `auditConstraints` (`:569`, called at `package.js:785`), `displayCopyBlock` (`:430`, called at `package.js:767`), `CAPTURE_CHARACTER` (`:392`, used at `package.js:663`).

**Imported by `package.js` and never called:**
- `sceneProtectionBlock`, defined `prompt-craft.js:273-283`, imported at `package.js:11`. The scene path's Protection section is gone, and the template and sales paths use the long-form `protectionBlock` instead. Pass 1's claim is confirmed.
- `FACE_FRAMING_RULE`, defined `prompt-craft.js:390`, imported at `package.js:10`.

**Exported and called by nothing in `src/production/`:** `humanTexture`, defined `prompt-craft.js:376-380`. The comment at `prompt-craft.js:355-360` dates the stop to 2026-08-31.

**`integrationSentence`** (`:93-101`) is exported and is called once, inside `protectionBlock` at `prompt-craft.js:229`, so it lives on the template and sales paths through that call.

**The constraint audit only ever emits two statuses.** `auditConstraints` returns `carried` or `review` (`prompt-craft.js:583` for guardrails, `:593` for the brief exclusion). The only other status the compiler can produce is `warning`, pushed at `package.js:797` for unanswered product review questions. **Finding:** pass 1's defect 2 says the review UI surfaces only `excluded` and `warning`. Nothing in the compile path ever produces `excluded`. If the UI filters on that string, every guardrail marked `review` is invisible by construction, not by oversight. Section 12 records what `app/app.js` actually filters on.

**The audit is an exact-substring check**, `prompt-craft.js:579` and `:589`, lowercased on both sides. This is why the comment at `prompt-craft.js:258-262` insists authored exclusions compile byte verbatim: any rewording would report as not carried.

**The long-form protection block has three cases**, `prompt-craft.js:167` (no locked asset), `:182` (non-product asset), `:195` (locked product). Case 3 is the longest and runs `prompt-craft.js:196-232`. On the current scene path none of this compiles, because the whole Protection section is gated to template and sales enablement.

**Display copy fidelity is asserted, not checked.** `displayCopyBlock` builds the instruction at `prompt-craft.js:430-465` and the docstring at `:426-428` states read-back verification is specified in ADR 0014 part two and is not built. That matches `display.verified` being hardcoded false at `package.js:890`.


### 1.3 `src/production/service.js` (766 lines, read completely)

The orchestration layer: it resolves inputs, calls the compiler, calls a renderer, and writes the record.

**Two render engines**, declared as a literal map at `service.js:17-32`. `DEFAULT_RENDER_ENGINE` is `"openai"` at `service.js:16`. `resolveRenderEngine` at `service.js:34-43` falls back to the default on an unknown name rather than failing. The comment at `service.js:11-15` states the compiled prompt is identical for every entry, which the code bears out: the engine table carries a model, an endpoint chooser, a render function, and an API key getter, and nothing that touches prompt text.

**The two-call render is disabled by a hardcoded constant.** `const twoCallEnabled = false;` at `service.js:447`. Pass 1 cited line 447 and is correct at head. The branch it guards runs `service.js:449-466` (package preparation) and `service.js:611-636` (the render itself). `productPlacementInstruction` is defined at `service.js:233-235` and called only inside the disabled branch at `service.js:461`, plus four times in `test/production-seedream.test.js` (lines 366, 445, 477-479), which is the test that flips the flag.

**The call-two instruction ignores its own argument.** `productPlacementInstruction(productName)` at `service.js:233` never reads `productName`; the returned string hardcodes "can" at `service.js:234`. The comment at `service.js:198-201` says so deliberately.

**Single-call render path**, `service.js:637-643`: one `render` call with `generationPackage.prompt` and every reference image. Reference order is fixed at `service.js:558-567`: template first if present, then the locked asset, then creative references.

**Protected assets are supplied as reference images to a generative call.** `service.js:562-564` pushes the locked asset into `allReferenceEntries` with `isLockedAsset: true`, and `service.js:641` hands the whole set to the renderer as `referenceImages`. There is no compositing step, no post-render overlay, and no check on the returned bytes anywhere in this file. The bytes go straight to `writeImage` at `service.js:656`. **This verifies the handoff document's correction in code:** the live path is a generative edit with a reference, and fidelity rests on human review.

**Two parameters are accepted and ignored by the compiler.** `prepareProductionPackage` reads the refusals store at `service.js:293-298` and passes `refusals` into `compileInputs` at `service.js:404`. `compileBrandWorldImagePackage` destructures `refusals` at `package.js:468` and never reads it again anywhere in the 962-line file. The same is true of `scenePass`. **Finding.** The refusals store read is live work that produces a value nothing consumes, and it costs a blob read on every package preparation. `rejectsDirection`, the function that would have used it, is uncalled at `package.js:394`.

**Duplicate-render protection is real and layered.** An already-complete job returns early at `service.js:530`. A duplicate arriving mid-render waits and returns the original's result at `service.js:534-546`, bounded by `IN_FLIGHT_WAIT_LIMIT_MS` 200000 and `ABANDONED_AFTER_MS` 300000 at `service.js:518-519`. An `attemptId` is minted at `service.js:551` and checked again before the durable write at `service.js:651-654` and before marking failure at `service.js:751-753`.

**Display copy is produced before the render**, `service.js:326-390`, and every other copy type after it, `service.js:678-717`. The reason is stated at `service.js:317-325`: a string that must be rendered has to exist first, and a copy failure should not cost an image. A display-copy failure is caught at `service.js:387-389` and the job renders without it.

**Product images become inputs automatically.** An `isolated` product image is promoted to the locked asset when the job locked nothing else, `service.js:254-269`. Every `in_context` product image joins the creative references, `service.js:270-282`. This is relevant to the re-synthesis defect: re-synthesis dropping attached product images silently changes what a render receives.


### 1.4 `src/production/looks.js` (254 lines, read completely)

**Sixteen looks** in the `LOOKS` object, `looks.js:41-204`: `film_noir` (:42), `drugstore_flash` (:50), `color_slide_1975` (:59), `consumer_negative_dusk` (:68), `large_format_daylight` (:78), `neutral` (:105), `overcast_editorial` (:113), `anamorphic_widescreen` (:122), `bleach_bypass_90s` (:130), `flash_night_street` (:139), `pushed_bw_reportage` (:148), `saturated_daylight_adventure` (:157), `daylight_street_documentary` (:166), `color_negative_daylight` (:180), `long_lens_distance` (:188), `available_light_interior` (:196).

**Correction to pass 1.** Pass 1 says the `scene_no_people` kind defaults to `available_light_interior`, tagged `[unread in code]`. The code says otherwise: `export const SCENE_NO_PEOPLE_DEFAULT_LOOK = "long_lens_distance";` at `looks.js:222`. The comment at `looks.js:214-221` explains the choice: four library lines name no face, chin, hair, or skin, and `long_lens_distance` is the only environment-agnostic one of the four. Either the 09-08 brief specified `available_light_interior` and the build chose differently, or pass 1 misread the brief. Recorded as a finding in section 7 rather than resolved here.

**The `neutral` misnaming is confirmed in code.** `neutral.line` at `looks.js:110` opens with one strobe through a large modifier placed off the lens axis. It is a built-light studio description sitting under the label `Neutral` (`looks.js:107`) and the comment at `looks.js:87-89` calls it what a person means when they ask for something clean and professional. Pass 1's defect 4 stands.

**Two look fields carry behavior.** `environment` is `agnostic` or `binding`, and a binding look carries a `requires` string naming the conditions it needs (for example `looks.js:62-63`). Nothing in `package.js` or `service.js` reads `environment` or `requires`. Whether the writer reads them is a `generate-copy.js` question, recorded in section 2.

**`lookResolvesFineDetail`** is exported at `looks.js:250-253` and its only consumer would be `humanTexture`, which is itself uncalled. **Retained and uncalled.**

**`LOOK_IDS`** is derived at `looks.js:228`, and the comment at `looks.js:224-227` states the picker order in `app/app.js` is curated separately with nothing validating that the two lists agree. That is a live drift risk, not a defect at head.

**Relevant to the photographic character layer brief in your project files.** That brief proposed a parallel capture-profile system. The comment at `looks.js:175-179` records the ruling: two of its profiles arrived as looks rather than as a second system, `color_negative_daylight` and `long_lens_distance`, on the reasoning that the library is already where a medium is described. `available_light_interior` is present too. The `tungsten_night_glow` candidate is not in the library. So that brief is partly implemented and its open questions 1 and 3 are partly answered by what shipped.

### 1.5 `src/production/composite.js` (161 lines, read completely)

The place-on-background path. Its own header comment, `composite.js:14-20`, states the position plainly: product pixels are composited in the browser, the product is never sent to a model alone, and the picture that comes back is a new picture the model made, so the area outside the mask is re-encoded rather than returned untouched. It then names the missing step: drawing the product over the returned image once more in the browser before saving, which would give a true untouched guarantee and is not done.

`placeOnBackground` at `composite.js:101-160` calls `callShadowEdit` (`:74`) against `IMAGE_EDITS_ENDPOINT` (`:22`), writes the returned bytes at `composite.js:125`, and writes a provenance record deliberately not shaped as a compiled package, per the comment at `composite.js:127-130`. Nothing here reads a brand brain.

**This is the code that settles the composition claim.** Deterministic overlay after generative work does not exist on either path. On the main render path the asset is a reference image (`service.js:562-564`, `:641`). On this path the composite is browser-side but the model re-encodes the frame.

### 1.6 `src/renderers/openai-images.js` (74 lines) and `src/renderers/seedream-images.js` (155 lines), both read completely

Thin adapters. Neither modifies prompt text: `requiredPrompt` in each (`openai-images.js:5-8`, `seedream-images.js:22-25`) only checks for a non-empty string.

**Endpoint choice is driven by reference-image count, not by intent.** `chooseOpenAIImageEndpoint` at `openai-images.js:17-19` and `chooseSeedreamImageEndpoint` at `seedream-images.js:57-59` both return the edit endpoint when any reference image is present. So every locked-asset render is an edit call on both engines.

**Model strings:** `gpt-image-2` at `openai-images.js:1`, `bytedance/seedream/v5/pro` at `seedream-images.js:16`.

**Seedream edits deliberately omit `image_size`.** `buildSeedreamEditRequest` at `seedream-images.js:91-101` drops the size argument, with the comment at `:83-90` explaining that naming an output size on an edit reads as a request for a new frame and was one of the two grounding fixes for the 2026-09-02 redrawn-frame renders. The `size` parameter is still in the signature and is unused.

**Seedream reports no usage.** `usage: null` at `seedream-images.js:152`, with the comment at `:150-151` saying an invented number would read on the record as measured. So any cost figure for a Seedream render is not available from the record.

### 1.7 `src/production/store.js` (242 lines, read completely)

Client-namespaced blob storage under `brand-world-system/clients/${clientId}` (`store.js:14-16`), per ADR 0011. Two implementations, a file store for tests (`:56-123`) and the Vercel Blob store (`:127-241`).

**A legacy read-through still exists.** `LEGACY_FLAT_PRODUCTION_PATHNAME` at `store.js:12` is read only for the default client at `store.js:152`, with a comment saying to remove it once the flat blob is gone. Live migration debt, not a defect.

**Images are private and served through short-lived presigned URLs**, fifteen minutes, `store.js:135`. The comment at `store.js:179-182` says callers mint fresh URLs at read time rather than trusting a persisted one.

**Discard is a hard delete** of image, scene image, and package, `store.js:44-50` and `:207-211`.

**`readOutputImageBytes`** at `store.js:218-226` exists for the place-on-background page, because a cross-origin canvas will not return its pixels. The comment at `store.js:217` states nothing on the render path calls it.


---

## 2. The writer

### 2.1 `api/production/generate-copy.js` (911 lines, read completely)

One serverless function carrying five actions plus a default. The dispatch is on `body.action`: `scene_brief` at `:47`, `segments` at `:59`, `audit_copy` at `:70`, `copy_type` at `:100`, and everything else falls through to LinkedIn post generation at `:143-311`. The comment at `:52-58` says the actions are stacked here because the function count sat at the Vercel Hobby ceiling. That constraint is stale, per section 5.

**`handleSceneBrief` is exported at `generate-copy.js:502`**, with signature `({ body, brain, product, apiKey, response, random = Math.random })`. Pass 1's line number is correct.

**Everything it reads from the brain.** Three artifacts and nothing else:

| Block | Line | Source |
| --- | --- | --- |
| `BRAND:` name and description | `:547` | brain root |
| `THE LIVED WORLD` | `:565-593` | `artifacts.livedWorld` |
| `THE STORY` | `:619-627` | `artifacts.storyArchitecture` |
| `THE VISUAL GRAMMAR` | `:636-665` | `artifacts.visualGrammar`, five sections |
| `CAMPAIGN:` | `:667-670` | `body.campaign` |
| `PRODUCT:` | `:674-679` | product record, name only |

**What is withheld, verified by absence in the file:** the guidance sections (read at `:144-147` for the LinkedIn path only, never inside `handleSceneBrief`), the whole dossier, the grammar's `rejects` section (the label list at `:642-646` has five entries and omits it), product `visual_direction` and `exclusions`. The product line at `:675` is one sentence: the name, and that it is present in the scene. The comment at `:671-673` gives the reason. Pass 1 is confirmed on every item.

**Three moments, chosen at random.** `SCENE_MOMENT_COUNT = 3` at `:484`; `selectMoments` at `:486-500` is a partial Fisher-Yates over a copy with an injectable `random`. Called at `:597`. Selected ids return to the client as `momentIds` at `:902,908`.

**The task text.** Pass 1 says about 252 words. Counted at head: **324 words for the `scene` kind** (`:728-736`) and **414 words for `scene_no_people`** (`:754-764`). Pass 1's figure is either pre-09-08 or a miscount. Corrected.

**The output shape is one prose block, not four fields.** `:847` asks for exactly three options, each `{label, brief}`, the brief between 120 and 220 words. The four-field shape is gone.

**This closes pass 1's open defect 6.** `package.js:479-481` still reads `brief.sceneComposition`, `sceneLighting`, and `sceneProps` and still compiles them as labelled clauses at `package.js:648-650`. Nothing writes them any more. `app/app.js:1325` initializes all three to empty string, the apply-suggestion handler at `app/app.js:9421-9435` explicitly no longer sets them (comment at `:9423-9429`), and `retireSceneDetail` at `app/app.js:11189-11193` clears them on every other path. So the three clauses are a dead branch reachable only by a hand-typed field or a direct API call. Not a join defect. Dead code on both sides.

**Model and settings for the scene writer:** `gpt-4o`, `temperature: 0.9`, `max_tokens: 2200` for a scene and 800 otherwise, at `generate-copy.js:861-867`. The LinkedIn path uses `gpt-4o` at `temperature: 0.7` at `:263-269`.

**The look reaches the writer in full, as a rule.** `lookBrief` resolves at `:797-798` with the same `SCENE_NO_PEOPLE_DEFAULT_LOOK` fallback the compiler uses. `lookRules[0]` at `:812` injects the look's entire `line` into the system prompt under `RULES:`.

**This is the mechanical cause of your first recorded craft failure.** The writer transcribes the look because the look's full optical description is in its RULES block at `:812`, while the instruction not to transcribe it is one clause inside paragraph three of the task at `:733`. A rule outranks a task paragraph in the same prompt. The third `lookRules` entry that used to forbid this was cut at `c8664ba3` and its wording is preserved at `:460-464`. The comment at `:701-717` records the owner's reasoning for not restoring it. **Recorded as a finding, not a recommendation:** the constraint currently sits in the weaker of the two positions in the same prompt.

**A binding look outranks the earned environment**, `:813-814`. An agnostic look states the environment stays governed by earned environments, `:815`. On the peopleless kind an extra sentence at `:826` tells the writer to ignore whatever the look says about faces and subject behavior; the comment at `:822-824` marks it untested as of 2026-09-08.

**Defect, unhardened lookup.** `const kind = kinds[requestedKind] || kinds.scene;` at `generate-copy.js:785`, where `requestedKind` is `String(body.kind || "scene")` at `:526`, arriving unvalidated from the request body. This is a bare lookup on an object literal, so an inherited property name resolves and passes the truthiness fallback. `src/lookup.js` exists for exactly this and is imported by `package.js:16`, `looks.js:1`, and `display-budget.js:1`. `generate-copy.js` does not import it. Consequence at head is a scene brief compiled with an empty task rather than a crash, so severity is low, but it is the same class of defect the repo hardened twice elsewhere. **Recorded in section 6.**

**Ambition labels travel to the writer.** `:658` appends "(declared ambition for this brand)" to any grammar entry whose `basis.origin` is `ambition`, and `:657` records every grammar entry into `grammarEntries`, returned to the client at `:907`. This is the seam ADR 0016 built.


---

## 3. Synthesis

### 3.1 `src/brand-brain/chat-completions-provider.js` (349 lines, read completely)

**The model is `gpt-5.6`**, `chat-completions-provider.js:3`. **Note the asymmetry:** synthesis runs on `gpt-5.6` and both writers run on `gpt-4o` (`generate-copy.js:263`, `:861`). Nothing in the code explains the difference. Worth knowing before the writer refactor, because "teach the writer craft" and "change the writer's model" are different projects with different costs.

**Four passes, assembled from six blocks.** `passInstructions` at `:152-158` joins, in order: `HEADER` (`:18`), the pass task (`PASS_TASKS`, `:121-143`), `AUTHORITY_RULES` (`:20-31`), `WRITING_RULES` (`:33-42`), the pass-specific rules (`PASS_RULES`, `:145-150`), and `REVIEW_QUESTION_LANGUAGE` (`:44-51`).

`PASS_RULES` maps: pass 1 gets no artifact rules (`:146`), pass 2 gets `LIVED_WORLD_RULES` (`:53-67`), pass 3 gets `STORY_ARCHITECTURE_RULES` (`:69-78`), pass 4 gets `VISUAL_GRAMMAR_RULES` (`:80-116`, seven joined blocks).

**Pass 3 receives no images.** `PASS_SENDS_IMAGES = { 1: true, 2: true, 3: false, 4: true }` at `:198`, applied at `:236-243`. The reason is at `:191-197`. Pass 1's claim is confirmed.

**Each pass reads the ones before it as data.** `priorPassText` at `:184-189` serializes prior pass output under an `ALREADY WRITTEN, PASS n` heading, labelled as data rather than instruction per the comment at `:181-183`.

**Structured output is enforced.** `response_format` with `strict: true` at `:254-261`, against `passSchemas[passId]`. Pass 1's output is additionally checked for all six guidance section ids at `:274-278`.

**Incremental synthesis exists** and is selected by the presence of a baseline, `:205` and `:212-229`. Each pass gets the slice of the approved baseline it owns.

### 3.2 `src/brand-brain/schema.js` (394 lines, read completely)

Confirms every shape pass 1 recorded, with lines:

- `basis` origin enum `["evidence", "inference", "ambition"]` at `schema.js:40`, confidence enum at `:42`.
- `visualGrammar.sections` has six sections at `:73-104`: people, objects, places, light, camera, rejects. Camera has `minItems: 3` (`:96`), light `maxItems: 6` (`:92`), the rest 1 to 8.
- `livedWorld.people` is an array of 2 to 5 (`:229-230`), each with `id`, `name`, `who`, `basis` (`:214-228`).
- `storyArchitecture.moments` is 6 to 12 (`:312-313`), each with `id`, `title`, `when`, `where`, `who` (person ids, 1 to 5), `doing`, `feeling`, `basis` (`:278-311`). There is no `product` field.
- `passSchemas` at `:369-382`: pass 1 owns brand fields, guidance sections and dossier; passes 2, 3, 4 own one artifact each. Every pass carries `reviewQuestions`.
- `brandBrainSchema` at `:345-358` answers to no model call since 2026-09-07 and is the validation target for the assembled brain, per the comment at `:333-337`.

**One structural fact that matters for the next decision:** `basis` is a single shared definition (`:39-43`) used by lived-world people, patterns, social and environments entries, story moments, and every grammar entry. The schema permits `ambition` in all of them. Only the pass instructions forbid it in specific artifacts. An aspiration mechanism therefore does not need a schema change; it needs instruction changes and a consumer.


### 3.3 `src/brand-brain/service.js` (401 lines, read completely)

**The rebuild-erases entry in the deferred register is confirmed line by line.** On a non-incremental synthesis, `baseline` is null at `service.js:238`, so the saved payload at `:322-345` carries `approvedResult: inProgress.baseline` (`:327`), which is null, and `brain: undefined` (`:335-343`). `store.write(saved)` at `:383` then overwrites the blob in place (`store.js:108-117`, `allowOverwrite: true`, `addRandomSuffix: false`). The mitigation is exactly as the register describes: `writeBackup` at `:369-381` runs before the write and a failed backup throws with status 503 and leaves nothing changed. The comment at `:357-364` names the fix as candidate-not-erase and points at the deferred register. The register entry at `deferred-work.md:97-107` moves from "not verified" to **verified** in section 13.

**The four-pass state machine.** `synthesizeBrandBrain` at `:197-224` dispatches pass 1 to `runFirstPass` (`:226-280`) and passes 2 through 4 to `runLaterPass` (`:282-386`). Pass 1 writes the in-progress record at `:278`; each later pass rejects a request id that does not match (`:292-294`) or a pass number out of sequence (`:295-297`) with a 409, rehydrates image bytes from Blob (`:299`, `:89-100`), and either writes the next in-progress record (`:314-318`) or, on the final pass, assembles and saves (`:320-385`). A failure at any pass clears the in-progress record (`:213-220`). Nothing reaches the saved brain before pass 4, per `:41` and the store comment at `store.js:23-28`.

**An incremental update synthesizes from the new sources only.** `sources: incomingSources` at `:255`, not the merged set. The merged set is what gets persisted (`:249`, `:271`), and the baseline carries the earlier reading. So an update never re-reads the original sources; it reads the previous output plus the additions.

**The baseline is already sliced per artifact.** `baselineForPass` at `:58-74` hands pass 1 the brand fields plus the dossier and hands each later pass one artifact. A baseline that predates an artifact yields null for that pass, which runs as a first synthesis of that slice (`:55-57`). **This is the closest thing at head to per-artifact handling**, and it lives on the update path, not the approval path.

**The synthesis model is overridable.** `model: options.env.OPENAI_MODEL` at `:253` and `:302`, falling through to `gpt-5.6` at `chat-completions-provider.js:3` when unset. The writer's `gpt-4o` at `generate-copy.js:861` has no equivalent override.

**`selectApprovedBaseline`** at `:13-15` returns `approvedResult`, or `result` when `brain.artifactStatus === "ready"`, or null. This is what the production path reads at `src/production/service.js:60`. Both fields are written by the browser, per 3.5 below.

**Dry run** exists, `:236` and `:347-355`: computes the candidate, clears in-progress, writes nothing. The comment at `:233-235` says it is the only path that evaluates a synthesis without persisting one.

### 3.4 `src/brand-brain/store.js` (173 lines, read completely)

Three blobs per client: `state/current.json` (`:19-21`), `state/in-progress.json` (`:29-31`), and timestamped backups under `state/backups/` (`:39-42`) written with `allowOverwrite: false` (`:127`), per the comment at `:118-121` that a backup that can be overwritten is not a backup. `readSourceFile` at `:157-170` refuses any pathname outside the client's own `sources/` prefix or the legacy prefix (`:158-162`). The same legacy flat-path read-through as the production store exists at `:12`, `:105`.

### 3.5 `api/brand-brain/save.js` (20 lines), `synthesize.js` (50 lines), `index.js` (263 lines), all read completely

**Approval is enforced nowhere on the server.** `save.js:15` calls `saveBrandBrainSnapshot` with whatever the browser POSTed, and `service.js:22-26` stamps `savedAt` and writes it. There is no schema check on the snapshot, no check that `approvedResult` was ever a synthesis output, and no check on `brain.artifactStatus`. The approve action described in the five things is a client-side state change (`app/app.js:10027-10046`) that the server records as sent. **A direct POST to `/api/brand-brain/save` carrying any `approvedResult` makes that object the approved brain**, and production reads it through `selectApprovedBaseline`. Combined with the `resolveClientId` cookie placeholder the deferred register records at `:240`, the approval gate is a property of the interface, not of the system. Recorded in section 6.

`synthesize.js` accepts a 45 MB body (`:40`) and answers GET with pass progress only (`:20-31`).

`index.js` dispatches eight POST actions on the brain route (`:9-19`): four claims operations, three refusals operations, and `run_audit_test`. The mechanism test inlined at `:170-263` checks four criteria (`:177-181`, `:246-249`). Pass 1 said criteria 5 and 6 of the amended test have never been run; the deployed test has no criteria 5 and 6, so it could not run them. `seed_refusals` at `:135-154` refuses when the client has any entries, per the comment at `:97-99`.


---

## 4. Governance that is live

Read this session in code: `src/claims/copy-audit.js` and `src/copy/prose-check.js` are imported by `api/production/generate-copy.js:6-7` and used on the `audit_copy` and default paths. `src/refusals/store.js` is read in `src/production/service.js:293-298` and its output reaches the compiler and stops there (section 1.3). Display copy renders under the narrowed text-safety rule at `prompt-craft.js:115` and records `verified: false` at `package.js:890`.

`src/claims/`, `src/copy/`, `src/refusals/`, `src/scope/`, `src/campaigns/`, `src/clients/`, `src/products/`, `src/compiler.js`, `src/validation.js`: **not read this session.** Pass 1's claims about them stand unverified.

### 4.1 What is live, from the import graph

Every `api/` route's imports from `src/` were listed. Eighteen `src` modules are imported by at least one route. **`src/compiler.js`, `src/validation.js`, and `src/index.js` are imported by no route and by nothing in `app/`.** Their only consumers are `scripts/validate-fixtures.js` and `test/compiler.test.js`.

**There are two compilers in this repository and the product runs one of them.** `package.json` names `./src/index.js` as the package export and describes the package as a "Deterministic Brand World production compiler foundation." `src/index.js` re-exports `compileProduction` from `src/compiler.js` (`index.js:1-6`), a 549-line schema-contract compiler with its own `COMPILER_ID` and `COMPILER_VERSION` (`compiler.js:4-5`) and a canonical-JSON digest (`compiler.js:26-39`). It takes `trustedInstallationProfile`, `brandBrainSnapshot`, `deliverablePreset`, `jobBrief`, `protectedAssets`, and `supplementalInputs` (`compiler.js:169-177`). Nothing on the deployed render path calls it. The live compiler is `src/production/package.js`, which the package manifest does not name. `compiler.js` was read to `:185` and its export list; the body was not read.

### 4.2 `src/lookup.js` (26 lines, read completely)

The comment at `lookup.js:16-19` states the repository's own rule: any map keyed by a value from a request body, a stored record, or a user field is looked up through `ownEntry`, never through `map[key] || fallback`. `:10-14` records the 2026-08-19 `resolveLook` incident and says four other externally keyed lookups were closed the following commit. `generate-copy.js:785` is a lookup of exactly that kind on a request-body value and does not use it. Section 6 defect 4 is therefore a violation of a stated rule, not a missed convention.

### 4.3 `src/server/http.js` (121 lines, read `:55-120`)

**One password for the installation.** `hasBrandWorldAccess` at `http.js:55-76` accepts Basic auth or a session cookie carrying `brandworld:` plus `BRAND_WORLD_ACCESS_PASSWORD`. Without the variable set, access is open off Vercel and refused on it (`:56`, `:79-82`).

**The client id is taken from the request unvalidated.** `resolveClientId` at `:103-115` reads an `x-client-id` header first, then the `bws_client` cookie, sanitizes to a path-safe string, and defaults to `"default"`. The comment at `:96-102` is labelled PROTOTYPE ONLY and says so. Anyone holding the installation password can read or write any client's brain, production state, claims, refusals, products, or campaigns by setting one header. Together with 3.5, this is the full shape of the governance gate: one shared secret, then the interface.

### 4.4 Not read

`src/claims/` (assembly, copy-audit, store), `src/copy/` (display-budget, generate, prose-check, types), `src/refusals/` (store, bootstrap), `src/scope/resolver.js`, `src/campaigns/store.js`, `src/clients/store.js`, `src/products/` (service, store), `src/brand-brain/source-reader.js`, `src/validation.js`, `middleware.js`, and the routes `api/auth/login.js`, `api/blob/upload.js`, `api/campaigns/index.js`, `api/clients/index.js`, `api/products/index.js`, `api/production/current.js`, `outputs.js`, `preflight.js`. `api/production/generate.js` (47 lines) was read: it dispatches `place-on-background` before the render (`generate.js:24-31`) and hands five stores to `generateProductionImage` (`:33-40`), including the refusals store whose output section 1.3 shows is unused.


---

## 5. Infrastructure facts

- **13 serverless functions** under `api/`, counted at head. Confirms pass 1.
- **`maxDuration` 300** for `api/**/*.js`, `vercel.json:8-10`. Also in `vercel.json`: `fluid: true` (`:6`), framework vite, and three security headers (`:14-18`).
- **Node >= 22**, `package.json` engines. Test command is bare `node --test`.
- **Dependencies are few:** `@vercel/blob`, `@vercel/functions`, `ajv`, `ajv-formats`, `officeparser`. Vite is the only dev dependency.
- **Source files are capped at 20 MB**, `source-normalizer.js:4`, and extracted text is truncated at 160,000 characters, `:33`.
- **Protected assets in non-image formats are never visually interpreted during synthesis.** `source-normalizer.js:74-83` and `:97-105` return a metadata-only record with that note. So a PDF brand kit registered as a protected asset contributes its metadata and nothing else to synthesis.
- **The test suite was run this session:** 218 tests, 217 pass, 1 fail (the API-key-gated mechanism test). 16 files, 4,638 lines. Section 8.

---

## 6. Open defects and gaps, verified in code this session

1. **The constraint audit's statuses and the interface's filter do not overlap.** The compiler emits `carried` or `review` (`prompt-craft.js:583`, `:593`) plus `warning` (`package.js:797`). The result screen at `app/app.js:6831-6845` renders only entries whose status is `excluded` or `warning`. Nothing anywhere produces `excluded`. Every guardrail that did not compile into the prompt is marked `review` and is therefore invisible to the reviewer. Pass 1 recorded this as the audit being honest; the honesty is real and the reporting is broken. Both ends now carry a line.
2. **`refusals` is read on every package preparation and consumed by nothing.** `service.js:293-298` reads the refusals store and passes the value to `package.js:468`, where it is destructured and never used. Costs a blob read per job.
3. **`scenePass` is accepted and ignored.** `package.js:468` destructures it; nothing in the function body branches on it. The two-call path that would have used it is disabled at `service.js:447`.
4. **The writer's kind lookup is unhardened.** `generate-copy.js:785` does a bare lookup on an object literal with an unvalidated request value, where `src/lookup.js` exists for exactly this and is used at `package.js:16`, `looks.js:1`, and `display-budget.js:1`. Low severity at head, same class as two defects already fixed.
5. **The `neutral` look is a built-light studio description under a neutral label**, `looks.js:105-111`. Confirms pass 1 defect 4.
6. **The three scene detail fields are dead on both sides.** Compiler reads them (`package.js:479-481`, `:648-650`), nothing writes them (`app/app.js:9421-9435`, `:11189-11193`). Pass 1's defect 6 is resolved as dead code rather than a join defect.
7. **`productPlacementInstruction` ignores its `productName` argument** and hardcodes "can", `service.js:233-234`. Deliberate per the comment, and a live limitation if the two-call path is ever re-enabled for a non-can product.
8. **Seedream renders record no usage**, `seedream-images.js:152`. Any per-render cost comparison between engines is unavailable from the record.
9. **A legacy flat blob path is still read** for the default client, `store.js:12`, `:152`.
10. Pass 1 defects 1, 3, 7, 8, 10 concern behavior in files not read this session or in runs not recorded anywhere. **Not verified.** They stand as pass 1 left them.
11. **Brain approval is not enforced on the server.** `api/brand-brain/save.js:15` writes whatever snapshot the browser sends, unvalidated, and `src/production/service.js:60` reads `approvedResult` from it as the approved brain. The approve gate exists only in `app/app.js:10027`. See section 3.5.

---

## 7. Documents and records that contradict the code

| Claim | Source of the claim | What the code says | Status |
| --- | --- | --- | --- |
| `scene_no_people` defaults to `available_light_interior` | pass 1, from `brief-2026-09-08-scene-no-people.md` | `SCENE_NO_PEOPLE_DEFAULT_LOOK = "long_lens_distance"`, `looks.js:222`, used at `package.js:613` and `generate-copy.js:798` | **Pass 1 corrected.** Whether the brief said otherwise is unread |
| The scene task is about 252 words | pass 1 | 324 words, `generate-copy.js:728-736` | **Pass 1 corrected** |
| `compileProductSectionForImage` and `referenceDirection` are retained uncalled | pass 1 | Both called on the template and sales paths, `package.js:695`, `:733` | **Pass 1 corrected** |
| Eight sections "stopped compiling" | pass 1 and the handoff | They stopped on the scene path and still compile on template and sales enablement, each gated at `package.js:684-756` | **Qualified** |
| The Assignment join runs composition and lighting together without a boundary | pass 1 defect 6 | Separate labelled clauses, `package.js:648-650`, and nothing writes the fields | **Stale** |
| Engine selection is administrator configuration, no picker | `docs/concept-visibility.md`, not read this session | `resolveRenderEngine(body.engine)` at `service.js:448`, `:569`, driven by a request field | **Unresolved.** Code confirms a request-level engine choice exists |
| The look picker order in `app/app.js` matches `LOOK_IDS` | nothing validates it | `looks.js:224-227` states the two lists are maintained by hand | Live drift risk |

---

## 8. Tests

**The suite was run this session** on Node 22.22.2 after `npm install`: **218 tests, 217 pass, 1 fail.** The one failure is `fixtures/copy-audit-mechanism-test.mjs`, exit code 1, first line of output "Set OPENAI_API_KEY before running." That matches every finding's ambient-state note. Pass 1's figure of 201 was recorded from a finding; 218 is the count at head.

**What each file tests, from its imports and test count.** Bodies were not read; this is the map of what pins what.

| File | Tests | Imports from |
| --- | --- | --- |
| `brand-brain-openai.test.js` | 31 | chat-completions-provider, schema, brand-brain service, source-normalizer, openai-images, `scripts/dev-server.js` |
| `production-seedream.test.js` | 25 | package, production service, both renderers |
| `scene-brief.test.js` | 21 | `api/production/generate-copy.js`, looks, package, prompt-craft |
| `display-copy.test.js` | 27 | display-budget, copy/generate, package, prompt-craft |
| `prompt-craft.test.js` | 13 | prompt-craft |
| `copy-calibration.test.js` | 12 | claims/assembly, copy/generate, prose-check |
| `production-openai.test.js` | 12 | package, production service, openai-images |
| `copy-contract.test.js` | 11 | copy/generate, copy/types, package |
| `segment-scope.test.js` | 11 | claims/assembly, scope/resolver |
| `compiler.test.js` | 10 | `src/index.js` only |
| `headline-set.test.js` | 10 | copy/generate, copy/types |
| `browser-prototype.test.js` | 9 | nothing from `src` |
| `campaign-store.test.js` | 8 | campaigns/store |
| `duplicate-render.test.js` | 5 | production service |
| `production-store.test.js` | 5 | production store |
| `vercel-deployment.test.js` | 4 | server/http |

Two things this map shows without reading a body. **The retired schema compiler has ten tests** (`compiler.test.js`, on `src/index.js`), so the suite protects a component the product does not run. And **`test/production-seedream.test.js:402`** is titled "flipping twoCallEnabled restores the two-call render," which is the test section 1.3 says exercises the disabled branch. `scene-brief.test.js` is the only file that imports an `api/` module, so it is the only test that pins the writer.

**Not read:** what any individual test asserts. A test that pins behavior the findings say was removed cannot be identified from this map.

---

## 9. Fixtures

Six `.mjs` files. **`node --test` picks up exactly one**, `fixtures/copy-audit-mechanism-test.mjs`, confirmed from the reporter output. The other five were run by hand at head:

| Harness | Result | What it says |
| --- | --- | --- |
| `adr-0017-step4-parity.mjs` | **throws** | `ReferenceError: clean is not defined`. Dead as pass 1 recorded, and dead at the level of a missing helper, not a stale assertion |
| `adr-0016-step4-parity.mjs` | **fails its own drift assertion** | `drift: the live scene writer no longer contains const grammarSections = brain.artifacts?.visualGrammar?.sections;`. The harness checks that a line of `generate-copy.js` still exists and reports honestly that it does not. Dead, and it says so |
| `adr-0018-phase0-capture.mjs` | **refuses to run, twice** | First on a dirty working tree, by design (`--allow-dirty` overrides). Then: `Missing mycopop brain at fixtures/adr-0018-phase0-inputs/mycopop-brain.json`. It needs the real, gitignored MycoPop brain. **Not dead.** It is the byte-identity gate pass 1 said the suite lacks, and it cannot run without an input nobody commits. Whether it runs against head with that input is unknown |
| `adr-0016-step1-harness.mjs` | exits 0 with `Set --client to mycopop or dialog-health.` | Needs a client argument and, presumably, a brain. Not exercised further |
| `adr-0017-refusals-gate.mjs` | **runs to completion** | Ten clauses across two brands. Nine pass. **`G2 convergence` fails on the second brand at 16/23 = 0.6957 against a 0.7 floor.** Output ends "At least one clause failed. See the judgment section of the gate document." This gate is live and reports a real failure at head |

**Correction to pass 1.** Pass 1 lists three dead harnesses. At head the count is two dead (`adr-0017-step4-parity`, `adr-0016-step4-parity`), one blocked on a private input (`adr-0018-phase0-capture`), and one running and failing a clause (`adr-0017-refusals-gate`). The refusals gate failure does not appear in pass 1 or in any finding this session read.

**Fixture JSON files** were not read.


---

## 11. Retained and uncalled

Every function below is defined at head and called by nothing on any live path. Confirmed by reading the definition and by a repository-wide search across `src`, `api`, `app`, `test`, and `fixtures`.

| Function | Defined | Stopped | Note |
| --- | --- | --- | --- |
| `worldDirection` | `package.js:357` | 2026-08-31 | Comment at `package.js:615-620` |
| `rejectsDirection` | `package.js:394` | 2026-08-31 | Comment at `package.js:719-723`. A copy exists in `fixtures/adr-0017-step4-parity-baseline.js:378` |
| `sceneProductPlaceholder` | `package.js:443` | 2026-09-07 | Comment at `package.js:422-426` |
| `sceneProtectionBlock` | `prompt-craft.js:273` | 2026-09-07 | Imported at `package.js:11`, never called |
| `humanTexture` | `prompt-craft.js:376` | 2026-08-31 | Comment at `prompt-craft.js:355-360` |
| `lookResolvesFineDetail` | `looks.js:250` | with `humanTexture` | Its only consumer is `humanTexture` |
| `FACE_FRAMING_RULE` (const) | `prompt-craft.js:390` | 2026-09-07 | Imported at `package.js:10`, never used |
| `productPlacementInstruction` | `service.js:233` | 2026-09-07 | Reachable only inside the disabled branch; exercised by `test/production-seedream.test.js` |
| `readOutputImageBytes` | `store.js:218` | never on the render path | Used by the place-on-background page |
| `buildConsumptionRecord` | `package.js:904` | unrecorded | Exported; no caller in `src`, `api`, `app`, or `test`. `app/app.js:10205-10220` builds the same record inline instead |
| `classifyChangeImpact` | `package.js:924` | unrecorded | Exported; no caller anywhere. The whole change-impact vocabulary (Reproduction required, Update available, Review recommended, No impact) is dead |

Both were found by a repository-wide search on 2026-09-09 pass 2. Neither appears in any finding, and neither is mentioned in the comments around it, so unlike the nine above these two look like drift rather than deliberate retention. **`classifyChangeImpact` matters more than its line count suggests:** it is the only code in the system that decides whether an output made on an older brain needs reproducing, and nothing calls it. `app/app.js:10039` substitutes a bare count of affected outputs.

The findings named eight. This list has eleven, and it also removes two entries pass 1 put on the list wrongly (`compileProductSectionForImage`, `referenceDirection`). `src/claims/`, `src/copy/`, `src/refusals/`, `src/scope/`, `src/campaigns/`, `src/clients/`, `src/products/` were not read, so the list is complete for the production path only.

---

## The five things the next decision needs

### 1. What the Add Source form captures, and where it lands on the record

The form's answers become a source record in `sourceContract`, `app/app.js:1801-1830`. Fields written: `materialType` (`:1810`), `declaredType` (`:1811`), `intakeVersion` fixed to `"single-source-v1"` (`:1812`), `authority` (`:1813`), `role` (`:1814`), `influence` (`:1815`, set to the string `"Not weighted"` unless the authority is `brand-evidence` or `creative-reference`, per `sourceUsesInfluence` at `:1797-1799`), `usage` (`:1816`), `exclusions` (`:1817`, defaulting to the sentence "No additional exclusions supplied."), `provenance` (`:1821`), `aspiration` (`:1822`), `verification` fixed to `"Pending content check"` (`:1823`), and three asset fields only when the authority is `exact-asset` (`:1824-1828`).

**Two answers are decided by the door rather than by the user.** A protected asset is forced to `provenance: "ours"` and `aspiration: "current"` at `:1821-1822`. **And one answer overrides a declaration:** `borrowed` at `:1807-1808` demotes any `emulate` source to `creative-reference` authority regardless of what material type was chosen.

The UI controls are `set-source-provenance` and `set-source-aspiration`, handled at `app/app.js:9759` and `:9767`, rendered at `:3067-3082` and again at `:2439-2442`.

The record shape as synthesis sees it is built by `sourceMetadata`, `chat-completions-provider.js:160-178`. **Not read this session:** `src/brand-brain/store.js` and where the record is persisted between those two points.

### 2. How `influence`, `aspiration`, and `provenance` travel into the four passes

All three are put on the wire for every pass. `sourceMetadata` includes `influence` (`chat-completions-provider.js:170`), `provenance` defaulting to `"ours"` (`:173`), and `aspiration` defaulting to `"current"` (`:174`).

Which pass instructions mention them:

- **All four passes** receive `AUTHORITY_RULES` (`:155`), which covers influence at `:25`, provenance at `:29`, and aspiration at `:30-31`. This is general framing: aspirational contents must never be recorded as fact, and both readings are kept.
- **Pass 4 alone** has operational rules that turn the two flags into a stored value. `VISUAL_GRAMMAR_RULES` block three, `:90-97`, states the mapping explicitly at `:92`: emulate plus current is ambition, emulate plus aspiration is ambition, ours plus aspiration is ambition, and only ours plus current describes the brand as it stands. `:97` states that influence sets reach, not strength.
- **Pass 2** (`LIVED_WORLD_RULES`, `:53-67`) and **pass 3** (`STORY_ARCHITECTURE_RULES`, `:69-78`) mention none of the three by name. They inherit only the general framing.

So the mechanism is concrete in one pass out of four and general in the other three.

### 3. Every line that keeps `ambition` out of an artifact, verbatim

Three, all in `chat-completions-provider.js`. The schema permits `ambition` everywhere `basis` appears (`schema.js:40`), so these instructions are the only thing holding it to one artifact.

**Pass 2, the Lived World, `:64`** (the one already known):
> "The schema also permits "ambition" as an origin. Never use it in the Lived World. It belongs to the visual grammar artifact and the rules for when it applies elsewhere are not written yet, so a Lived World entry is "evidence" or "inference" and nothing else."

**Pass 3, Story Architecture moments, inside `:78`:**
> "The origin is "evidence" when the supplied sources state or directly show the thing and "inference" when it was reasoned, and it is never "ambition"."

**Pass 4, the rejects section of the Visual Grammar, `:115`:**
> "Rejects carry an origin of "evidence" or "inference" and never "ambition". A reject is a rule rather than a fact about the brand or a declared aim, and a rule is in force today even when the material that motivated it is aspirational. A reject motivated by a direction source records that source in derivedFrom and is no less in force for it."

The first line names its own reason for existing: the rules for applying ambition outside the grammar are not written. That is the gap an aspiration mechanism would fill.

### 4. What the brain review screens show, and what approve writes

**Answered.** Read this session: `app/app.js:3352-3570`, `:7310-7400`, `:9995-10090`, `:10198-10235`.

**There is one approve action for the whole brain, not one per artifact.** `approve-brain-artifact` at `app/app.js:10027-10046` is gated on `state.brain.artifactStatus === "draft"` and writes, in order: `artifactStatus = "ready"` (`:10028`), `stage = "ready"` (`:10029`), `approvedResult` as a deep copy of `currentSynthesisResult` (`:10030`), `approvedVersion = artifactVersion` (`:10032`), and then clears `pendingSourceIds`, `affectedGuidanceIds`, `candidateBaseVersion`, and `revisionPending` (`:10033-10036`). It calls `syncProductionReferences()` (`:10037`), counts approved outputs built on an earlier brain version (`:10039`), records a history entry (`:10043`), and persists (`:10044`).

**This matters for the intake and synthesis split.** The dossier, the Lived World, the Story Architecture, and the Visual Grammar are approved together as one object. Nothing in the approve path can accept one artifact and hold another, and `approvedResult` is a single snapshot. A brand-today and brand-evolved split would need either a second approved object or per-artifact status, and neither exists at head.

**What approve persists.** `persistBrainState` at `app/app.js:7316-7355` POSTs to `/api/brand-brain/save` a snapshot with `kind: "state"`, the sources with file data stripped (`:7312`, `:7320`), the full `currentSynthesisResult` as `result` (`:7321`), `approvedResult` (`:7322`), the synthesis model and response id (`:7323-7325`), and a `brain` object carrying stage, `processingComplete`, resolutions, `cleanApproved`, `artifactVersion`, `artifactStatus`, `approvedVersion`, `revisionPending`, `pendingSourceIds`, `affectedGuidanceIds`, `candidateBaseVersion`, `guidanceComments`, and `history` (`:7326-7340`). A save failure is swallowed and the UI stays usable (`:7352-7354`).

**The other three approve actions.** `approve-clean-assets` at `:10004-10008` sets one boolean and persists. `finish-brain-review` at `:10014-10025`, which is the gate before the draft exists, increments the version when a revision is pending and moves the stage to draft. `approve-output` at `:10198-10235` writes a consumption record and marks the output record approved. `approve-product` at `:9142` was not read.

**What each artifact review screen shows.** `renderBrainArtifactReader` at `:3552-3570` picks a body renderer from `artifactBodyRenderers` (`:3545-3550`) and wraps it in a header carrying the artifact description, its source count, its category count, and the brain version (`:3562-3563`).

| Artifact | Renderer | Sections shown |
| --- | --- | --- |
| Dossier | `:3352-3393` | the read, audience, desired feeling, product truth and proof, palette swatches, materials, cultural codes, guardrails |
| Lived World | `:3418-3465` | people (or the legacy single `person`), wants, rejects, tensions, patterns with an emotion line, social, environments, belongs, opens |
| Story Architecture | `:3490-3511` | rhythm, the moments, why, continuity |
| Visual Grammar | `:3522-3543` | all six sections including `rejects`, per `grammarSectionMeta` at `:3513-3520` |

**Provenance is surfaced per entry by `basisNote`, `app/app.js:3395-3416.**` It renders a pill reading "From your sources" for `evidence`, "Reasoned" for `inference`, and **"A direction you're reaching for" for `ambition`** (`:3409`), with the `derivedFrom` string beside it (`:3414`). Confidence is shown only on an inference (`:3411-3413`), on the stated reasoning that an ambition is a declared aim rather than a guess. An unrecognized origin renders no note at all (`:3404-3408`), so an unknown value cannot claim the strongest provenance.

**Where `basisNote` is called:** lived-world people (`:3424`), patterns (`:3449`), social (`:3454`), environments (`:3458`); story moments in the new shape (`:3484`) but **not** in the old shape (`:3487`); and every grammar entry (`:3534`). The dossier renderer never calls it, correctly, because the dossier schema carries no `basis`.

**The interface is already built for the ambition label.** The wording at `:3409` deliberately matches the intake form, per the comment at `:3400-3402`. So an aspiration mechanism has a display surface waiting for it in the Lived World and the Story Architecture, both of which the synthesis instructions currently forbid from carrying `ambition` at all.

**Two stale things on these screens.**

- `renderStoryArtifact` hardcodes the heading "Why these four" at `app/app.js:3502`. Moments have been 6 to 12 since 2026-09-07 (`schema.js:312-313`).
- The Visual Grammar reader shows the `rejects` section (`:3519`, `:3534`), and `rejects` reaches neither the writer (the label list at `generate-copy.js:642-646` omits it) nor the compiled prompt. A reviewer approves refusals that no production path consumes.

### 5. What `handleSceneBrief` receives about the look and the campaign, and when

**Fully answered.**

The **campaign** arrives on `body.campaign` and is captured at `generate-copy.js:520`. It enters the context array last among the brain blocks, at `:667-670`, as one line naming the campaign, its idea, message territory, audience, and objective. It is part of `context`, which is joined into the system prompt at `:834`, after the task and before `RULES:`.

The **look** arrives on `body.look` and resolves at `:797-798`, after the whole context array is built and after the kind is selected at `:785`. It becomes `lookRules` at `:810-829` and enters the system prompt at `:837`, as the **first entries under `RULES:`**, ahead of the kind's own rules at `:838`.

**This is the seam an aspiration weight would enter through, and its position matters.** The context blocks, including the visual grammar with its ambition labels, sit in the middle of the prompt as description. The look sits at the end as a rule. The assembly order is fixed at `:831-849`: task, context, RULES, OUTPUT FORMAT. Anything that needs to outrank the brand's own world has to be written into the rules block, because that is the only place in this prompt with more weight than the task paragraphs.

---

---

## 13. Deferred-work entries that no longer hold

`docs/deferred-work.md` (297 lines, read completely). The file's own rule 3 says an entry that ships is deleted rather than marked done. Two entries below have shipped and are still in the file.

### Shipped, and should have been deleted

**"Retire AESTHETIC_MODES"** (`deferred-work.md:274-278`). The entry says "Not done. The modes still supply the assignment opening line." That is false at head. `AESTHETIC_MODES`, `MODE_SIGNAL_PATTERNS`, `selectAestheticMode`, and `openingLine` are gone, recorded at `prompt-craft.js:403-412`. The Assignment section now opens with the assignment itself, `package.js:640-646`, on ADR 0018 ruling five. The `aestheticMode` package field was replaced by the look id and label, `package.js:816-820`. A repository-wide search finds the identifier only in those two comments. **The work described is complete and the entry is wrong in the present tense**, which is worse than stale: a session reading it would go looking for a system that is not there. The two findings it records against the old implementation are history now.

### Stale in part

**"The 12-function Vercel Hobby ceiling"** (`:242`). 13 functions live under `api/` at head. Pass 1 sourced the Pro plan to a finding. The entry is contradicted by the repository whatever the plan is, because 13 is already past 12. This also makes the reasoning stale in two other places that cite it as a live constraint: `generate-copy.js:52-58`, which stacks actions onto one handler for this reason.

**"Studio and product photography looks need world building suppressed"** (`:252-260`). The body holds and the diagnosis is confirmed by the current library, which contains no studio look. The **closing paragraph is wrong**: it says the clean and professional need is met by the `clean_digital` look. There is no `clean_digital` in `LOOKS`. It was absorbed into `neutral` on 2026-08-18, recorded at `looks.js:91-96`. So the entry points a reader at a look that does not exist, and the need it names is now served by the entry that section 6 of this document records as misnamed.

**"Two format tables disagree for Website feature"** (`:244-250`). **The disagreement is real at head** and the line numbers are not. The entry cites `app/app.js` line 59 and line 83; the tables are at `app/app.js:131` (`placementFormats`) and `:155` (`websiteOutputFormats`). `placementFormats["Website feature"]` is `["16:9 landscape", "4:3 landscape"]` at `:135`. `websiteOutputFormats.feature` is `1200 x 800` at `3:2`, `:169-170`. **The entry names the output type catalog as the authority that should settle it, and the catalog answers: Website feature image, 1200 x 800, 3:2.** So this is closeable by reading a document that already exists, not by a product decision.

### Conditions that no longer make sense after 2026-09-09

The brief asks whether each entry's condition still holds after the direction change. Four do not.

**"Protected asset variations are recorded but not chosen automatically"** (`:75-81`). Its condition is "Bring it back when: deterministic compositing lands." The 2026-09-09 handoff retires deterministic composition as an immediate platform project. **The condition is now unreachable**, so the entry will sit here indefinitely unless it is rewritten against a condition that can occur.

**"Refusals that govern language have no durable home"** (`:109-117`) and **"Refusal sources reach past guardrails and lived-world rejects"** (`:119-126`). Both conditions are pinned to ADR 0017 steps 2 and 3. Refusals stopped compiling into image prompts on 2026-08-31 and `rejectsDirection` has been uncalled since (`package.js:394`, section 11). The handoff retires the enforcement machinery while keeping claims and prohibited claims alive where regulation is real. **These two entries are about a channel that no longer feeds anything**, so their conditions describe a sequence that may not continue.

**"A replacement for the phase 1 word count gate"** (`:292-296`). The handoff retires generalized evaluation infrastructure, which reads as retiring this. It is worth noticing what the entry actually proposes: measuring whether every compiled statement is a physical fact that can change pixels, and whether any two statements make competing claims about the same property. Both are mechanically checkable against a captured package. **That is the same discipline the plan's failure corpus describes**, arrived at from the other direction, and both of the failures it claims it would have caught are prompt-conflict failures of the kind section 2 of this document records for the look.

**"Brain export and import"** (`:127-135`) is the reverse case. Nothing retires it, and the World Kit decision makes the export half more relevant than when it was written, since a document generated from the approved world is a form of export with a governance question already attached. Recorded because the entry currently reads as low priority.

### Confirmed still true, in code

- **"Rebuild erases the approved brain before it has a replacement"** (`:97-107`). Verified in full at `src/brand-brain/service.js:238`, `:327`, `:335-343`, `:369-383` and `store.js:108-117`. Section 3.3 carries the lines. The update at `:107` says ADR 0017 absorbs it as step 5; the handoff retires that machinery, so the entry's own condition is back to needing its own decision record.

- **"Deterministic composition is specified and not implemented"** (`:241`). Verified at `service.js:641` and `composite.js:14-20`. The entry is now understated in one respect: it names the OpenAI edits endpoint, and Seedream takes the same path, `seedream-images.js:57-59`. Both engines send a protected asset to a model as a reference.
- **"The server does not refuse unaudited display copy"** (`:196-200`). Verified exactly as described at `service.js:341-356`: `body.draftedCopy` is used as sent and an errored-audit placeholder is attached at `:350-355` while the string still compiles.
- **"Read-back verification for rendered copy does not exist"** (`:202-206`). Verified at `package.js:890` and `prompt-craft.js:426-428`.
- **"The brand slate layer does not exist"** (`:280-282`). Verified by absence: nothing in `looks.js`, `package.js`, or `service.js` scopes the library per client, and `LOOK_IDS` at `looks.js:228` exposes all sixteen. The word "slate" appears in `src/refusals/` for an unrelated concept.
- **"Filtering the look library for the peopleless scene kind"** (`:262-272`). Consistent with code, and it corroborates the count: sixteen looks, four of which name no face. It also independently confirms the correction in section 7 of this document, since it names `long_lens_distance` first among the four.
- **"The studio reference picker offers a narrow slice"** (`:228-232`). The filter it describes is confirmed at `service.js:86` and `:123`, which require a raster type with a `blobPathname`.

### Not verified

Entries resting on files not read this session: dismissal state and candidate rules (`:19-33`), the stylesheet entries (`:37-59`), sub-brands (`:67-73`), remaking a drifted output (`:83-89`), outputs made before package persistence (`:91-95`), resizing and transparency (`:147-163`), the screen-bearing collision (`:169-178`), invented screen content (`:180-188`), display copy character budgets (`:190-194`, which cites `src/copy/display-budget.js`), the content and prompt debt entries (`:212-226`), `resolveClientId` (`:240`), and products doing several jobs badly (`:284-290`).

---

## 14. `docs/image-pipeline-contract.md`

**Not read completely.** 984 lines, 210 KB, with a 175-line header of stacked delta entries. This session read the header in full, the heading structure, and audited its anchors. The twelve stage bodies and the three cross-cutting sections were not read. What follows is an anchor audit, which is the part of the brief this session could finish honestly.

**Structure.** Twelve stages at `:186` (brain synthesis), `:277` (product records), `:328` (claims document), `:372` (job scope), `:412` (claims assembly), `:460` (scene writing), `:552` (compilation), `:652` (preflight), `:701` (render call), `:753` (persistence), `:805` (serving), `:848` (surfacing), then three cross-cutting sections at `:896`, `:908`, `:948`, and an acceptance section at `:982`. The document carries **365 line anchors**.

**The header declares its own drift, and the declaration is wrong in three ways.** `image-pipeline-contract.md:4` says anchors in `package.js`, `prompt-craft.js`, and `looks.js` read low by roughly 30 to 45 lines, that `service.js` anchors outside stages 9 and 10 read low by a growing amount, and that every named function and constant is still present under its stated name.

*First, the drift is not the size it claims.* Measured against head:

| Contract anchor | Contract says | Actual at head | Drift |
| --- | --- | --- | --- |
| `renderEngines` | L17 to L32 | `service.js:17-32` | **0, correct** |
| `resolveRenderEngine` | L34 to L43 | `service.js:34-43` | **0, correct** |
| the engine-table comment | L11 to L15 | `service.js:11-15` | **0, correct** |
| `compileBrandWorldImagePackage` signature | L460 | `package.js:468` | 8 |
| `sceneProductPlaceholder` | L435 | `package.js:443` | 8 |
| `compileProductSectionForImage` call site | L663 | `package.js:695` | 32 |
| product exclusions in the Protection body | L732 | `package.js:753` | 21 |
| job record `endpoint` | L535 | `service.js:579` | 44 |
| `recoverProductionJob` | app.js L8072 | `app/app.js:8226` | **154** |

So the stage 9 and 10 anchors are exact, as the header says, and the `package.js` drift is 8 to 32 rather than 30 to 45. The header states one number for a whole file when the drift grows down each file, which it only admits for `service.js`.

*Second, the declaration omits `app/app.js` entirely.* The header names five modules and does not name the app. Its app anchors are the furthest off of any measured here, at roughly 154 lines. A reader trusting the header would treat an app anchor as current.

*Third, and this is the one that matters:* the claim that every named function and constant is still present under its stated name is true, but presence is not the same as being called. **At least two passages describe behavior that no longer runs**, and neither is covered by any delta at the top of the document:

- The scene-pass account at `image-pipeline-contract.md:46` says "Two section bodies read it," meaning `scenePass`. At head **no section body reads `scenePass`**. It is destructured at `package.js:468` and never referenced again. The Product knowledge body it describes is now gated on template and sales enablement regardless of the flag (`package.js:693`).
- The same passage anchors the gate at "L715 to L733" as "the only place the product's values reach the block," meaning the call site into `sceneProtectionBlock`. **`sceneProtectionBlock` has no call site at head.** It is imported at `package.js:11` and never invoked.

The document's own maintenance rule is at `:180`, and the header records four separate violations of it by name. **A fifth class exists that the header does not have a category for:** a passage that stays accurate about a function's existence while the code around it stops calling it. The 2026-09-07 delta at `:20` correctly announces that the writer authors the prompt and that stages 6 and 7 were rewritten, but the older `scenePass` passage lower in the header was left describing a mechanism that the same commit hollowed out.

**What this means for using the document.** The stage bodies were not read, so nothing here says whether stages 1 through 8, 11, and 12 are current. The anchor drift is real but recoverable, since every named symbol still exists and can be found by name. The risk is the second kind: prose that reads as a current account of behavior and is not, in a document whose header invites you to trust everything outside the modules it names. Anyone using this document should search by symbol name rather than by line, and should check any behavioral claim against the code before relying on it.

## Sections not reached

Stated so nobody treats this document as complete. Updated after pass 2 session three.

**Now written:** sections 3.3 to 3.5 (synthesis service, store, and routes), 4.1 to 4.4 (the import graph, `lookup.js`, `http.js`), 8 (tests, run and mapped), 9 (fixtures, run), 13, 14, and item 4 of the five things.

**Still not read:**

- `src/claims/`, `src/copy/`, `src/refusals/`, `src/scope/`, `src/campaigns/`, `src/clients/`, `src/products/`, `src/brand-brain/source-reader.js`, `src/validation.js`, `src/compiler.js` beyond `:185`, `middleware.js`, and eight `api/` routes named in 4.4.
- `schemas/v1/*.json`, `specs/*.md`, `glossary.md`. Which schema fields the code reads is still unanswered.
- Test bodies. Section 8 maps files to modules and counts; it does not say what any test asserts.
- Fixture JSON files. The `.mjs` harnesses were run, not read.
- `app/app.js` beyond the passages listed in sessions one and two. **Section 12 of the intended deliverable is not written.**
- `docs/image-pipeline-contract.md` stage bodies.
- ADRs 0001 through 0012 and every document under `docs/` other than `deferred-work.md`.
- Evaluations and incidents. Still the one permitted-partial category no session has opened.
- **Sections 9 and 10 of the intended deliverable**, the full call graphs, remain untraced line by line. Sections 1.3, 2, 3.3, and 4.1 carry the established parts.
