# Brand World System

Persistent brand intelligence and governed production infrastructure. Deployed, with two client brands running through it.

## The problem

Most AI tools treat a brand as something you explain again every time you want something made. You upload the guidelines, paste the brief, attach a few references, describe what you want. The tool makes it. Then the context disappears.

Next week you do it again. The approved logo and somebody's guess about the brand's tone went into the same box, so the tool had no way to know which one it was allowed to change. The correction you gave it Tuesday is buried in a chat nobody can find.

That is the actual cost. Not that the output is bad, because often it isn't. It's that the work of explaining the brand never compounds, and nobody can answer why a given asset came out the way it did.

## The bet

Rendering quality is commoditizing. Every model release closes the distance on fidelity, and any advantage built on being good at prompting a particular model expires when that model is replaced.

What does not commoditize is a structured, governed, portable account of what a brand is and what it is permitted to do. That asset appreciates as approved work accumulates, and it survives the model underneath being swapped out.

So this system is built the other way around from most tools in the category. The brand model is the product. Generation is a replaceable consumer of it.

## Aspiration, and why it is the durable part

Governance is the practical half of this system and it is not the defensible half. Locking approved assets is table stakes. Enforcing prohibitions is risk work every serious operator will eventually do. Both are necessary. Neither is hard to copy.

The defensible part is that a brand can be governed and still move.

Every evidence-based approach to brand consistency is structurally backward-looking. Fine-tune a model on brand imagery, retrieve from the asset library, follow the style guide, and each one learns from what the brand already is. They reproduce the past accurately and have no mechanism for anything else. A brand that wants to become something has to leave the system to do it, which is exactly when consistency breaks.

This system treats aspiration as a first-class kind of knowledge. A direction the brand is reaching toward is recorded with its own origin, sits alongside what is observed and what is inferred, and is never labeled as a fact about the brand today. Once approved, it compiles at full strength with no hedging, because the image model needs direction and the human needs the label. The brand can move on purpose without anyone pretending it has already arrived.

The sharpest expression of this is substitution rather than suppression. Handed a reference the brand admires and cannot legally use, most systems produce a prohibition and stop. This one authors the brand's own physical version of that territory, its own people, era, materials, and light, and keeps the prohibition at the edge of it. One opens the ground. The other draws the line. Most systems only have the line.

Model progress makes this stronger rather than weaker. The constraint on reaching a territory a brand has not yet earned was always the rendering. Every capability gain makes a declared aspiration more executable. Governance does not improve when the model improves, it only becomes more necessary. Aspiration compounds with the thing everyone else is racing.

## What runs today

A hosted studio with two client brands onboarded, one B2B and one emerging consumer packaged goods, chosen to be unalike so the schema would have to hold across both.

- **Brand brain.** Source intake, synthesis into a structured brand model, review, approval, versioning, and incremental update from an approved baseline. Every statement carries where it came from and whether a person approved it.
- **Products as governed records,** with a candidate and approved lifecycle and evidence-fidelity discipline.
- **Production compiler.** A deterministic library that resolves canon, scope, and policy into a portable generation package, under versioned schema contracts.
- **Renderer,** with deterministic composition of protected assets onto generated backgrounds.
- **Look library.** Fourteen named looks compiled as a governed world block, with a stated photorealistic ban and a human texture floor.
- **Governed copy,** derived from scoped brand claims and audited against them before it ships.
- **Refusals.** Brand prohibitions decomposed, assigned, and compiled into the generation as things to avoid.

## What building it proved

Three findings changed the design rather than illustrating it. All three are in the decision record with the evidence attached.

**Synthesis is a sampler, so anything consequential has to be a governed record.** The same brand run through synthesis three times, from identical sources under identical instructions, produced three different sets of brand guardrails. No guardrail was shared across all three runs on either test brand. Not one currently approved refusal survived, including a healthcare client's approved rule against fear-based depictions of patients.

That is the dangerous kind of failure. A wrong rule gets caught in review. A missing rule doesn't, because nobody reviews an absence. The fix was to change what a rule is: the model proposes, a person rules, and the rule stays until a person retires it. The model keeps the thing it's good at, which is surfacing concerns nobody thought of, and loses the thing it was bad at, which is quietly dropping a protection.

