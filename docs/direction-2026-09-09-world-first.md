# Direction of record: world first

> Status: Current. This is the governing direction as of 2026-09-09. It supersedes the product thesis, the primer, the success criteria, and the roadmap, each of which now carries a status line pointing here. It was written as a session handoff and is kept in `docs/` rather than `docs/handoffs/` because it is a standing document rather than an archived one.

- Date: 2026-09-09
- Owner: Grey, Higher Roads
- Purpose: give a fresh session everything it needs to continue without re-deriving the last two months

## Read this first

Two assumptions will lead you wrong if you inherit them from the repository's own process documents.

**The design sprint is over in practice and still marked active on paper.** `roadmap.md` Phase 3 says the whole-product design sprint is active, and `docs/experience/design-sprint-brief.md` still carries "Status: Active mandate." Both are contradicted by the same repository. The roadmap's status appendix is dated 2026-08-09, and every ADR and finding since then is render pipeline work. Screens are not the current problem.

**The system is deployed with live client brands.** This is not a pre-implementation exercise. There is a hosted studio, serverless routes, a production compiler under versioned schema contracts, two render engines, eighteen decision records, an evaluations directory, an incidents directory, and a deferred-work register with roughly thirty open items.

The repository is canon at `github.com/grey-highroads/brand-world-system`. Fetch live. Do not work from copies, including the files loaded into a Claude project, which lag the repository by weeks.

## The direction change

For most of 2026 the working assumption was that governance is what makes BWS valuable: provenance, authority, approval, prohibitions, compiled protections, and eventually an enforcement contract with compile receipts and blocking preflight.

That assumption was retired on 2026-09-09 for two reasons.

**No market evidence.** Nobody produced any showing that a buyer pays for claims governance. It is insurance, and insurance does not open a meeting.

**The build history says otherwise.** Rules have been the single thing the team has had to unwind to get usable output. An audit of the compiled MycoPop prompt found roughly 2,610 words, 49 percent prohibitions and protections, and 44 occurrences of "do not." A hand-written 180-word prompt outperformed a 22,571-character compiled one. The subtraction work of August and September was not a regression to repair. It was the system discovering that compiling rules into the instruction was the wrong approach.

The repository already said this. The README states that governance is the practical half and not the defensible half, that locking assets is table stakes, and that neither is hard to copy.

## What the product is

BWS authors the lived customer world a brand can grow into: particular people, meaningful moments, physical environments, and a visual language built from brand truth plus declared aspiration.

Brand lives in the customer's lived experience and the product meets them there. High-level brand thinkers have always known this. The opportunity is to make that discipline repeatable with technology. Not design tokens. Moments that carry the emotional connection people form with a brand.

**Do not claim that nobody else builds brand worlds.** Infinite Studios, Trained to Imagine, and Cinemora all sell that phrase, and Jasper, Typeface, and Adobe are heavily invested in brand consistency at scale. The wedge is the kind of world and the fact that it persists across campaigns, not the term.

Kantar and Ipsos research validates that emotional connection drives effectiveness and that AI advertising underperforms on exactly that axis. That is problem validation for the whole category, including the competitors above. It does not distinguish BWS from them. Do not present it as if it does.

## The clients

**MycoPop.** Emerging CPG. Wants a brand system that is retro, adjacent to wellness without being a wellness product, fun, and aimed at the Red Bull audience without caffeine. All of it exists as ideas. None of it exists as assets or systems, and they have no mechanism to change that. This is the flagship case, because its world has to be authored rather than observed. ADR 0015 documented why: its lived world came back describing its own Instagram posting behavior, because a website and a screenshot were the only evidence available.

**Simply Agree.** Recently rebranded. Professional, generic, and they can feel something visual missing. Curious whether a richer world could surround the identity work they just completed. This is the transfer case, and it is the most important one structurally. If Simply Agree comes out coherent and owing nothing to MycoPop's personality, there is a system rather than one good art direction project.

**Dialog Health.** Wants marketing orchestration and automation: campaigns, channel decisions, distribution, tapping their knowledge base. That is a different product. Grey has ruled they are not a current prospect. This is settled, not open for reconsideration.

## What is retired

Not deleted from the codebase, and not roadmap priorities:

