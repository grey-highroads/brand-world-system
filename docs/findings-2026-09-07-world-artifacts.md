# The Lived World and Story Architecture become a world, and the writer stops reading the dossier

- Date: 2026-09-07
- Base commit: `c731e6d0eaf9cbbc4ec5c2e3e78d823d12d87cfc`
- Modules: `src/brand-brain/schema.js`, `src/brand-brain/chat-completions-provider.js`, `api/production/generate-copy.js`, `app/app.js`, `docs/image-pipeline-contract.md`, tests
- Status: shipped
- ADR: this changes the shape of two governed artifacts, which is ADR-level. Whether it also gets an ADR is the owner's call. Nothing here waits on that.

## Why

Since `c8664ba3` the scene writer reads the brain artifacts and nothing else, and its prose reaches the renderer with only format, capture, display copy and output added. That made the artifacts the thing that decides whether a scene is good, and two writer outputs since then showed the artifacts are written to explain the brand rather than to describe its world.

Both outputs put the product in someone's hand and named it more than once. Both carried sentences a camera cannot use: "a refreshing break from the digital task at hand," "laughter mingles with the sound of distant music." Both described people as roles or gave them invented names.

Each of those traces to a specific place in the artifacts.

**Story Architecture had no synthesis guidance.** It was mentioned once, in the writing rules, only to say it should not be a placeholder. The schema fixed `moments` at exactly four and gave every moment a `product` field. So the model filled four moments with what the product does in each. That is where reach and sip came from.

**The Lived World was guided toward an audience.** It said it was a portrait of a person and their days, which is right, and then `person` was one string reasoned from what the product implies. That produces "a late 20s professional," and a writer told to name specific people invents Mark.

**The dossier is brand language and it was being sent to the writer.** `desiredFeeling`, `productTruth`, `culturalCodes` and the rest are the brand explaining itself to a person reviewing it. Sending them to the writer is what produced the marketing sentences. That was the earlier brief's mistake and this session corrects it.

## Schema: Lived World

Before:

```
person: { type: "string" },
```

After:

```
people: {
  type: "array", minItems: 2, maxItems: 5,
  items: strictObject({
    id: string,     // stable, cited by Story Architecture moments, never a position
    name: string,   // a first name, so moments and scenes can refer to them
    who: string,    // two or three sentences: age, days, bearing, what they are
                    // like to be around. Castable, and no two entries the same person.
    basis,
  }),
},
```

Everything else in the artifact is unchanged: `wants`, `rejects`, `tensions`, `patterns`, `emotions`, `social`, `environments`, `belongs`, `opens`.

## Schema: Story Architecture

Before:

```
moments: objectArray({
  index, time, scale, title, action, feeling, role, product
}, 4, 4),
```

After:

```
moments: {
  type: "array", minItems: 6, maxItems: 12,
  items: strictObject({
    id: string,       // stable, never a position
    title: string,    // a short handle
    when: string,     // time of day or point in a routine
    where: string,    // a physical setting someone could stand in
    who: string[],    // Lived World person ids, at least one
    doing: string,    // what is happening, camera-visible, already underway
    feeling: string,  // what it means to the people in it, one sentence
    basis,
  }),
},
```

`index`, `scale`, `role` and `product` are gone. `doing` replaces `action`. `rhythm`, `why` and `continuity` are unchanged.

The `product` field going is the substantive removal. A field that asks where the product sits in every moment guarantees the moment is about the product.

## Synthesis guidance

**Story Architecture** gains a section, placed after Lived World and before Visual Grammar, having had none before. It says the moments are moments in the world of the Lived World's people, that each is something they do somewhere specific at a particular time that a photographer could walk into, and that the product may be present or absent and the moment does not exist to show it. It says plainly that a moment which is really a reason to hold or drink the product is not a moment, it is an ad, and it belongs nowhere in the artifact. It defines each field, requires `who` to name people by their Lived World ids, and says `feeling` is what the moment means to the people in it rather than what the brand wants a viewer to feel. It carries the same basis rules the Lived World entries follow: origin is evidence or inference and never ambition, and `derivedFrom` names what it rests on.

**Lived World** loses the sentence saying it is a portrait of a person and their days, and gains guidance that it holds several people, each particular enough to put in a room, and that they are characters rather than segments. The contrast is written out, because the abstract version of this instruction is what the old shape already failed: "a late 20s professional" is a segment, "Dana, 27, runs the front of a bike shop and talks with her hands" is a person. The two-layer reasoning rule that gets from a product to a person is unchanged; its output is now people.

Visual Grammar guidance is untouched, per the brief.

## The writer

