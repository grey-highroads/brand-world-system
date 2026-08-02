# ADR 0006: Treat the generation package as a portable artifact

- Status: Accepted
- Date: 2026-08-02
- Owner: Higher Roads

## Context

The production workflow compiles brand knowledge, job inputs, output requirements, and policy into instructions for a generative system. If those instructions remain hidden, users may try to write prompt-like language into brief fields without knowing what the system will actually submit. Hidden compilation also binds the product too closely to its built-in renderer and makes failures difficult to inspect.

Riggg demonstrates a more useful boundary. A user can review the prompt and recommended reference images before generation. The compiled material remains valuable even when the user chooses to render somewhere else.

## Decision

Every generative workflow stage produces a versioned **generation package** before invoking a renderer.

The package contains:

- the compiled prompt;
- negative instructions and exclusions;
- recommended reference assets with their role, priority, and handling;
- the resolved output specification;
- a reference to the policy snapshot that governed compilation;
- provider-neutral generation settings where practical; and
- provenance linking each instruction to the brief, brand brain, workflow configuration, or policy.

The user can inspect, copy, or export the package without running generation through Brand World System. Authorized users may edit the prompt before submission. An edit creates a job-scoped override, triggers policy validation again, and never changes the brand brain or canon.

Rendering is a separate, optional step behind a capability adapter. A workflow may configure a default renderer and model, including a native provider, an API integration, an MCP connector, or a system such as Higher Roads Emagin8. The interface shows the destination when the user is deciding whether and where to render. It does not require routine users to understand provider architecture.

The system snapshots the exact package and adapter payload used for every render invocation.

## Options considered

- Keep prompts and references as hidden execution details.
- Show only a prompt preview while keeping rendering inseparable from the product.
- Produce an inspectable, portable generation package before an optional render step.

## Rationale

The portable package gives users a concrete checkpoint between intent and generation. It discourages prompt engineering in unrelated brief fields, makes brand reasoning inspectable, supports debugging, and prevents renderer lock-in. It also creates a stable integration boundary while models and media systems continue to change.

The prompt remains a derived execution artifact rather than a source of truth. Brand knowledge, policy, and the resolved output specification continue to govern compilation.

## Consequences

- The asset-creation journey gains a generation-package review step after preflight and before rendering.
- Reference assets require explicit roles such as exact subject, style, composition, or lighting.
- Prompt edits are stored as job-scoped overrides and revalidated before execution.
- Users can export a package and complete rendering outside the system.
- Renderer configuration belongs in workflow administration, with authorized job-level choice where it creates a meaningful tradeoff.
- A later workflow-contract revision should define generation-package and render-invocation schemas.
- Provider credentials and sensitive payload fields remain subject to tenant security and retention policy.
