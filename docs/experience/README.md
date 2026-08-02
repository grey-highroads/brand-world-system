# Experience Workstream

The experience workstream gives the product model a visible, testable form before implementation. Mockups are working hypotheses: they expose missing states, confusing language, excessive metadata, weak approvals, and gaps between policy and production.

Two artifact types are maintained:

- **North-star views** show a coherent finished application and keep product decisions pointed toward the same destination.
- **Workflow probes** isolate risky interactions and pressure-test them against realistic work.

Design decisions discovered here should update the schema, production policy, glossary, or an ADR. Mockups do not override those contracts silently.

## Current status

Visual development is paused while the product architecture is audited. The first production mockup was valuable as a workflow probe: it exposed a job-level mode selector as architecture leaking into the interface. That finding produced ADR 0005 and the concept-visibility audit.

When visual work resumes, it should begin with the complete application and user journeys before returning to deep production controls. Every proposed surface must pass the product architecture test in [`../product-development-principles.md`](../product-development-principles.md).

See [`north-star.md`](north-star.md), [`screen-inventory.md`](screen-inventory.md), and [`flows/hybrid-production.md`](flows/hybrid-production.md) for retained hypotheses and learning.
