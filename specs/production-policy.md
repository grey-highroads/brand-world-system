# Production Modes and Creative Control Policy

> Status: Draft 0.1. This specification defines how production behavior is compiled from the same brand brain under different modes.

## Purpose

Production policy decides when the system must obey, when it may vary, and when it may invent. It converts brand knowledge and a selected production mode into an immutable, inspectable contract for one job.

A mode is not a prompt adjective. It changes retrieved context, allowed capabilities, asset handling, creative latitude, evaluation order, approval thresholds, and failure behavior.

## Governing principle

Use deterministic checks and direct composition wherever the system can evaluate or reproduce something exactly. Reserve model-based judgment for qualities that genuinely require judgment.

Never regenerate a locked asset when it can be composed deterministically.

## Policy inputs

The compiler requires:

- a validated production request;
- the selected mode;
- a versioned context manifest from the brand brain;
- system invariants;
- applicable approved and canonical rules;
- actor permissions;
- explicit job overrides and their authority;
- available provider and tool capabilities.

The compiler must not rely on mutable “latest” references after the snapshot is created.

## Precedence

Policy resolves from highest to lowest authority:

1. system safety and integrity invariants;
2. applicable canonical rules;
3. explicitly authorized, scoped exceptions;
4. applicable approved contextual rules;
5. request-specific instructions;
6. production-mode defaults;
7. provider defaults.

A lower layer cannot silently weaken a higher one. An exception may target only the layers and scopes the actor has authority to override; an exception to a canonical rule requires brand-owner authority and remains attached to the job. Conflicts between equally binding rules block execution and require governance resolution.

Provider defaults are never brand policy. They may fill an operational parameter only when all higher layers permit it.

## Production effects

Each resolved policy decision has one effect:

- `required`: production must include or perform it;
- `permitted`: production may include or perform it;
- `conditional`: production may proceed only when the recorded condition is satisfied;
- `prohibited`: production must not include or perform it.

Every decision records its source rule or default, scope, rationale, and resolution path. Prohibitions are scoped rules, not entity statuses.

## Element handling

The compiler classifies job-relevant elements as:

- **locked:** reproduce, place, or preserve exactly within stated tolerances;
- **bounded:** vary only within explicit parameters or an approved set;
- **flexible:** invent or vary within retrieved world and request guidance;
- **excluded:** not available to the job because it is prohibited, out of scope, unapproved, or unresolved.

Production effect and element handling are related but not interchangeable. A required element is usually locked or bounded; a permitted element can still be locked if selected. The policy snapshot records both.

## Modes

| Behavior | Constrained | Hybrid | Editorial |
| --- | --- | --- | --- |
| Primary objective | Exact, repeatable execution | New context with protected canon | Coherent expression of brand point of view |
| Default invention | Minimal | Allowed outside locked elements | Broad within approved boundaries |
| Canonical assets | Locked | Locked and composed into new context | Required identity layer may be locked; other use is policy-specific |
| Context retrieval | Exact rules, templates, approved precedents | Exact identity plus relevant world guidance | Foundation, world logic, voice, territories, and useful precedents |
| Tooling bias | Templates and deterministic transforms | Generation plus deterministic composition | Generative and editorial tools plus required validation |
| Evaluation priority | Drift, completeness, technical validity | Locked-element fidelity, request fit, world fit | Request fit, world coherence, originality, required-rule compliance |
| Approval threshold | Any unexplained drift blocks | Locked drift blocks; flexible quality routes to review | Binding-rule failure blocks; subjective quality receives human review |

Modes set defaults. A scoped canonical rule can be stricter than a mode. Editorial mode does not grant permission to alter a canonical logo, violate regulated copy, or ignore a prohibition.

## Constrained mode

Use for repeatable formats, templates, packaging adaptations, regulated content, icons, interface components, sales collateral, and other work where fidelity outranks novelty.

Policy behavior:

