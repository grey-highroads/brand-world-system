# Brand World System

An attempt to turn brand strategy from static documentation into persistent production infrastructure.

Deployed, with two client brands running through it.

## The problem

Most AI tools treat a brand as something you explain again every time you want something made. You upload the guidelines, paste the brief, attach a few references, describe what you want. The tool makes it. Then the context disappears.

Next week you do it again. The approved logo and somebody's guess about the brand's tone went into the same box, so the tool had no way to know which one it was allowed to change. The correction you gave it Tuesday is buried in a chat nobody can find.

That is the actual cost. Not that the output is bad, because often it isn't. It's that the work of explaining the brand never compounds, and nobody can answer why a given asset came out the way it did.

## The bet

Rendering quality is commoditizing. Every model release closes the distance on fidelity, and any advantage built on being good at prompting a particular model expires when that model is replaced.

What does not commoditize is a structured, governed, portable account of what a brand is and what it is permitted to do. That asset appreciates as approved work accumulates, and it survives the model underneath being swapped out.

So this system is built the other way around from most tools in the category. The brand model is the product. Generation is a replaceable consumer of it.

## The brand world

A brand model that only describes the brand is not enough to make anything worth looking at.

The trap is specific and easy to fall into. Ask a system to learn a brand from the brand's own published material and it will faithfully describe the brand's marketing: its posting cadence, its content categories, its product photography conventions. Every statement will be true and traceable. Then production composes from it and returns work about the brand's marketing, which is the definition of generic.

So the brand world is a first-class artifact here, and its subject is not the brand. It is the person the brand serves, living their life, with the product in tow. Where they are, what time it is, what the room is made of, what they are in the middle of doing, what they want, what they refuse. Their environments and their rejects, not the brand's.

This is the part that carries emotional weight, and the weight is the point. Correct color, correct logo placement, and correct tone get you consistency. They do not get you recognition, and recognition is what turns a customer into an advocate. A brand earns that by showing someone a version of themselves they want to be, which requires a person in a real situation rather than a product on a surface.

It is also the ceiling on everything downstream, which is why the world is synthesized deliberately rather than inherited, why every entry records whether it was observed or reasoned toward and with what confidence, and why thin evidence surfaces as a question to the client instead of getting quietly filled in.

## Aspiration, and why it is the durable part

Governance is the practical half of this system and it is not the defensible half. Locking approved assets is table stakes. Enforcing prohibitions is risk work every serious operator will eventually do. Both are necessary. Neither is hard to copy.

The defensible part is that a brand can be governed and still move.

Every evidence-based approach to brand consistency is structurally backward-looking. Fine-tune a model on brand imagery, retrieve from the asset library, follow the style guide, and each one learns from what the brand already is. They reproduce the past accurately and have no mechanism for anything else. A brand that wants to become something has to leave the system to do it, which is exactly when consistency breaks.

This system treats aspiration as a first-class kind of knowledge. A direction the brand is reaching toward is recorded with its own origin, sits alongside what is observed and what is inferred, and is never labeled as a fact about the brand today. Once approved, it compiles at full strength with no hedging, because the image model needs direction and the human needs the label. The brand can move on purpose without anyone pretending it has already arrived.

The sharpest expression of this is substitution rather than suppression. Handed a reference the brand admires and cannot legally use, most systems produce a prohibition and stop. This one authors the brand's own physical version of that territory, its own people, era, materials, and light, and keeps the prohibition at the edge of it. One opens the ground. The other draws the line. Most systems only have the line.

Model progress makes this stronger rather than weaker. The constraint on reaching a territory a brand has not yet earned was always the rendering. Governance does not improve when the model improves, it only becomes more necessary. Aspiration does improve, because every capability gain widens the range of declared direction a brand can actually execute.

## What runs today

A hosted studio with two client brands onboarded, one B2B and one emerging consumer packaged goods, chosen to be unalike so the schema would have to hold across both.

- **Brand brain.** Source intake, synthesis into a structured brand model, review, approval, versioning, and incremental update from an approved baseline. Every statement carries where it came from and whether a person approved it.
- **Brand world.** The person the brand serves as a synthesized artifact: environments, life patterns, wants, tensions, and refusals, each entry recording whether it was observed or reasoned toward.
- **Visual grammar,** the durable account of how the brand looks in camera terms, with aspiration carried as its own origin alongside evidence and inference.
- **Production compiler.** A deterministic library that resolves canon, scope, and policy into a portable generation package, under versioned schema contracts.
- **Products as governed records,** with a candidate and approved lifecycle and evidence-fidelity discipline.
- **Governed copy,** derived from scoped brand claims and audited against them before it ships.
- **Refusals.** Brand prohibitions decomposed, assigned, and compiled into the generation as things to avoid.
- **Look library.** Fourteen named looks compiled as a governed world block, with a stated photorealistic ban and a human texture floor.
- **Renderer,** with deterministic composition of protected assets onto generated backgrounds.

## What this is not

Not a prompt builder. Not a general creative platform. Not a replacement for a DAM or a project tool. It does not publish without human approval, and it does not promise pixel-perfect reproduction through prompt instructions, which is exactly why exact assets are composited rather than generated.

The engineering is not enterprise hardened and does not claim to be. No role-based access control, no single sign-on, no formal service commitment, and test coverage is fixture-driven rather than exhaustive. Those gaps are tracked, not discovered.

What is proven is the product model that hardening work would support. The schema held across two unrelated brands. Policy compiles into real generation. Governance survived contact with production deadlines. The work remaining is largely operational maturity rather than discovering the system's basic shape.

## Where to start

Everything below is the working record behind those claims.

New here, read [`docs/product-primer.md`](docs/product-primer.md). It is the plain-language walkthrough and assumes nothing.

**Product and rationale**
- [`docs/product-thesis.md`](docs/product-thesis.md) — rationale, product model, boundaries, and commercial opportunity
- [`docs/architecture.md`](docs/architecture.md) — system boundaries, components, data flow, isolation, and failure posture
- [`docs/product-development-principles.md`](docs/product-development-principles.md) — product-first decision sequence and architecture test
- [`docs/concept-visibility.md`](docs/concept-visibility.md) — user-facing, configured, internal, and unproven concepts
- [`glossary.md`](glossary.md) — authoritative terminology
- [`roadmap.md`](roadmap.md) — staged path and current status appendix

**Decisions and evidence**
- [`docs/decisions/`](docs/decisions/) — eighteen decision records, with supersessions preserved rather than edited away. What building the system corrected about the thesis is recorded in [`docs/product-thesis.md`](docs/product-thesis.md#what-building-it-taught-us)
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
