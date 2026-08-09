# ADR 0013: Govern copy through derived claims and a copy audit

- Status: Proposed
- Date: 2026-08-09
- Owner: Higher Roads
- Supersedes: Nothing
- Related: ADR 0012 (products as governed records), ADR 0003 (compile and snapshot production policy), ADR 0010 (route feedback through candidate rules)

## Context

The system governs visual production through compiled prompts, constraint audits, protection blocks, and locked asset handling. Copy is ungoverned. The LinkedIn generate-copy endpoint pulls voice and rules from the brain and builds a system prompt, but it never checks its output against an approved or prohibited claims list. The studio caption field accepts free text with no validation. A generated post that invents a health claim, drops a required disclosure, or contradicts a product's approved language ships without detection.

For a regulated healthcare client like Dialog Health, an unapproved claim or a missing disclosure is the real risk surface, more than any visual error. Copy governance is the text analogue of `auditConstraints`: check what was produced against what the brand actually permits.

Three findings from the current codebase shape this decision.

**First, claims already live in three disconnected places.** Product records carry `approved_claim_language` per feature and per-product `exclusions`. The brain's `rules` guidance section carries prose rules. The brain's `dossier.guardrails` carry structured title/body pairs that `auditConstraints` checks against the image prompt. None of these is a queryable approved/prohibited claims list, and no copy path checks output against any of them.

**Second, the product record's evidence-fidelity discipline transfers directly.** ADR 0012's evaluation proved that per-product synthesis preserves verbatim claim language (seven-for-seven against the Dialog Health RCS deck) and correctly distinguishes stated from inferred content. The same discipline applies to copy governance: approved language must be exact, prohibited language must be enforced, and the system must surface findings rather than silently passing.

**Third, the brain document cannot absorb a growing claims list.** The same incremental-synthesis scaling wall that pushed products out of the brain (ADR 0012) applies to claims. A variable-length approved-claims list inside the brain document would require every re-synthesis to reproduce every prior claim verbatim. Cost grows with the list, and the model's paraphrase risk on exact claim language is the highest-stakes failure mode in copy governance.

## Decision

Copy governance uses a **derived claims model**: the set of governed claims for any production job is assembled at compilation time from two sources, not stored as a third parallel entity catalog.

**Source one: brand-level claims document.** A thin per-client JSON document stored alongside the brain and product records, namespaced per ADR 0011. It carries three lists: approved claims (brand-wide assertions the brand has cleared for use), prohibited claims (assertions production must never make), and required disclosures (statements that must appear when certain content types are produced). Each entry carries verbatim text, scope (brand-wide, channel, campaign), a source reference, an added-on date, and the identity of the person who added it. If an entry is revised, the prior version is retained with a superseded-on date. The document itself carries a version number bumped on any edit, matching the versioning discipline on product records. This document is authored by humans (from brand guides, legal review, regulatory requirements), not synthesized from sources. It is reviewed and approved through the existing "approve guidance" action.

**Source two: approved product records.** Each approved product record's `approved_claim_language` entries and `exclusions` entries flow into the claims set for any job scoped to that product. No duplication, no sync mechanism. The product record is the source of truth for product-scoped claims. If a product record's approval is cleared (after re-synthesis or revision), its claims exit the derived set automatically.

**Assembly at compilation time.** When a production job compiles its generation package, the compiler assembles the governing claims set: all entries from the brand-level claims document whose scope matches the job, plus all entries from the job's product record (if any). The assembled set is included in the generation package for audit and prompt steering. Assembly is a union of two reads, not a transformation. Nothing is paraphrased, merged, or reconciled during assembly.

**Copy audit at production time.** When copy is generated or entered, the system checks it against the assembled claims set. The audit uses the model itself to detect claim-like sentences in the output (assertions of benefit, capability, statistic, comparative, or regulatory property) and checks each detected claim against the approved and prohibited lists. The audit surfaces findings in the same shape as existing constraint audit findings: specific sentence, finding type, and the governing rule. Generated copy additionally receives prompt-level steering: the approved claims and prohibitions are included in the system prompt so the model avoids prohibited claims at generation time. Entered copy receives only the post-hoc audit.

**Approved claims are a safe harbor, not the only permitted language.** The prohibited list is a hard stop: any detected claim that matches a prohibited entry is flagged as a violation. The approved list works differently. A detected claim that matches an approved entry passes cleanly. A detected claim that matches neither list is flagged as "unapproved claim, review recommended," not as a violation. This is an advisory finding, not a blocker. Marketers write new true sentences all the time; treating every novel sentence as a violation would train reviewers to dismiss findings, and a dismissed-by-habit audit is worse than no audit because it manufactures false confidence. The prohibited list blocks. The approved list reassures. The gap between them surfaces work for the reviewer.