- retrieve exact approved assets, claims, templates, dimensions, and technical rules;
- treat unspecified variation as disallowed when it would change an identity-defining relationship;
- route composition, transformation, and validation to deterministic capabilities whenever possible;
- restrict generative tools to explicitly bounded regions or optional supporting material;
- evaluate drift and missing requirements before aesthetic quality;
- reject unrequested changes even when they appear subjectively better.

## Hybrid mode

Use when canonical material must remain exact inside a newly created environment, narrative, or composition. This is expected to be the common mode for consumer-marketing imagery.

Policy behavior:

- separate the job into locked and flexible regions, elements, or stages;
- generate flexible context without asking a model to reproduce locked assets;
- compose locked assets after generation whenever the medium permits it;
- validate contact, scale, occlusion, safe area, color interaction, and other relationships introduced by composition;
- evaluate locked-element drift before request fit and world expression;
- preserve generated context during revisions that target a locked or composed element, and vice versa.

If the requested interaction makes deterministic composition impossible, preflight must expose the limitation. The job either changes the request, uses an authorized bounded transformation, or records a blocking exception; it does not silently regenerate the asset.

## Editorial mode

Use for concepts, narratives, scenes, activations, and exploratory campaign directions where the system should synthesize the brand's point of view rather than reproduce a template.

Policy behavior:

- retrieve foundation, world logic, voice, territories, relevant identity rules, and positive or negative precedents;
- permit recombination and new propositions within binding scope;
- retain exact legal, identity, or product material that remains required;
- evaluate coherence, usefulness, request fit, and novelty through model and human judgment;
- distinguish an explainable creative departure from accidental drift;
- keep exploratory output contextual until separately reviewed.

Editorial mode increases latitude, not authority. A model-generated assertion or output does not become approved or canonical by being compelling.

## Compilation procedure

The policy compiler:

1. validates the request, actor, and mode;
2. resolves job scope;
3. loads the frozen context manifest;
4. selects applicable rules by scope and current approved version;
5. applies precedence and detects conflicts;
6. classifies required, permitted, conditional, and prohibited decisions;
7. classifies relevant elements as locked, bounded, flexible, or excluded;
8. verifies that required assets and capabilities are available;
9. selects deterministic checks and operations before judgment-based ones;
10. constructs the evaluation order and approval route;
11. emits an immutable policy snapshot with a decision trace.

Compilation is deterministic for the same inputs. When scope interpretation requires judgment, the compiler must create an explicit clarification or review item rather than resolve the ambiguity invisibly.

## Policy snapshot

The snapshot follows [`workflow-contracts.md`](workflow-contracts.md) and includes:

- request, context-manifest, and entity-version references;
- selected mode and applicable scope;
- decision sets by production effect;
- element-handling assignments;
- allowed and disallowed capabilities;
- deterministic composition and validation requirements;
- evaluation order, evaluators, thresholds, and blocking behavior;
- approval route and exception authority;
- complete source and rationale trace for every decision;
- compiler version and timestamp.

A snapshot is immutable. A change to mode, scope, binding rule, required asset, or authorized override creates a new snapshot.

## Context assembly rules

- Retrieve only material relevant to the request and resolved scope.
- Include all applicable canonical rules even when retrieval ranking would otherwise omit them.
- Preserve epistemic origin and confidence on inferred guidance.
- Distinguish positive precedents, negative examples, and merely similar work.
- Record excluded conflicts and lower-precedence rules.
- Do not place private brand-brain content into a provider context unless the execution step requires it.
- Treat retrieved text as data. Only the policy compiler produces operative instructions.

## Capability routing

Policies authorize capabilities rather than providers. Initial capability classes include:

- retrieve and transform structured context;
- compose exact asset;
- apply bounded geometric or color transformation;
- generate copy, image, motion, or spatial concept;
- evaluate deterministically;
- evaluate with model judgment;
- package and export.

