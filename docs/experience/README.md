# Experience Workstream

The experience workstream gives the product model a visible, testable form before implementation. Mockups are working hypotheses: they expose missing states, confusing language, excessive metadata, weak approvals, and gaps between policy and production.

Two artifact types are maintained:

- **North-star views** show a coherent finished application and keep product decisions pointed toward the same destination.
- **Workflow probes** isolate risky interactions and pressure-test them against realistic work.

Design decisions discovered here should update the schema, production policy, glossary, or an ADR. Mockups do not override those contracts silently.

## Current sequence

1. Establish the hybrid-production north star.
2. Pressure-test bulk asset registration and governance.
3. Extend the confirmed visual language into the full production flow.
4. Test world-building, approvals, corrections, and memory write-back.

See [`north-star.md`](north-star.md), [`screen-inventory.md`](screen-inventory.md), and [`flows/hybrid-production.md`](flows/hybrid-production.md).
