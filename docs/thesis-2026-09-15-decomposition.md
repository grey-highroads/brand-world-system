# Thesis: the system decomposes what the model already knows whole

- Date: 2026-09-15
- Author: builder session, for a second reader
- Owner: Grey, Higher Roads
- Status: a proposal and an argument, not a decision. Nothing here is built.
- Related: ADR 0021, ADR 0019, the handoff of 2026-09-09, `docs/findings-2026-09-15-the-session-proposes.md`

## What this document is for

We want a second opinion on one question. The system keeps producing narrower, flatter worlds than a general chat assistant produces from a paragraph of prompting, and we think we know why, and we want to be told if we are wrong before we rebuild around it.

Read the claim, then read the counterarguments, then tell us which side is right.

## The claim

Every stage of this system takes something the model can hold whole and breaks it into fields. Each break is individually defensible. Together they throttle the thing we are paying the model for.

The evidence is not an opinion about elegance. It is a repeated measurement.

**A hand written 180 word prompt outperformed a compiled prompt of 22,571 characters.** Recorded in the handoff of 2026-09-09. An audit of the compiled MycoPop prompt found roughly 2,610 words, 49 percent of it prohibitions and protections, with 44 occurrences of "do not". The response was the subtraction work of August and September, which stopped compiling rules into the instruction. The finding at the time was stated plainly: the system had discovered that compiling rules into the instruction was the wrong approach.

**The direction session repeated the mistake in conversational form.** ADR 0021 ruled that the session agent extracts rather than supplies, never writing into the record anything the person did not state, pick, or confirm. The reason was sound: without it, every brand that says the word retro receives the same twenty pages. The result was a twenty five turn interview asking the owner for details the model already held in far greater richness than he could articulate. The owner's comparison: a twenty five word prompt to a general assistant produced a better world sketch than the interview produced here. We changed the session to propose rather than extract, and the improvement was immediate.

**The record shape then produced the same collapse one layer down.** The brief specified the direction record's sections as the four Lived World fields and the six Visual Grammar sections, one slot per artifact field. So the session proposed a whole world, then decomposed it into one sentence entries per bucket. The evolved passes read a filled bucket as the content for that bucket. One scene the owner described in detail became the entire world, and the writer produced three directions that were variations on it.

We renamed the buckets and added a rule-versus-example distinction. The owner's response, which prompted this document: we are still talking about tables, chairs and countertop surfaces. He is right. Renaming buckets does not undo decomposition.

## Why it keeps happening

The pattern is the same at every layer and it is worth naming because the next design will face it too.

A schema field is a promise that something will be there. That is exactly why it was built, and for governance it works: a field can be validated, cited, versioned, and approved. The trouble is that a field is also an instruction to fill it, and a model filling twelve fields separately writes twelve unrelated things. The connective tissue, which is the reason those people are in that place doing that thing, has no field, so it is the thing that gets dropped.

This is visible in the artifacts today. The Visual Grammar's places section is defined as rooms, surfaces and materials. The Lived World's environments are defined as journey moments, and the instruction says explicitly that naming a moment is not naming a room. Both definitions are careful and correct in isolation. Between them, the world is split into two lists that each describe half of a place and neither of which describes why anyone is there.

There is a second, subtler cost. Decomposition invites the model to satisfy each field at the level of the field. Asked for "light", it writes a sentence about light. Asked for "objects", it writes a sentence about objects. The output is not wrong. It is thin in exactly the way a checklist is thin, and thinness at this layer is what produces convergence at the layer below: twenty pictures of tables.

## The counterarguments, stated as strongly as we can

We want these attacked or endorsed, not waved past.

**Governance needs structure.** Provenance, the ambition test, confidence levels, approval and versioning all operate on entries. A field-level basis object is how a reviewer tells reach from evidence. Prose has no fields to attach any of that to. If the record becomes prose, what exactly is approved, and what does a reviewer inspect?

Our current answer: the owner approves the world he stopped arguing with, which is a stronger act of review than clicking through twelve buckets he never read. But this is an assertion and it should be tested.

**Sameness across brands is a real risk.** The extraction rule existed for a reason. If the model proposes freely, every functional beverage may get the same world. We now think the guard belongs at the decision rather than at the proposal: the model may propose anything, and nothing is recorded that the owner did not take, say or confirm. Whether that is sufficient is unproven. We have one brand's worth of evidence.