- the enforcement contract, compile receipts, and process-compliance machinery
- blocking image preflight
- the mechanism-disclosure taxonomy
- a brand-compliance benchmark
- DESIGN.md import or export, and competitor interoperability generally
- deterministic composition as an immediate platform project
- generalized evaluation infrastructure
- a third renderer, orchestration, distribution, broad UI redesign, RBAC and SSO

Claims, prohibited claims, disclosures, scoped copy audits, and human approval stay alive where regulation is real, meaning MycoPop copy and healthcare copy. Treat that as a workflow requirement rather than the product's differentiator.

## What is true versus what is claimed

The public README overstated several capabilities. A corrected version accompanies this handoff. The corrections, so a fresh session does not re-derive them:

- **Protected assets are not composited.** The live path supplies the approved asset as a reference to a generative edit, and fidelity rests on human review. A separate place-on-background path does browser compositing, and the model can still return the complete image afterward. Deterministic overlay after all generative work, with checks on the final artifact, does not exist. The old README claimed the opposite in two places.
- **Refusals do not compile.** They are governed records with human rulings, per ADR 0017, and `rejectsDirection` has been uncalled since 2026-08-31. The world block stopped compiling the same day.
- **ADR 0018's scene-relevance filtering describes intent, not current behavior.** The subtraction work overtook it. Do not read an accepted ADR as running code.
- **Image evaluation does not exist.** The result screen presents element-level findings and generates human-verification prompts. It does not inspect pixels, measure locked-asset fidelity, detect drift, or read back rendered text.
- **The renderer picker contradicts `docs/concept-visibility.md`,** which says provider and model selection is administrator configuration with no picker in a routine job. The 2026-09-01 finding shipped a Render engine field on the ready card. Unresolved.

## What actually compiles today

After the 2026-09-07 change, the writer reads the four brain artifacts and authors the render prompt as one piece of prose. The compiler attaches the output format, attaches the locked asset, records provenance, and adds nothing else.

Sections that still compile: Assignment, Capture, Output, and Display copy.

Sections that stopped: the people rule, product knowledge, the protection block, creative reference direction, campaign direction and continuity, banner and product composition, the world block, and the refusals recital. Every removal is listed in `docs/findings-2026-09-07-writer-authors-the-prompt.md`, with the builder functions retained uncalled so any return is one revert.

The consequence, stated in that finding: if the writer's output is generic, the artifact that should have prevented it is the thing to improve. Quality is now entirely upstream.

## The plan

**Fix the claims.** The corrected README, plus the stale roadmap, the sprint mandate, and the renderer conflict. Cheap, and the composition claim is testable by a prospect in one conversation.

**Author MycoPop's aspiration.** A working session, not more synthesis. A separate brief accompanies this handoff.

**Build the moment library.** Fifteen entries to start. Craft patterns rather than scenes or templates: private preparation before a public act, the minute after effort, evidence of an activity after the person has left, a small act of care nobody performs for a camera. Each entry carries the human situation, relationship geometry, what has just happened, what is interrupted, the visible gesture or residue, camera awareness, emotional tension, the product's possible role, observable details, and common failure signatures. Authored in code by Higher Roads, like the look library. Retrieve one or two at scene-writing time and bind them to that client's people, places, tensions, and visual grammar. Do not compile the library into every prompt.

**Teach the writer craft.** Extract its context assembly into a separately testable module. Judge directions before rendering against questions like: is this one photograph rather than a sequence, does it reveal a human behavior, could it belong only to this brand's world, did the look change how people behave in frame rather than only adding optical vocabulary, is the product incidental to a real moment. Keep a corpus of misses and the corrections that fixed them. That corpus is the durable asset, more than the moment cards themselves.

**Make MycoPop undeniable.** Three territories, each with recurring people and environments, six or more moments, a compatible look range, and four to six finished frames. Around twenty strong images. Hand finishing is acceptable, because the proof is world authorship rather than unattended automation. It has to read without centered packaging, logos, or retro overlays doing the work.

Range is a stated gate, not a hope. Twenty images have to be twenty different moments rather than six good compositions with variations. A coherent world produced quickly tends to converge, and this is the most likely way the flagship fails while looking fine.

The flagship has three outputs, not one:

