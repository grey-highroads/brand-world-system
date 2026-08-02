# Browser Prototype

## Status

Working interaction model, not a production implementation.

The prototype in [`../../app/`](../../app/) translates the current production-flow decisions into a browser experience. Its purpose is to expose product friction early, make workflow conversations concrete, and preserve useful design learning without selecting the production application stack prematurely.

## Implemented journey

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
- Reader output is evidence for the compiler. The server-owned resolution contract decides what is included, rejected, or overridden.
- The product asset is canonical and exact. It is composed into the scene, not regenerated.
- Prompt compilation is visibly derived from specific Brand Brain components and the brief.
- The generation package is portable and useful even when rendering happens elsewhere.
- Rendering is downstream and configurable outside the job-level workflow.

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
- production validation, approvals, revisions, or memory write-back
- the Brand Brain build journey
- fully implemented deliverable presets beyond product lifestyle image

These omissions keep the artifact honest. The prototype tests the production interaction model; it is not evidence that the first implementation slice has been selected.

## Running locally

From the repository root:

```sh
python3 -m http.server 4173 --directory app
```

Open `http://localhost:4173`.
