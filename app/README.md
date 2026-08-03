# Browser prototype

This directory contains the framework-neutral interaction prototype for Brand World System. It uses synthetic fixture data and browser-native HTML, CSS, and JavaScript so the product team can test workflow, copy, state, density, and visual direction without implying that the production application stack or backend has been selected.

## Run locally

From the repository root:

```sh
python3 -m http.server 4173 --directory app
```

Open `http://localhost:4173`.

## Current scope

- SLAKE Brand Brain batch intake with 50 synthetic assets
- Master-detail review for conflicting guidance, a possible duplicate, a possible brand principle, and a proposed brand rule
- Plain-language evidence detail explaining what was found, how it was found, why it matters, and what it could affect
- Helpful guidance kept separate from deliberate changes to core brand guidance
- Complete local outcomes for contradictions and suspected duplicates: keep either item, keep both, or leave unresolved
- Complete local outcomes for a brand rule: use it, keep it for later, or discard the suggestion
- No V1 roles, permissions, escalation, notifications, or external review routing
- Core-guidance impact preview and mock change record
- SLAKE deliverable chooser
- Product lifestyle image brief
- Placement-dependent format choices
- Optional creative inputs with source type, role, semantic influence, usage instruction, provenance, and reader confidence
- Read-only, brand-derived compiled prompt
- Preflight resolution trace showing how each input affected the package
- Portable generation package export with an installation boundary and structured input contract
- Mock Generate transition and result review

The prototype has no authentication, persistence, uploads, model calls, provider integration, or durable approval behavior. Brand Brain actions update only the current browser session. Those omissions are intentional.