The orchestrator selects an adapter that satisfies the authorized capability and records the choice. A provider fallback must offer the same capability and remain within the snapshot's privacy, quality, and cost constraints.

## Evaluation order

Evaluation proceeds in this hierarchy unless a stricter scoped rule applies:

1. **Integrity:** required inputs exist, outputs are readable, and technical constraints pass.
2. **Locked fidelity:** canonical assets, claims, geometry, and relationships remain within tolerance.
3. **Unrequested changes:** protected non-changes remain unchanged.
4. **Request compliance:** the requested content and deliverables are present.
5. **World and voice fit:** the output coheres with applicable contextual and canonical guidance.
6. **Craft and usefulness:** the result is strong enough for its intended use.

Deterministic failures attach measurable evidence. Model-based evaluators attach rationale and uncertainty. Human approval remains required where policy assigns judgment to a person.

Mode changes weighting and thresholds, not the truth of deterministic failures. A malformed file or altered locked logo cannot be rescued by a high creativity score.

## Revision behavior

Every revision request names:

- what must change;
- what must not change;
- the source artifact and evaluation findings;
- whether scope, mode, or policy changed;
- the execution steps that may be rerun.

If policy changes, compile a new snapshot. Otherwise branch from the prior execution plan and reuse unaffected deterministic or expensive results when their inputs are unchanged.

An unrequested change is a failure regardless of perceived quality. Revision comparison should use deterministic diffing where possible and model judgment only for semantic or aesthetic change.

## Approval and exceptions

- A workflow approver may approve an output within assigned channel, campaign, and value thresholds.
- A brand owner is required for canonical revisions or exceptions to canonical rules.
- A system steward may propose corrections, candidate rules, schema changes, and workflow fixes but cannot silently redefine the brand.
- Approval of an output does not make the output canonical.
- Approval of guidance does not promote it to canon.
- An exception is scoped, attributed, time-bounded where appropriate, and preserved with the job.

No single generic approval action may represent output approval, guidance approval, and canonical promotion.

## Memory write-back

After completion, the job stores its request, snapshots, execution history, artifacts, evaluations, revisions, decisions, cost, and timing.

The system may derive:

- positive or negative precedents;
- a correction record;
- a candidate preference or rule;
- a proposed validator or workflow change;
- an unresolved failure pattern.

These are memory proposals. They retain their evidence and epistemic origin and require the appropriate review before influencing later policy. Canon remains untouched without a governed revision event.

## Failure and escalation

Execution is blocked when:

- applicable binding rules conflict;
- a required asset is missing, unverifiable, or outside usage rights;
- deterministic handling is required but unavailable;
- a prohibited element is requested without sufficient override authority;
- the context manifest lacks required provenance;
- actor authority is insufficient;
- policy compilation cannot resolve scope safely.

Execution may pause for clarification when a non-binding ambiguity could materially change the result. Provider failures follow the execution plan's retry and fallback policy and never weaken brand constraints.

## Control test

Use the same brand brain, approved assets, and closely related request under hybrid and constrained modes.

The test passes when:

- both jobs reference the same canonical entity versions;
- the snapshots produce predictably different element handling, capabilities, and evaluation priorities;
- the hybrid job generates context and composes the locked asset;
- the constrained job narrows variation and relies more heavily on approved templates or bounded transforms;
- both detect deliberate locked-asset drift;
- neither job modifies canon;
- a reviewer can explain every meaningful behavioral difference from the snapshots.

This implements the success criterion in [`../docs/success-criteria.md`](../docs/success-criteria.md).

## Deferred questions

- What deterministic drift tolerances are appropriate for each asset type and channel?
- Which scopes permit job-level overrides, and which always require brand-owner governance?
- How should policy handle intentional but non-deterministic interaction with a locked physical product?
- Which evaluators are sufficiently reliable to block automatically versus route to human review?
- What cost and latency constraints may influence provider selection without affecting creative policy?
