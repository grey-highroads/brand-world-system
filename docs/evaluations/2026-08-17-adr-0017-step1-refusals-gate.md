# ADR 0017 step 1: the refusals fixture gate, pre-registered

- Date: 2026-08-17
- Status: Pre-registered. Written and pushed before any fixture entry or store line exists. Commit order is the proof, the same discipline the ADR 0016 step 3 cycles used.
- Governs: ADR 0017 sequencing step 1, the store and the hand-authored refusals documents for both test brands.

## What is being tested

ADR 0017 rests on one load-bearing claim: **a refusal's concern is separable from its wording.** Everything downstream depends on it. Concern matching at step 2 matches on concern. A decline persists so a paraphrase of the same concern can be suppressed. A re-observation attaches to a concern rather than to a phrasing. If concerns are not separable from wordings against real synthesis output, the design does not work and the ADR revisits before step 2 rather than after.

This gate tests that claim against the only real material available: the ten recorded step 3 captures and the two brands' currently approved refusal exports. No model calls. No reads or writes on any client namespace. The captures already exist.

## Source material, stated so the population cannot be chosen after seeing results

**Grammar rejects.** Verbatim in `docs/evaluations/2026-08-16-adr-0016-step3-parity.md` across ten captures: cycle 1, cycle 2, and stability runs S1, S2, S3, for each of MycoPop and Dialog Health.

**Regenerated dossier guardrails and regenerated `livedWorld.rejects`.** Present in the six stability captures only. The four cycle captures carry `artifacts.visualGrammar` alone, because the capture snippet extracted nothing else. That scoping is recorded in the parity document and is not a gap this gate can close.

**Currently approved guardrails and `livedWorld.rejects` for both brands.** These live in client storage rather than the repo. They arrive as an owner paste, held under `fixtures/adr-0017-approved-refusals/` and gitignored, per ADR 0004 and the ADR 0016 step 1 precedent. Never committed.

## Authoring rules, fixed before authoring

**Rule A, the inclusion test.** A captured item enters the population when it is refusal shaped, meaning it names something that must not be done or must not appear. Applied to every grammar reject entry in the ten captures, every regenerated guardrail in the six stability captures, every regenerated `livedWorld.rejects` entry in the six stability captures, and every approved guardrail and approved `livedWorld.rejects` entry in the paste.

**Rule B, the exclusion is auditable.** A guardrail carrying no prohibition contributes no entry. Every such guardrail is listed by title in the judgment, so the exclusions can be checked rather than trusted.

**Rule C, status reflects standing today.** An entry whose concern is carried by currently approved material is authored as `active` with an accepted ruling, because it is a rule in force. An entry whose concern appears only in regenerated captures is authored as `proposed`. The fixture then shows exactly what a step 2 diff would surface, rather than flattening the two populations into one approved set.

**Rule D, no schema invention.** The entry shape is the ADR's shape. Where the material does not fit the shape, that is recorded as a finding against the shape. Fields are not added to make the fixture pass.

## Clauses and conditions

**G1, total mapping. Absolute.** Every refusal-shaped captured item maps to exactly one concern entry, or is recorded as genuinely new. Zero items map to two entries. Zero items map to none. A single item requiring two entries to be stated honestly fails the clause, because it means the concern granularity is wrong rather than the wording.

**G2, paraphrase convergence.** The five grammar-reject captures per brand are five draws under the same instruction, so they are the sharpest available test of whether wording varies while concern holds. Two measures, both computed per brand over grammar-reject items only.

- Under-merge test: concern count divided by item count. A ratio at or above 0.75 fails, because almost nothing merged and the concern key is doing no work.
- Convergence test: the share of grammar-reject items landing on a concern that two or more distinct captures reached. Below 0.70 fails.

Both thresholds are set here, before any count exists. G2 failing is the negative result the gate was built to be able to return: the concern split does not hold against real output, and the ADR's design revisits before step 2.

**G3, domain coverage. Reports, does not pass or fail.** Every entry is classified as visual, verbal, or both. Visual means the refusal can be stated in terms a camera can see, which is the ADR's stated discipline for `statement`. Any entry whose honest statement cannot be written in camera-visible terms is named. This clause exists because the approved refusal set includes claim-language and copy-domain protections, and the ADR's entry shape asks for visual terms. Whether that is a scope question or a shape question is not decided here.

**G4, origin honesty.** No entry requires an `ambition` origin to be honest. Every basis is evidence or inference with a `derivedFrom` naming material that actually contains it. The clause has teeth: MycoPop's cycle 1 grammar rejects contain two `ambition`-origin entries, recorded before the cycle 2 rule fixed the instruction. Failure reopens the ADR's origin rule rather than being patched in the fixture.

**G5, placement fidelity under clause S6.** For refusals that are approved and never regenerated, `derivedFrom` names where the refusal actually lives in the approved brain, per the clause S6 resolution. Two known cases are checked by name: Dialog Health's fear-based depiction refusal, and MycoPop's stimulant-culture refusal. An entry claiming derivation from material it does not appear in fails the clause.

**G6, lifecycle round trip. Absolute.** Each fixture document passes through the store's operations in sequence: propose, accept, decline, retire, with a supersession. Conditions: entry count never decreases, no field is dropped, ids are stable across every operation, declined entries remain present and readable, retired entries remain present and readable, and the document round-trips through serialization unchanged in content. Deletion must not exist as an operation. Runs offline against the pure document layer, zero blob calls, zero network.

**G7, the boundary register. Reports, does not pass or fail.** Every pair of captured refusals where a careful reader cannot decide whether the two share a concern is recorded by name with the reason. Step 2's matcher gate needs exactly these cases, and a gate that only records its confident calls hands step 2 a test set with the hard cases removed.

## Decision rule, stated before the work

- G1 or G6 failing fails the gate outright. Both are absolutes.
- G2 failing is a successful gate with a negative result. It is recorded plainly, the fixtures are not adjusted until they pass, and the ADR's concern design revisits before step 2 begins.
- G4 failing reopens the ADR's origin rule and is reported ahead of G3 and G5.
- G3, G5, and G7 report into step 2 regardless of the other outcomes.

## Stated limitations

Two brands and ten captures cannot establish that concern separability holds generally. They can establish whether it holds here, which is the question step 1 is allowed to ask.

The four cycle captures carry no guardrails and no regenerated `livedWorld.rejects`, so the regenerated population for those two channels is six captures rather than ten. Concern coverage drawn from those channels is correspondingly thinner and no clause treats absence there as evidence.

The author of the concern split is also its judge in this session. Nothing in this gate removes that. G7 is the mitigation: boundary calls are named rather than resolved silently, so a second reader can check the ones that were close.

## Judgment

To be written after the fixtures and the store exist, appended below rather than folded into the clauses above.
