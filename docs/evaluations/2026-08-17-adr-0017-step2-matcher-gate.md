# ADR 0017 step 2: the concern matcher gate, pre-registered

- Date: 2026-08-17
- Status: Pre-registered. Written and pushed before any matcher line, any re-cut hand judgment, and any run. Commit order is the proof, the same discipline step 1 and the ADR 0016 step 3 cycles used.
- Governs: ADR 0017 sequencing step 2, the diff between fresh synthesis output and a client's refusals document.
- Carries forward from the step 1 gate: G1 re-cut per prohibition, the eight boundary cases as a hard test set, and the boundary register as a standing structure rather than an appendix.

## What is being tested

Step 1 established that concerns are separable from wordings when a careful reader does the separating. Step 2 asks the next question and only that one: **can the matcher reproduce a hand judgment closely enough that its errors are tolerable in the direction they fall?**

The ADR already ruled the posture: err toward proposing. A wrong match that proposes something already ruled costs a redundant question. A wrong match that absorbs a new refusal into an existing concern costs a protection, silently, which is the failure mode the whole decision record exists to end. The two errors are not symmetric and this gate does not score them symmetrically.

## Input contract, widened per step 1 finding 3

The matcher takes refusals from four channels, not two. Step 1's inclusion rule saw three of them and missed the fourth, which is how MycoPop's floating-product rule stayed invisible to a fixture built from the captures.

| Channel | Present in the fixtures | Testable in this gate |
| --- | --- | --- |
| Visual grammar rejects | Yes, ten captures | Yes |
| Dossier guardrails | Yes, six stability captures | Yes |
| `livedWorld.rejects` | Yes, six stability captures | Yes |
| Creative and world guidance principles | No | **No, pending an owner paste** |

The fourth channel is named in the contract and is untestable here, because the guidance sections of both brands' approved brains are client state and the hard rules forbid reading them. If the paste arrives during this work it enters as gitignored fixture input under the step 1 convention and the channel is measured. If it does not, the gate reports the channel as declared and unmeasured rather than treating its absence as a pass. **Recording it as unmeasured is the whole point: a matcher that never sees a channel cannot fail on it, and a gate that stays silent about that reproduces the error step 1 finding 3 named.**

## The hand judgment, re-cut per prohibition

Step 1's G1 failed because it mapped per captured item. Guardrails and lived-world rejects are prose and carry as many prohibitions as their author wanted; four of 138 items carried two or three. The remedy is structural rather than a threshold change.

The hand judgment for this gate is authored at the prohibition level: every captured item is first decomposed into the distinct prohibitions it carries, and each prohibition is then assigned to exactly one concern or marked genuinely new. The decomposition is committed as its own artifact, separate from the assignment, so a later reader can disagree with either half without disturbing the other. The four items step 1 named are the known decompositions; more are expected and each one found is recorded.

The matcher is scored against the assignment. It never sees it.

## Conditions

**Condition A, in distribution.** The matcher runs over the captured prohibitions from all four cycle-2-instruction runs per brand, matched against the step 1 refusals documents at `fixtures/adr-0017-refusals/`. The two cycle-1 captures are run separately and reported as an out-of-distribution check, since cycle 1 predates the rejects-source revision and its output is not what a live matcher will meet.

**Condition B, held out.** A reduced refusals document is authored per brand from the cycle 2 capture alone. The matcher then runs the S1, S2, and S3 prohibitions against that reduced document. Condition B exists because of a leak that Condition A cannot remove: the step 1 fixture statements were written by an author who had read all ten captures, so their wording overlaps the material they are scored against more than a real client's document would overlap a fresh run.

**Where A and B disagree, B is the reading this gate reports as primary.** Stated here so the choice is not made after the numbers exist.

## Measures

Computed per brand, per condition, over prohibitions rather than items.

**M1, over-merge. The harmful direction.** A prohibition the hand judgment marks genuinely new, which the matcher attaches to an existing entry. Each one is a protection that never reaches a person.
- Rate above 0.05 of genuinely-new prohibitions fails.
- **Absolute, independent of rate: any over-merge onto a `declined` or `retired` entry fails the clause outright.** Absorbing a new refusal into a concern a person already declined suppresses it under a ruling nobody made about it.

**M2, under-merge. The tolerable direction.** A prohibition the hand judgment assigns to an existing concern, which the matcher calls new. Each one is a redundant question.
- Rate above 0.30 of already-covered prohibitions fails. The threshold is loose on purpose. A rebuild surfacing two redundant questions is an annoyance; the ADR accepted that cost explicitly.

**M3, declined parity.** Suppression on `declined` entries must not be materially worse than on `active` ones, since the ADR's stated reason for persisting declines is that a re-proposed paraphrase gets matched rather than re-litigated. Measured as the difference in correct-match rate between the two statuses.
- A gap above 0.15 in favour of active entries fails, because it means declines persist without doing the job they persist for.

**M4, the eight boundary cases. Reports, does not pass or fail.** For each case in the step 1 boundary register, record whether the matcher merged or split, and against which entry. These cases have no correct answer, because a careful reader could not settle them. What they measure is whether the matcher is stable across runs on the same pair and whether it lands the same way in both conditions. An unstable boundary call is a finding about the matcher's usefulness rather than its accuracy.

**M5, the uncertainty posture.** The ADR ruled that an uncertain match proposes. This is checked as behavior, not as instruction text: for every prohibition the matcher reports at its lowest confidence band, record whether it proposed or matched. Any low-confidence outcome that matched rather than proposed fails, because the posture is either enforced by the mechanics or it is a sentence in a prompt that the sampling ignores when it feels like it.

## Decision rule, stated before the runs

- M1 failing, on either measure, fails the gate. No other result outranks it.
- M5 failing fails the gate, and is reported alongside M1 rather than after it.
- M2 or M3 failing is a real result that does not block step 3, provided M1 and M5 hold. A matcher that asks too many redundant questions is tunable; a matcher that eats protections is not shippable.
- Condition A passing while Condition B fails is reported as a Condition B failure. The leak runs in one direction and only one.
- Any clause found to be mis-specified during the work is reported as written, never re-cut after results exist. The step 1 precedent is the owner's ruling of 2026-08-17: the escape hatch would be discovered exactly when results disappoint. Remedies live forward, in step 3's pre-registration.

## Stated limitations, named before judgment

**The hand judgment has one author, who also authored the fixtures it scores against.** Step 1's finding 5 recorded that its mechanical check could not detect the failure it was written to catch, because the mapping was the author's judgment rather than an independent measurement, and the real failures were found by reading. That holds here with more force, since the matcher is scored against that same author's assignment. The boundary register is the structural mitigation and it is carried forward for exactly this reason: calls that could go either way are named rather than resolved silently, so a second reader can check the close ones without re-reading everything.

**Two brands and eight runs cannot estimate a distribution.** They can establish whether the matcher's errors fall in the tolerable direction on this material, which is what step 2 is allowed to ask.

**The creative and world guidance channel is unmeasured** unless the paste arrives, per the input contract above.

**Cycle 1 output is out of distribution** and its numbers are reported separately rather than pooled.

## Stop rule

The ADR specifies concern matching as a model call at synthesis time. **This session stops at the mechanics proposal, before any run**, per house precedent: the mechanism, its input contract, its confidence bands, and its fail-safe branch are proposed and ruled before a single call is made. Fixture construction, decomposition, and the reduced Condition B documents need no model calls and proceed.

## Judgment

To be written after the mechanics are ruled and the runs exist, appended below rather than folded into the clauses above.
