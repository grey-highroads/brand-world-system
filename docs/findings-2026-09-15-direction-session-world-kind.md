# Findings: the direction session, world kind

- Date: 2026-09-15
- Session: builder, against `docs/brief-2026-09-15-direction-session-world-kind.md` and ADR 0021
- Repo state read at start: `main` at `ca7fa7c79463`

## What was built

The direction session end to end for a brand whose audience is not established, in the order the brief names: passes 1 through 4 run and stop, the foundation is approved, the session runs on its own screen with the record filling beside the conversation, the record is approved, and the evolved passes read it as a source.

New: `src/direction/record.js` (the record shape, prose rendering, and the source conversion), `src/direction/session.js` (the turn runner and its instruction), `api/direction/index.js` (GET reads the record; POST dispatches turn, save, approve), `test/direction-session.test.js` (twelve tests covering the brief's list).

Changed: `src/brand-brain/store.js` gained `readDirection` and `writeDirection` on both stores, at `state/direction.json` beside the brain. `src/brand-brain/service.js` decides on pass 1 where an initial synthesis ends, records it on the in-progress record, finalizes there, and injects the approved direction record into every evolved pass at read time. `app/app.js` gained the session screen, the direction card on the Artifacts screen, and a run loop that stops when the server says the synthesis is complete. `app/styles.css` gained the session styles.

## Where the brief was right and where it under-stated the work

**Section 4 needed a server change, not only a client change.** The brief asked whether the evolved-only path could be driven the way section 4 assumes. It can, verified against `runEvolvedStart`. What section 4 under-stated is the stop itself: the server wrote the saved brain only when pass 8 finished, so a client that stopped sending requests at pass 4 would have left the four today artifacts stranded in the in-progress blob with nothing for the foundation review to read. The fix is a `finalPass` recorded on the in-progress record from pass 1 and honored in `runLaterPass`, with the completed payload returned on whichever pass finishes the synthesis. The client stops when the payload says `complete` rather than counting to eight, so the server's decision governs.

**An empty evolved key is a live hazard.** `assembleBrainFromPasses` wrote `artifacts.evolved` unconditionally, and with no evolved pass results that serializes to `{}`, which is truthy to `worldArtifacts` and to the app's `evolvedStatus` check. A pass-4 save carrying it would have shown a phantom evolved world as a draft. The assembly now omits the key when no evolved pass ran. An eight-pass assembly is unchanged.

**"Runs all eight unchanged" was read as run mechanics, not byte-identical behavior.** The approved record is injected into the evolved passes of a full eight-pass run too, not only the evolved-only path. Without that, the first full rebuild after approval would produce a directionless evolved world, which is the collapse ADR 0021 documents. The today passes never receive it, and the injection happens at read time, so the stored intake list stays what the user supplied. If the owner meant byte-identical, the injection in `runLaterPass` is one condition to narrow.

## What holds the design test

Nothing in the synthesis instructions changed. The record arrives as a source with provenance `ours`, aspiration `aspiration`, influence `Lead`, and prose content, and the evolved passes read it through the same authority rules as any uploaded direction material. The test at `test/direction-session.test.js` pins the register.

## Gating and compatibility

Every new server behavior is gated on the store having `readDirection`. A store without it, which includes every store in the existing test suite, behaves exactly as before, and the full suite passes against the same baseline it had at head.

Two failures exist at head before this work: `fixtures/copy-audit-mechanism-test.mjs` requires `OPENAI_API_KEY`, and browser-prototype test 44, "Sources landing separates guided intake from the detailed source library," fails on `main` with no local changes. Neither was introduced or fixed here.

## Not built, on purpose

- The craft session, board reading, the writer, the reach control, and image labelling, per the brief's out-of-scope list. The reach constant `SYNTHESIS_REACH` still sends "a new world", which happens to be the only level a world-direction brand has.
- A revision flow for an approved record. The save action supports it server side (a save over an approved record takes the next version and returns to proposed), but the screen shows an approved record read only. ADR 0021 says the record is re-runnable and versioned; the interface for that is future work.
- The processing screen still lists eight steps while a record-less brand runs four. Cosmetic, left alone.

## To tune with real turns

The session instruction was adapted from the prototype's world branch and has not been run against OpenAI. The prototype ran on a different provider, and the brief expects tuning. The likeliest soft spots: how eagerly the model writes entries it should have asked about first, and whether the strict output schema needs the reach object loosened for models that return it early.
