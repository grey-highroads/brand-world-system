# ADR 0016: Articulate visual grammar as a brain artifact and evaluate renders against it

- Status: Proposed
- Date: 2026-08-15
- Owner: Higher Roads
- Related: ADR 0015 (render quality on people, scene, and rejects), ADR 0013 (copy audit as the evaluation precedent), ADR 0010 (production feedback through candidate rules), ADR 0009 (update from an approved baseline)
- Source findings: [`../findings-2026-08-14-adr-0015-session.md`](../findings-2026-08-14-adr-0015-session.md), findings 1, 2, 3, and the addendum

## Context

`docs/product-thesis.md` requires the world-building workflow to articulate visual grammar and lived-world logic. Lived-world logic exists as a schema artifact. Visual grammar exists nowhere in the schema. ADR 0015 rejected restoring PWP's visual grammar library on the reasoning that four authored scene fields carry the same knowledge, and the same-day build corrected that rejection in place: the reasoning was correct about the library and wrong about the knowledge. Four fields let a scene writer invent craft per job from a summary. They do not give a brand a durable, versioned, editable account of how it looks. Scene writer rules were tightened three times during the session and each was satisfied at its weakest available reading, because nothing specific existed for the rules to reach.

That correction stands. This ADR does not reopen it. It decides what the artifact is.

Three findings from the 2026-08-14 session shape the decision.

**A declared aesthetic ambition reaches production only as a prohibition.** Mycopop supplied an 8-bit retro gaming reference marked as an outside inspiration with strong declared influence. The brain derived a correct intellectual property rule from it, and the production path delivered that rule as its most specific statement about the aesthetic, under RULES AND GUARDRAILS. The identity principles, which carry the most concrete positive statement, never reach the scene writer: `api/production/generate-copy.js` pushes `identity.summary` alone. Three consecutive suggestion sets produced a home office, an urban park, and a living room. The territory was reachable, demonstrated by an ungoverned frame produced outside BWS that reached it convincingly and cannot ship because it contains readable third-party marks. The system retreats from the territory when the correct behavior is to author the brand's own version of it.

**The rejects list serves copy, not images.** `livedWorld.rejects` describes what the person rejects, which is right for copy governance and audience work. Two of Mycopop's six entries describe something a camera could see. The reference case's eleven exclusions were all visual territories, authored for an image. One field cannot serve both consumers.

**There is no aesthetic evaluation loop.** The existing audit confirms rules reached the compiled text. Nothing examines the returned image. A frame that is fully compliant and mediocre passes every check the system has. An evaluation loop needs a standard to evaluate against, and visual grammar is that standard. Grammar states what the brand looks like; evaluation asks whether the frame met it. Building either alone leaves half a mechanism, which is why both are in this ADR's scope.

## Decision

Visual grammar becomes a first-class brain artifact, synthesized from sources, editable, versioned, and consumed by the scene writer and the compiler. A render evaluation reads the returned image against it and surfaces findings to the reviewer. Five parts.

### 1. A fourth artifact: `visualGrammar`

A peer to `dossier`, `livedWorld`, and `storyArchitecture` under `artifacts`. **Verified:** `artifacts` is a strict object requiring exactly those three keys, so this is a brain version bump and existing clients need re-synthesis to gain it, following the ADR 0015 precedent.

Its sections cover what a camera can see and nothing else:

- **People.** Who appears in the frame, what they look like, what they wear, how they carry themselves on camera. Casting logic rather than audience strategy.
- **Objects.** The era and condition of things: technology period, wear state, prop territory the brand owns.
- **Places.** Rooms, surfaces, and materials in physical space. Not content categories.
- **Light.** Sources, direction, behavior, color condition, contrast character.
- **Camera.** Height, focal range, depth of field, framing distance, and register. Register is the vocabulary the aesthetic mode library stood in for.
- **Rejects.** Visual territory the brand refuses, in terms a camera can see. The addendum's vocabulary shows the register: centred symmetry, spotless environments, decorative haze, exaggerated rim light, staged influencer poses.

