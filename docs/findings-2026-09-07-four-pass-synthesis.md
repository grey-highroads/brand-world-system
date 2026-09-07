# Synthesis runs in four ordered passes

- Date: 2026-09-07
- Base commit: `9c615b094d9c92854c44b57d0a5074811d1f0467`
- Modules: `src/brand-brain/schema.js`, `src/brand-brain/chat-completions-provider.js`, `src/brand-brain/service.js`, `src/brand-brain/store.js`, `api/brand-brain/synthesize.js`, `app/app.js`, `scripts/dev-server.js`, `docs/image-pipeline-contract.md`, tests
- Status: shipped

## Why

Synthesis was one call producing the whole Brand Brain: six guidance sections, review questions and four artifacts, from the raw sources, under one system prompt, in one structured-output response. After `c5da34bb` widened the Lived World to several people and the Story Architecture to six to twelve moments, that call ran past the route's 300 second limit. Two attempts on 2026-09-07 timed out, recorded against `/api/brand-brain/synthesize` on deployment `dpl_28atcdDi`.

The timeout is the trigger. The reason to split is better than the timeout. In one call everything was written at once, so the moments could not be written about people who already existed, and the grammar could not describe rooms the moments already took place in. Each artifact was invented in parallel with the others. Split into ordered passes, each one reads what the earlier ones wrote.

## The four passes

Each is its own chat completion with its own developer instruction, its own user content, and its own structured-output schema cut from `brandBrainSchema`.

1. **The brand as it presents itself.** Reads the source register and the source images. Writes `brandName`, `brandDescription`, `synthesisSummary`, `cleanAssetCount`, the six `guidanceSections`, `reviewQuestions`, and `dossier`.
2. **The people and their days.** Reads the register, the images, and pass 1. Writes `livedWorld`. It does nothing else, so it can go further than a summary would.
3. **Moments in their world.** Reads the register, pass 1 and pass 2. Writes `storyArchitecture`. The people it names by id already exist, and the environments, tensions and social modes it places them in are already on the page. It is placing known people into moments rather than describing a product's role.
4. **The physical world of the pictures.** Reads the register, the images, and passes 1 through 3. Writes `visualGrammar`, so the grammar casts the people of those moments and names the rooms they happen in.

## What was decided, and what it cost

**Pass 3 receives the source register but not the source images.** The brief said pass 3 does not need the raw source files and asked me to say so rather than decide silently. I sent the register and withheld the images. The register is text and it is what lets a moment's `derivedFrom` name a real source rather than a paraphrase, which the basis rules require. The images are the expensive part and pass 3 has the least use for them, since its material is what the earlier passes wrote. If a moment ever needs to cite what an image shows, `PASS_SENDS_IMAGES` in the provider is the one line to change.

**Review questions merge without a cap.** Each pass can raise up to eight, and four passes could raise more than the eight `brandBrainSchema` allowed. Rather than dropping questions on merge, the assembled schema's cap is now 32. This costs nothing: since this commit no model call answers to `brandBrainSchema`. It describes the assembled brain and is the validation target for the assembly. Questions are deduplicated by id, because a later pass can raise the same concern an earlier one already raised.

**The in-progress brain lives in its own blob**, at `state/in-progress.json`, not as a key on the saved payload. A half-built brain must not be reachable by anything that reads a Brand Brain, and a failed synthesis has to leave no trace, which is one delete rather than an edit to live state.

**Image bytes are not carried between passes.** A source file that reached the server through Blob is re-read from Blob for the pass that needs it. Only a file that arrived inline with no Blob path keeps its data in the in-progress record, and that is the local-development fallback in `app/app.js#storeBrandWorldSourceFile`. In the hosted product this record holds text and metadata rather than megabytes of base64. Text extraction from PDFs and Office files also happens once, on pass 1, rather than four times.

**The partial brain is never returned to the browser.** A pass that is not the last returns which pass ran, which is next, and the per-pass ids. Sending the half-built result would put an incomplete artifact set in the browser where something could try to render it.

## Failure

A failed pass fails the synthesis. Nothing is written to the saved brain, the in-progress record is cleared, and the next attempt starts at pass 1. The error carries `error.pass` and its message is prefixed with the pass number and its label, so the person is told which pass failed.

A pass arriving with no synthesis in progress, out of order, or carrying a request id belonging to a different synthesis, is refused with 409 and told to start again from the first pass.

One thing got strictly safer as a side effect. The pre-destruction backup of an existing brain now happens after every model call rather than before the only one, so three of the four ways a synthesis can fail no longer reach the replace at all. The underlying hazard is unchanged and still recorded in `docs/deferred-work.md`: a non-incremental synthesis replaces the approved brain rather than proposing a candidate.

