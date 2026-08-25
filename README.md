# Brand World System

Persistent brand intelligence and governed production infrastructure.

Brand World System builds a durable brand brain and runs controlled creative production on top of it. Evidence goes in, a governed brand model comes out, and every generated asset is compiled from that model under an explicit policy rather than from a prompt someone typed. It grows from two prior efforts: Product World Preview (PWP) showed how to infer and articulate a brand world from incomplete evidence, and Riggg showed how to produce consistently when canonical rules and assets are explicit.

The system is running. Two client brands are onboarded and producing governed imagery and copy through a hosted installation.

## Core model

The system separates two jobs that are often collapsed into one prompt or application:

1. **Build the brand brain.** Ingest evidence, resolve contradictions, register canonical assets, model the brand world, record approvals, and preserve what the organization learns.
2. **Produce from the brand brain.** Interpret a request, retrieve relevant canon, apply a production policy, compile a generation package, render it, evaluate the result, and route feedback back as candidate rules.

Configured workflow stages may use three reusable creative-control presets:

- **Constrained:** fidelity to approved assets and rules outranks novelty.
- **Editorial:** the system may synthesize broadly while expressing the brand's point of view.
- **Hybrid:** canonical elements remain locked inside a newly generated context.

These are internal configuration presets, not global brand types or user-facing switches. Ordinary users choose workflows built around real jobs, and one workflow may use different presets at different stages.

## What is built

- **Brand brain.** Source intake from URLs, text, and uploads, with a Firecrawl fallback for bot-protected pages. OpenAI synthesis into a structured brand model covering identity, lived world, visual grammar, aspiration, and provenance. Review, approval, versioning, and incremental update from an approved baseline.
- **Products as governed records.** Per-product synthesis with evidence-fidelity discipline, candidate and approved lifecycle, re-synthesis, review questions, and an approved-but-incomplete production warning.
- **Production compiler.** A deterministic, framework-independent library that resolves canon, scope, and policy into a portable generation package. Fixture-driven tests and versioned JSON Schema contracts.
- **Renderer.** OpenAI images behind an adapter, with deterministic composition of protected assets onto generated backgrounds.
- **Look library.** Fourteen named looks compiled into the prompt as a governed world block, with a stated photorealistic ban and a human texture floor under every look.
- **Governed copy.** Copy derived from scoped brand claims and audited against them before it reaches an image or a caption.
- **Refusals.** Brand prohibitions decomposed, assigned, and compiled into avoid-clauses at generation time, stored as durable records per client.
- **Studio application.** Deployed on Vercel with per-client isolation, blob storage, campaign workspaces, an output log, evaluation, and approval.

## Repository map

**Product and rationale**
- [`docs/product-thesis.md`](docs/product-thesis.md) — rationale, product model, boundaries, and commercial opportunity
- [`docs/architecture.md`](docs/architecture.md) — system boundaries, components, data flow, isolation, and failure posture
- [`docs/product-development-principles.md`](docs/product-development-principles.md) — product-first decision sequence and architecture test
- [`docs/concept-visibility.md`](docs/concept-visibility.md) — user-facing, configured, internal, and unproven concepts
- [`glossary.md`](glossary.md) — authoritative terminology
- [`roadmap.md`](roadmap.md) — staged path and current status appendix

**Decisions and evidence**
- [`docs/decisions/`](docs/decisions/) — eighteen architectural and product decision records, with supersessions preserved
- [`docs/evaluations/`](docs/evaluations/) — gate rubrics pre-registered before each run, and the judged findings
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
- [`fixtures/`](fixtures/) — reference cases and the ADR gate harnesses
- [`docs/vercel-deployment.md`](docs/vercel-deployment.md) — hosted installation, private storage, and environment setup
- [`docs/ui-contribution-guide.md`](docs/ui-contribution-guide.md) — working inside the design system

## Working principles

- Canon is a governed view of approved, identity-defining entities across every domain.
- Creative freedom is a policy decision, not an accidental property of a prompt.
- Brand knowledge stays readable. Nothing that governs an output is hidden inside model weights.
- Architecture supports user jobs. Implementation concepts do not automatically become product features.
- Generation is downstream of brand intelligence.
- Approved outputs, corrections, and failures improve future work without silently rewriting foundational canon.
- Shared infrastructure stays separate from private client data and brand-specific configuration.
- Gates are pre-registered before the run, and a failed gate is recorded as failed.

## Status

The system is deployed and in use with two client brands. Brand brain synthesis, product records, governed copy, the production compiler, the look library, and the refusals bootstrap are all shipped and running against real client storage.

Current work is ADR 0018, compiling scene-relevant prompts and governing looks as a brand slate. ADR 0016 remains proposed after its parity runs returned partial, with people and guardrails both judged unstable. ADR 0017 step 2 is pre-registered and parked. Open items are tracked in [`docs/deferred-work.md`](docs/deferred-work.md).

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