Every entry carries the `basis` object from ADR 0015: origin, what it was derived from, and a confidence value. The origin enum gains a third value, `ambition`, for direction that rests on a declared outside inspiration rather than on evidence or reasoning about the brand as it stands. This mirrors the palette's existing directional-rather-than-approved label and keeps Rule 1 discipline in the artifact: an aspiration is never labeled as an established fact. Whether `ambition` is a third origin or a flag on `inference` is a shape question the prototype settles.

The interface presents it as marketers read it, in plain language, editable like its peers, with basis rendered as the existing plain-language note. No schema field names on screen.

### 2. Substitution rather than suppression is a synthesis rule, not a value statement

When a source is marked as an outside inspiration with declared influence, synthesis must author the brand's own physical version of that territory into the relevant grammar sections: what the people wear in that world, what era the objects belong to, what the rooms are made of, how the light behaves. Original motifs and invented forms carrying no readable third-party identity.

The intellectual property prohibition derived from the same source stays in the guardrails and continues to compile. The two are a pair with different jobs: the grammar opens the territory, the guardrail draws the line at the edge of it. The current failure is that only the line exists.

### 3. Visual rejects live here, and `livedWorld.rejects` leaves the image path

Grammar rejects compile as avoid-clauses through the existing `rejectsDirection` pattern, which shipped in ADR 0015 step 5 and is proven at the mechanism level. Once grammar rejects compile, `livedWorld.rejects` stops compiling into image prompts. It remains in the schema, the interface, and the copy path, where it is doing the job it was designed for.

The generic render clichés in the addendum's vocabulary are mostly platform failure modes rather than brand facts: teal and orange grading and floating particles are wrong for every client. They do not compile as defaults into every brand's prompt, which would repeat the generic failure through a new door. They become evaluation criteria in part 4, and the synthesis instructions use them as register examples so brand rejects come back camera-visible.

### 4. A render evaluation reads the image against the grammar

After a render returns, an evaluation examines the image and reports findings on two standards:

- **Grammar fidelity.** Did the frame meet the brand's stated people, objects, places, light, and camera, and did it stay out of the rejected territory. Each finding cites the grammar statement it measures against, following the copy audit's pattern of a finding plus the governing text.
- **Render failure modes.** Is the frame generic, over-rendered, too clean, compositionally obvious. This is where the platform-level cliché vocabulary lives. It also checks for readable third-party marks, which is the guardrail's edge and the exact failure the ungoverned exhibit demonstrated.

Findings surface on the result screen beside the image and persist on the output record, exactly as copy audit findings do. The evaluation is advisory: the reviewer decides. It does not gate or auto-reject, because nothing has measured whether a model's aesthetic judgment is worth obeying, and an unmeasured judge should not burn render spend or block a human. If the evaluation errors, the result says the evaluation did not run. A clean-looking result with a silently failed evaluation is the failure direction this system never permits.

Calibration of the evaluation belongs to a real reviewer using the system over time, per the standing principle on audit calibration. The infrastructure ships ready for that person.

### 5. The scene writer consumes the grammar in place of summaries

The scene writer currently receives world and creative as summary plus principles, guardrails, and `identity.summary` alone. It gains the visual grammar as its craft source: people, objects, places, light, camera, and rejects, compiled compact. This is what gives tightened rules something specific to reach.

The compiler carries the grammar into the image prompt within the budget discipline ADR 0015 established. Grammar compiles as direction, not recitation. The protection section is untouched: its 21.6 percent share is a verified measurement whose effect on output conventionality is assumed and untested, and this ADR does not compress it.

## Options considered

**A second rejects field on `livedWorld`.** Rejected. Finding 3 shows the two lists serve different consumers, and visual rejects are one section of a larger missing artifact, not a missing field on an existing one.

**Fold visual grammar into the identity and creative principles.** Rejected. This is the current state and it failed observably: the statements are marketer prose, distributed across sections with different production reach, and the most concrete one never arrives at the scene writer. A durable account of how the brand looks is an artifact, not a scattering of principles.

**Restore PWP's twelve-module library.** Remains rejected, unchanged from ADR 0015. The correction was about the knowledge, not the library. The grammar is brand-authored and brand-specific, synthesized per client, with no selection mechanism and no module accumulation.

**Evaluate against generic criteria without a grammar.** Rejected. A compliant, mediocre, generic frame passes generic checks. The evaluation is only as good as the standard, and the standard is the brand's.

