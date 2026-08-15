# ADR 0016 step 1: two-fixture visual grammar prototype

- Date opened: 2026-08-15
- ADR: [0016](decisions/0016-articulate-visual-grammar-and-evaluate-renders-against-it.md), step 1
- Status: **Incomplete. Fixtures authored, captures not yet run.** The gates are unjudged.
- Repo commit fixtures were authored against: `5cb49281f549a6fdf38ca5b980ef224741b582cc`
- Gate authority: the owner. This document produces evidence and a recommendation. It does not rule.

---

## What this document is

ADR 0016 step 1 hand-authors visual grammar for two clients, feeds each to the scene writer in place of the identity and creative guidance, and judges the resulting suggestion sets against two gates that test opposite failure directions. Mycopop tests expressiveness. Dialog Health tests restraint.

This session authored both fixtures and built the capture harness. The twelve capture runs have not happened. Section 3 records why, section 6 holds the empty tables they fill, and sections 7 through 9 hold the conclusions that authoring alone could reach.

**Nothing here marks step 1 complete.**

---

## 1. Prerequisite check: the pipeline contract against the code

ADR 0016 sequencing makes `docs/image-pipeline-contract.md` mandatory reading and blocks implementation until that document is verified against the current commit. The session's stop-and-flag rule requires that any divergence between the contract's stage 6 and the live input assembly be recorded as a finding before proceeding.

**Verified: no divergence.** Stage 6 was checked line citation by line citation against `api/production/generate-copy.js` at `5cb4928`.

| Contract claim | Code at head | Result |
| --- | --- | --- |
| `BRAND:` line | L336 | matches |
| `WORLD:` summary plus principles | L338 | matches |
| `IDENTITY:` summary plus principles | L342 | matches, including the post-`1a9357e` principles |
| `CREATIVE DIRECTION:` summary plus principles | L346 | matches |
| `EARNED ENVIRONMENTS:` name plus earned | L351 | matches |
| `PERSON AT THE CENTER:` string or 600 char JSON slice | L355 | matches |
| `DESIRED FEELING:`, `MATERIALS AND LIGHT:`, `PALETTE:` | L358 to L360 | matches |
| `RULES AND GUARDRAILS:` summary plus guardrails | L362 | matches |
| `CAMPAIGN:` | L366 | matches |
| `PRODUCT:` and `PRODUCT EXCLUSIONS:` | L370 to L371 | matches |
| Model `gpt-4o`, temperature 0.9 | L445, L451 | matches |
| `max_tokens` 2200 for scene, 800 otherwise | L450 | matches |
| Options sliced to at most three | L463 | matches |

The contract is accurate at this commit and is load-bearing for the rest of this work.

---

## 2. The harness

`fixtures/adr-0016-step1-harness.mjs`. **Temporary prototype tooling, named here as a harness per the session's hard rules.** It is not product code and is scheduled for deletion when ADR 0016 step 4 lands.

### Why it duplicates rather than imports

`handleSceneBrief` is not exported. `api/production/generate-copy.js` exports only the default handler at L10. The ADR 0013 mechanism test could import `auditCopyAgainstClaims` because that function lives in `src/claims/`; the scene writer has no equivalent, because the 12-function Vercel Hobby ceiling forced it inline inside the copy endpoint.

Three harness shapes were available. Extracting the scene writer into `src/` is cleanest and violates this session's requirement that the live compile path stay byte-identical, and the owner deferred that extraction to ADR 0016 step 4, which rewrites the assembly anyway. Calling the deployed endpoint cannot inject a grammar in place of the identity and creative lines, because the endpoint takes no such parameter. Duplication is what remains.

### The drift tripwire

Duplication risks the harness testing something other than the live path. The owner's ruling: drift disclosed in a findings doc is a risk, drift that halts the harness is not.

Before any model call the harness pulls `handleSceneBrief` from `main` through the Git Data API, hashes it, and compares against a pinned value. A mismatch prints both hashes and both commits, then exits non-zero. It does not warn and continue.

- Pinned commit: `5cb49281f549a6fdf38ca5b980ef224741b582cc`
- Pinned sha256 over the full function: `db81c0e89e42b24647266c52ece9d8442e1d9c0b241e5924fe86d88a61c5c44d`
- Read path: `git/refs` to `git/commits` to `git/trees` to `git/blobs`, chosen over the contents raw endpoint because that endpoint caches and can report a stale match

**Verified** by test: with the correct hash the tripwire passes and the run proceeds; with a deliberately corrupted hash it halts before any model call.

### Faithfulness of the copy

The tripwire proves the live side has not moved. It cannot prove the copy is correct, so the two were diffed line by line. Every difference is accounted for:

