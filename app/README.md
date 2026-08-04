# Browser prototype

This directory contains the browser-native interaction prototype for Brand World System. It retains the sanitized SLAKE fixture journey and now also supports a first real Brand Brain vertical slice through the local Node server. The product team can compare synthetic control data with actual OpenAI-synthesized outputs without treating this prototype stack as a final platform decision.

## Run locally

From the repository root:

```sh
npm run dev
```

Open `http://localhost:4173`.

## Current scope

- Brand Brain empty state and guided onboarding entry
- Persistent Brand Brain navigation across Overview, Sources, Needs review, Brand guidance, and History
- Type-first source intake for one local file, URL, or written source at a time, using concrete choices such as protected asset, approved guidance, past work or research, image, image grid, cultural reference, and business context
- A required usage instruction for every source, conditional influence, optional exclusions, file compatibility checks, a 20 MB per-file limit, and a 40 MB synthesis-batch limit. Approved guidance accepts supported documents, structured text files, and PNG, JPG, or WebP page images; SVG and native design files require conversion when they need interpretation.
- Local document normalization, Chat Completions synthesis with image evidence, public-page reading for URL sources, and full pasted-text intake
- Per-source guidance area, semantic influence where appropriate, usage instructions, and explicit exclusions
- Visible OpenAI synthesis progress from reading sources through preparation of review questions, six guidance sections, and three full artifacts
- SLAKE Brand Brain batch intake with 50 synthetic assets
- Master-detail review for conflicting guidance, a possible duplicate, a possible brand principle, and a proposed brand rule
- Plain-language evidence detail explaining what was found, how it was found, why it matters, and what it could affect
- Helpful guidance kept separate from deliberate changes to core brand guidance
- Complete local outcomes for contradictions and suspected duplicates: keep either item, keep both, or leave unresolved
- Complete local outcomes for a brand rule: use it, keep it for later, or discard the suggestion
- No V1 roles, permissions, escalation, notifications, or external review routing
- Core-guidance impact preview and mock change record
- Stored Brand Brain draft with six marketer-facing guidance tabs, extended synthesized prose, working principles, source trails, production use, and richer downstream artifacts
- Full Brand Dossier, Lived World, and Story Architecture readers composed across multiple guidance categories
- Varied artifact modules for audience, product truth, palette, guardrails, tensions, life patterns, earned environments, emotional arc, and moment planning
- Passage-level comments, overall feedback, stored revisions, production approval, and session history
- Local server storage for the latest source register, structured synthesis, review state, comments, and approval state so the Brand Brain survives refresh
- Incremental additions against the stored approved baseline, with stable guidance copied forward, type/content mismatches raised for review, candidate changes identified, and the active version preserved until approval
- SLAKE deliverable chooser
- Product lifestyle image brief
- Placement-dependent format choices
- Optional creative inputs with source type, role, semantic influence, usage instruction, provenance, and reader confidence
- Read-only, brand-derived compiled prompt
- Preflight resolution trace showing how each input affected the package
- Portable generation package export with an installation boundary and structured input contract
- Mock Generate transition and result review

The live Brand Brain path is intentionally local and single-installation. Uploaded file bytes are sent for the current synthesis request but are not copied into a durable asset library; the stored source register keeps file metadata and the generated source trail. There is no authentication, background job queue, multi-user behavior, production database, full asset search, or retry queue yet. The sanitized SLAKE sample path remains deterministic for interaction testing.
