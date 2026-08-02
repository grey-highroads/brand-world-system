# ADR 0005: Apply creative-control presets per workflow stage

- Status: Accepted
- Date: 2026-08-02
- Owner: Higher Roads
- Supersedes: ADR 0003 where it assigns one selected mode to an entire job

## Context

The initial architecture treated constrained, hybrid, and editorial as selectable job-level modes. A production-interface probe exposed a product mismatch: ordinary users would be asked to choose an architectural category without enough context, while real creative workflows often require different behavior at different stages.

A campaign workflow may develop territories editorially, produce a hero image through hybrid generation and deterministic composition, and create channel adaptations under constrained rules. Brand category does not determine posture: CPG and B2B brands both use all three patterns for different jobs.

## Decision

Constrained, hybrid, and editorial are reusable policy presets, not primary user-facing product modes or global brand settings.

A configured workflow contains one or more stages. Each stage defines policy primitives directly or starts from one preset and applies scoped configuration. Before a stage executes, the system compiles an immutable stage policy snapshot from the workflow definition, brand rules, request context, actor authority, exceptions, and available capabilities.

Ordinary users choose a useful workflow and make decisions expressed in the language of the job. They see plain-language exactness promises, material exceptions, and approval consequences—not a universal three-way mode selector. System stewards may inspect and configure presets.

## Options considered

- One global mode per brand.
- A mode selector on every production job.
- One hidden mode per workflow.
- Stage-level policy configuration using reusable presets.

## Rationale

Stage-level configuration matches actual creative work, keeps configuration out of routine production, and preserves the testability of the policy system. The true primitives remain production effects, element handling, capabilities, evaluation, and authority. Presets reduce configuration effort without becoming the ontology or interface.

## Consequences

- ADR 0003 remains valid for compilation and snapshotting but is superseded where it assumes one selected mode per job.
- Production requests reference configured workflows rather than requesting a mode by default.
- Multi-stage jobs may retain several policy snapshots.
- The internal control test can compare presets without implying that an end user performs the switch.
- Product surfaces expose workflow-specific language and exceptions.
- Fixtures must demonstrate complete user journeys and at least one workflow that changes posture across stages.
