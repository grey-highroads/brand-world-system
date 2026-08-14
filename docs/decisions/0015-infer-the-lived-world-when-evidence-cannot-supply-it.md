# ADR 0015: Infer the Lived World when evidence cannot supply it

- Status: Proposed
- Date: 2026-08-14
- Owner: Higher Roads
- Supersedes: Nothing. Extends ADR 0009 (update from an approved baseline) with an epistemic field on artifact entries.
- Related: ADR 0006 (portable generation package), ADR 0010 (route production feedback through candidate rules), ADR 0012 (products as governed records)

## Context

A Mycopop social image review on 2026-08-14 produced a render that read as generic category work. The compiled prompt and both repos were read to find the cause. The render was faithful to its brief, the brief was faithful to the Brand Brain, and the Brand Brain was faithful to its sources. The fault is upstream of all three.

**What the Mycopop Lived World contains.** Every entry under `environments` is justified by the brand's own posting behavior:

> Earned by repeated polished product compositions in the Instagram screenshot.

Five environments, five variations of the same justification. The `patterns` entries fill the `time` field with content-calendar categories rather than times of day: "Launches, product reminders, and campaign beats", "Evergreen world-building". The `social` entries describe the brand's content modes rather than the person's social behavior. The artifact describes Mycopop's marketing output, not a customer's life.

**What Dialog Health's Lived World contains.** The same schema, the same synthesis prompt, the same source count, and a person: "A capable healthcare communicator working under pressure: practical, responsible, and focused on helping people act." The life patterns are temporal, running from days before care through weeks or months later. The emotions are Relief, Confidence, Clarity, Trust, Control.

The synthesis engine is not broken. It is evidence-faithful in both cases.

### Why the two differ

**Verified.** Mycopop's sources are their website and an Instagram screenshot. Both are brand-published material about a product. Dialog Health's website is B2B and describes a buyer, that buyer's workflow, and the stages of a care encounter. It hands the synthesizer a person in the source text.

**Reasoned.** This is a category asymmetry, not a client accident. B2B marketing sites describe the buyer because that is how B2B sells. Consumer packaged goods sites describe the product and its proof points because that is how CPG sells. Emerging CPG is one of two revenue tracks. Every CPG client will produce a Mycopop-shaped Lived World.

### Why the synthesizer filled the gap instead of reporting it

**Verified.** The synthesis instructions in `src/brand-brain/chat-completions-provider.js` already carry the correct rule:

> When evidence is thin or conflicting, create a review question rather than filling the gap.

The schema overrides it. `livedWorld.environments` requires three to six entries, `patterns` three to six, `wants` three to six, `social` two to four. Structured output enforces the schema, so the model cannot follow the instruction and return a valid document at the same time. Handed brand-only evidence and a hard floor of three environments, it produced three environments from the only behavior it could observe.

**Verified.** No instruction anywhere in the synthesis prompt states what the Lived World is about. The only mention is "Build a genuinely useful Brand Dossier, Lived World, and Story Architecture, not short placeholders." The subject is carried entirely by field names and interface headings. Dialog Health came out right because its sources supply a person, not because anything asked for one.

### Why this matters to production

**Verified.** `src/production/package.js` never reads `artifacts.livedWorld`. The render compiler's guidance order is foundation, identity, world, creative, rules, plus dossier palette, materials, and guardrails. The Lived World does not reach the render prompt in any form.

The 2026-08-11 display copy evaluation recorded renders producing invented analytics dashboards and fabricated clinical instructions from a named surgical center. Dialog Health's Lived World lists under `rejects`: "Generic technology spectacle disconnected from healthcare work" and "Fear-based depictions of patients or clinical situations." The guidance existed and never reached the compiler.

So the connection is worth making, and making it today would push Mycopop's current artifact into renders. The connection and the artifact quality are one problem.

### The correction that is not available

Every part of the brain is editable by hand. In practice the artifacts are dense enough that manual correction will not happen at any scale, and an artifact nobody finishes reading is an artifact nobody validates. Hand editing is a repair path, not a product answer.

## Decision

**Lived World entries may be inferred, and inference is recorded as a field rather than implied by wording.**

### 1. Entries carry their epistemic origin

Each entry in `environments`, `patterns`, and `social` gains a basis describing whether it rests on supplied evidence or on reasoning, what it was derived from, and a confidence value drawn from the existing High, Medium, Low vocabulary. The shape mirrors the existing `earned` field, so the interface presents inference the way it already presents evidence.

The compiler already treats epistemic origin, confidence, and provenance as fields that are never derived from one another, per `docs/production-compiler.md`. This extends that discipline to a live artifact that currently lacks it.

### 2. Inference reasons at two layers

The broad layer draws on category knowledge to establish the audience a product of this kind serves. The narrow layer reasons from the client's own supplied facts to identify the tighter segment inside it. The layers are nested rather than exclusive.

