# ADR 0019: Synthesize the brand today and the brand evolved as two worlds, and brief the writer from the one the job asks for

- Status: Accepted. Owner ruled on all four open questions 2026-09-09; rulings recorded in the closing section and applied to the decision text.
- Date: 2026-09-09
- Owner: Higher Roads
- Deciders: Grey rules. Chief architect drafts and verifies.
- Related: ADR 0015 (people, scene, and rejects; the finding that MycoPop's world has to be authored rather than observed), ADR 0016 (visual grammar and the `ambition` origin), ADR 0017 (refusals as governed records; untouched here), ADR 0009 (update from an approved baseline)
- Verified against: head `a1764ae5`, files opened in the drafting session. Line numbers are from `src/brand-brain/chat-completions-provider.js`, `src/brand-brain/schema.js`, `src/brand-brain/service.js`, `api/production/generate-copy.js`, and `app/app.js`. Where a claim rests on `docs/current-state.md` rather than on a file opened here, it says so.

## Context

**The product claims to author the world a brand can grow into.** The direction of record says so plainly. MycoPop is the flagship because its world has to be authored: the brand has ideas, no assets, and no system.

**The pipeline forbids that by rule.** Three sentences in the synthesis instructions keep aspiration out of every artifact except the visual grammar:

- Pass 2, the Lived World, `chat-completions-provider.js:64`: "The schema also permits 'ambition' as an origin. Never use it in the Lived World. It belongs to the visual grammar artifact and the rules for when it applies elsewhere are not written yet."
- Pass 3, the Story Architecture, inside `:78`: the origin "is never 'ambition'".
- Pass 4, the rejects section, `:115`: "Rejects carry an origin of 'evidence' or 'inference' and never 'ambition'."

The first sentence states its own reason: the rules for applying ambition outside the grammar were not written. This record writes them.

**The schema does not need to change to allow it.** `basis` is one shared definition at `schema.js:39-43` and its origin enum already includes `ambition`. Every people entry, pattern, social entry, environment, moment, and grammar entry carries that same `basis`. Only the three instruction lines above hold ambition to one artifact. VERIFIED.

**Intake already asks the right questions.** Every source record carries `provenance` (ours or emulate), `aspiration` (current or aspiration), and `influence`, and all three are put on the wire for every pass at `chat-completions-provider.js:170-174`. Only pass 4 has an operational rule that turns them into a stored origin, `:90-97`. Passes 2 and 3 receive the flags and have no instruction that uses them. VERIFIED.

**The review interface is already built for the label.** `basisNote` renders "A direction you're reaching for" for an ambition origin, and it is called on Lived World people, patterns, social entries, environments, and story moments. Verified by the read session; see `docs/current-state.md`, five things, item 4, citing `app/app.js:3395-3416`. So the display exists for data the instructions prohibit.

**What that produced for MycoPop.** The brain re-synthesized on 2026-09-09 read the two retro sources and cited them nine times. Every citation landed in grammar objects, grammar light, grammar rejects, a dossier guardrail, or a continuity line calling retro an "optional creative treatment." The people are three inferred adults at their jobs, the places are their workplaces, and the camera section is the renderer's house style. The retro direction is a prop on their desks. Read in full from the exported brain, 2026-09-09.

**Approval is one action for the whole brain.** `approve-brain-artifact` at `app/app.js:10027-10036` copies `currentSynthesisResult` into `approvedResult` wholesale. There is no per-artifact status and no second approved object. VERIFIED.

**An incremental update does not re-read the corpus.** `service.js:245-255` normalizes `incomingSources` and hands only those to the pass, alongside the approved baseline slice from `baselineForPass` at `:58-74`. A rebuild backs up and replaces the whole brain, `:369-385`. VERIFIED. So adding an aspiration source to MycoPop today would synthesize from that source plus the three-people world, not from scratch.

**The writer already carries the label.** `generate-copy.js:657-658` appends "(declared ambition for this brand)" to any grammar entry whose origin is ambition and records every entry in `grammarEntries`. The look enters the system prompt as the first entries under `RULES:` at `:837`, after the task and the context. VERIFIED. That position is where anything that must outrank the world has to go.

**Owner rulings recorded 2026-09-09, before this draft:**

1. Nobody needs to recognize the same person from one image to the next. Recurrence across a world is by situation, place, and kind of person, not by face.
2. Counted lists of people and moments are the same mistake as the compiled rulebook, moved into the schema. Twenty images from three people doing twelve things is the monotony.
3. The ambition fence is wrong for any brand whose world must be authored.

## Decision, part one: two worlds, two approvals

**Intake gains two surfaces with plain names.** "The brand today" and "The brand world, evolved." A source goes in one pile. The pile sets `aspiration` on the record; nothing else about the record changes. The evolved pile also offers a third reference role, "not this," for a competitor or a direction the brand refuses. Today a competitor can only be marked emulate, which is how Odyssey was read as refreshment inspiration and prohibited in the same brain.

**Synthesis produces the world twice.** The guidance sections are written once, from today's sources, because their job is resolving conflicts between sources and that job does not change with direction. The dossier and the three world artifacts are written twice. Pass 1 today runs as it does now. Pass 1 evolved reads pass 1 today as settled data and rewrites the dossier only, so the dossier describes what the client wants the brand to be, labeled where it reaches. Passes 2, 3, and 4 run twice:

- **Today.** From today's sources only. Origin is evidence or inference. The current instructions apply unchanged, fence lines included.
- **Evolved.** From all sources, with today's world supplied as settled data the same way pass 1 is supplied to pass 2 now. Every entry that would not say what it says with the aspiration sources removed carries origin `ambition`, using the test already written for the grammar at `:93`. The fence lines at `:64` and `:78` do not apply to this run. The rejects rule at `:115` stays: a refusal is in force today whatever motivated it.

The evolved run reads today's world so that a brand whose sources are mostly evidence comes back evolved but recognizable, and a brand whose sources are mostly aspiration comes back mostly new. Simply Agree and MycoPop through one mechanism.

**Eight model calls instead of four.** REASONED from the pass structure: each evolved pass reads one more prior artifact than its today counterpart and writes the same schema, so it is the same order of cost as the pass it mirrors. The client already drives passes as separate requests with their own 300 second clock, so four more requests fit the existing shape.

**Storage.** `artifacts` splits into `artifacts.today` and `artifacts.evolved`, each holding `dossier`, `livedWorld`, `storyArchitecture`, and `visualGrammar`. The guidance sections stay at the brain root. `baselineForPass` already slices by artifact; it gains a world axis. Old brains with a single `artifacts` object read as today with no evolved world, and the writer handles that the way it handles the pre-09-07 `person` string now.

**Two approvals.** Approving the brand today is a truth check: does this describe us. Approving the brand evolved is a direction decision: is this where we are going. They are different questions and they get different buttons. `approve-brain-artifact` becomes per world, and each world carries its own `approvedVersion`.

**Rejects and refusals are untouched.** ADR 0017 governs refusals and nothing here changes it. Grammar rejects still carry evidence or inference. A "not this" source feeds the rejects instruction at `:107-115`, which already reads usage instructions and already writes two rejects for a borrowed territory.

## Decision, part two: the writer reads the evolved world, and the throttle is upstream

**The writer always briefs from `artifacts.evolved`.** There is no per-job choice to write from the brand today. Owner ruling 2026-09-09: the point of an aspiration is to build it, and a switch that lets a job ignore it is a way to never build it. Ambition entries carry the label they already carry at `generate-copy.js:658`.

**The today world has two jobs and neither is production.** It is the truth check a reviewer approves, and it is the settled base the evolved passes read. A brain whose evolved world has not been approved briefs the writer from today, which is the current behavior and the read-through for old brains.

**If the ambition is too heavy, it is dialed back at synthesis, not at the job.** Two controls, both existing or nearly so:

- **Per source, `influence`.** Already on every source record and already defined at `chat-completions-provider.js:97` as reach rather than strength. A source marked light earns an entry; a source marked strong can set the frame for a section. That definition moves from the grammar rules to the shared authority rules so it governs every evolved pass.
- **Per brand, one reach setting for the evolved run.** Three levels, in the user's words: "a few touches," "a clear direction," "a new world." It is stored on the brain, set when the evolved world is approved, and sent to the four evolved passes as one sentence saying how far the aspiration sources may change the people, the places, the moments, and the dossier. Changing it means re-synthesizing the evolved world, which is the point: the throttle acts on what gets built, and the writer reads what was built.

**This does not reverse ADR 0016's compile rule.** Origin never sets compile weight. An approved ambition entry compiles at full strength. The throttle decides how much ambition enters the world; the compiler still attaches format, locked asset, and provenance and nothing else.

## Decision, part three: the world is open

Owner ruling 2 above, applied to the schema and the instructions. This part ships with part one because it changes the same two files.

**People become a cast, not characters.** `livedWorld.people` becomes `livedWorld.cast`: one prose description of who belongs in this world, wide enough that twenty frames cast twenty different people who all fit, plus example people marked as examples. The examples exist so a writer has something concrete to reach for; the instruction says to cast fresh each time and never to reuse an example by name. `minItems` on examples is 1. There is no `maxItems`.

**Moments become situations, not scripts.** `storyArchitecture.moments` keeps `title`, `when`, `where`, `feeling`, and `basis`. `who` becomes a prose description of who is there, not a list of ids. `doing` becomes `situation`: one thing underway, written so a photographer could arrive at any minute of it and find a different picture. The instruction says plainly that a moment is not a sequence and that a person in it is in the middle of one thing. `minItems` stays at 6 as an honesty floor. There is no `maxItems`.

**The grammar's people section becomes casting range**, not one entry per named person. The instruction at `:80-84` already says the people section is casting; the MycoPop result shows it was read as one entry per character because the characters had names and ids.

**The writer stops being handed a list to pick from.** `selectMoments` stays. The task's people paragraph changes from "use these people by name" to "cast from this description, and nobody in this frame has appeared in another."

## Consequences

**Gained.** The product can do the thing it says it does. MycoPop's retro direction can reach the people, the rooms, and the moments, labeled so nobody mistakes it for evidence. Simply Agree gets a regression check for free: its evolved world should come back close to its today world, and if it does not, the mechanism is over-reaching. The client gets two decisions to make instead of one they cannot separate.

**Accepted costs.** Four more model calls per synthesis. Two approve actions and two review surfaces. A storage shape change with a read-through for old brains. The first evolved synthesis for MycoPop is a rebuild, because an update would build on the three-people baseline; the rebuild path replaces the approved brain and is backed up first, `service.js:371-383`, and the rebuild-erases hazard in `docs/deferred-work.md` stands until it gets its own decision.

**Risks.** The evolved world can become cosplay. The guard is that it reads today's world as settled data and that every reaching entry carries a label a reviewer can see. The reach sentence is one sentence in a synthesis instruction and may not steer a model at all three levels; the gate below runs it at all three before anything ships. Removing caps can produce thin or repetitive output; the honesty rule at `:100-104` already says a thin section is correct output, and it applies here.

**Not in scope.** The save route validating snapshots against `brandBrainSchema`, recorded in `docs/current-state.md` section 6. It should ship before a second approved object exists, and it is its own small change.

## Sequencing

1. **Instructions and schema, prototyped by dry run.** Rewrite the three fence lines and add the evolved-pass variants. Change the people and moments shapes per part three. `synthesize` already accepts `dryRun` at `service.js:235`, which computes a candidate without persisting. Run MycoPop's evolved passes against its current eight sources and read the result. Run Simply Agree's the same way. Gate: MycoPop's evolved people, places, moments, and dossier carry the retro direction as a physical world with ambition labels on the entries that depend on it, and no readable third-party property; Simply Agree's evolved world is unsurprising next to its today world. Both pass before anything is committed.
2. **Storage and approval.** `artifacts.today` and `artifacts.evolved`, per-world `approvedVersion`, two approve actions, old-brain read-through.
3. **Intake.** The two piles and the "not this" role. The record shape does not change.
4. **The writer and the throttle.** The writer reads `artifacts.evolved` when approved and `artifacts.today` otherwise. The reach setting lands on the brain and in the evolved-pass instruction. Dry-run MycoPop at all three levels and read the three worlds side by side before calling it done.
5. **MycoPop rebuild** through the new path, then the aspiration session's output enters as evolved sources and MycoPop re-synthesizes once more.

Step 1 gates everything. Steps 2 and 3 can run together. Step 4 needs 2. Step 5 needs all of it.

## Options considered

- **One world with ambition entries mixed in, filtered by the writer.** Rejected. One synthesis instead of two, but the client cannot approve "this is accurate" separately from "this is where we are going," and a mixed artifact makes the today check impossible.
- **Evolved world only, dropping today.** Rejected. Simply Agree's value is texture on an accurate base, and the today world is the regression check that keeps the mechanism honest.
- **Keep the fence and author the aspiration by hand as a document outside synthesis.** Rejected as the product position. It is what the aspiration session does for MycoPop this month, and the session's output has to have somewhere to go afterward.
- **A per-job choice of which world the writer reads.** Rejected by owner ruling. A job that can ignore the aspiration is a way to never build it. The dial belongs at synthesis.
- **A numeric blend weight.** Rejected. A model does not read "sixty percent aspiration" as anything, and ADR 0016 already ruled that origin does not set weight. Three named reach levels in one instruction sentence are the honest version.
- **Two worlds, two approvals, the writer reads the evolved one, reach throttled upstream.** Accepted.

## Owner rulings, 2026-09-09

1. **Names.** The two piles are "the brand today" and "the brand world, evolved." The reach levels are "a few touches," "a clear direction," "a new world."
2. **No per-job choice.** The writer always reads the evolved world once it is approved. Ambition that is too heavy is dialed back upstream, at synthesis, by source influence and the brand reach setting.
3. **The dossier gets an evolved version.** A dossier that does not represent what the client wants the brand to be is not doing its job. The guidance sections stay single, because their job is conflict resolution between sources.
4. **The caps come out now.** Moments are free to express themselves. Part three ships with part one.