1. **The images.** The proof that the world produces work.
2. **The world in the app.** The approved brain, artifacts, and grammar that make the next campaign faster than the first.
3. **The World Kit.** A document for the people who make brand work outside BWS: a photographer on a real shoot, an agency writing a campaign, a packaging designer, a retail partner. It carries the world thesis, the people, the moment vocabulary, the environments and recurring objects, the visual and camera grammar, the reference set, proven examples, and how to make more.

The kit is not a fallback for the app and the app is not a fallback for the kit. A brand does work in places BWS will never touch, and a world that only functions inside one piece of software is a weaker offer than one that travels. The app is where the work goes fastest.

Two constraints on the kit. Generate it from the approved world rather than authoring it separately, or it goes stale the first time the world is extended and the client's photographer starts briefing against an old version. And write it for people rather than models. Its reader is a photographer or a writer who needs to understand the world well enough to make something inside it, which is a different document from anything the compiler produces.

**Sell one build.** Use the flagship to sell rather than to demonstrate software. Fixed scope, an optional ongoing engagement, three price points. A paid build is the signal.

**Run the outsider test.** Every good frame so far has come out of a session with Grey in the loop. Hand the app to someone outside the core team, with MycoPop's approved world loaded and no briefing, and see whether they produce something that belongs. Separately, give a photographer the World Kit alone and see whether they can shoot something that belongs. Different failure modes, both worth knowing before either is sold as something a client can use on their own.

If the app test fails, the likely causes are that the writer needs a person with taste to reject its weak directions, and that there is no path inside the product for a competent outsider to learn what good looks like. Both are product problems and both are better found now.

**Prove transfer with Simply Agree.** A credible lived world for a professional service, with emotional texture and no lifestyle-brand cosplay.

## The known craft failures

These are the current evidence base for what the writer gets wrong. Use them as the seed of the failure corpus.

**The writer transcribes the look instead of embodying it.** On 2026-09-08, against MycoPop with the `drugstore_flash` look, all three directions paraphrased the look's optical description back into the scene prose: the color cast, the contrast range, the flat faces, the wide lens, the falloff, the grain. It copied the film stock and ignored the one thing that should have changed the frame, which is that drugstore flash means subjects face the camera and know they are being photographed. Nobody in any direction faced the camera.

**The product lands in someone's hand every time.** The task said the product is one object among several, mentioned once, never the subject. It did not say where the product is, so the writer picked the most obvious thing a person does with a can.

**Synthesis is unstable across runs.** ADR 0017 measured three full rebuilds of the same brand from identical sources: no guardrail shared by all three runs on either test brand, and not one currently approved refusal surviving in any form. That is why refusals became governed records. Expect the same instability anywhere synthesis output is treated as durable.

## Open questions

**Who does the work.** A moment library, a writer refactor, an aspiration session, eighteen finished frames, a sales motion, and a second brand is more than one person. Unresolved.

**Whether this is a software company.** Partly settled by the World Kit decision. The kit governs brand work happening outside BWS and the app is where the work goes fastest, so the offer is a system with service around it rather than a dependency on Higher Roads being in the room. What remains open is pricing and capacity, and whether the first engagements are creative direction with software support or the reverse.

**Whether recurring people can hold across twenty images.** Trained to Imagine states publicly that character consistency comes from references, model choice, compositing, and cleanup, because no current model holds identity across arbitrary scenes. BWS has the same problem. If identity does not hold, territories have to be built around recurring situations, environments, and behavior rather than recurring faces. Decide this before the moment library is written, because it changes what a moment card has to specify.

**How much of the aspiration mechanism actually exists.** ADR 0016 specified `ambition` as an origin and substitution as a synthesis rule. ADR 0016 is still proposed. Confirm what ships before the MycoPop session depends on it.

## Working rules

The Higher Roads prose ruleset governs all written output, including interface copy. No em dashes. No fragment stacks. No "it's not X, it's Y." No negation-first constructions. No sentence built to be quotable. Plain peer-to-peer register.

Interface language prefers the user's words to the architecture's words. "Needs approval," not "lifecycle: proposed."

Label claims as verified, reasoned, or assumed when describing how something works or what it costs. Assumed claims need an explicit label and a recommendation to verify.

Findings that conflict with a frozen spec are recorded as findings rather than silently designed around.

Repository pushes go through the GitHub REST API with a session-scoped personal access token. Never store a token in memory or project knowledge. Revoke after the session.
