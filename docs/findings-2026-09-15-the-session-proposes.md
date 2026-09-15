# Finding: the session proposes worlds rather than interviewing for them

- Date: 2026-09-15
- Against: ADR 0021, sections "the agent extracts rather than supplies", "two kinds of session", and the brief's section 1
- Owner ruled this change on 2026-09-15 after running the first real sessions

## What happened

The first build followed ADR 0021 exactly. The session extracted: it never wrote anything into the record that the person had not stated, picked, or confirmed. The owner ran it against MycoPop and it took roughly twenty five turns of detailed questions about the small elements of one hypothetical scene. The resulting evolved world produced three scene directions that all drew on the handful of situations he had described in the session, and all three landed in the same territory.

Two failures, one cause.

**The extraction rule wasted the model's knowledge.** The model holds a great deal about this category, this culture, and the aesthetic territory a brand like MycoPop is reaching toward. The rule told it to sit on all of it and ask questions instead. The owner's point, and it is correct: a twenty five word prompt to a general assistant produced a better world sketch than a twenty five turn interview produced here.

**The record's shape invited collapse.** Section 1 of the brief specified the record's sections as the four Lived World fields and the six Visual Grammar sections, one per artifact field. So an answer landed in the exact slot the evolved pass was about to fill, and the pass read a filled slot as the content for that slot rather than as a constraint to write within. The session's instruction to get physical compounded it, because a person asked to be physical describes a scene. One scene became the world.

The repository already recorded this lesson in another form. The handoff of 2026-09-09 notes a hand written 180 word prompt outperforming a 22,571 character compiled one. The subtraction work was the system learning that compiling more instruction into the request was the wrong move. The extraction rule made the same mistake in conversational form.

The two halves of the system also disagreed. The evolved passes carry EVOLVED_AUTHORING, which tells the model it knows the category and to author the world in full. The session told it the opposite, and the session runs first.

## What changed

**The session proposes.** It opens by asking for a rough steer, twenty five words is enough, then returns two or three complete worlds built from what it knows. The person kills one, takes another, redirects. Taste applies through reaction rather than through interrogation. Target is three or four rounds, and the screen says which round it is on. Past eight rounds the session says plainly that it has failed and recommends approving what exists.

The sameness risk ADR 0021 named is real and is now handled where it belongs: the session may propose anything, and nothing enters the record that the person did not take, say, or confirm. Proposing is the model's. Deciding is the owner's.

**The record holds rules, not scenes.** Every entry is a rule or an example. A rule holds across every picture in the world and is what synthesis builds from. An example illustrates a rule, is labelled as one in the prose, and carries the instruction not to reproduce it. The sections no longer mirror the artifact fields: they are named after what the session decides (the world, the register, who is in frame, where it happens, what is in the room, how it is lit, how it is shot, what must not change), which removes the copy-across reflex the old shape invited.

**One session, not two.** ADR 0021 split this into a world session and a craft session. In practice the difference was two paragraphs of instruction, not two products. There is now one session, and a settled audience changes what is held fixed and which reach levels may be recommended rather than whether the session runs. The craft discipline survives as instruction: with a settled audience the session never reopens the people, asks early what the current photography gets right, and refuses to record "elevated", "polished" or "clean" as a direction, because those read to a camera as the house style the brand already dislikes.

## What is not resolved

**The workflow is too long.** Before one picture a brand now passes review questions, a six section guidance walkthrough, the today approval, a session, the record approval, the evolved build, and the evolved approval. Four approvals and two interviews. The owner raised this and it is not addressed here. There are really two decisions in that sequence, does this describe us and is this where we are going, and everything else is a step inside one of them. This needs a ruling rather than a patch.

**Range is instructed but not measured.** The session is told to push for more than one kind of place and more than one kind of day before it lands, and the prose tells synthesis that examples are not scenes. Whether that is enough to stop convergence across twenty images is unknown until a set exists. The gate stated in the 2026-09-09 handoff still applies: twenty images have to be twenty different moments.

**Not run against a real session yet.** The instruction is rewritten and the tests pin its shape, but no live turn has gone through it.

## Correction: the casting range is the design, not a workaround

Recorded 2026-09-15, owner ruling.

An earlier version of this finding, and the handoff of 2026-09-09, treated the casting range as a concession to a model limitation. The handoff's open question asks whether recurring people can hold across twenty images, notes that no current model holds identity across arbitrary scenes, and says that if identity does not hold, territories have to be built around recurring situations, environments, and behavior instead.

The owner ruled that this frames the wrong question. A casting range is the right answer for a brand world on its own terms and would remain right if identity consistency were solved. There are millions of people in a casting range and a brand's pictures should look like it. People in a Lived World are representative rather than particular, so twenty images asking for the same twenty faces would be a worse world rather than a compromised one. Building territories around situations, environments, and behavior is the design, not the fallback.

That open question can be closed on this ruling rather than on a technical answer.

One consequence, fixed here. The session's world sketches skewed small and interior, because nothing told it that scale is part of a territory. A festival field is one environment holding twenty thousand people, and the same world also holds a packed room, a street at closing, and a kitchen at seven in the morning. The instruction now asks for settings at more than one scale, and names the failure it prevents: a world written entirely in small interiors produces twenty pictures of tables.
