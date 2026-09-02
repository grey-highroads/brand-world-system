# Finding: a second render engine behind an owner-facing switcher

Date: 2026-09-01
Repo: grey-highroads/brand-world-system
Status: shipped, awaiting owner parity renders from the deployed app

## Why a second engine

The app rendered only through OpenAI. The people in those renders have been the
limiting factor: skin, faces, and age reading correctly at mid effort has not
come from prompt tuning alone, and the 2026-09-01 playground comparison showed
Seedream 5.0 Pro clearing that bar on inputs the incumbent has not. **Verified**
that the comparison was run and reviewed by the owner. **Assumed** that the
advantage holds on the real compiled payload rather than on playground prompts,
which is exactly what this change exists to test and what the owner's parity
renders will settle. Nothing here should be treated as a decision to move off
OpenAI.

The compiled prompt is deliberately unchanged for both engines. A per-engine
prompt profile would confound the comparison on its first run.

## What was added

- `src/renderers/seedream-images.js`. Mirrors the exported surface of
  `openai-images.js`: model constant, a request builder per endpoint, one render
  function. Returns `{ data: [{ b64_json }], usage }`, which is the shape
  `service.js` already consumes, so the consumption site reads one shape from
  either engine and nothing downstream asks which one ran.
- `src/production/service.js`. An engine table, `resolveRenderEngine`, engine
  and model recorded on the working record and on the persisted output package,
  and per-engine key selection. An injected `options.render` still wins over the
  table, so existing tests exercise the seam rather than the engine list.
- `app/app.js`. A "Render engine" field on the ready card, OpenAI preselected.
  The chosen engine travels with the render request and appears on the finished
  render's production record beside the model string.
- `test/production-seedream.test.js`. Fourteen tests.

No new files under `api/`. Every call still dispatches through the existing
production handler; the twelve function ceiling is unchanged.

## Two corrections to the instruction as written

**Endpoint IDs.** The instruction gave the Pro endpoints with a `fal-ai/`
prefix. **Verified** against the fal model pages on 2026-09-01 that the Pro
paths carry no prefix and the Lite paths do:

    https://fal.run/bytedance/seedream/v5/pro/text-to-image
    https://fal.run/bytedance/seedream/v5/pro/edit

The prefixed paths would have failed on the first render from the deployed app.

**Size parameter.** The field is `image_size`, not `size`, and it accepts either
a preset enum string or a `{ width, height }` object. **Verified** from the fal
model pages and the fal model-arguments documentation. Every size the compiler
emits, from `1024x1024` through `960x2016`, falls inside fal's stated total
pixel window of 1024x1024 to 2048x2048, so the whole `formatSizes` table maps
without exception. A size string that does not parse is dropped rather than
guessed at, which leaves the model on its own default instead of a size nobody
chose.

## The reference-passing choice

References are passed to the edit endpoint as Base64 data URIs under
`image_urls`.

**Verified** from `src/brand-brain/store.js` that source blobs are written with
`access: "private"`. **Verified** from fal's documentation that a model runner
downloads an input URL without additional authentication headers, and that a
Base64 data URI is accepted anywhere a file URL is accepted. **Reasoned** from
those two facts that the stored blob URL was never available for this path: it
is not publicly fetchable, so fal could not read it. A data URI is the only
reference form that works without adding an upload hop to fal's CDN or minting
presigned URLs, neither of which is in scope for this session.

**Assumed**, and worth watching on the first real edit render: fal notes that
large files passed inline can affect request performance. Observed renders run
around 110 seconds against a `maxDuration` of 300, so there is headroom, but a
multi-reference edit with large source files is the case that would find the
limit. If it does, the fix is an upload step, not a prompt change.

## A defect found on the way and corrected

`app/app.js` decided whether a render was reference-guided by testing the
endpoint for `/edits`, which is the OpenAI spelling. The Seedream edit path ends
in `/edit`, so every reference-guided Seedream render would have labelled itself
"Prompt-only image" on the production record. **Verified** by reading both
endpoint constants. Changed to a pattern matching both spellings.

## A rule described one way and implemented another

The instruction described the endpoint choice as a locked-asset rule.
**Verified** by reading `chooseOpenAIImageEndpoint` and its call site that the
incumbent rule is any reference image present, which includes a template asset
or creative sources with no locked asset at all. The Seedream renderer mirrors
the rule as implemented, so the two engines branch identically. Narrowing both
renderers to a locked-asset rule is a separate change and a separate session.

## Licensing

**Verified** from the fal model page that Seedream 5.0 Pro is listed as
commercial use under fal's partner terms. **Assumed** that this covers the
client work BWS produces; the owner should confirm against fal's terms of
service before any Seedream render reaches a client deliverable. OpenAI terms
are unchanged by this session.

## Evidence

- Full suite before the change: 132 tests, 131 pass, 1 fail.
- Full suite after: 146 tests, 145 pass, 1 fail.
- The one failure in both runs is `fixtures/copy-audit-mechanism-test.mjs`, the
  credential-dependent copy audit, unchanged by this work.
- Prompt parity across the four frozen ADR 0018 fixture scenes: byte identical
  before and after, by SHA-256 of each compiled prompt.

One limitation on that parity check, stated plainly because the number looks
stronger than it is. The ADR 0018 phase 0 harness needs the approved brains in
`fixtures/adr-0018-phase0-inputs`, which are gitignored per ADR 0004 and absent
from a clone. The check run here compiled the four frozen scene briefs against a
fixed synthetic brain held constant across both runs. That proves the claim at
issue, which is that this diff does not move the compiler, and it does not
reproduce the phase 0 baseline. A test in the new suite separately compiles the
same brief with no engine value, with `openai`, and with `seedream`, and asserts
the three prompts are identical.

## Deliberately deferred

- The two-step scene-then-edit product placement.
- Any per-engine prompt profile.
- Any quality parameter mapping beyond size. The service passes
  `quality: "medium"`, which the Seedream renderer ignores because the model
  exposes no equivalent field.
- Retiring the OpenAI renderer.
- Any look array edits.

Each waits on the owner's parity renders from the deployed app.

## Operational note

`FAL_KEY` must be set in the Vercel project environment before the Seedream
option will render. The renderer fails with a message naming the variable if it
is absent, rather than failing at the request.