- The function signature and the `sendJson` call, replaced by a return that also carries the assembled prompts
- The identity and creative blocks, nested one level deeper inside the mode branch, with string content byte-identical
- The grammar swap point
- The `template_surface` and `sales_element` kinds, dropped because the harness only runs `scene`. With `body.kind` fixed to `scene` the selector resolves identically

**Verified:** zero unaccounted differences.

### Held constant across all twelve runs

Placement is a 1:1 social post with the same composition craft string, no campaign, no hint, and one approved product record per client. The swapped context is the only variable. **Reasoned:** running with no product would test a thinner assembly than real jobs use, since the live path pushes `PRODUCT:` and `PRODUCT EXCLUSIONS:` lines carrying `visual_direction` and exclusions, and over-prescription pressure is higher with a visual direction present.

Products selected, to be confirmed by the owner at capture time:

- **Mycopop: Mycopop Original.** The flagship beverage and the product the 8-bit ambition would actually be applied to. The alternative in the brain's source list is a T-shirt, which is merchandise and would not exercise the beverage grammar.
- **Dialog Health: Analytics Pro.** Chosen over RCS deliberately. The brain flags the RCS experience as emerging rather than established, and its supporting deck is the most stylized material Dialog Health has. Running the restraint gate against it would confound the grammar's effect with the product's own caveat. Any escalation in the Analytics Pro sets is unambiguously the grammar's doing.

---

## 3. Why the captures are not in this document

The session was run in an environment whose egress allowlist excludes `api.openai.com` and the deployed application. Both return 403 at the proxy with `x-deny-reason: host_not_allowed`. The scene writer cannot be called and the brains cannot be fetched from the running app.

Consequences and how each was handled:

- **Brains.** Supplied by the owner as exported state payloads rather than fetched. Both carry `approvedResult`, `sources`, and brain metadata, so the fixtures are authored from actual brain content as the session requires. Provenance is recorded per fixture in `authoredFrom`.
- **Product records.** Not present in the brain payload; they live in the product store. The harness therefore reads a product record from `fixtures/adr-0016-step1-products/<client>.json` and refuses to run without one, and refuses again if the record carries no `approved_at`, matching the live path's 409.
- **Captures.** Deferred to the owner, running locally with the key as an environment variable. Baselines included, so capture mechanics are identical on both sides of the comparison.

**This is a methodology note, not a gate result.** The gates remain unjudged.

---

## 4. Commands the owner runs

From the repo root, with the key in the environment. Twelve sets total, three per cell.

```
export OPENAI_API_KEY=sk-...
export GITHUB_TOKEN=ghp_...

node fixtures/adr-0016-step1-harness.mjs --client mycopop       --mode baseline --sets 3
node fixtures/adr-0016-step1-harness.mjs --client mycopop       --mode grammar  --sets 3
node fixtures/adr-0016-step1-harness.mjs --client dialog-health --mode baseline --sets 3
node fixtures/adr-0016-step1-harness.mjs --client dialog-health --mode grammar  --sets 3
```

`GITHUB_TOKEN` is required. Without it the tripwire cannot verify the harness against the live path and the run is refused.

Before the first command, place four local files. **All four are gitignored and none of them belong in the repo,** per the ADR 0004 separation of shared platform and private brand data.

```
fixtures/adr-0016-step1-brains/mycopop.json
fixtures/adr-0016-step1-brains/dialog-health.json
fixtures/adr-0016-step1-products/mycopop.json
fixtures/adr-0016-step1-products/dialog-health.json
```

Each brain file is the `approvedResult` object alone, not the whole saved state wrapper. Each product record needs `product_name`, `one_true_thing`, `visual_direction`, `exclusions`, `images`, and `approved_at`.

Captures land in `fixtures/adr-0016-step1-captures/`, which is gitignored for the same reason. Paste the contents back into the session rather than committing them.

### Output shape

Each run writes `fixtures/adr-0016-step1-captures/<client>-<mode>.json`:

```
{
  "harness": "fixtures/adr-0016-step1-harness.mjs",
  "client": "mycopop",
  "mode": "baseline",
  "capturedAt": "...",
  "tripwire": { "builtAgainstCommit": "...", "liveHeadAtCapture": "...", "sceneWriterSha256": "..." },
  "requestBody": { ... },
  "product": { "name": "...", "approvedAt": "..." },
  "grammarFixture": { ... } or null,
  "sets": [
    {
      "set": 1,
      "options": [ { "label", "brief", "composition", "lighting", "props" } x3 ],
      "drewOn": [ ... ],
      "systemPrompt": "...",
      "userPrompt": "...",
      "rawResponse": "..."
    }
  ]
}
```

