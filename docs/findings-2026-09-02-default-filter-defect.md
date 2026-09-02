# Finding: the default look silently compiled a full filter into every scene prompt

Date: 2026-09-02
Surfaced by: the first Seedream render through the deployed app. The compiled payload carried a 200-plus word Capture section describing one strobe in an interior room, injected into a forest trail scene, on a job where the owner never chose a look.

## The two defects

1. The default brief shipped with `look: "neutral"`. Every job that never touched the look picker sent a truthy look id, and a truthy id replaces the shared capture floor with that look's full line. (Verified from `app/app.js` and `src/production/package.js`.)
2. The entry named "neutral" is not neutral. Its line in `looks.js` is the built-light look: one strobe through a large modifier in a real room. The picker card described it as "No filter, still a photograph," so the interface implied an absence while compiling a strong interior look. (Verified.)

The compiled result contradicted the assignment wholesale, carried equipment nouns the look array rules ban, and instructed the subject to hold the camera while the People section forbade it. The render engine ignored the section and followed the Assignment, which is why the defect surfaced as a payload finding rather than a bad image.

## The fix

The mandatory look grid became an optional Filters disclosure, off by default. The owner named the frame: these are filters, and a filter should inject prompt content only when someone chooses one.

- The default brief carries no look. No filter and an empty filter both compile the shared capture floor; the compiler needed no change, since it already treated an absent look correctly. The defect was entirely in the interface default.
- "Apply a filter" is a toggle in the same pattern as the headline set. Off hides the grid and clears any prior choice, which also clears scene suggestions, because the scene writer is briefed with the filter and directions drafted under one describe a photograph the unfiltered path would not make.
- The ready-card dropdown gained an explicit None option, selected by default, and its label and note now say Filter and say what None does.
- The look-select fallback that invented "neutral" when a card had no id now falls back to no filter.
- The Neutral card's note now describes what the entry does ("One soft strobe in a real room") instead of claiming absence.

## Still deferred, deliberately

The `neutral` entry itself: its id, interface label, and line are unchanged. Renaming it and rewriting its line in consequence language is the look-language session, now carrying a live example: the 2026-09-02 Seedream render compiled this look against a forest assignment and the engine discarded it. Stored jobs that already carry `look: "neutral"` are data and stay as they are.

## Test

A regression test asserts that an absent look and an empty look both compile the capture floor and record no look on the package, and that an explicitly chosen look compiles its line and is recorded. (Verified by the suite: 147 tests, 146 passing, the one failure being the pre-existing credential-dependent copy audit.)
