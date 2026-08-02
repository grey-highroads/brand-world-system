# Concept Visibility Map

> Status: Working audit. This map prevents implementation concepts from appearing in the product without a user job and decision.

| Concept | Current class and exposure | User job or decision | Product treatment |
| --- | --- | --- | --- |
| Brand workspace | User-facing | Understand what work exists and what needs attention | Organize around active workflows, exceptions, and recent decisions; avoid abstract dashboards |
| Brand brain | User-facing summary + internal mechanism | Trust that the system understands and preserves the brand | Show relevant knowledge in context; expose the full model mainly in governance and investigation views |
| World-building workflow | Workflow configuration | Turn scattered evidence into usable brand knowledge | Present as concrete onboarding, import, review, and gap-resolution tasks rather than “world-building” machinery |
| Production workflow | User-facing | Complete a named deliverable or campaign task | Users choose a useful workflow and provide a brief, not assemble system stages manually |
| Deliverable preset | User-facing, client-configured | Start a recurring kind of production job | Populate the chooser with familiar client-specific outputs; avoid universal intent categories |
| Output type and composition schema | Workflow configuration + internal mechanism | Understand required inputs and promised delivery when relevant | Resolve a preset into layers, text handling, variants, delivery, and validation; expose consequences in job language |
| Five content domains | Internal mechanism | None during ordinary production | Use for storage, retrieval, validation, and specialist governance; do not require routine manual classification |
| Canon | User-facing in governance contexts | Decide what is identity-defining and change-controlled | Surface when approving or changing binding brand knowledge; summarize implications in plain language |
| Lifecycle | Internal mechanism with contextual status | Know whether something may be used or needs review | Show actionable states such as “Needs approval” or “Replaced”; preserve native enums internally |
| Provenance | Internal mechanism with on-demand detail | Verify why the system believes or used something | Make traceability available from evidence and decision details, not as permanent page furniture |
| Epistemic confidence | Internal mechanism with exception visibility | Decide whether uncertain inferred guidance is trustworthy | Show rationale and evidence when confidence affects review; avoid universal scores and decorative badges |
| Production effects | Workflow configuration + internal mechanism | Understand a blocking requirement or exception | Compile required, permitted, conditional, and prohibited behavior; show plain-language consequences when relevant |
| Locked, bounded, flexible, excluded handling | Workflow configuration | Confirm unusual handling or resolve an exception | Workflows assign defaults; users see exactness promises and exceptions, not a taxonomy editor |
| Constrained, hybrid, editorial presets | Workflow configuration + internal mechanism | Usually none | Apply per workflow stage; do not present as a universal brand setting or routine job-level selector |
| Policy snapshot | Internal mechanism with user-facing summary | Understand what will remain exact or why work is blocked | Preserve the full snapshot for audit; show a concise preflight summary and exceptions |
| Generation package | User-facing preflight + durable execution artifact | Verify what will be sent or reuse it elsewhere | Show the read-only compiled prompt, generation inputs, exclusions, and output requirements before rendering; keep provenance and the original compiled version |
| Provider and model selection | Administrator configuration + internal mechanism | None during an ordinary production job | Configure provider, model, credentials, and connection outside the job; the Generate action uses that backend without exposing provider plumbing |
| Asset registry | Internal mechanism with user-facing library access | Find and use the correct approved material | Integrate with existing systems; avoid recreating a full DAM or requiring duplicate asset administration |
| Evaluation pipeline | Internal mechanism with user-facing findings | Know what failed and what to fix | Present evidence-backed findings and affected elements, not evaluator architecture |
| Approval | User-facing | Authorize an output or brand decision within scope | Use specific actions for output approval, guidance approval, and canonical change |
| Candidate rule | Workflow configuration + governance queue | Decide whether repeated feedback should affect future work | Show only evidence-backed proposals to the appropriate owner; prove that review volume remains manageable |
| Memory | Internal mechanism with user-facing history | Recover context, understand prior decisions, or reuse a precedent | Present job history, corrections, and precedents; avoid a vague standalone “AI memory” feature |
| Brand-health score | Unproven | No validated decision yet | Do not implement or display until measurable inputs and a useful resulting action are established |
| General-purpose mode switch | Unproven and currently rejected | No validated recurring user decision | Reconsider only if workflow research shows users need to change a stage's policy directly |

## Current product correction

An early production mockup exposed constrained, hybrid, and editorial as a prominent selector. The controls made the architecture visible but did not help a producer understand the job. A real workflow may move from editorial concept development to hybrid hero production to constrained adaptations.

The accepted correction is to treat these modes as reusable policy presets applied to workflow stages. Ordinary users select a workflow and make job-relevant decisions. Higher Roads or an authorized administrator configures stage behavior. Advanced exceptions are exposed only when the user understands their consequence and has authority to make them.

The asset-creation wireframes exposed a second correction. A chooser organized around campaign intent asks the product to understand strategy that Higher Roads may not own. The accepted direction is a client-configured catalog of recurring deliverables. Each visible preset references an internal output type that defines layers, text handling, variants, delivery, and validation. Ads are a first-class structure because they may combine artwork, platform copy, destination fields, and placement variants. See [`experience/output-type-catalog.md`](experience/output-type-catalog.md).

Riggg exposed a third correction. Prompt compilation and rendering are distinct system responsibilities, but they do not require separate review screens. Preflight produces and presents a portable generation package containing the read-only compiled prompt, exclusions, and generation inputs. Users may copy or export it. Generate uses the renderer configured outside the production job; provider and model plumbing stays out of the routine workflow. See [`decisions/0006-treat-generation-package-as-portable-artifact.md`](decisions/0006-treat-generation-package-as-portable-artifact.md).

The same interface review exposed a fourth correction. Production must not become an accidental brand-governance surface. Compilation filters evidence that is inapplicable under approved rules, including references that would introduce unapproved claims. Incomplete or contradictory binding knowledge is blocked or routed to brand governance upstream. The producer sees an exception only when there is a legitimate, authorized decision about the current job.

The brief review exposed a fifth correction. Ambient product promises should not appear as form fields: brand guidance is always applied. A render produces one primary image by default, while an explicit deliverable preset defines any promised adaptations or variants. Placement constrains the available formats through the output schema. Required source assets enter from the selected product or preset; optional creative references are added deliberately and always show provenance, role, and influence.

## Audit questions still open

- Does “brand brain” help client users, or should most surfaces use more concrete language?
- Can approval and canonical promotion remain distinct without creating governance friction?
- How much evidence and provenance detail do reviewers actually need by default?
- Will candidate rules create a useful learning loop or an ignored review backlog?
- Which brand-brain views help complete work rather than merely display structured data?
- How should asset access feel when the client already uses a DAM?
- Which output structures belong in the first implementation slice, and which remain future client extensions?
