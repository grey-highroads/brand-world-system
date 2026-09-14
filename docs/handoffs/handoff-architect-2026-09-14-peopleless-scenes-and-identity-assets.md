# Architect handoff: peopleless scenes, and identity assets

Date: 2026-09-14
Covers: one architect thread with Grey on 2026-09-08, resumed 2026-09-14. The six days between are not mine and are flagged below.
Repo state at close: `main` at `66cf05e893`.
Every claim in this document was checked against the repository on 2026-09-14 after it was written, and three were wrong and are corrected. Read it alongside the findings and decision documents in `docs/`, which are the durable record. This is the narrative and the working knowledge that did not fit in them.

## Where things stand in one paragraph

Two pieces of work, a week apart. The first added a second kind of photograph: the same authored moment, the same world and grammar, photographed at a point when nobody is in the frame, selectable in the studio. It is built, tested, and live. The second was a live audit of the Sources path, which found that the system already collects most of what a brand needs to describe its logos and then throws it away before anything can use it. That produced ADR 0020, which makes identity assets a governed record type of their own, and a brief for three current defects, which a builder has already executed. The placement question underneath it, whether the real logo file gets composited or a model redraws it, is tabled by owner ruling and is the next real decision.

## What was built, in order

### 1. The peopleless scene kind (2026-09-08)

Grey's mission: product scenes in world-appropriate settings with no people in them, carrying the same creativity, aspiration, and visual grammar, sometimes the same lived moments, and selectable by the user.

The audit that shaped it, all verified by reading the files at the time:

- The writer already switched on a `kinds` map with `scene`, `template_surface`, and `sales_element`, so a fourth kind was the intended seam.
- The compiler branches on `placement`, not on the writer's kind, so the kind died at the suggest call and never reached the compile.
- On a scene render the Protection section is gated to template and sales, and `sceneProtectionBlock` is imported and uncalled, so there was no channel that could say "no people." That turned out to be fine.
- Every moment in Story Architecture requires at least one person present, `minItems: 1`, so moments cannot supply a peopleless situation directly and have to be read differently instead of filtered.

Grey's framing, which he ruled on and which the task is built around: the moment still governs, and the camera arrives before the people arrived, after they left, or at an hour when the place is theirs and empty. The people are the reason the room looks the way it does. The three directions are spread across how far they sit from the people.

Two hand pulls in the fal playground answered the question the design rested on. Both frames came back empty, including the one whose prose never said the room was unoccupied. Complete description produces an empty frame without a prohibition. Both also came back unmistakably MycoPop, with the dark CRT and the yellowed keyboard carrying the era with no person to carry it.

One finding came out of those pulls and is in the shipped task: the can is the only saturated warm object in a peopleless frame, so it becomes the subject by color unless something else has real visual weight. On the with-people kind that rule is held up by a person doing something. Here nothing holds it up, so the writer has to name a non-product subject and give it size and position.

Shipped: `scene_no_people` in `api/production/generate-copy.js` with the approved task verbatim and a test that pins the string; a `writesAScene` predicate replacing three copies of a string comparison; the Lived World people list traveling under a lead line about whose place it is; the grammar's people section relabeled; a precedence sentence added to `lookRules`; `SCENE_NO_PEOPLE_DEFAULT_LOOK` in `looks.js` and read in `package.js`; the kind on the brief record and on the consumption record; a two-option control in the studio on the two forms that have one.

Brief: `docs/brief-2026-09-08-scene-no-people.md`, amended 2026-09-14 to match what shipped. Read the amendments section; the body was wrong in four places.

### 2. The Sources audit and identity assets (2026-09-14)

Grey asked for a live audit of how files get synthesized into the brain, on the premise that most brands have many logo variations with usage rules, and most have a brand guidelines PDF, and that a logo variation should be usable in the studio.

What the audit found, each verified by reading the file at `fb4aebdd60`:

- Multiple logos already work at intake, and the variation is already collected. The contract carries `assetKind`, `assetVariation`, and `assetVariationOther`, and `assetVariationLabel` shows it in two places.
- `sourceMetadata` in `chat-completions-provider.js` did not include the contract, so synthesis saw five filenames and inferred what the user had already answered. Now fixed.
- A source's `usage` and `exclusions` do reach synthesis and the pass instructions act on them. Neither reaches the compiled package, which carries `lockedAsset: { name, format }` and nothing else.
- `generate-copy.js` contains no reference to a locked asset in any form, so the writer composes a frame with no knowledge that a mark has to sit in it.
- `productionLockedAssets` returned every `exact-asset` source including logos, into a picker titled "Product asset." Selecting a logo asked a generative model to redraw a logo. Live defect, now fixed.
- The intake accepted SVG, AI, EPS, and fonts; the vision set is GIF, JPEG, PNG, WebP; so those files were stored, never looked at, never selectable, and nothing said so. Now fixed to say so.
- Multi-file PDF, DOCX and PPTX parsing already works through officeparser, capped at 160,000 characters per file and 20 MB. Images inside those files are skipped, so a brand book's lockup pages, color chips, clear-space diagrams and misuse examples are invisible. The system already admits this: the `asset-bearing-guide` material type says in its own description that nothing inside it is placeable.

Grey's rulings: a logo is its own thing and gets its own record type. Logos keep feeding synthesis, unlike product briefs, because a logo is the brand's own face. Existing logo sources convert once rather than two shapes coexisting. Placement is tabled.

`docs/decisions/0020-model-identity-assets-as-governed-records.md`, accepted, nothing implemented. `docs/brief-2026-09-14-identity-asset-defects.md`, executed the same day in commits `98d5c41f` and `d9a384a7`, which I have not read.

