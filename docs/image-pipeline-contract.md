# Image pipeline contract

- Date: 2026-08-15
- Status: Draft. Practice gate per the spec: stages 6 and 7 only, stopped for owner review before the remaining ten stages and the cross-cutting sections are written.
- Verified against commit: `f7e0843c46eab62a6bd52988d1c85d60372c8ed7`
- Spec: `docs/image-pipeline-contract-spec.md` (the prep artifact defining the template, the twelve stages, and the acceptance test)
- Line anchors below are line numbers in the named file at the verified commit. Every claim is Verified by reading the code at that commit unless labeled Reasoned or Assumed inline.

## What this document is

One authoritative account of everything the system does when making an image. Every stage answers the same eight fields: trigger, inputs, owner, transformations, outputs and artifacts, invariants, failure states, consumers. "None" is an answer; silence is not. The ADRs explain why the machinery exists; this document states what the code does at the commit named above. Where the two disagree, the disagreement is recorded in Known ambient states, never silently reconciled.

## Maintenance rule

Any commit that changes a module listed in the contract updates the contract in the same commit, or states in the commit message why no update is needed. The contract header's verified-against commit moves with every update. A contract more than ten commits behind the modules it covers is stale and must say so in its header until re-verified. This joins the shrink check as the second mechanical ritual of the push workflow.

---

## Stage 6: Scene writing

### Trigger

A POST to `/api/production/generate-copy` with `body.action === "scene_brief"`. The dispatch is at `api/production/generate-copy.js#handler` (L46 to L49), which routes to `#handleSceneBrief` after the shared context load. In the interface, `app/app.js#suggestSceneBriefs` (L9728) sends the request when the user presses a suggest button in Design Studio setup (the `suggest-scene` action handler, `app/app.js` L8556 to L8559). Suggestion is user-initiated only; nothing fires this stage automatically.

### Inputs

From the request body, read by `#handleSceneBrief` and the handler above it:

- `kind`: one of `"scene"`, `"template_surface"`, `"sales_element"`. Any other value, or none, resolves to `scene` (L415).
- `placementLabel`, `placementRatio`, `placementCraft`: the output shape and its per-format composition advice, assembled client-side in `app/app.js#suggestSceneBriefs` (L9735 to L9748) from the studio's format presets.
- `hint`: the user's partial description, when they have started writing (L438). Absent, the user prompt asks for three directions the brand could credibly take.
- `campaign`: an object with `name`, `campaignIdea`, `messageTerritory`, `audience`, `objective`, sent by the interface when a campaign is selected (`app/app.js` L9757 to L9763), read at L331 and L365 to L368.
- `productId`: resolved by the handler before dispatch (L30 to L40). The record must exist and carry `approved_at`; an unapproved record throws with status 409.

From storage:

- The approved brain: `brainState.approvedResult` from the brand brain store (L24 to L27). No approved brain throws.
- `OPENAI_API_KEY` from the environment (L20 to L21).

What the writer receives from the approved brain, exactly (L336 to L375):

- `brandName` and `brandDescription` (L336).
- The `world`, `identity`, and `creative` guidance sections, each as summary plus all principles joined (L337 to L348). Identity principles are included as of commit `1a9357e`; see Known ambient states for the stale ADR 0016 claim on this point.
- `livedWorld.environments`: each entry's name and its `earned` justification (L349 to L353).
- `livedWorld.person` when present, as a string or a JSON slice capped at 600 characters (L354 to L357).
- `dossier.desiredFeeling`, `dossier.materials`, `dossier.palette` with name and role per color (L358 to L360).
- The `rules` section summary plus every `dossier.guardrails` entry as `title: body` (L361 to L364).
- From the product record when one is named: `product_name`, `one_true_thing`, `visual_direction`, and `exclusions` (L369 to L375).

What the writer does not receive: the `foundation` and `voice` guidance sections; `livedWorld.rejects`, `wants`, `tensions`, `patterns`, and `social`; `storyArchitecture`; product features, approved claim language, and proof points; guidance section prose paragraphs and `productionUse` notes.

### Owner

`api/production/generate-copy.js#handleSceneBrief` (L323 to L470), dispatched from `api/production/generate-copy.js#handler` (L46 to L49). The scene writer lives inside the copy endpoint because the serverless function count sits at the Vercel Hobby ceiling and the two paths share the same loaded context (comment at L42 to L54).