**Disclosures check presence, not correctness.** Each required disclosure entry in the brand-level document names its own trigger scope (for example, "appears on any paid ad" or "appears when RCS is mentioned"). The system checks whether the job's scope matches the disclosure's trigger scope, then checks whether the disclosure string is present in the output. Trigger scope is manually authored on each disclosure entry, not inferred by the system. Claim-to-disclosure correctness mapping (checking that the right disclosure accompanies the right claim) is deferred until the data entry burden proves worthwhile.

**Scope resolution extends the existing applicability resolver.** The applicability model from roadmap item 3 currently checks channel and placement. Copy governance extends it to also check product and campaign scope, which benefits both image and copy governance. This is the forcing function for the scope-resolution work that item 3 deferred.

## Why derived, not a dedicated store

A dedicated claims store (option two from the scoping discussion) would version claims independently and avoid the assembly step. But it creates a worse problem: two sources of truth for the same claim. A product record's `approved_claim_language` and a claims-store entry for the same claim would need a sync mechanism. If sync breaks or lags, production could enforce a stale version of a claim while the product record carries the current one. The derived model avoids this entirely: the product record is always authoritative for its own claims, and the brand-level document is always authoritative for brand-wide claims. No sync, no conflict, no reconciliation.

The assembly seam (a union of two reads) is the simplest possible aggregation. A claim is either in the union or it is not. The failure mode (assembly silently drops a claim) would require a bug in list concatenation, which is lower-probability than a sync mechanism falling out of date.

## Why not inside the brain document

The same argument as ADR 0012. A variable-length claims list in the brain document means every incremental re-synthesis reproduces every prior claim verbatim. Paraphrase risk on exact claim language is the highest-cost failure mode in copy governance, higher even than in product synthesis, because claims flow directly into regulated copy that carries commercial and legal exposure. The brain document is the wrong container for growing, exact-text data.

## Consequences

**Gained.** Copy production draws on governed claims instead of model invention. Product claims and brand claims share one audit mechanism without duplicating data. The applicability resolver gains product and campaign scope, closing the most common gap from roadmap item 3. The generate-copy endpoint becomes the first governed copy path.

**Accepted costs.** A brand-level claims document to create and maintain per client (thin, human-authored, not synthesized). An assembly step at compilation time (a union of two reads). The model-based claim detection in the audit introduces a judgment boundary: it may over-detect (flagging descriptive sentences as claims) or under-detect (missing implied claims). The prototype must evaluate this boundary before the schema is committed.

**Deferred.** Claim-to-disclosure correctness mapping. Ad copy governance (the ad flow does not generate copy yet). Automatic extraction of claims from existing marketing materials. Candidate-rule promotion of audit findings into the claims document (the ADR 0010 pattern applies but the mechanism is not built in this slice).

**Risks.** Claim detection quality is the make-or-break, the same way product synthesis quality was for ADR 0012. The false-positive direction is the more dangerous failure: if the audit over-flags descriptive copy as unapproved claims, reviewers learn to dismiss findings, and a dismissed-by-habit audit is worse than no audit. The prototype carries explicit pass criteria (see sequencing step 1) including a false-positive ceiling. Second risk: the brand-level claims document could grow unwieldy without curation. The document should carry a standing note that it is a curated list of consequential claims, not a transcript of everything the brand has ever said.

## Sequencing

1. **Prototype the copy audit** against real Dialog Health generated copy. Generate several LinkedIn posts from the existing endpoint. Hand-label every sentence in the output as claim or not-claim, and cross-reference each claim against the product record's approved claims and exclusions. Run the claim-detection model against the same output and compare. The prototype passes when: (a) every prohibited-list match is correctly flagged (zero false negatives on prohibitions), (b) every approved-list match passes cleanly (zero false negatives on safe harbor), (c) false positives (descriptive sentences flagged as claims) stay below 20% of total sentences, and (d) the advisory "unapproved claim, review recommended" findings are actionable rather than noise. If (c) fails, the detection heuristic needs tuning before the schema is committed. If (d) fails, the safe-harbor model may be too strict and the boundary between claim and description needs recalibration. No schema commitment until this passes.
2. **Brand-level claims document schema and store**, namespaced per client, thin and human-authored. Three sections: approved, prohibited, disclosures. Each entry carries text, scope, source reference, and date.
3. **Assembly function in the compiler.** Union of brand-level claims (scope-matched) and product claims (product-matched). Included in the generation package.
4. **Copy audit wired to generate-copy.** Prompt-level steering (claims and prohibitions in the system prompt) plus post-hoc audit on the output. Findings surfaced in the response.
5. **Applicability resolver extended** to handle product and campaign scope alongside channel and placement.
6. **Copy audit surfaced in preflight and evaluation** for image+copy production flows (social image with caption, future ad copy).

## Options considered

- Store claims inside the brain document as a new structured section (rejected: incremental-synthesis scaling wall, paraphrase risk on exact claim language).
- Store claims as their own governed entity catalog, versioned independently (rejected: creates two sources of truth for product-scoped claims, requires sync mechanism).
- Derive claims from product records plus a thin brand-level document at compilation time (accepted: single source of truth per scope, simplest assembly, no sync).