Paste all four files back whole. The `systemPrompt` matters as much as the options: the per-clause judgment in section 6 cites which grammar statement a suggestion did or did not reach, and that citation is only checkable against what was actually sent.

---

## 5. The fixtures

`fixtures/adr-0016-step1-grammar/mycopop.json` and `fixtures/adr-0016-step1-grammar/dialog-health.json`. Six sections each, every entry carrying `basis` with `origin`, `confidence`, and `derivedFrom`.

| Section | Mycopop entries | Dialog Health entries |
| --- | --- | --- |
| people | 5 | 4 |
| objects | 4 | 5 |
| places | 5 | 4 |
| light | 4 | 2 |
| camera | 7 | 7 |
| rejects | 7 | 6 |

Origin distribution:

| Origin | Mycopop | Dialog Health |
| --- | --- | --- |
| evidence | 16 | 14 |
| inference | 12 | 14 |
| ambition | 4 | 0 |

The asymmetry is the point. Mycopop has a declared outside inspiration with strong influence; Dialog Health has none, and a Dialog Health fixture containing an ambition entry would be the over-prescription failure happening in the author's hands.

---

## 6. Gate judgment

**Not yet performed.** Filled after the captures arrive.

### 6.1 Baseline sets, verbatim

Mycopop baseline, sets 1 to 3, captured at commit `_____`:

> _pending_

Dialog Health baseline, sets 1 to 3, captured at commit `_____`:

> _pending_

### 6.2 Grammar-fed sets, verbatim

Mycopop grammar, sets 1 to 3:

> _pending_

Dialog Health grammar, sets 1 to 3:

> _pending_

### 6.3 Mycopop gate: expressiveness

Judged per clause, each with cited lines from the sets above. A clause that cannot be cited line by line is unjudged rather than passed.

| Clause | Judgment | Citation |
| --- | --- | --- |
| Scenes reach the declared territory as the brand's own version | _pending_ | |
| No readable third-party identity | _pending_ | |
| Composition carries stated settings rather than register adjectives | _pending_ | |
| Lighting carries stated settings rather than register adjectives | _pending_ | |
| Holds across at least three consecutive sets | _pending_ | |

### 6.4 Dialog Health gate: restraint

| Clause | Judgment | Citation |
| --- | --- | --- |
| Sets stay evidenced | _pending_ | |
| Sets stay unsurprising | _pending_ | |
| No louder or more stylized than the brand's materials support, against baseline | _pending_ | |
| Holds across at least three consecutive sets | _pending_ | |

---

## 7. Section shape conclusions from authoring

These come from authoring both fixtures against real brain content. They are provisional until the captures test whether the shape survives contact with the scene writer.

**The six sections all earned entries on both brands.** No section came back empty. **Verified** by authoring: every section has at least two entries in both fixtures. The thinnest cell is Dialog Health light at two entries, and that thinness is honest rather than a shape failure.

**`basis` per entry is the right granularity, not per section.** Within one section origins mix freely. Mycopop's light section holds an evidence entry about daylight, an ambition entry about CRT practical light, and a low-confidence inference about interior work light. A section-level label would have flattened all three. **Verified** by authoring.

**Lived World environments are journey moments, not rooms, so places cannot copy them across.** Dialog Health's six environments name what happens (before an appointment, the operations console, re-entry into care) without naming a physical space. Rendering them into the grammar's places section required inferring rooms, which is why three of Dialog Health's four places entries are inference. Mycopop's environments are closer to places already because they name desks, trailheads, and porches. **Reasoned:** synthesis in step 3 should treat environments as an input to places rather than as places, and the schema should not assume a one-to-one mapping.

**The camera section needs an explicit shorthand-resolution entry, not just a register rule in the prose.** Both fixtures carry a final camera entry stating that any register word resolves to the settings above or does not appear. **Reasoned:** without it the register rule lives only in the ADR and reaches nothing at job time. Whether it belongs as an entry or as a section-level property is a schema question for step 2, and the captures should show which by revealing whether register adjectives still surface.

**A section-level evidence note may be needed.** Dialog Health's light and camera sections are thin because its identity guidance explicitly lists photography as undocumented. The fixture carries that as an `authoringConstraint` string at the top level, which is a blunt instrument. **Assumed, requires verification:** a per-section note explaining thinness would serve the review surface better than a document-level one. The captures will not settle this; the brain interface work in step 2 will.

**What the fixtures proved unnecessary:** no entry needed a weight, priority, or ordering field. Compile order followed section order and nothing wanted to jump. **Reasoned:** ADR 0016 already states that origin never sets compile weight, and authoring produced no case that argued otherwise.

---