**The renderer obeys physical facts and ignores description.** Across roughly thirty renders, concrete topology was obeyed and abstract perceptual targets were not. Counts, positions, one action per subject, surface states with a stated cause, named light positions. Words like natural or unperformed did nothing. Governance language written for a marketer to read compiles badly into an instruction for an image model.

**The failure was silence, not volume.** One compiled prompt ran 2,610 words and was 49 percent prohibitions. The obvious diagnosis was bloat and the obvious fix was subtraction, so a gate was registered in advance around word count. It failed, and it was mis-specified. Cutting 250 words was invisible. Every intervention that visibly improved output added concrete language in a strong early position. Four of the five things fixed that session were absences rather than errors, and the model had been filling each silence with consensus. Both halves of that bet are in the record. The corrected principle: when quality plateaus, ask which axis nobody has written to yet.

## What this is not

Not a prompt builder. Not a general creative platform. Not a replacement for a DAM or a project tool. It does not publish without human approval, and it does not promise pixel-perfect reproduction through prompt instructions, which is exactly why exact assets are composited rather than generated.

The engineering is not enterprise hardened and does not claim to be. No role-based access control, no single sign-on, no formal service commitment, and test coverage is fixture-driven rather than exhaustive. Those gaps are tracked, not discovered.

What is proven is the harder part. The schema held across two unrelated brands. Policy compiles into real generation. Governance survived contact with production deadlines. Hardening a validated model is ordinary work. Discovering the model was wrong after hardening it is not.

## Where to start

New here, read [`docs/product-primer.md`](docs/product-primer.md). It is the plain-language walkthrough and assumes nothing.

**Product and rationale**
- [`docs/product-thesis.md`](docs/product-thesis.md) — rationale, product model, boundaries, and commercial opportunity
- [`docs/architecture.md`](docs/architecture.md) — system boundaries, components, data flow, isolation, and failure posture
- [`docs/product-development-principles.md`](docs/product-development-principles.md) — product-first decision sequence and architecture test
- [`docs/concept-visibility.md`](docs/concept-visibility.md) — user-facing, configured, internal, and unproven concepts
- [`glossary.md`](glossary.md) — authoritative terminology
- [`roadmap.md`](roadmap.md) — staged path and current status appendix

**Decisions and evidence**
- [`docs/decisions/`](docs/decisions/) — eighteen decision records, with supersessions preserved rather than edited away
- [`docs/evaluations/`](docs/evaluations/) — gate rubrics registered before each run, and the judged findings
- [`docs/incidents/`](docs/incidents/) — production defects and what they changed
- [`docs/deferred-work.md`](docs/deferred-work.md) — the open register

**Specifications**
- [`specs/brand-world-schema.md`](specs/brand-world-schema.md) — entity, governance, provenance, and revision model
- [`specs/production-policy.md`](specs/production-policy.md) — policy primitives, stage presets, compilation, evaluation, and approvals
- [`specs/workflow-contracts.md`](specs/workflow-contracts.md) — durable payloads between world-building, production, governance, and learning
- [`docs/production-compiler.md`](docs/production-compiler.md) — compiler boundary, contracts, and verification
- [`docs/image-pipeline-contract.md`](docs/image-pipeline-contract.md) — the twelve stages from brief to rendered asset
- [`schemas/v1/`](schemas/v1/) — versioned JSON Schema contracts

**Implementation**
- [`app/`](app/) — the studio application
- [`api/`](api/) — serverless routes for brain, production, products, clients, and storage
- [`src/`](src/) — brand brain, claims, compiler, production, refusals, renderers, and scope resolution
- [`test/`](test/) — compiler, contract, and behavior tests
- [`fixtures/`](fixtures/) — reference cases and the decision gate harnesses
- [`docs/vercel-deployment.md`](docs/vercel-deployment.md) — hosted installation, private storage, and environment setup
- [`docs/ui-contribution-guide.md`](docs/ui-contribution-guide.md) — working inside the design system

## Current work

ADR 0018, compiling scene-relevant prompts and governing looks as a brand slate. ADR 0016 remains proposed after its parity runs came back partial, with people and guardrails both judged unstable. ADR 0017 step 2 is registered and parked. Open items are in [`docs/deferred-work.md`](docs/deferred-work.md).

Run it from the repository root:

```sh
npm run dev
```

Validate the production compiler with Node.js 22 or newer:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm validate:fixtures
```
