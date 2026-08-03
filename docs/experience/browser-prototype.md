# Browser Prototype

## Status

Working interaction model, not a production implementation. The production journey and the first Brand Brain governance slice are interactive.

The prototype in [`../../app/`](../../app/) translates the current production-flow decisions into a browser experience. Its purpose is to expose product friction early, make workflow conversations concrete, and preserve useful design learning without selecting the production application stack prematurely.

## Implemented journey

### Brand Brain

1. Open the SLAKE foundational-library batch containing 50 synthetic assets.
2. Approve 47 clean assets for future work without changing core brand guidance.
3. Review conflicting guidance, a possible duplicate, a possible brand principle, and a proposed brand rule in one master-detail view.
4. Inspect the evidence in marketer-facing language: what was found, how it was found, why it matters, and what it could affect.
5. Resolve contradictions and suspected duplicates by keeping either item, keeping both, or deliberately leaving the affected guidance unresolved.
6. Use, defer, or discard the proposed rule against medical and health claims, with explicit paid-social scope and no V1 exception workflow.
7. Approve the system-suggested 4pm Reset ritual as helpful guidance.
8. Open a separate core-guidance screen, inspect what will change, and record a mock change.

### Production

1. Choose from a client-configured catalog of ordinary deliverables.
2. Describe a product lifestyle image in brief language.
3. Choose a placement; the output schema constrains the available formats.
4. Optionally attach creative inputs, assigning each a role, semantic influence, and plain-language usage instruction.
5. Review Preflight as the deliverable: a portable generation package with named Brand Brain components, a read-only compiled prompt, exact and flexible production rules, output parameters, input provenance, extracted evidence, and a resolution receipt.
6. Invoke a mock Generate action and review a static result and evaluation state.

The prototype defaults to one image per render. It does not expose a renderer choice, imply that brand guidance is optional, permit prompt editing, or ask a production user to repair Brand Brain governance problems.

## Product architecture expressed

- Deliverable presets are client configuration, not universal intent categories.
- Placement and format are related through the output type rather than independent labels.
- References are optional production inputs with explicit jobs; they are not unexplained attachments.
- Influence describes creative priority, not authority. Confidence describes the quality of a source read and remains separate from influence.
- Canonical assets, policy, and explicit requirements cannot be weakened through the reference controls.
- Batch approval and exception resolution do not promote material into canon.
- Inferred material remains visibly inferred after contextual approval.
- Canon promotion is a separate deliberate action with an impact preview and governance event.
- Product copy speaks in ordinary brand and marketing language while the implementation retains precise contract terms internally.
- V1 models local resolution outcomes, not user roles, permissions, escalation, notifications, or external review routing.
- Reader output is evidence for the compiler. The server-owned resolution contract decides what is included, rejected, or overridden.
- The product asset is canonical and exact. It is composed into the scene, not regenerated.
- Prompt compilation is visibly derived from specific Brand Brain components and the brief.
- The generation package is portable and useful even when rendering happens elsewhere.
- Rendering is downstream and configurable outside the job-level workflow.
- OpenAI is the sole planned initial renderer, while the generation package remains portable across future adapters.

## Visual direction

The browser artifact uses a compact dark dashboard language: layered blue-charcoal and slate surfaces, cool white type, low-radius modules, subtle tonal borders, and restrained shadows. The direction intentionally stays close to the supplied DroitLab dashboard reference while translating that system to Brand World System's production workflow.

Accent color carries product meaning rather than decoration:

- coral-orange identifies user action, attention, and exceptions;
- cyan identifies compiled system intelligence and production output;
- lavender identifies governance and Brand Brain context; and
- green identifies verified or successfully resolved state.

The palette is a product-shell hypothesis rather than a client brand requirement. Tokens are centralized in [`../../app/styles.css`](../../app/styles.css) so client themes can later change presentation without changing semantic color roles or workflow behavior.

## Deliberately absent

- authentication, authorization, or runtime client isolation (the delivery boundary is specified separately in [`../installation-model.md`](../installation-model.md))
- persistence, saved jobs, uploads, or asset search
- real Brand Brain retrieval or prompt compilation
- model/provider selection, credentials, or renderer calls
- production validation, durable approvals, revisions, or memory write-back
- Brand Brain persistence, real ingestion, extraction, user and permission management, external review routing, rule exceptions, or supersession
- fully implemented deliverable presets beyond product lifestyle image

These omissions keep the artifact honest. The prototype tests the production interaction model; it is not evidence that the first implementation slice has been selected.

The absent renderer call is planned work rather than an external dependency. The first production adapter will target OpenAI, followed by Brand World System-owned deterministic composition and drift checks for protected assets. See [`../decisions/0008-use-openai-as-the-initial-renderer.md`](../decisions/0008-use-openai-as-the-initial-renderer.md).

## Running locally

From the repository root:

```sh
python3 -m http.server 4173 --directory app
```

Open `http://localhost:4173`.
