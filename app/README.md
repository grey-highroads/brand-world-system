# Browser prototype

This directory contains the framework-neutral interaction prototype for Brand World System. It uses synthetic fixture data and browser-native HTML, CSS, and JavaScript so the product team can test workflow, copy, state, density, and visual direction without implying that the production application stack or backend has been selected.

## Run locally

From the repository root:

```sh
python3 -m http.server 4173 --directory app
```

Open `http://localhost:4173`.

## Current scope

- SLAKE deliverable chooser
- Product lifestyle image brief
- Placement-dependent format choices
- Optional creative inputs with source type, role, semantic influence, usage instruction, provenance, and reader confidence
- Read-only, brand-derived compiled prompt
- Preflight resolution trace showing how each input affected the package
- Portable generation package export with an installation boundary and structured input contract
- Mock Generate transition and result review

The prototype has no authentication, persistence, uploads, model calls, provider integration, or production approval behavior. Those omissions are intentional.
