# Finding: product briefs are withheld from brand synthesis, and emerging brands have little else

- Date: 2026-09-15
- Status: recorded, not resolved. The owner rules.
- Raised during: Sources screen work on the brand brain

## What the code does today

Product briefs never reach Brand Brain synthesis. `startBrainSynthesis` in `app/app.js` filters out every source carrying `productMeta` on both the full-build and incremental paths. When a batch contains only briefs, the screen says the briefs were saved and points the user at the Products screen.

Product knowledge enters at job time instead. In `api/production/generate-copy.js`, a product record is read only when the request carries a `productId`, and only if the record has been approved. Its one true thing and features are then pushed into the generation prompt for that job.

The material-type description in `app/app.js` states the same rule: a product brief is excluded from Brand Brain synthesis and routed to per-product synthesis instead. The behavior matches ADR 0012 as the code comment describes it. ADR 0012 was not read this session, so treat the attribution as REASONED rather than verified.

## Why the separation is right

A brand surrounds its products without being defined by them. Product facts change on a release cycle; brand guidance should not move every time a SKU ships. Keeping briefs out of synthesis means a product deck cannot quietly rewrite tone, world, or visual guidance, and it means a discontinued product does not leave residue in the brand.

## The tension

For an emerging brand, the product deck may be the densest document that exists. MycoPop is the flagship case. It has no body of shipped work to observe, and ADR 0015 already recorded that its lived world came back describing its own Instagram posting behavior, because a website and a screenshot were the only evidence available.

In that situation the current rule means the system declines to read the most substantive thing the client has. The brief builds a product record and contributes nothing to the world the brand is supposed to grow into. This is not a defect in the filter. It is a gap in what happens next.

## What was changed on 2026-09-15, and what was not

The Sources screen stopped listing product briefs, stopped counting them, and stopped offering product synthesis from a source record. The Products screen now shows each record's brief with its file or link. None of that changes synthesis behavior. It makes the existing rule visible rather than silent.

## Open questions for the owner

1. Should a product brief be able to inform brand synthesis when the user declares it should, as a source-level decision rather than a category rule?
2. If not, is there a different intake for an emerging brand that has product documents and little else? The aspiration work may already be the answer, since an authored world does not depend on observed evidence.
3. Does a brand with one product need the separation at all, or is the product effectively the brand until a second one exists?
