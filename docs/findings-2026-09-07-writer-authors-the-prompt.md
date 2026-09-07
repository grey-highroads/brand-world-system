# The writer authors the prompt, the compiler attaches facts

- Date: 2026-09-07
- Base commit: `a3a567aa40465005bec2577805c54d032a3154fb`
- Modules: `api/production/generate-copy.js`, `app/app.js`, `src/production/package.js`, `docs/image-pipeline-contract.md`, tests
- Status: shipped

## What changed and why

The brand used to become a prompt twice. A writer read part of the brain and produced a scene in four fields. A compiler then wrapped those fields in blocks it built from the brain again: world, capture, people, protection, product knowledge, exclusions, refusals, output. Each step carried its own accumulated rules, each one written after a bad render. The image model received about six hundred words and ignored most of them.

Two prompts written by hand on 2026-09-07, around 180 words each, one piece of prose, no rules and no compiled blocks, rendered better than anything the system had produced. They were written by someone who had read the brand's artifacts and had a point of view about the moment.

The shape now: the writer reads the four brain artifacts and produces a finished prompt as one piece of prose. The compiler attaches the format, attaches the locked asset, records provenance, and adds nothing else.

Governance did not move. The brain is approved before anyone writes. A person picks a direction before anything renders. The result is reviewed before it is approved. What changed is the prompt in between, which now carries the moment rather than the rulebook.

If the writer's output is generic, the artifact that should have prevented it is the thing to improve. That is the intended consequence. The artifacts are the world view, and this shape makes their quality visible for the first time.

## What stopped compiling on a scene render

Listed so that any return is a decision rather than a drift. Every builder function behind these stays in the file, uncalled, so each return is one revert.

1. **People.** `FACE_FRAMING_RULE`, compiled on every scene render since 2026-08-31. It was a scene-path section only, so it now compiles nowhere. `FACE_FRAMING_RULE` is still exported from `prompt-craft.js` and still imported by `package.js`.
2. **Product knowledge.** Both bodies: `compileProductSectionForImage` on a single call and `sceneProductPlaceholder` on the scene pass of a two-call render. The writer's prose is what puts the product in the scene now, and the locked asset still attaches to the render call. `sceneProductPlaceholder` is now uncalled from anywhere.
3. **Protection.** `sceneProtectionBlock` and everything it carried: the text safety sentence, the screen content rule, the locked-asset preservation language, the one-readable-unit rule, the closed-and-sealed state lock, and the avoid sentence carrying the brief's and the product record's exclusions. `sceneProtectionBlock` is now uncalled. The template and sales enablement Protection section is untouched.
4. **Creative references.** The per-reference direction naming role, influence, usage instruction, and do-not-carry-over exclusions. The reference image itself still travels to the renderer and still appears on the record; the prompt stops describing it in words.
5. **Campaign direction and campaign continuity.** Campaign context still reaches the writer, which is where a campaign belongs: it changes what the moment is, not what a rule says.
6. **Banner and product composition.** The quiet-third instruction driven by `bannerTextSide`, the instruction that an overlaid headline must not be rendered into the image, and the product-placement paragraph for `assetType === "product"`.

Already stopped before this commit and named here for completeness, because the same list is where anyone will look: the world block and the refusals recital both stopped on 2026-08-31, and `worldDirection` and `rejectsDirection` have been uncalled since.

## What kept compiling, and one thing that nearly did not

Assignment, Capture, and Output. Plus Display copy.

Display copy was the one consequence the builder brief did not name. Taken literally, "nothing else compiles on a scene render" removed it, which would have meant a job that produced and audited a headline through the ADR 0014 copy path rendered an image with no text on it and no surface saying why. That was raised before the work was pushed rather than after, and the owner ruled it back in the same day: an approved display string is a fact about the image in the same sense the format and the locked asset are, so it belongs with the facts the compiler attaches rather than with the rules it stopped reciting. The acceptance line is now three sections, or four when display copy is present.

The three sections that were removed and are not coming back on the owner's ruling are campaign direction, campaign continuity, and the composition blocks.

## What the writer reads now

The four artifacts under `brain.artifacts`, in full, as labelled plain-text blocks, plus campaign and product context and the look. A field the brand has not written sends nothing rather than an empty heading.

Three things are withheld by name, each because it is a rule rather than a fact about the world:

- The guidance sections. They are prose summaries of the same four artifacts, and sending both gave the writer two answers to every question.
- `dossier.guardrails`.
- The grammar's `rejects` section, withheld for the reason it always was: ADR 0017 made the governed refusals document the only refusal source for the image path.

The product line names the product and says it is present in the scene. `visual_direction` and `exclusions` no longer travel: one is a second art director and the other is a rule.

