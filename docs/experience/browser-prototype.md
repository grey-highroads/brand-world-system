# Browser Prototype

## Status

Working interaction model, not a production implementation.

The prototype in [`../../app/`](../../app/) translates the current production-flow decisions into a browser experience. Its purpose is to expose product friction early, make workflow conversations concrete, and preserve useful design learning without selecting the production application stack prematurely.

## Implemented journey

1. Choose from a client-configured catalog of ordinary deliverables.
2. Describe a product lifestyle image in brief language.
3. Choose a placement; the output schema constrains the available formats.
4. Optionally attach creative references, assigning each a role and influence.
5. Review Preflight as the deliverable: a portable generation package with named Brand Brain components, a read-only compiled prompt, exact and flexible production rules, output parameters, and input provenance.
6. Invoke a mock Generate action and review a static result and evaluation state.

The prototype defaults to one image per render. It does not expose a renderer choice, imply that brand guidance is optional, permit prompt editing, or ask a production user to repair Brand Brain governance problems.

## Product architecture expressed

- Deliverable presets are client configuration, not universal intent categories.
- Placement and format are related through the output type rather than independent labels.
- References are optional production inputs with explicit jobs; they are not unexplained attachments.
- The product asset is canonical and exact. It is composed into the scene, not regenerated.
- Prompt compilation is visibly derived from specific Brand Brain components and the brief.
- The generation package is portable and useful even when rendering happens elsewhere.
- Rendering is downstream and configurable outside the job-level workflow.

## Visual direction

The browser artifact intentionally moves beyond the earlier neutral beige treatment. Its working theme combines deep botanical ink, warm paper surfaces, coral action color, and restrained celery, lavender, and gold accents. Editorial display type distinguishes brand-world thinking from operational interface text.

The palette is a design hypothesis rather than a brand-system requirement. Tokens are centralized in [`../../app/styles.css`](../../app/styles.css) so the direction can be tuned without rewriting the workflow.

## Deliberately absent

- authentication, authorization, or client isolation
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
