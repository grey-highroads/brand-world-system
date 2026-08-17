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

## Mechanics proposal, for ruling before any run

Proposed, not built. The stop rule above holds: nothing runs until this is ruled.

### Where it sits

Inside the existing synthesis path in `src/brand-brain/service.js`, after `#parseSynthesisCompletion` returns a schema-valid brain and before persistence. No new `api/` file; the 12-function ceiling is unchanged. On `dryRun`, the matcher runs and its result rides along in the response without writing, which is what makes the gate's runs possible without touching a client's document.

### What it receives

Two arguments and nothing else.

**The fresh material**, drawn from the four channels in the input contract: `visualGrammar.sections.rejects`, `dossier.guardrails`, `livedWorld.rejects`, and the guidance principles once the channel is testable. Each arrives as an item with its channel named, because a guardrail and a grammar reject are different shapes and the decomposition step needs to know which it is holding.

**The client's concern list**, read from `refusals.json`: for every entry regardless of status, its id, concern, statement, and status. **Declined and retired entries are included.** Excluding them would mean a declined concern returns as a fresh proposal every rebuild, which is the exact behavior the ADR's persistence rule exists to prevent.

### What it returns

For each input item, a set of results rather than one. This is step 1 finding 1, accepted into the design by the owner's ruling of 2026-08-17: guardrails carry two or three prohibitions and a one-in one-out matcher drops the second silently.

Each result carries the prohibition as the matcher read it, a matched entry id or null, and a confidence band of high, medium, or low. Nothing else. **The matcher does not rewrite statements, does not rule, does not retire, and does not propose removals.** Its whole authority is to say whether it has seen this concern before.

### Decomposition and matching, one call or two

Proposed as one call, with the alternative stated because it is a real fork.

**One call.** The model receives the items and the concern list together and returns prohibition-level results directly. Cheaper, and the decomposition is informed by the concern list, which helps: a guardrail naming both borrowed property and competitor copying decomposes more cleanly when the reader already knows both concepts exist as separate concerns.

**Two calls.** Decompose first with no knowledge of the client's document, then match. More expensive and slower, and it removes a bias the one-call version carries: a decomposer that can see the concern list will tend to cut prohibitions along the lines the list already draws, which inflates match rates and hides genuinely new refusals inside familiar shapes.

**The recommendation is two calls,** on the reasoning that the bias runs toward over-merge, and over-merge is the harmful direction under M1. The cost is one extra call per synthesis, on a path that already makes one very expensive call. **This is the ruling most worth making before the runs**, because the gate cannot fairly measure over-merge on a mechanism whose decomposition step was primed by the answer key.

### Confidence and the fail-safe branch

Three bands, with the ADR's uncertainty posture enforced by the mechanics rather than by the prompt:

- High and medium: the match stands, a re-observation is appended to the entry, nothing surfaces.
- Low: **the mechanics discard the match and record a proposal**, whatever the model said. This is the M5 clause made structural. A posture that lives only in prompt text is a posture the sampling ignores when it feels like it.

Every failure mode collapses the same way: a non-2xx response, a timeout, a parse failure, a returned entry id that is not in the document, or a malformed result all cause every item in that synthesis to be recorded as a proposal. **Synthesis never fails because matching failed, and matching never suppresses because it broke.** The worst outcome is a person ruling on a slate they have mostly seen before.

Temperature 0, for the same reason the claim auditor runs at 0: this is a judgment about identity, not a generation.

### What it writes

Proposals enter the document as `proposed` through `proposeEntry`, carrying `ruling.proposed_by_run`. Matches append through `recordObservation` with the run id and the fresh wording, so an entry absorbing many observations is visible to a reader, which is the ADR's stated mitigation against a concern quietly swallowing everything.

Nothing else in the document is touched. Status changes stay human-initiated.

### Open questions the owner should settle with the ruling

1. **One call or two.** Recommended above as two. Everything else here holds either way.
2. **Does the matcher see statements or concerns alone?** Proposed: both, because the concern is a short name and two different refusals can share a short name. The risk is that statement wording drives the match and the concern key stops doing the work step 1 measured it doing.
3. **What happens on the first synthesis after this ships,** when a client has no `refusals.json`. Proposed: every prohibition is a proposal, the person rules the full initial slate once, exactly as the ADR describes. Worth confirming, because it is also the moment the matcher is least useful and most expensive.

### What remains before the runs

The prohibition-level decomposition and its assignment, and the Condition B reduced documents. Neither needs a model call and neither is blocked by this ruling.

## Judgment

To be written after the mechanics are ruled and the runs exist, appended below rather than folded into the clauses above.
