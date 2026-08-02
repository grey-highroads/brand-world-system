# ADR 0006: Treat the generation package as a portable artifact

- Status: Accepted
- Date: 2026-08-02
- Owner: Higher Roads

## Context

The production workflow compiles brand knowledge, job inputs, output requirements, and policy into instructions for a generative system. If those instructions remain hidden, users may try to write prompt-like language into brief fields without knowing what the system will actually submit. Hidden compilation also binds the product too closely to its built-in renderer and makes failures difficult to inspect.

Riggg demonstrates a more useful boundary. A user can review the prompt and recommended reference images before generation. The compiled material remains valuable even when the user chooses to render somewhere else.

## Decision

Preflight produces and presents a versioned **generation package** before invoking a renderer. The package is the deliverable of preflight, not a gate leading to a second review interface.

The package contains:

- the compiled prompt;
- negative instructions and exclusions;
- recommended reference assets with their role, priority, and handling;
- the resolved output specification;
- a reference to the policy snapshot that governed compilation;
- provider-neutral generation settings where practical; and
- provenance linking each instruction to the brief, brand brain, workflow configuration, or policy.

The user can inspect, copy, or export the package without running generation through Brand World System. Authorized users may edit the prompt before submission. An edit creates a job-scoped override, triggers policy validation again, and never changes the brand brain or canon.

Rendering is a separate, optional capability behind an adapter. An administrator configures the renderer, model, credentials, and connection for a workflow, including a native provider, an API integration, an MCP connector, or a system such as Higher Roads Emagin8. The production interface exposes a single **Generate** action that uses the configured backend. Routine producers do not choose or inspect provider plumbing inside a job.

Compilation applies approved brand rules before the package reaches production. Inapplicable evidence and references that would introduce unapproved claims are excluded automatically. If binding brand knowledge is incomplete or genuinely contradictory, the system blocks compilation or routes the issue to brand governance. Production may ask for a decision about the current job; it must not ask a producer to repair the brand brain.

The system snapshots the exact package and adapter payload used for every render invocation.

## Options considered

- Keep prompts and references as hidden execution details.
- Show only a prompt preview while keeping rendering inseparable from the product.
- Produce an inspectable, portable generation package before an optional render step.

## Rationale

The portable package gives users a concrete checkpoint between intent and generation. It discourages prompt engineering in unrelated brief fields, makes brand reasoning inspectable, supports debugging, and prevents renderer lock-in. It also creates a stable integration boundary while models and media systems continue to change.

The prompt remains a derived execution artifact rather than a source of truth. Brand knowledge, policy, and the resolved output specification continue to govern compilation.

## Consequences

- Preflight becomes the generation-package review interface and ends with a Generate action.
- Reference assets require explicit roles such as exact subject, style, composition, or lighting.
- Prompt edits are stored as job-scoped overrides and revalidated before execution.
- Users can export a package and complete rendering outside the system.
- Renderer, model, credential, and connection configuration belongs outside the production job in workflow administration or user settings.
- Brand-knowledge conflicts are filtered or routed upstream rather than presented as production decisions.
- A later workflow-contract revision should define generation-package and render-invocation schemas.
- Provider credentials and sensitive payload fields remain subject to tenant security and retention policy.