Each inferred entry names the specific brand-side facts the narrowing rests on. Caffeine-free formulation, Appalachian sourcing, a slim can at a premium shelf position, and mushroom-led positioning imply things about a buyer, and the implication is specific to this brand.

**The narrow layer governs production.** The broad layer is by construction the layer every competitor in the category would also receive, so a render drawing primarily on it reproduces the generic output this ADR exists to prevent.

### 3. Inference surfaces in review

Inferred personas and environments become review questions. `reviewQuestion` already carries `confidence`, an evidence array with label, reference, and quote, `method`, `rationale`, and two to five actions. It is a confidence-labeled, evidence-backed, actionable conclusion with choices attached.

The `type` enum gains a value for this class. Routing inference to an existing surface avoids building a second review pattern that competes with the first.

### 4. Evidence attaches to inference rather than replacing it

A later source that touches an inferred entry is recorded alongside it. One customer review does not overturn a persona, and no automatic threshold promotes an inference to evidenced.

Confirmation in review is the only thing that changes the label, which makes a person the promotion gate. This matches the existing separation between approving an output, approving guidance, and promoting to canon.

### 5. The scene writer weighs basis alongside its other inputs

Basis becomes one input among product type, campaign context, and placement rather than a global weighting rule. Scene options may differ in what they lean on, which is what the three-option structure is for. This requires the scene writer to receive the basis field, which today does not exist.

### 6. The label survives to the compiled prompt and the result screen

An inferred persona that shapes a render must be visible as inferred wherever that render is inspected. A compiled prompt presenting reasoning as settled brand fact is the failure this ADR is designed to prevent, reproduced one layer down.

## Options considered

**Anchor the subject in the synthesis prompt and change nothing else.** Rejected. The schema minimums remain, so the model must still produce three to six environments. Pushed toward people without evidence about people, it invents an audience instead of describing posts. That output is more plausible, less falsifiable, and carries no traceable source. The current Mycopop artifact is wrong and legible, which is how the fault was found in minutes. This option trades a visible failure for an invisible one.

**Relax the schema minimums to zero and let the artifact come back thin.** Rejected for now, though it remains the honest fallback. It surfaces a real gap to the client at onboarding, which has product value. It also means some brains ship visibly incomplete, and it changes what onboarding promises without offering the client a way forward. Revisit if inference quality proves poor.

**Add a customer-evidence intake slot and require it.** Deferred by the owner on 2026-08-14. The seven current slots are website, logo, brand guide, templates, Instagram, LinkedIn, and recent work, all of which are brand-published material. A slot for reviews, support tickets, or community posts is what would make inference improvable rather than permanent. It is not on the critical path once inference exists, and it is the natural follow-on.

**Import PWP's thesis and art-director stages wholesale.** Rejected. `docs/product-thesis.md` records that combining world-building, production, fidelity, and quality assurance in one workflow made PWP prompt-heavy and hard to debug. ADR 0013's revision names PWP as the over-prescription failure mode the project has already learned from. Those positions stand.

## Consequences

The schema gains a field on three artifact arrays, which is a brain version bump and requires re-synthesis for existing clients to benefit.

Mycopop's brain does not improve through re-synthesis alone until inference exists, and improves further only when customer evidence is supplied.

Dialog Health's Lived World should re-synthesize substantially unchanged, since its entries rest on evidence. That is the regression check.

The render compiler gains a Lived World section, which changes compiled prompts for every image job. Parity testing across placement shapes applies, following the pattern established for the ADR 0014 copy contract after the 2026-08-09 regression.

## Sequencing

1. Schema field and its interface presentation, with no synthesis change. Existing artifacts read as evidenced.
2. Synthesis subject anchor plus inference permission. Regression check: Dialog Health re-synthesizes with its entries still marked as evidenced. Mycopop re-synthesizes with a person rather than a content calendar.
3. Review question type and the inference review surface.
4. Render compiler connection, gated on step two passing.

Step two gates step four. Connecting the Lived World before inference lands would push the current Mycopop artifact into renders.

## Risks

**Inference quality is unmeasured.** Nothing here establishes that a reasoned persona is better than no persona. The Dialog Health regression check tests that evidence still wins, not that inference is good. Real measurement needs client volume and a second CPG brand.

**The broad layer can dominate.** If category reasoning outweighs brand-fact narrowing, the system produces the category's audience for every client in that category. This is the generic-output failure returning through a new door, and it is the specific thing to watch on the first CPG re-synthesis.

**The label can stop at the brain.** Rule 1 of this project requires that inferred claims about how a business works are labeled as inferred. Building that behavior into the product means the label has to reach the compiled prompt and the result screen, not only the brain interface. Cheap to get right at build time and expensive to retrofit.