The dossier block is gone from the context assembly, and `drewOn` no longer lists it. The writer reads the Lived World, Story Architecture and Visual Grammar.

The Lived World block now leads with the people by name and their `who` text, under a line telling the writer to use these people and not invent others. The Story block assembles each moment as its title, when and where, who is present resolved from ids to names, what is being done, and what it means.

The task line changed with them. It asks for three directions each built from one of the moments, taking that moment's people, place and time and writing what a camera in that room would see. It says the people are the ones named in the Lived World, to use their names and write them as themselves, and not to describe anyone by their job or their age bracket. It says a sentence about what the picture means is a sentence to cut, and that the product is never what the moment is about.

## Old brains

No migration was written and none runs. A brain synthesized before today keeps its shape.

- The writer reads either shape. A `person` string still assembles under its old line when there is no `people` list, and old-shape moments still assemble from `index`, `time`, `action`, `role` and `product`.
- The review UI renders either shape. `renderLivedArtifact` shows a people list when there is one, the single string when there is not, and a line saying the brain predates people when there is neither. `renderStoryMoment` detects the shape per moment and renders the matching fields.

The old shape is still what a writer given it will fail on, in exactly the ways this change was made to stop. It works, rather than being good.

## Re-synthesis

MycoPop needs re-synthesizing to get the new artifacts. That is the owner's action in the app.

**Re-synthesis drops attached product images.** This is a recorded defect: `images` is not carried forward in the synthesis path. The owner has to re-attach the isolated can afterward, or the locked asset will be missing from the next render.

## Readers found, and what happened to each

Grepped for `livedWorld`, `lived_world`, `.person`, and `moments` across the tree.

Updated:

- `api/production/generate-copy.js#handleSceneBrief`, the writer. Dual-shape.
- `app/app.js#renderLivedArtifact` and the new `app/app.js#renderStoryMoment`. Dual-shape. The moments heading stopped promising four.
- `test/browser-prototype.test.js`, which asserted the old moments standfirst.

Left alone, with reasons:

- `src/production/package.js` reads `livedWorld.rejects` in `rejectsDirection`, which is uncalled since 2026-08-31 and unaffected by this change. `rejects` did not move.
- `src/production/service.js` mentions `livedWorld.rejects` only in a comment.
- `app/app.js#sampleBrainArtifacts`, the demo brain, is still in the old shape. Rewriting it means inventing several pages of SLAKE brand content, which is not something to do inside a schema change. It doubles as the old-shape case both readers have to keep handling, and the prototype test exercises it. **Follow-up: the demo brain should be rewritten to the new shape, or it will keep showing a shape the system no longer produces.**
- `fixtures/adr-0016-step1-harness.mjs` and `fixtures/adr-0016-step4-parity.mjs` read `lived.person`. Both are dead harnesses that `node --test` does not pick up by filename, and both already describe a context assembly that stopped existing at `c8664ba3`. They are further out of date now. Recorded, not repaired, per the out-of-scope line.
- `fixtures/adr-0017-step4-parity.mjs` and `fixtures/adr-0017-refusals-gate.mjs` touch `livedWorld.rejects` only.
- `fixtures/adr-0018-phase0-scenes.json` carries no brain snapshot; the string match was on `livedWorld` as a refusals-channel label in `adr-0018-phase0-capture.mjs`.
- `fixtures/adr-0016-step1-grammar/*.json` mention "moments" only inside `derivedFrom` prose.
- Nothing validates a stored brain against `brandBrainSchema`. It is used in one place, as the structured-output schema for synthesis, so the shape change cannot break a load.

## Verification

- `node --check` on every edited JS file.
- The writer's assembled context was probed with a poison string in every dossier field, plus the guidance sections, the grammar rejects, the product visual direction and the product exclusions. None appear, in either brain shape.
- The context names people by name and moments by title, when, where, who, doing and feeling. Confirmed by reading the assembled prompt.
- An old-shape brain assembles a writer context and renders in the review UI. The prototype test exercises the UI path against the old-shape sample brain.
- Three new tests in `test/brand-brain-openai.test.js` pin the schema and the guidance: the people shape and its required fields, the moment shape with the product field gone, and the instructions carrying the Story Architecture section and the segment contrast.
- Full suite: 169 tests, 168 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, pre-existing, left alone.
- No em dashes in any touched file, checked mechanically.

## What to watch after re-synthesis

The whole point of this change is that the artifacts now carry the burden. If a re-synthesized MycoPop still produces moments that build toward the product, the guidance is not strong enough and the next fix is in the instructions, not in the writer or the compiler. If the people come back as two versions of the same person, the minItems of 2 is doing nothing and the `who` description needs to be harder.
