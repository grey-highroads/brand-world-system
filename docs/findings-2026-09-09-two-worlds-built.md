# Findings: ADR 0019 built, the brand today and the brand evolved

- Date: 2026-09-09
- Branch: `adr-0019`, four checkpoint commits on top of `main` at `e1d2900b`
- Brief: build ADR 0019 end to end so the owner can rebuild MycoPop and read two worlds
- Status: built and tested; not yet run against a model

## What changed

**Synthesis is eight passes.** Passes 1 to 4 write the brand today exactly as before, apart from the cast and situation rewrites below. Passes 5 to 8 write the brand evolved from all sources, with the finished today world supplied as data. Pass 5 writes the dossier and review questions only. Every evolved pass carries one reach sentence; the today passes carry none. Each evolved pass request carries `reach` on the body, and a missing or unknown level runs at "a clear direction".

**The fence moved.** The Lived World and Story Architecture fence lines apply to passes 2 and 3 verbatim and do not apply to passes 6 and 7, which carry the ambition test the grammar already used. The rejects rule keeps its fence in both runs. The influence sentence now lives in the authority rules every pass carries, and no longer inside the grammar block.

**People became a cast.** `livedWorld.cast` is one description plus examples, no ids, no ceiling. `storyArchitecture.moments` carry `who` as prose and `situation` in place of `doing`, floor six, no ceiling. The grammar's people section description says it is casting range.

**Storage.** `artifacts.today` and `artifacts.evolved`. Guidance and brand fields at the root. The saved payload records `reach`. A brain saved before the split carries one `artifacts` object at the root and reads as today with no evolved world.

**One function selects the world.** `src/brand-brain/world.js#selectWorldArtifacts` returns evolved when present on the approved snapshot, today otherwise, the legacy root before the split. The scene writer, the LinkedIn copy path, `src/copy/generate.js`, and `src/production/package.js` all read through it. This was ruled in on 2026-09-09 after the first build session found five root reads in the compiler that would have compiled template and sales renders with an empty dossier.

**Two approvals.** `approve-brain-today` and `approve-brain-evolved`. Per-world state: `artifactStatus`, `approvedVersion` and `stage` keep meaning the brand today, so every existing readiness check keeps its meaning; `evolvedStatus` and `evolvedApprovedVersion` are new. The evolved approve waits for the today approve, because the brand fields and guidance travel with today.

**Two review surfaces**, today first, each under a plain heading and a status pill. Selecting an evolved tab does not move the today reader. The demo brain is untouched and renders as today only.

## Where the brief was wrong, and what was built instead

1. Section 8 excluded `package.js` and `copy/generate.js`; both read brain artifacts from the root. Ruled in; see above.
2. Section 1 named `:104` for the grammar people sentence. That line is in the camera block. The sentence went at `:109`, the honesty-over-quantity block, where the casting sentence already was.
3. Section 1 moves the influence sentence out of the grammar block; section 9 says no change to the grammar rules beyond the people sentence. Section 1 won.
4. "One place" for the reach constant is two: the app sends `SYNTHESIS_REACH` and the server falls back to `DEFAULT_REACH`, so a direct call without reach does not fail.
5. The moments line was told to stop resolving ids. It still resolves a legacy id list through the legacy people list, because Simply Agree's saved brain is in that shape. A prose `who` is never resolved.

## Not verified against a model

Structured output runs with `strict: true`. Whether OpenAI accepts an array with `minItems` and no `maxItems` is unconfirmed; the existing schemas always carried both. If the first real pass 2 rejects the schema, that is the cause, and the answer is not to add a ceiling. Say so and stop.

## What the owner reads for

The people, places, moments and dossier of the evolved world carry the retro direction as a physical world. Ambition labels sit on the entries that depend on the retro sources and not on the ones that do not. No readable third-party property. Moments read as situations that could be photographed twenty ways.

## Left for the next brief

The save route still writes whatever the browser sends (`api/brand-brain/save.js:15`), and with two approved worlds that gap is wider. Re-synthesis still drops product images; re-attach the isolated can before rendering. The reach control on screen. The intake piles and the "not this" role.

## Suite

Before: 218 tests, 217 pass, 1 ambient failure. After: 232 tests, 231 pass, the same ambient failure.