### Transformations

In order:

1. Context assembly (L333 to L375): the brain, campaign, and product inputs above are flattened into labeled context lines (`BRAND:`, `WORLD:`, `IDENTITY:`, `CREATIVE DIRECTION:`, `EARNED ENVIRONMENTS:`, `PERSON AT THE CENTER:`, `DESIRED FEELING:`, `MATERIALS AND LIGHT:`, `PALETTE:`, `RULES AND GUARDRAILS:`, `CAMPAIGN:`, `PRODUCT:`, `PRODUCT EXCLUSIONS:`). A parallel `drewOn` array records which sources contributed, for interface disclosure.
2. Kind selection (L379 to L415): each kind carries its own task line and rule list. The `scene` kind directs four separate authored fields (world, composition, lighting, props) with twelve rules covering camera behavior, spatial structure, eye-order ranking with the person first and the product never first or centered, one product unit, off-center composition, light behavior, worn props, three directions differing in world, and pursuit of a declared aesthetic ambition in one of the three (L380 to L395). `template_surface` directs reusable background surfaces with no subject (L396 to L404). `sales_element` directs one clean object with no invented interface copy (L405 to L413).
3. System prompt assembly (L417 to L433): task, context lines, the kind's rules, a structural prose rule (no em dashes, no fragment stacks, L424), a length rule (two to four sentences per field for scene, two or three per brief otherwise, L425 to L427), and a JSON-only output format that for `scene` names all four fields per option (L429 to L432).
4. User prompt assembly (L435 to L439): placement label and ratio, per-shape composition craft, and the hint or the default ask.
5. One model call to `https://api.openai.com/v1/chat/completions`, model `gpt-4o`, temperature 0.9, `max_tokens` 2200 for `scene` and 800 otherwise (L441 to L452).
6. Response parsing (L458 to L467): markdown fences stripped, JSON parsed, options sliced to at most three.

### Outputs and artifacts

Returns `{ options, drewOn, model: "gpt-4o" }` (L469). For the `scene` kind each option carries `label`, `brief` (the world), `composition`, `lighting`, and `props`; for the other kinds each option carries `label` and `brief` (L431 to L432).

Persisted: none. The output is job direction for a single image, never brand knowledge; nothing this stage writes is stored, and the user edits or discards it freely (comment at L42 to L45; the function contains no store writes).

### Invariants

- Suggestions compose only from the approved brain. The handler loads `approvedResult` and throws without it (L26); a candidate brain never feeds the writer. Source: the approval discipline of ADR 0009 and ADR 0002.
- An unapproved product record cannot feed the writer (L35 to L39, status 409). Source: ADR 0012's approval gate.
- Nothing is persisted. Scene suggestions are never a write path into the brain or any store (L42 to L45). Source: the ADR 0010 line that production feedback routes through candidate rules, never auto-writes.
- The stage dispatches through the existing handler rather than a new serverless function, because the deployment sits at the 12-function ceiling (L52 to L54). Source: ADR 0011 operating constraints as recorded in the handler comment.
- The structural prose rules (no em dashes, no fragment stacks) exist for this stage only as prompt instruction (L424). No deterministic check runs on scene brief output; `src/copy/prose-check.js` runs on produced copy blocks, not on scene briefs. Verified by absence: `handleSceneBrief` calls no check function on the parsed options.

### Failure states

- Missing API key: throws at L21 before any model call.
- No approved brain: throws at L26.
- Unknown product: throws at L34. Unapproved product: throws with status 409 (L36 to L39).
- Model call non-2xx: throws with the OpenAI status and the first 200 characters of the error body (L454 to L456).
- Unparseable response: throws "The suggestions came back in an unexpected shape. Try again." (L461 to L466).
- Zero options after parsing: throws "No suggestions came back. Try again." (L467), so an empty result is an error, never a silent empty success.

All of these are caught by `#handler` and sent through `sendPublicError` (L311 to L313). The interface surfaces the message in the suggestion panel error state (`app/app.js#sceneSuggestionPanel`, L4058 to L4060) and clears the options list (`app/app.js#suggestSceneBriefs` catch block, L9774 to L9776).