**Synthesis instability is documented.** ADR 0017 measured three full rebuilds of the same brand from identical sources and found no guardrail shared by all three runs, and not one approved refusal surviving in any form. That is why refusals became governed records with human rulings. If synthesis output is unstable, is a prose world any more stable than a structured one, or does it just make the instability harder to see?

**The schema is what makes two brands comparable.** The transfer case, Simply Agree, is the structurally important one: if it comes out coherent and owes nothing to MycoPop's personality, there is a system rather than one good art direction project. A shared schema is one way to demonstrate that a system exists. Prose worlds might make the transfer claim harder to evidence.

**Prohibitions do not survive this move cleanly.** ADR 0021 rules that rules may reach the writer and may not reach the image prompt, and that a prohibition surviving into the direction prose is a defect caught before the prompt is built. A prose record mixes the direction with anything ruled out unless the two are kept structurally apart.

## What we propose instead

Thin structure at the edges, prose in the middle. The shape has three parts and nothing else.

**One: the world, as prose.** Whole, long, as rich as the model wrote it and the owner approved it. Who these people are, written as a casting range rather than a cast, because a brand's pictures should look like the millions of people in that range rather than the same twenty faces. Where they spend time, at more than one scale, from one person alone to a crowd of thousands. What is in those places, how the light behaves, what they are doing when nobody is performing. It is not assembled from fields and it is not decomposed after the fact. It travels into the evolved passes intact, and those passes are already instructed to author in full and already know how to read a world.

**Two: the kill list.** What the owner rejected, kept verbatim and permanently. This is the highest value content in the record and the most brand-specific thing in the session, because what a brand refuses is more particular to it than what it asks for. It is stored apart from the world, never mixed into the prose, which is also what keeps prohibitions out of the image prompt.

**Three: a small set of standing rules.** Not per-field entries. The handful of statements that hold across every picture and that the owner stated or confirmed. In the MycoPop case these look like: nobody is working, they are off the clock; the product sits on a surface and nobody holds it up; the pictures are made at a range of scales. Three to eight of these, not thirty. Their job is alignment, not description. The world carries the description.

That is the whole record. No per-artifact buckets. The model gets a door and a few guardrails rather than a form.

**How taste applies.** The session proposes two or three complete worlds, genuinely different from each other, committed to rather than hedged. The owner kills, takes, and redirects. Three or four rounds. What is stored is the version he stopped arguing with, plus what he killed, plus the rules he stated along the way. His taste is expressed through reaction, which is fast and accurate, rather than through interrogation, which is slow and drags the world toward whatever he happened to describe in most detail.

**What governance attaches to.** The record has a status, a version, an approving human, and the model that wrote it. It is approved as a whole, the way a creative director approves a treatment. The claim we are making, and want challenged, is that field-level provenance on a direction record was always somewhat ceremonial: the direction is declared by the brand, not derived from evidence, so an origin field on each fragment records something nobody disputes. Provenance matters enormously on the brand today, which is a truth claim. A direction is an intent, and intent is approved rather than traced.

**What does not change.** The record still arrives at synthesis as an ordinary source with provenance ours and aspiration aspiration, so no synthesis instruction learns that direction records exist. That test held through both builds and should keep holding.

## What we are least sure about

Ranked, most to least worrying.

1. **Whether a prose world actually produces range, or just hides its absence.** A structured record at least makes narrowness visible: you can see that the places bucket has one entry. A prose world can read beautifully and still generate twenty pictures of the same afternoon. The stated gate from the 2026-09-09 handoff is that twenty images must be twenty different moments rather than six compositions with variations, and nothing we have built measures that.
2. **Whether approval of prose is real review or a rubber stamp.** Structured review is tedious and at least forces contact with each part.
3. **Whether the standing rules stay a handful.** Every system in this repository has grown its rule set until the rules crowded out the content. This one has no structural reason not to do the same, only discipline.
4. **Whether the workflow can absorb another change.** Before one picture a brand currently passes review questions, a six section guidance walkthrough, the today approval, a session, the record approval, the evolved build, and the evolved approval. Four approvals and two long sequences. The product has never pruned a governance surface, only added them, and that is a separate problem this proposal does not solve.

## The question for the second reader

Is the decomposition diagnosis right, and is thin-structure-with-prose the correct correction, or is it an overcorrection that trades a real governance capability for a quality gain we have measured exactly once?

If it is an overcorrection, we want to know what the minimum structure is that preserves review without producing checklist output. If it is right, we want to know what should measure range, since that is the failure mode this proposal is least defended against.
