# Brand World System

Persistent brand intelligence and production infrastructure.

Brand World System is a documentation-first effort to define a reusable system for building a durable brand brain and installing controlled creative-production workflows on top of it. It grows from two working lessons: Product World Preview (PWB) showed how to infer and articulate a brand world from incomplete evidence, while Riggg showed how to produce consistently when canonical rules and assets are explicit.

## Core model

The system separates two jobs that are often collapsed into one prompt or application:

1. **Build the brand brain.** Ingest evidence, resolve contradictions, register canonical assets, model the brand world, record approvals, and preserve what the organization learns.
2. **Produce from the brand brain.** Interpret a request, retrieve relevant canon, apply a production policy, generate or assemble an output, evaluate it, and save the result and feedback.

Production uses one of three configurable modes:

- **Constrained:** fidelity to approved assets and rules outranks novelty.
- **Editorial:** the system may synthesize broadly while expressing the brand's point of view.
- **Hybrid:** canonical elements remain locked inside a newly generated context.

## Repository map

- [`docs/product-thesis.md`](docs/product-thesis.md) — rationale, product model, boundaries, and commercial opportunity
- [`docs/product-primer.md`](docs/product-primer.md) — forthcoming plain-language product walkthrough
- [`docs/decisions/`](docs/decisions/) — architectural and product decision records
- [`specs/brand-world-schema.md`](specs/brand-world-schema.md) — forthcoming canonical brand-world model
- [`specs/production-policy.md`](specs/production-policy.md) — forthcoming creative-control policy
- [`fixtures/pwb/`](fixtures/pwb/) — editorial and inference-first reference case
- [`fixtures/riggg/`](fixtures/riggg/) — constrained and canon-first reference case
- [`roadmap.md`](roadmap.md) — staged path from documentation to a working implementation kit

## Working principles

- Canon is structured, persistent, versioned, and traceable to evidence.
- Creative freedom is a policy decision, not an accidental property of a prompt.
- Generation is downstream of brand intelligence.
- Approved outputs, corrections, and failures improve future work without silently rewriting foundational canon.
- Shared infrastructure stays separate from private client data and brand-specific configuration.

## Status

This repository currently defines the product before it defines the software. The thesis is the first substantive artifact; the schema and production policy are the next implementation-facing specifications.