## 8. Ambition origin observations

Step 1 is meant to settle whether `ambition` is a third origin value or a flag on `inference`.

**Ambition is a distinct origin, not a flag on inference. Reasoned, pending the captures.** An inference entry rests on brand facts and reasons forward from them. Mycopop's wardrobe entry infers everyday worn clothing from the person description. An ambition entry rests on a source that is explicitly not about the brand as it stands: the 8-bit intake source carries `provenance: emulate`, `aspiration: aspiration`, and `influence: Strong`. Collapsing the two would let a declared outside direction read as a reasoned conclusion about the brand today, which is the exact honesty failure the basis field exists to prevent.

**The intake trigger is real and already present. Verified** in the supplied source list. Mycopop's 8-bit source carries emulate, aspiration, and Strong influence with the usage note describing retro and tech affinity. A second source, the Odyssey competitor screenshot, carries emulate, aspiration, and Light influence. Nothing needed to be invented to fire the ambition trigger.

**Influence maps onto reach, and the two Mycopop sources demonstrate the difference. Reasoned.** The Strong 8-bit source shaped four entries across four sections: people wardrobe, objects era, places materials, light behavior. The Light Odyssey source shaped none directly, and its contribution surfaces only as an existing guardrail against copying its executions. That distribution matches the ADR's stated rule that lead can set the frame for whole sections while light earns an entry rather than a takeover. It was not engineered to match; it fell out of what the sources actually support.

**The palette gave ambition its cleanest traceability.** The brain's own palette carries Arcade Black at `#101010` with the role text recording it as suggested by the 8-bit reference, directional rather than approved. That entry let the ambition light statement point at brand-held data rather than at the raw intake source. **Verified** in the Mycopop dossier palette.

**Substitution was authorable without crossing into reproduction, on paper.** The four ambition entries describe period physical material: yellowed beige plastic, ribbed vents, worn keycaps, curved CRT glass, wood veneer paneling, low pile carpet, nylon windbreakers with color blocking. None names a manufacturer, title, character, or cabinet. The seventh Mycopop reject exists to guard the same line from the other side by prohibiting pixel overlays and scanline filters laid on a photograph. **Whether this survives the scene writer is exactly what the Mycopop gate tests, and it is unmeasured.**

**One observation cuts against the ADR's framing.** ADR 0016 records that every usable Mycopop identity statement describes retro gaming as a graphic system of icons, frames, motion, and data display, giving the scene writer no account of people, wardrobe, rooms, or era. **Verified** at head: the identity principle reads "develop proprietary pixel icons, interface frames, and motion rules," and the creative principle reads "use original retro-game devices as framing, transitions, motion, navigation, or data display." Authoring the physical version required going past both, to the intake source's usage note and the palette's directional entry. **Reasoned:** the substitution rule in ADR 0016 part 2 is therefore doing real work rather than restating existing guidance, and synthesis in step 3 cannot derive the physical world from the approved guidance sections alone. It has to reach the source.

---

## 9. Other findings from this session

**Finding: the Dialog Health brain predates the ADR 0015 basis field.** **Verified.** Saved 2026-08-09 at approved version 2, its six Lived World environments carry `earned` justifications and no `basis` object. Mycopop, saved 2026-08-14 at version 1, carries basis on all four. Assigning origins while authoring the Dialog Health fixture therefore meant reading intent out of `earned` prose, and that reading is itself an inference. Consequence for step 3: grammar synthesis on a pre-basis brain has less to inherit than on a post-basis one, and the regression check should not assume parity between the two clients.

**Finding: the scene writer is not independently testable.** Recorded in section 2. It is a consequence of the function ceiling rather than a defect in the scene writer, and step 4 resolves it incidentally. Recorded so the cost is visible when the ceiling is next discussed.

**Finding: brain export and import does not exist.** This session needed both brains in a working context and the only route was a manual copy. Added to `docs/deferred-work.md` under Incomplete paths, with export framed as near-term and import framed as carrying a governance decision that imported content arrives as candidate rather than approved.

---

## 10. Recommendation

**Withheld. There is no evidence to recommend from.**

The honest position at the close of this session: the fixtures are authored, the harness is built and its tripwire is proven in both directions, the contract prerequisite is verified, and zero suggestion sets have been captured. Section 8's conclusions on the ambition origin rest on authoring rather than on output, and a fixture that reads well is not a fixture that works.

The recommendation goes here once sections 6.1 through 6.4 are filled, and it will be one of: proceed to step 2, iterate the fixtures, or a finding that changes the ADR. If either gate fails, that is a successful prototype with a negative result and it gets recorded plainly.

**Step 1 is not complete and this document does not mark it complete.**