**Ship grammar without evaluation, or evaluation without grammar.** Rejected per the addendum's reasoning: either alone is half a mechanism. They are sequenced within this ADR rather than split into two decisions.

**Gate renders on evaluation findings.** Deferred. Advisory first, measurement before authority.

## Consequences

The schema gains a fourth artifact and a third basis origin, a brain version bump requiring re-synthesis. Dialog Health is the regression check again: its grammar should come back evidenced and unsurprising. Mycopop is the effect check: its grammar should state the 8-bit territory as the brand's own physical world, labeled as ambition.

Compiled prompts change for every image job, so parity testing across placement shapes applies, per the ADR 0014 pattern.

The suggestion picker currently renders one of four authored scene fields. Once those fields draw on the grammar, judging the writer on a quarter of its output gets more expensive. The defect stands on the list and gains priority.

ADR 0015 step 3 remains open work under that ADR. The session recommendation, delete the regex selector and have the scene writer author register as a field, is coordinated with this decision: register vocabulary comes from the grammar's camera section. **Verified** in `src/production/prompt-craft.js` that `openingLine` falls back to the cinematic film still mode, so every unmatched prompt currently opens with the vocabulary of the failure mode. That deletion does not wait for this ADR.

Approved rejections with stated aesthetic reasons are the natural feedstock for candidate grammar rejects through the ADR 0010 path, and the thesis names writing negative examples back to memory as workflow-two behavior. Roadmap, not critical path.

## Sequencing

Prototype gates schema commitment.

1. **Prototype.** Hand-author Mycopop's visual grammar as a fixture, with no schema change. Feed it to the scene writer in place of the identity and creative summaries and review the suggestion sets. The gate: scenes reach the declared territory as the brand's own version, with no readable third-party identity, across at least three consecutive suggestion sets. This settles the section shape and the ambition-origin question before anything is committed.
2. **Schema and interface.** The `visualGrammar` artifact with basis on every entry, presented in the brain view, editable, versioned with the brain.
3. **Synthesis.** Grammar synthesis with the substitution rule. Regression check on Dialog Health, effect check on Mycopop.
4. **Consumption.** Scene writer and compiler switch to the grammar; `livedWorld.rejects` leaves the image path. Parity testing across placements.
5. **Evaluation.** The render evaluation module, result-screen findings with cited grammar statements, persistence on the output record.

Step 1 gates step 2. Step 3 gates step 4. Step 5 needs the schema shape from step 2 and real grammars from step 3 to test against, and its build can begin once step 2 lands.

## Risks

**The evidence asymmetry returns.** Brand-published CPG sources say little about wardrobe, era, or rooms. Grammar entries will lean on inference and ambition, which is why the basis labels and the review surface from ADR 0015 apply here unchanged. A grammar that is mostly inferred and labeled as such is honest. A thin grammar surfaced to the client is a finding about their materials, not a failure of the artifact.

**Ambition quietly becomes fact.** The label must reach the compiled prompt and the result screen, not stop at the brain interface. Same risk ADR 0015 recorded for inference, same answer: cheap at build time, expensive to retrofit.

**Over-prescription returns.** PWP became prompt-heavy and hard to debug, and a six-section grammar could recreate that by accumulation. The guards: grammar compiles compact, rejects close space rather than prescribe it, per-job craft stays in the four scene fields, and the payload is measured on every change as it was in ADR 0015.

**The evaluator is confidently wrong.** A model grading aesthetics is an unmeasured judge. Advisory-only until a real reviewer's agreement rate says otherwise, and findings always cite the statement they measure against so a human can see when the citation does not support the finding.

**Substitution crosses the line it was meant to respect.** Authoring the brand's own version of a referenced aesthetic sits one step from reproducing the reference. The guardrail still compiles, the evaluation checks for readable third-party marks, and the ungoverned exhibit stays in the record as the case where crossing looks like success.

**Image quality remains unestablished.** ADR 0015's measured effects were payload and authored-scene share, not image quality, and one render has run the completed path. This ADR adds the standard and the measurement loop. It does not assume the direction is proven, and the prototype gate exists so the shape is tested against real suggestion sets before the schema carries it.
