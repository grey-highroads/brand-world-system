# Brief: the direction session, world kind

Date: 2026-09-15
Repo state this brief was written against: `main` at `e4618b5a7e`
Related: ADR 0021 (author the direction in a session), ADR 0019 (brand today and brand evolved)

## Push first

If you hit the tool limit with work on disk and nothing pushed, push before you do anything else, including before you write your report.

## What this session does

Build the direction session end to end for a brand whose audience is not established. MycoPop is the case. At the end of this build the owner can run passes 1 through 4, approve the foundation, hold a session, approve the direction record, and run the evolved passes against it.

Most of the machinery this needs already exists and is listed below. Read those parts before designing anything.

Do not build the craft session. Do not build board reading. Do not touch the writer.

## What already exists, verified at head

**An evolved-only run.** `src/brand-brain/service.js` has a path that starts at the first evolved pass, reads the stored today results out of the approved brain, and runs passes 5 through 8 against them. It is reached with `mode: "evolved"` on the pass 5 request and it accepts sources added after approval. The client uses it at `app/app.js:8182`. This is the seam the session sits in and you do not have to build it.

**Reach levels.** `REACH_LEVELS` in `src/brand-brain/schema.js` holds the three levels and `reachSentence` in `chat-completions-provider.js` turns one into an instruction for the evolved passes. The client sends `SYNTHESIS_REACH`, a constant at `app/app.js:713`, because no control exists. The comment there says so.

**The audience flag.** The today Lived World now carries `audienceEvidence`, either `established` or `not established`, added 2026-09-15. It is what decides which kind of session a brand gets, and this brief only builds one kind.

**Pass requests are one per HTTP request.** `api/brand-brain/synthesize.js` takes `pass` in the body and holds the in-progress brain between calls, because eight calls in one request share one 300 second clock. Follow that pattern for anything long running.

## 1. The direction record

A new record type, stored per client alongside the brain, in the same blob store. One per brand.

It holds, at minimum: the sections and their entries, each entry carrying its text and how it was arrived at; the reach the session recommended, with the reasons; the model that wrote it; a status; and a version.

Entry origin is one of `stated`, `chosen`, or `rejected`. Stated means the person typed it. Chosen means they picked it from options the session offered. Rejected means they ruled one out. Rejected entries are kept rather than deleted. They stop a later session re-proposing what an earlier one killed, and what a brand rules out is often more particular to it than what it asks for.

Status follows the pattern the rest of the system uses: proposed until the owner approves it. A proposed record is not read by synthesis.

The sections for this kind of session are the four Lived World fields and the six Visual Grammar sections. Name them in the user's words in the interface and in the architecture's words in the record, the way the rest of the app already does.

## 2. The session route

One turn per request. The body carries the client, the record so far, the new message, and how that message arrived. The response carries the reply, any options to offer, the entries to append, and the reach recommendation once there is one.

The model is the synthesis model, `OPENAI_MODEL`, with its own environment override following the precedent of `OPENAI_WRITER_MODEL` in `api/production/generate-copy.js`. Record which model answered on the direction record.

The session instruction is the substance of this route and it is prompt text, not code. It has to carry, at least:

- The approved foundation as data, so the session never re-asks a settled question.
- The review questions the four today passes raised, as data. Every pass carries `reviewQuestions` and the assembled set is on the brain. They are the system saying where it was unsure, which is the closest thing the foundation has to a list of what the session should ask about. Send the title, summary and rationale. Send the ones still unanswered, and send an answered one with its ruling, because a ruling is a settled answer the session must not reopen.
- The record so far, so it knows what is filled.
- How the last message arrived, so it tags the entry correctly.
- The rule that it extracts rather than supplies. It may offer vocabulary as options. It may not write into the record anything the person did not state, pick, or confirm. Without this every brand that says the word retro receives the same answer.
- The rule that a direction is authored positively. When someone says what they do not want, the session asks what should be there instead and records that. The rejection is still logged as how the direction was arrived at.
- The known writer failures as things to brief against: a look described optically rather than behaviourally, the product landing in a hand in every frame, a world that converges across a set.
- The reach levels available to this brand, and the instruction not to recommend one outside that list. For an unestablished audience there is nothing for the other two levels to keep, so `a new world` is the only one available. Derive the list rather than hardcoding it.
- The prose ruleset. No em dashes, no fragment stacks, no line built to be quotable.

A prototype of this instruction exists and the owner has run sessions against it. Ask him for it rather than writing one from scratch. It was written against a different provider, so expect to tune it.

## 3. The session screen

A conversation with the record visible beside it, filling as the session runs.

The record is the point of the screen and should read as the artifact it is, not as a summary of the chat. Each entry shows how it was arrived at. Rejected entries stay visible and struck through.

Options the session offers are clickable, and each carries a way to rule it out. Clicking records a choice, ruling out records a rejection. This is how origin is captured without asking the person to classify their own answers.

The reach recommendation appears when the session makes one, with the reasons and what it costs.

Turn caps: a session that runs past roughly forty turns is failing to converge rather than producing a better record. Say so plainly and let the owner close it.

## 4. Stopping at pass 4

Today the client runs all eight passes in one loop, `app/app.js` around line 8058. For a brand with no direction record, the initial synthesis stops after pass 4 and the screen moves to the foundation review.

The evolved passes then run later, through the path that already exists, once the direction record is approved.

A brand that already has an approved direction record is unchanged: all eight run as they do now.

## 5. The record becomes a source

On approval, the direction record is written as a source: provenance `ours`, aspiration `aspiration`, with an influence value. Its material is the record rendered as prose.

Nothing in the synthesis instructions changes to accommodate it. That is the test of whether this was done right. If the evolved passes need a new rule to read the direction, the record is the wrong shape.

## Tests

- A record with entries of all three origins round-trips through the store unchanged.
- A proposed record is not returned to synthesis; an approved one is.
- The session route rejects a request for a brand whose today Lived World reads `established`, because this brief builds one kind of session. Fail with a plain message rather than running the wrong interview.
- The reach list offered to the session holds only `a new world` when the audience is not established.
- The session payload carries the brain's unanswered review questions, and carries an answered one together with its ruling.
- An initial synthesis for a brand with no direction record stops after pass 4 and saves what the four passes produced.
- A brand with an approved direction record runs all eight unchanged.
- The approved record appears in the source register sent to pass 5, with provenance and aspiration set.
- Every existing assertion in the suite passes unchanged.

## Out of scope

- The craft session and everything that distinguishes it.
- Reading uploaded boards in a session, and storing the session's reading of one.
- The channel that briefs the writer on rejects that did not convert to positive statements.
- Any change to the writer or to prompt assembly.
- The reach control on screen. The session recommends; the constant still sends.
- Labelling images in the synthesis payload.
- Making `influence` do anything on the today run.

## If the brief is wrong

Stop and say so in your report. Briefs from this desk have carried a wrong file count, a false claim about what reaches the writer, and a default that bound the wrong setting. The claim most worth checking here is that the evolved-only path can be driven the way section 4 assumes. Raise it rather than building around it.
