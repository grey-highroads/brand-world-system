# Experience Workstream

The experience workstream gives the product model a visible, testable form before implementation. Mockups are working hypotheses: they expose missing states, confusing language, excessive metadata, weak approvals, and gaps between policy and production.

Two artifact types are maintained:

- **North-star views** show a coherent finished application and keep product decisions pointed toward the same destination.
- **Workflow probes** isolate risky interactions and pressure-test them against realistic work.

Design decisions discovered here should update the schema, production policy, glossary, or an ADR. Mockups do not override those contracts silently.

## Current status

A whole-product design sprint is active. The sprint brief, mandate, sequence, evidence gates, and exit criteria are in [`design-sprint-brief.md`](design-sprint-brief.md). All specification documents are frozen as target-state references; the sprint is the next unit of learning.

The sprint designs the asset-creation journey before the brand-brain journey, uses one synthetic brand consistently, and writes findings back into concept-visibility or ADRs.

The current wireframes produced an additional working model: client-specific deliverable presets should reference reusable structural output types. The model covers layers, text handling, variants, delivery, validation, and ads as coordinated packages. It is recorded in [`output-type-catalog.md`](output-type-catalog.md) while the normative specifications remain frozen.

The Riggg comparison produced another accepted boundary: Preflight yields and presents a portable generation package before optional rendering. The package exposes the compiled prompt, exclusions, and recommended references for inspection, editing, copying, or export. Generate uses a downstream renderer configured outside the production job. Brand-knowledge conflicts are filtered or routed to governance before they reach this interface. The decision is recorded in [`../decisions/0006-treat-generation-package-as-portable-artifact.md`](../decisions/0006-treat-generation-package-as-portable-artifact.md).

See [`north-star.md`](north-star.md), [`screen-inventory.md`](screen-inventory.md), [`output-type-catalog.md`](output-type-catalog.md), and [`flows/hybrid-production.md`](flows/hybrid-production.md) for retained hypotheses and learning.