## The six days I did not cover

My thread ran on 09-08 and resumed on 09-14. Roughly fifty commits landed between, from threads that are not mine: a Needs Review prototype integrated into the live app, an Artifact Library landing and an Artifacts tab, a focused Brand Guidance flow, Brand Brain chrome and artifact reader work, and a Design Studio audit with nine numbered items that were built through 09-12 to 09-14 (one run one image, placement leaving the prompt, campaigns as labels, inert controls saying so, the feedback panel and image findings card coming out).

I did not read any of it. Nothing in this handoff describes those changes and nothing in it should be trusted about them. Whoever picks this up should read the Design Studio audit brief and its rulings before touching the studio, because my knowledge of that screen is six days stale in a week where it changed a lot.

## Open queue

1. **Logo placement.** The tabled decision, and the biggest one. Deterministic compositing was retired on 2026-09-09. Placing a real logo file brings it back for this one case. Until it is decided, no identity asset reaches a render, and ADR 0020 says so explicitly.
2. **The identity asset record type itself.** Schema, store, conversion of the existing MycoPop and Simply Agree logo sources, and synthesis reading the record. Buildable now, useful to synthesis without placement.
3. **The moment library.** Still the largest unbuilt thing named in the 2026-09-09 direction handoff, and nothing in my thread touched it.
4. **The look precedence sentence is untested.** It tells a look that its instructions about how subjects behave do not apply when nobody is in the frame. If a person appears on a face-heavy look, the sentence was not enough and the fallback is filtering the look list, which the brief told the builder not to build.
5. **The Sources tab layer 1 card layout.** Grey wants the Brand foundation section to use the card format that layer 2 uses, two rows, with the blue tone it already carries. The section already has `tone-info`; the work is rendering layer 1 through a card function instead of `sourceFoundationRow`. Worth doing after the record type, because what a logo card has to show depends on what a logo record is.
6. **Images inside brand guide PDFs.** Extraction runs with `includeImages: false`. The diagram that is the rule is invisible. Not scoped anywhere.
7. **`kinds[requestedKind]` is a bare object lookup on a request string.** A builder flagged it on 09-08. `src/lookup.js` and `ownEntry` exist because this exact shape let `constructor` resolve an inherited function in `resolveLook`. Pre-existing and unchanged. It is not recorded in `docs/deferred-work.md`, so it lives only here and in the builder's report.
8. **Everything in the 09-08 handoff's open queue** that has not been closed since. I did not re-verify it this session.

## The working relationship

Everything in the 2026-09-08 handoff's version of this section still holds, and I got several of them wrong again anyway. Read that one; it is better than this. What this week added or re-proved:

**Plain language means plain language, and he will ask twice.** He asked for it three times in this thread. Each time my answer had been correct and unusable: structured, hedged, full of file names. The version that worked said what breaks, in the words a person would use out loud. When he asks a second time, do not compress the same answer. Rewrite it from the beginning for someone who has not read the code.

**Say what you are asking him for.** I wrote a long section ending in "tell me if the task text is right" and he said he could not tell what I wanted. The fix was one line: read the box, tell me if it is right, that is the only thing I need. Ask for one thing and say it is the only thing.

**Do not turn a hole in the system into a form field.** I required the user to pick a look on the peopleless kind rather than write a capture fallback I had no evidence to write. He called it a punt and he was right. Not writing it that night was defensible; handing the gap to the user as a required choice was not. There was a third option, a sensible default, that cost the same and asked nothing of anyone. When a decision ends with the user doing more work, look for the option where nobody does.

**When you say you will push something, push it.** I told him I was pushing a brief amendment on 09-08 and did not. Six days later the repo brief still named a binding look as the default and still said four studio forms. Somebody fixed the binding problem in the code independently. The brief is now amended, but the gap between what was said in chat and what exists in the repo is exactly the failure mode this project's documents exist to prevent.

**Read the field above the line you are reading.** I picked `available_light_interior` as a default because its line had no skin in it and never looked at its `environment: "binding"` four lines up, in a file I had open. The whole point of ADR 0018 is that a binding look decides the setting. A look default that arrives after the writer decides nothing and contradicts everything.

**Builders correcting the brief is still the system working.** This week the builder caught four things in one brief: two studio forms not four, a claim that a defaulted look reaches the writer when it cannot, a binding default that would reintroduce the ADR 0018 conflict, and a byte-identity line that contradicted another section. Every one was right. Rule cleanly, say the brief was wrong, do not make them relitigate.

**No more tests when he says no more tests.** He declined a third pull. The right response is to handle the question by design and flag what that leaves untested, which is what the look precedence sentence is. Do not re-offer it.

## Mistakes on the record

- Wrote "four forms" into a plan and then a brief after my own grep had returned two.
- Chose a binding look as a default without reading its environment field.
- Made a required user choice out of work I did not have evidence to do.
- Said I was pushing an amendment and did not, leaving a wrong brief in the repo for six days.
- Wrote a brief section asking for byte identity and another asking for a new key on the same object.
- Answered "what am I asking you for" with more structure instead of one sentence.

## What success looks like next

The peopleless kind is in and has not been exercised against real client work yet. The first real test is whether the writer chooses the era-carrying objects on its own, which is the thing the two hand pulls could not answer because I wrote those objects in myself. If the peopleless directions come back with a generic laptop instead of a dark CRT, that is the Visual Grammar question from the 09-08 queue answered from the other direction, and it is more informative than another render.

On identity assets, the record type is worth building before the placement decision, not after. It improves synthesis on its own, and it makes the placement decision concrete rather than abstract, because there will be a real record with real variations and real rules to place.