### Consumers

- `app/app.js#suggestSceneBriefs` (L9728 to L9781) stores the options in `state.studio.sceneSuggestions` and the disclosure list in `state.studio.sceneSuggestionsDrewOn`.
- `app/app.js#sceneSuggestionPanel` (L4056 to L4082) renders the option cards. It displays only `label` and `brief`; the composition, lighting, and props fields are not shown on the card. See Known ambient states.
- The `use-scene-suggestion` handler (`app/app.js` L8565 to L8581) applies all four fields on selection: `brief` into the active studio field, and `composition`, `lighting`, `props` into `state.brief.sceneComposition`, `state.brief.sceneLighting`, `state.brief.sceneProps`. Those three travel in the job brief and are consumed by stage 7 (`src/production/package.js` L373 to L375).

---

## Stage 7: Compilation

### Trigger

`src/production/service.js#prepareProductionPackage` (L161) calls `compileBrandWorldImagePackage` at L304 to L316. `prepareProductionPackage` is reached two ways:

1. `api/production/preflight.js#handler` (L7 to L26), when the user opens preflight. The compile runs before any spend so the user sees the package first.
2. `src/production/service.js#generateProductionImage` (L403), reached from `api/production/generate.js#handler` when the user confirms generation. The compile runs again inside the render invocation; the package the render uses is the one compiled in that invocation, not the one preflight showed.

### Inputs

Passed by `prepareProductionPackage` (service.js L304 to L316):

- `approvedBrain` and `brainVersion`: from `#approvedContext` (service.js L24 to L35), which selects the approved baseline via `src/brand-brain/service.js#selectApprovedBaseline` and throws 409 without one.
- `brief`: the request body's brief. The compiler validates and bounds it (package.js L369 to L381): `scene` required, at most 4,000 characters; `sceneComposition`, `sceneLighting`, `sceneProps` optional prose carried separately when the scene writer authored them (L373 to L375); `exclusions` at most 2,000; `placement` required, at most 120; `format` required, at most 120; `assetType` defaulting to `"scene"`; `bannerHeadline` at most 300; `bannerTextSide`.
- `references`: resolved by `service.js#resolveReferences` (L37 to L65): at most eight, each a stored source that is not `exact-asset` and not `approved-guidance`, with a raster file in Blob, a role from the allowed set, and an influence from Lead, Strong, Supporting, Light. When the job names a product, its `in_context` images join the references up to the cap of eight, with a fixed usage instruction (service.js L194 to L206).
- `lockedAsset`: resolved by `service.js#resolveLockedAsset` (L74 to L101) from an `exact-asset` source with a raster file. When no locked asset is chosen and the product record carries an `isolated` image, that image becomes the locked asset with `assetType: "product"` (service.js L177 to L193).
- `templateAsset`: resolved by `service.js#resolveTemplateAsset` (L108 to L135) from a source with `templateMeta.isTemplate` and a raster file.
- `campaign`: the request body's campaign object, passed through (service.js L311).
- `product`: resolved by `service.js#resolveProduct` (L142 to L159); must exist and carry `approved_at`, otherwise 400 or 409.
- `copyOutputs`: declared copy type ids, unknown ids dropped, capped at four (`service.js#resolveCopyOutputs`, L330 to L336).
- `claimsSet`: assembled by `src/claims/assembly.js#assembleClaimsSet` only when at least one copy output is declared and a claims store is available (service.js L212 to L227), scoped through `src/scope/resolver.js#buildJobScope` from the brief's placement, the product id, the campaign id, and the segment. The set carries `approved`, `prohibited`, `disclosures`, `directives`, and `withheldForSegment` (assembly.js L163). A job with no copy outputs does no claims work.
- `displayCopy`: built in `prepareProductionPackage` before the compile (service.js L238 to L302), only when `body.renderCopyIntoImage` is set, `copyOutputs` includes `headline_set`, and the API key exists. Copy drafted in setup arrives with the job and is used as sent, with the audit that traveled with it; when no draft arrives, `src/copy/generate.js#produceCopy` writes the block against display budgets from `src/copy/display-budget.js#displayBudgets`. The lines carried into the compile take their proportional design ratios from `#designFor` (service.js L294 to L296). A display copy failure sets `displayCopyError` and the job compiles without the block (service.js L299 to L301); a blocked image is the worse outcome, per the ADR 0014 revision of 2026-08-11.

