# ADR 0021: Author the direction in a session, and keep prohibitions out of the prompt

- Status: Proposed. Owner ruled on refusals and on where rules may reach during the drafting conversation, 2026-09-15; those rulings are applied to the decision text.
- Date: 2026-09-15
- Owner: Higher Roads
- Deciders: Grey rules. Chief architect drafts and verifies.
- Related: ADR 0019 (brand today and brand evolved; this record supplies the direction its evolved passes reach from), ADR 0015 (MycoPop's world has to be authored rather than observed), ADR 0016 (visual grammar and the ambition origin), ADR 0017 (refusals as governed records; untouched here), ADR 0012 (products as governed records)
- Verified against: head at drafting, files opened in this session: `src/brand-brain/chat-completions-provider.js`, `src/brand-brain/schema.js`, `src/brand-brain/world.js`, `api/brand-brain/synthesize.js`, `api/production/generate-copy.js`, `src/production/looks.js`, `app/app.js`. Claims carrying no file are labelled.

## Context

ADR 0019 built two worlds and a reach lever. Both work. What neither has is a way for a brand to say where it is going in the first place.

**A direction can only arrive as an uploaded file.** Every source is a file, a link, or pasted text, and the two flags that make it a direction, `provenance` and `aspiration`, are set on that record. There is no intake for a direction the client can state but has not documented. VERIFIED.

**MycoPop's direction is exactly that.** It is intent held by its founders. The handoff of 2026-09-09 says so and calls for a working session rather than more synthesis. The system has nowhere to put the output of that session.

**With no direction source, the evolved run collapses into the today run.** The ambition test says an entry carries the ambition origin when it would not say what it says with the aspiration and emulate sources removed. With none supplied, that test can never return true, so nothing can be labelled ambition and every entry falls back to evidence or inference, which means defensible from the brand's own current material. The reach sentence at "a new world" tells the model to author in full while the basis rules require every entry to name what it rests on. Those point opposite ways, and the checkable one wins. VERIFIED from the instruction text. That the checkable rule wins in practice is REASONED, and it matches MycoPop's output.

**Nothing warns that a direction is missing.** No check for whether any aspiration or emulate source exists, no review question, no notice on screen. The run proceeds as though a direction was given. VERIFIED.

**The images a direction would arrive as cannot be told apart.** When a pass sends images, every image file on every source is appended to the message with no text identifying which source it came from. A direction moodboard marked lead influence and a logo file arrive as two unlabelled pictures. So per-source `influence` and `aspiration` cannot reach image material at all. VERIFIED.

**No pass filters sources.** Every pass receives every source. Passes 1 through 4, the brand today, receive direction material and are kept from recording it as fact by instruction alone. VERIFIED.

**Some brands have the opposite problem.** Simply Agree has a settled audience, documented moments, and a new identity system. What it wants changed is how the pictures are made. The reach level "a few touches" already describes that case exactly: keep the people, the places and the moments, and bring the direction into the objects, the clothes, the light and the detail. VERIFIED. So the axis exists and nothing collects the input for it.

**The writer transcribes what it is handed.** On 2026-09-08, against MycoPop with the `drugstore_flash` look, all three directions paraphrased the look's optical description back into the scene prose and none of them acted on what the look meant for behaviour in frame. Recorded in `docs/writer-corpus.md`. This is the governing fact for how any rule may be given to the writer.

**Owner rulings recorded during drafting, 2026-09-15:**

1. A brand has one visual aspirational direction. Not one per campaign.
2. The session recommends the reach level and states the implications. The client does not set it blind.
3. Rules may reach the writer. Rules may not reach the image prompt.

## Decision, part one: the direction session

**A direction is authored in a session with an agent, between the two worlds.** Passes 1 through 4 run and the foundation is approved. The session runs. Passes 5 through 8 then run with the session's output as a source, at the reach the session recommended. The synthesize route already runs one pass per request and holds the in-progress brain between them, so the seam exists; what changes is that the client stops at 4 and waits. VERIFIED that the route works this way.

**The session produces a direction record, not a transcript.** The record is structured by the sections it feeds: the Lived World fields for a world direction, the six Visual Grammar sections for either. It is what persists, what a later session resumes from, and what synthesis reads. A transcript grows without bound and loses its own decisions.

**Every entry records how it was arrived at.** Stated, when the person said it unprompted. Chosen, when they picked it from options the agent offered. Rejected, when they ruled one out. Rejections persist, because they stop a later session re-proposing what an earlier one killed, and because what a brand rules out is often more particular to it than what it asks for.

**The agent extracts rather than supplies.** It carries vocabulary the client may not have and offers it as options to accept or refuse. It does not write a territory into the record that the person did not state, pick, or confirm. Without this rule every brand that says the word retro receives the same twenty pages, which fails in the opposite direction from convergence: sameness across brands rather than within one.

**The record becomes a source when approved.** Provenance ours, aspiration aspiration, with an influence value. Nothing in the synthesis instructions changes to accommodate it. The ambition test gains something to test against, `derivedFrom` gains a checkable answer, and the reach lever gains something to reach from.

**It is re-runnable and versioned.** A direction sharpens after the first twenty images. A later session reads the record and asks what changed.

**The session records the model that wrote it,** following the writer's precedent. The session is a taste-bearing component and changing its model changes the worlds it produces.

## Decision, part two: two kinds of session

**Which kind a brand gets is decided by the foundation, not by a picker.** A today world whose audience is not established is a world direction. One with a settled audience is a craft direction. The same fact constrains which reach levels may be recommended.

**A world direction authors people, days, places and grammar.** MycoPop. The session may not treat product facts as the audience.

**A craft direction authors grammar only.** Simply Agree. The session never asks who these people are. It asks what the current work gets wrong, in specifics, and what it gets right that must survive. It may offer named photographic approaches from the look library as options to react to, described in a clause rather than named, because choosing between two is a far easier question than describing light.

**A craft session is briefed against one specific failure.** The ask arrives as a feeling: more sophisticated, a bigger brand, a better agency. Sophisticated reads to an image model as clean, and clean is the renderer's house style the photographic character work already names as the enemy. A craft session that accepts "elevated" and records it has failed. Its whole job is converting the feeling into decisions a camera makes.

## Decision, part three: a direction is authored positively

**What the client rules out is converted into what should be there instead.** "Stop lighting everything evenly" becomes one window source with the far side of the room going dark. A precise positive statement displaces the prohibition and gives the writer something to write rather than something to avoid. The rejection is still logged in the direction record, as how the direction was arrived at.

**The remainder is short and is about absence.** Nobody posing at a laptop. Nobody acknowledging the camera. The product not in anyone's hand. These have no positive form at the same precision. A long remainder means the session did not do the conversion work and is a defect in the session, not a reason to widen the channel.

**The remainder reaches the writer and never the prompt.** It is given to the writer separated from the material it describes, stating that it governs what the writer writes and does not appear in what it is written. This follows the owner ruling: rules may reach the writer, and rules may not reach the image prompt. The look transcription failure of 2026-09-08 is the evidence that this needs enforcing rather than trusting.

**A prohibition that survives into the direction prose is a defect caught before the prompt is built,** in the same place the existing meaning check runs.

**ADR 0017 is untouched.** Governed refusals remain the only refusal channel for compliance. A governed refusal exists because saying something would be a regulatory or brand problem and it carries a human ruling. A session reject exists because the picture would be wrong. Routing craft direction through the compliance mechanism would degrade both.

## Decision, part four: what shipped already

The Lived World now records `audienceEvidence`, established or not established, and product facts are excluded from counting as evidence. When the audience is not established, the artifact is written as the placeholder it is and the evolved passes are told not to carry those people forward. The product-reasoning rule became a labelled fallback that may not reach past product facts into taste, culture or scene. Pushed 2026-09-15.

This was a prerequisite rather than part of the design. Every Lived World field is required and every array carries a floor, so a brand with no customer evidence still receives a full portrait reasoned out of its own packaging. Left unsaid, that portrait anchors the evolved passes, and the session would open by reading a fabricated person as settled foundation.

## Consequences

The client stops at pass 4 and waits. Synthesis is no longer one uninterrupted run, which is a change to the run loop rather than to the model, and the two worlds already carry separate statuses and separate approve actions.

Taste is authored in a second place, so the direction record needs review and approval like every other artifact. The session must not be the one surface that skips governance.

The session is a conversational component in a product that has had none. It needs turn caps, because a session running sixty turns is failing to converge rather than producing a better record.

Direction material arriving in the session rather than in phase one keeps it out of passes 1 through 4, which no filter currently does.

## What this does not decide

**Whether images should be labelled at synthesis.** The unlabelled image stack is recorded above as a verified defect. The session reduces its blast radius for direction material, because a board handed over in conversation is read once with a person present to correct the reading. It does not fix the defect.

**Whether influence should govern more than precedence among direction sources.** It is instructed on the evolved run only and not at all on the today run. Out of scope here.

**Whether a brand with a settled audience may later reopen it.** One direction per brand is ruled. Whether the kind of direction can change is not.

## Open questions

1. Does the session run with the client present, with Higher Roads, or either? The output differs, and the World Kit decision was written to remove the dependency on Higher Roads being in the room.
2. Should the session read uploaded boards directly, and if so does the record store the image reference, the session's written reading of it, or both? The written reading travels through synthesis intact where the image currently cannot.
3. What model runs the session. Synthesis runs on gpt-5.6 and the writer on gpt-4o, both VERIFIED. The session is closer to synthesis in what it has to hold at once. The prototype used a different provider and its quality should not be read as a prediction.