## Incremental mode

The incremental rules are unchanged. What changed is their subject. Each pass is handed `baselineForPass`, the slice of the approved baseline it is responsible for, and asked for the smallest update to that slice. One rule was added: an earlier pass in the same update may itself have changed, and where it did, that change is the new material for this pass and the same rules apply to it. That is the ripple the brief asked for.

A baseline that predates an artifact yields null for that pass, which then runs as a first synthesis of that slice, because there is genuinely nothing to update. That is the case for every brain approved before `c5da34bb`.

A pass sees only its own slice, so pass 2 cannot quietly rewrite guidance during an update. That is a schema property rather than an instruction the model is trusted to follow, and it is tested.

## Timeout

`maxDuration` in `vercel.json` is 300 and was not changed.

I cannot measure a pass's real duration without running the model, so this is reasoned rather than verified. Each pass writes one artifact where the single call wrote all four plus the guidance sections, and output tokens dominate latency on structured output, so every pass is strictly less work than the call that timed out. Pass 4 is the one to watch: it carries the longest instruction, around 12,000 characters against pass 1's 4,800, and it reads three prior outputs plus the images. If any pass does not fit, pass 4 is where it will show, and the answer is to split the grammar rather than to raise the limit.

## The client

The browser drives four requests, one per pass, so each gets its own 300 second clock. Four model calls inside one request would share one clock and fail the same way the single call did, only later, so that shape was ruled out in the brief and is not what shipped.

The progress screen now has one step per pass, and the steps are what is actually happening: reading your sources, finding the people, placing them in moments, describing the pictures. The fake 1400ms timer that used to advance a guess is gone. The owner sees one synthesis with progress, not four actions.

Recovery after a dropped connection is now attempted only when the connection dropped on the final pass, since that is the only pass that can have left a saved brain behind. On an earlier pass there is nothing to recover, and polling for thirty seconds would only delay the message saying which pass failed.

## Discrepancy with the brief

The brief says `docs/image-pipeline-contract.md` does not cover synthesis. It does: stage 1 is "Brain synthesis and approval" and it describes the call shape, the request construction, the schema, the parse, the backup and the persistence in detail. I updated stage 1 rather than recording it as out of date, which is what the maintenance rule asks for. This is the only place the brief did not match the tree.

No ADR describes the synthesis call shape. ADR 0009 governs updating from an approved baseline and says nothing about how many calls that takes, so nothing there needed changing. Whether the pass split earns its own ADR is the owner's call; the ordering is now a real constraint on how the artifacts relate, which is the kind of thing an ADR usually carries.

## Verification

- `node --check` on every edited file.
- The instruction split was checked block by block: every one of the thirteen blocks in the old constant reaches at least one pass, the shared four reach all of them, and each artifact's rules reach exactly one. A block added later and not routed fails the assembly rather than silently reaching no call.
- Full suite: 180 tests, 179 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, pre-existing, left alone.
- No em dashes in any touched file, checked mechanically.

Eleven new tests cover the split, all in `test/brand-brain-openai.test.js`:

- Four passes assemble one brain with the shape a single call used to return, including the saved keys, the summed usage, the per-pass provenance and the deduplicated questions.
- Each pass receives what the passes before it wrote. Pass 3 receives pass 2's people; pass 4 receives pass 3's moments and pass 2's people.
- Nothing is saved before the last pass, and the half-built brain is not returned.
- A failed pass saves nothing, names the pass, and clears the half-built work.
- A later pass with no synthesis in progress is refused with 409.
- Incremental synthesis hands each pass its own slice of the baseline, and a pass sees only its own slice.
- A baseline predating an artifact runs that pass as a first synthesis of it.
- A rebuild backs the existing brain up once, on the pass that replaces it.
- The four schema slices cover every top-level key of the assembled brain, and only pass 1 carries the guidance sections.
- The assembled brain has every key `brandBrainSchema` names.
- A pass request carries only its own instruction and schema, and pass 3 sends no images while passes 1, 2 and 4 do.

## What to watch on the first real run

Whether the ordering does the thing it was split to do. The test proves pass 3 receives pass 2's people; it cannot prove pass 3 uses them. If the moments come back naming ids that do not exist in the Lived World, or the grammar describes rooms that appear in no moment, the fix is in the pass instructions, which are now short enough to read one at a time.

MycoPop still needs re-synthesizing for the artifact shapes from `c5da34bb`, and re-synthesis still drops attached product images, so the isolated can needs re-attaching afterward. That defect is unchanged by this work.
