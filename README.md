# Brand World System

Persistent brand intelligence and production infrastructure.

Brand World System is a documentation-first effort to define a reusable system for building a durable brand brain and installing controlled creative-production workflows on top of it. It grows from two working lessons: Product World Preview (PWP) showed how to infer and articulate a brand world from incomplete evidence, while Riggg showed how to produce consistently when canonical rules and assets are explicit.

## Core model

The system separates two jobs that are often collapsed into one prompt or application:

1. **Build the brand brain.** Ingest evidence, resolve contradictions, register canonical assets, model the brand world, record approvals, and preserve what the organization learns.
2. **Produce from the brand brain.** Interpret a request, retrieve relevant canon, apply a production policy, generate or assemble an output, evaluate it, and save the result and feedback.

Configured workflow stages may use three reusable creative-control presets:

- **Constrained:** fidelity to approved assets and rules outranks novelty.
- **Editorial:** the system may synthesize broadly while expressing the brand's point of view.
- **Hybrid:** canonical elements remain locked inside a newly generated context.

These are internal configuration presets, not global brand types or assumed user-facing switches. Ordinary users choose workflows built around real jobs; one workflow may use different presets at different stages.

## Repository map

- [`docs/product-thesis.md`](docs/product-thesis.md) — rationale, product model, boundaries, and commercial opportunity
- [`docs/architecture.md`](docs/architecture.md) — system boundaries, logical components, data flow, isolation, and failure posture
- [`docs/product-development-principles.md`](docs/product-development-principles.md) — product-first decision sequence and architecture test
- [`docs/concept-visibility.md`](docs/concept-visibility.md) — classification of user-facing, configured, internal, and unproven concepts
- [`glossary.md`](glossary.md) — authoritative terminology for the system
- [`docs/success-criteria.md`](docs/success-criteria.md) — falsifiable control test for the first proof
- [`docs/experience/`](docs/experience/) — north-star views and workflow pressure tests
- [`app/`](app/) — runnable browser prototype of the configured production journey
- [`docs/product-primer.md`](docs/product-primer.md) — forthcoming plain-language product walkthrough
- [`docs/decisions/`](docs/decisions/) — architectural and product decision records
- [`specs/brand-world-schema.md`](specs/brand-world-schema.md) — draft entity, governance, provenance, and revision model
- [`specs/production-policy.md`](specs/production-policy.md) — policy primitives, stage-level presets, compilation, evaluation, revision, and approvals
- [`specs/workflow-contracts.md`](specs/workflow-contracts.md) — durable payloads between world-building, production, governance, and learning
- [`fixtures/pwp/`](fixtures/pwp/) — inference-first onboarding and concept-development journey
- [`fixtures/riggg/`](fixtures/riggg/) — canon-first controlled-production journey
- [`roadmap.md`](roadmap.md) — staged path from documentation to a working implementation kit

## Working principles

- Canon is a governed view of approved, identity-defining entities across every domain.
- Creative freedom is a policy decision, not an accidental property of a prompt.
- Architecture supports user jobs; implementation concepts do not automatically become product features.
- Generation is downstream of brand intelligence.
- Approved outputs, corrections, and failures improve future work without silently rewriting foundational canon.
- Shared infrastructure stays separate from private client data and brand-specific configuration.

## Status

Specifications are frozen as target-state references. A whole-product design sprint is active, and its first production-flow learning is now represented in a runnable browser prototype. The prototype covers the configured deliverable chooser, a schema-linked brief, Preflight as a portable generation package, and a mock result state. It is an interaction artifact, not the first production slice or a commitment to an application stack.

Run it from the repository root:

```sh
python3 -m http.server 4173 --directory app
```

See [`docs/experience/browser-prototype.md`](docs/experience/browser-prototype.md) for scope and product boundaries, and [`docs/experience/design-sprint-brief.md`](docs/experience/design-sprint-brief.md) for the broader design mandate.