### Owner

`src/production/package.js#compileBrandWorldImagePackage` (L362 to L627). Craft functions it calls live in `src/production/prompt-craft.js`: `#inferPackageFormat` (L41), `#inferScreenBearing` (L70), `#integrationSentence` (L93), `#protectionBlock` (L151), `#selectAestheticMode` (L313), `#openingLine` (L329), `#neutralizeStateLanguage` (L365), `#neutralizeScreenOrientation` (L407), `#auditConstraints` (L432), `#displayCopyBlock` (L267). The display copy zone comes from `src/copy/display-budget.js#getZone` (L114).

### Transformations

In order:

1. **Validation and bounding** (package.js L369 to L381): `requiredText` and `optionalText` (L256 to L279) throw 400 with a user-facing message on missing or over-length fields.
2. **Placement class and guidance order** (L383 to L387): `isTemplate` is `placement === "Brand template"`, `isSalesEnablement` is `placement === "Sales enablement"`. Those two compile from `templateGuidanceOrder` (`foundation`, `identity`, `rules`; L21); every other placement compiles from `guidanceOrder` (`foundation`, `identity`, `world`, `creative`, `rules`; L15). World and creative storytelling are deliberately withheld from template and sales jobs (comment at L17 to L20).
3. **Aesthetic mode** (L390 to L395): `selectAestheticMode` runs over the creative section rendered by `#sectionDirection` in its non-compact form, which includes summary, prose paragraphs, principles, and the production-use note (L287 to L297). The mode falls back to `cinematic_film_still` when no signal pattern matches (prompt-craft.js L313 to L323); the signal patterns cover only the other three modes (prompt-craft.js L245 to L249). `openingLine(mode, hasProduct)` strips the "not a tabletop product photo" clause when no locked asset is present (prompt-craft.js L329 to L333). Note the asymmetry: mode selection reads the full creative prose; the compiled guidance section uses the compact form (step 10 below).
4. **Format and screen inference** (L398 to L401): `packageFormat` from `inferPackageFormat(lockedAsset)`, keyword regexes over the asset's name, type, and file name with `"package"` as the fallback (prompt-craft.js L41 to L61). `screenBearing` is true only when the job is not a template job, not a sales enablement job, has no template asset, and the locked asset matches the screen-device regex (package.js L399; prompt-craft.js L70 to L82). This placement scoping is the seam where the template regression occurred; the exclusions are the fix. `sceneMentionsScreens` is a device-word regex over the scene (L400); `screenContentAbstracted` flags a scene that mentions screens without a screen-bearing locked asset (L401), a preflight disclosure, not a rewrite.
5. **State-lock neutralization** (L404 to L408): runs only when a locked asset is present. `neutralizeStateLanguage` rewrites open, unsealed, spilled, and tipped phrasing to closed and settled equivalents through eighteen fixed patterns (prompt-craft.js L340 to L358), returning the changed phrases, which the package records as `stateNeutralizations`.
6. **Screen orientation neutralization** (L409 to L413): runs only when `screenBearing` is true, so never on template or sales jobs and never when a template asset is present. `neutralizeScreenOrientation` rewrites mid-use phrasing (scrolling, typing, looking at, reading, using a device) to presentation poses through ten fixed patterns, participle forms kept participle and finite forms kept finite (prompt-craft.js L382 to L396). Changed phrases are recorded as `orientationAdjustments`.
7. **Protection block** (L416 to L422): `protectionBlock({ lockedAsset, format, peopleExcluded: false, screenBearing, displayCopy })`. Three cases (prompt-craft.js L151 to L206):
   - No locked asset: render only the authored environment, no invented focal object or identity mark, plus text safety and the screen content rule (L154 to L162).
   - Locked non-product asset: preserve identity, integrate through non-destructive light and depth only, plus text safety and the screen content rule; the three screen orientation lines (L145 to L149) are spliced in when screen-bearing (L170 to L181).
   - Locked product asset (matched by asset type regex at L165 to L167): format-noun preservation sentence; the one-readable-unit rule that turns any further unit of the product away from camera (L193); the closed-and-sealed state lock when the format is stateful (L195 to L199); screen orientation lines when screen-bearing (L200); the `integrationSentence` for physical grounding (L201, L93 to L101); text safety; the screen content rule (L202 to L203).
   - Text safety selection: `TEXT_SAFETY_WITH_DISPLAY_COPY` (permitting exactly the authored block, forbidding all other invented words) replaces the blanket `TEXT_SAFETY` when display copy is present (L152, L108 to L115).
   - Screen content rule selection: `SCREEN_CONTENT_RULE_WITH_ASSET` (the protected asset's own display shown exactly, every other screen abstract) when the locked asset is screen-bearing, otherwise `SCREEN_CONTENT_RULE` (every screen abstract, including a subject device) (L125 to L132). Case 1 always uses the no-asset rule (L158). Source: the ADR 0014 revision of 2026-08-11, screens are a governed surface.
8. **Campaign, continuity, and composition sections** (L434 to L479): the campaign direction section compiles when `campaign.campaignIdea` exists; campaign continuity compiles per prior output with one of five role instructions, defaulting to reference-only (L426 to L459); the composition section compiles for `assetType === "banner"` (quiet-third instruction from `bannerTextSide`, and when `bannerHeadline` exists an instruction that the headline is overlaid by layout and no text is rendered, L468 to L475) or `assetType === "product"` (the supplied product image is the subject, L476 to L479).
9. **Section assembly** (L481 to L559), in this exact order, empty sections dropped (L559): Assignment (opening line plus scene for standard jobs, with composition, lighting, and props appended as labeled sentences when authored, L488 to L494; template and sales jobs get their own assignment line and no opening line, L484 to L487); Brand foundation (`brandOpener`, L242 to L249, plus dossier read body or synthesis summary); Product knowledge (image variant only: name, one true thing, visual direction; claim language and features deliberately excluded from image prompts, `#compileProductSectionForImage` L313 to L322); the guidance sections in the active order, each compiled compact as summary plus bare principles (`#sectionDirection` with `compact: true`, L287 to L297, L504); template production instructions or sales element instructions when applicable (L505 to L506, L23 to L63); campaign direction; campaign continuity; banner or product composition; Audience and feeling (dossier audience and desired feeling, withheld from template and sales jobs, L510 to L513); Visual materials (palette always, materials withheld from template and sales jobs, L514 to L520); What this brand is not (`#rejectsDirection`, L303 to L308, compiling `livedWorld.rejects` as avoid-clauses, withheld from template and sales jobs, L521 to L524); Creative references (per-reference direction with influence, role, usage instruction, and do-not-carry-over exclusions, or the no-reference fallback line, L525 to L530); Protection (the protection block, template or sales overlays, every dossier guardrail as `title: body`, every product exclusion as `Product rule:`, and `Also avoid:` with the brief exclusions, L531 to L541); Display copy (`#displayCopyBlock` with the zone from `getZone(displayCopy.zoneId)`, only when a line has text, L543 to L548); Output (per-placement closing instruction, L549 to L558).
10. **Prompt join** (L561): each section as its uppercased title, a newline, the body, sections joined by blank lines. This string is the render prompt and the durable record.
11. **Constraint audit** (L564 to L568): `auditConstraints` checks each guardrail and the brief exclusions for presence in the compiled prompt, a deterministic text check, not semantic (prompt-craft.js L432 to L461). Because step 9 compiles guardrails and exclusions verbatim into the Protection section, presence is guaranteed while that compilation holds; the audit's live value is as a regression tripwire against a compile change that drops them (Reasoned; the guarantee itself is Verified from L538 to L540 against L442 and L452). An approved product with unanswered review questions appends a warning entry (L572 to L578).
12. **Treatments and requirements** (L581 to L584): `resolveTreatments` (L109 to L208) classifies locked assets, guardrails, scoped brain rules through `arrayScopeAppliesToJob`, guidance sections, references, palette, and materials into locked, suggested, and not-needed for the preflight panel. `checkRequirements` runs with the deliverable id hardcoded to `"brand-world-image"` for every placement, including template and sales jobs (L582; see Known ambient states). Treatments are display-only and do not govern the prompt, per ADR 0005 sprint finding 3.

### Outputs and artifacts

Returns one package object (L586 to L626): `version: "brand-world-image-v2"`; brand name, description, brain version, source count; `output` with placement, format, size from `#imageSizeForFormat` (L330 to L332, table at L210 to L236), quantity 1; `brief` with the neutralized scene and exclusions; `aestheticMode`; `lockedAsset` and `templateAsset` summaries; `stateNeutralizations`, `orientationAdjustments`, `screenContentAbstracted`; `prompt`; `sections`; `compiledComponents`; `references` summaries; `constraintAudit`; `treatments`; `requirementCheck` and `ready`; the product summary with its open question count; the copy contract via `#compileCopyContract` (L641 to L669), which returns nothing at all for a job with no declared copy outputs and otherwise records the declared types, the governing claims as text, source, and scope, the display block with `verified: false`, claims withheld for a missing segment, and an empty `produced` array; and `policy` with grounding, flexible elements, and exclusions.

Persisted by this stage: none. The compiler is a pure function over its inputs. Persistence of the package belongs to stage 10: the working job record carries `generationPackage` from the moment the render starts (service.js L419 to L428), and `writeOutputPackage` saves it beside the image after the render (service.js L513 to L524).

### Invariants

- **The compiled prompt is the durable record.** The package carries the exact prompt string the renderer receives, and it persists with the output. No stage between compilation and the API call may append or rewrite; stage 9 validates non-empty only. Source: ADR 0003 and ADR 0006; the persistence rule in stage 10.
- **Image-only parity.** A job that declares no copy outputs gets no `copy` key at all, and its compiled package is byte-identical to the pre-copy-contract compiler's output (`#compileCopyContract` L641 to L643, comment L633 to L636). Asserted by `test/copy-contract.test.js` ("a job with no copy output compiles identically across every placement shape", L57).
- **Neutralizer scoping.** State-lock neutralization runs only when a locked asset is present (L404). Screen orientation neutralization runs only when the job is screen-bearing, which excludes template jobs, sales jobs, and any job with a template asset (L399, L409). Source: the screen orientation template regression, fixed by exactly this scoping.
- **Protection is one compact block and is proven craft.** The protection text, integration sentence, and state lock carried through thirteen PWP iterations and are ported as-is (prompt-craft.js L1 to L12). ADR 0015 compressed guidance but left protection untouched.
- **The claims set is recorded as assembled, never re-filtered or paraphrased.** The compiler maps each claim to text, source, and scope and stores it (L650 to L655). Scope matching and the asymmetric fail directions (approved and disclosures fail closed, prohibited fails open) live upstream in `src/scope/resolver.js` (header, L21 to L33) and `src/claims/assembly.js` (L71 to L72); the compiler must not reimplement them. Source: ADR 0013 revision of 2026-08-09.
- **`verified: false` is never set true by assertion.** The display record carries it false until read-back verification exists (L656 to L661). Source: ADR 0014 revision of 2026-08-11.
- **Treatments are display-only.** They classify for the preflight panel and do not govern the compile (ADR 0005 sprint finding 3; verified: nothing in L481 to L559 reads `treatments`).
- **Screens are a governed surface.** Every compiled prompt carries a screen content rule; readable screen content enters only as a protected asset (prompt-craft.js L117 to L132). Source: ADR 0014 revision of 2026-08-11.
- **Deliverable requirements are advisory.** `ready` is computed and reported; nothing in the compile or the render path blocks on it (L583 to L584, L616). Source: ADR 0005 sprint finding 4.

### Failure states

- Missing or over-length brief fields throw status 400 with a user-facing message naming the field and the limit (`#requiredText` L256 to L269, `#optionalText` L271 to L279).
- No approved brain throws status 409, both in the compiler's own guard (L363 to L367) and earlier in `service.js#approvedContext` (L24 to L35), so the compiler's guard is a second wall rather than the live one.
- Upstream resolution failures reach the caller before the compile: bad references, locked asset, template, or product throw 400 or 409 from their resolvers in service.js (L37 to L159).
- The compile itself makes no model call and no network call; it is deterministic. Any throw surfaces through the endpoint's `sendPublicError` (preflight.js L23 to L25; generate.js catch). There is no empty-success shape: the compiler either returns a full package or throws.
- A display copy failure is not a compile failure: the error is recorded on the copy contract as `displayCopyError` and the job compiles and renders without the block (service.js L299 to L301, L317 to L318).

### Consumers

- `api/production/preflight.js#handler` returns `{ generationPackage }` to the interface, which renders exactness, adjustments, the screen abstraction disclosure, and governing claims from it (stage 8; the interface regions are stage 12's to document).
- `src/production/service.js#generateProductionImage` consumes `generationPackage.prompt` (L443), `output.size` (L446), and the copy contract for post-render copy production (L470 to L509); the endpoint choice reads the reference entries, not the package (L425).
- `src/production/store.js` persists the package on the working record and beside the output (stage 10).
- `src/production/package.js#buildConsumptionRecord` (L675 to L692) derives the consumption record from the package for change-impact classification.
- `app/app.js` preflight and result regions read the package fields (stage 12).

---

## Known ambient states (draft scope: stages 6 and 7)

Findings recorded during the practice build. Each names the disagreement and the evidence; none has been reconciled in code.

1. **ADR 0016 carries a stale Verified claim about the scene writer.** The ADR's context section states, marked Verified, that `api/production/generate-copy.js` pushes `identity.summary` alone and the identity principles never reach the scene writer. Commit `1a9357e` (after `bcee418`, before this contract's verified commit) changed the writer to include identity principles (`api/production/generate-copy.js` L341 to L343). The ADR text has not been updated. The spec for this contract (`docs/image-pipeline-contract-spec.md`, stage 6) carries the same stale statement, dating from its verification at `bcee418`.
2. **The spec names a scene writer kind that does not exist.** The spec's stage 6 lists kinds `scene` and `object`. The kinds at the verified commit are `scene`, `template_surface`, and `sales_element` (`api/production/generate-copy.js` L379 to L414). No `object` kind exists anywhere in the file.
3. **Display copy governance is enforced client-side at the API seam.** ADR 0014 part two requires in-image copy to come only from a produced-and-audited source. Server-side, `prepareProductionPackage` uses `body.draftedCopy` as sent (service.js L253 to L268); when the draft arrives without an audit, an errored-audit placeholder is attached and the string still compiles into the render prompt. The comment records that the interface blocks generation while an edit is unchecked (L249 to L252), so the gate is the client, and a direct API caller can render an unaudited string. The package records the audit state honestly; it does not refuse the string.
4. **The suggestion picker displays one of four authored fields.** `app/app.js#sceneSuggestionPanel` (L4056 to L4083, card markup at L4070 to L4074) renders only `label` and `brief`. Selection applies all four fields (L8565 to L8581), so the data is complete and the defect is display-only. Already recorded in `docs/deferred-work.md` and in ADR 0016's consequences.
5. **`checkRequirements` runs with a hardcoded deliverable id.** `compileBrandWorldImagePackage` calls it with `"brand-world-image"` for every placement (package.js L582), so template and sales enablement jobs are checked against the brand-world-image requirement list, and the `product-showcase` entry in `deliverableRequirements` (L78 to L83) is reachable only by a direct call with that id, which no caller at the verified commit makes. Requirements are advisory (ADR 0005 finding 4), so the mismatch has no blocking effect today.
6. **`compileProductSection` is dead code.** `src/production/package.js#compileProductSection` (L337 to L360) compiles the full product record including approved claim language into a prompt section and is called from nowhere in `src/` or `api/` at the verified commit. The live image path uses `#compileProductSectionForImage` (L313 to L322), which deliberately excludes claim language from image prompts. A session finding the dead function by search could mistake it for the live compiler; that is the exact misreading class this contract exists to prevent.
7. **The constraint audit is structurally satisfied by construction.** Guardrails and brief exclusions are compiled verbatim into the Protection section (package.js L538 to L540) and then presence-checked against the same prompt (prompt-craft.js L442, L452), so their `carried` status is guaranteed while that compilation holds. The audit's value is as a regression tripwire, not a live filter (Reasoned).
8. **ADR 0016 is proposed and unimplemented at the verified commit.** No `visualGrammar` artifact exists; `livedWorld.rejects` remains the live source of image-path avoid-clauses (`#rejectsDirection`, package.js L303 to L308). This is consistent with the ADR's status; recorded here so a session does not go looking for grammar consumption that does not exist yet.