The material that did not reach this stage at all before this commit is the reason the change is expected to work. Story Architecture had never been read by the scene writer. Neither had Lived World's patterns, emotions, tensions, or social modes. Those are what these people are doing and feeling, and they are assembled as sentences rather than as a list of field names.

## Rules cut from the writer

`kinds.scene.rules`, twenty-four entries. `worldRules`, seven entries. The third `lookRules` entry. The per-field length rule. All are preserved verbatim in a comment block above `#handleSceneBrief`, with the dated comments that record which render produced each. The first two look rules stay, because a medium that requires a condition has to decide the setting, and that precedence was established by three named look failures on 2026-08-18.

The scene kind's `task` is rewritten as the whole instruction, about 130 words.

## Consequences accepted going in

Some failures the removed blocks were written for will come back. That is the point rather than a risk being tolerated: each one that returns is now evidence about an artifact or about the writer, both of which are short enough to read. Nothing returns to the compiler.

Two specific ones worth naming, because they have the most evidence behind them:

- The face framing rule was added after a render where a person appeared in a scene that named no person. The festival fixture that beat the old word-list gate is kept in the test suite as the record.
- Product-record exclusions painting label text onto a placeholder can, the 7:38 PM render of 2026-09-02. That failure mode is now structurally impossible on a different path: product exclusions no longer reach the writer or the compiler at all.

## Collateral, recorded rather than fixed

- **`fixtures/adr-0016-step4-parity.mjs` now describes a shape that does not exist.** It holds copies of the grammar-path and legacy-path context assemblies and asserts the live handler still matches them. Both paths read the guidance sections, which are no longer read, so the fixture is stale. It is left in place. It is one of the harnesses `node --test` does not pick up by filename, so it is not failing CI and was not failing CI before this commit either.
- **The `option.world` fallback in the parse step is kept.** A model that emitted `world` instead of `brief` used to produce a card with a heading and no body. The rules that made `world` a likely key are gone, so this should stop firing. It costs nothing and was not removed.
- **The constraint audit now reports brief and product exclusions as not carried on a scene render.** That is the audit working, not a defect. What the brand refuses is still on the package, in `treatments`, and in `policy.excluded`.

## Verification

- `node --check` on every edited JS file.
- Template and sales enablement compiled prompts byte identical to the base commit. Captured sha256 of the compiled prompt for four cases against the tree at `a3a567aa` before any edit, recaptured after, diffed: template bare, template with product plus campaign plus prior outputs plus banner composition, sales enablement bare, and sales enablement with a template asset plus campaign plus product composition. All four identical. The four cases were chosen to exercise every branch that was about to be gated.
- Scene renders compile exactly Assignment, Capture, Output, verified on a bare scene, a scene loaded with product, campaign, locked asset, references, and display copy, and a `scenePass` compile. With display copy present, Display copy compiles as the fourth section between Capture and Output.
- A brain with an empty Story Architecture still produces three directions and drops the block from both the prompt and `drewOn`, verified by a probe run against `#handleSceneBrief` with a stubbed model call.
- The assembled writer prompt was read end to end against a fixture brain carrying poison strings in the withheld fields. None of them appear.
- Full suite: 165 tests, 164 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, is pre-existing, and was left alone.
- No em dashes in any touched file, checked mechanically before the push.

## Tests updated

Compiled prompts changed on purpose, so tests pinning the old sections were rewritten rather than deleted where the fixture still meant something.

`test/production-openai.test.js`

- The determinism test now pins the three-section shape and asserts the face rule is absent.
- The festival person-gate test is inverted: it now asserts no People section compiles on a scene render. The fixture is kept because it is the recorded miss that produced the rule.
- The creative references test is extended to cover a scene render with a reference attached, asserting the reference is on the record and not in the prompt.
- Four Protection tests are collapsed into one, asserting no Protection section, no avoid sentence, exclusions still on the package and in `policy.excluded`, and a constraint audit that no longer says carried.
- The Images edits test asserts the reference travels as an image and not as words.
- Two locked-asset tests assert the asset still reaches the render call in the right order with no protection block in the prompt.

`test/production-seedream.test.js`

- The two-call record test asserts the scene prompt and the single-call prompt are now the same three sections, and that the two calls still differ in what they send alongside the prompt.
- The scene placeholder test asserts the placeholder no longer compiles.
- The scenePass test asserts both passes compile the same three sections and that the flag left at its default changes nothing.
- The exclusions test asserts no exclusions reach either pass and both stay on the record.

`test/display-copy.test.js`

- The scene display copy test asserts the four-section shape with Display copy between Capture and Output.
- A new test asserts a template job still compiles its display copy section.
