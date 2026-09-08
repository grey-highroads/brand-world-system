# Findings, 2026-09-08: a direction is what was in front of the lens, and the product sits where someone left it

Two sentences were added to `kinds.scene.task` in `api/production/generate-copy.js`. Both came from one set of writer output: three directions produced on 2026-09-08 against MycoPop with the `drugstore_flash` look. Both failures appear in all three directions.

## Finding 1: the writer transcribes the look

The look brief travels to the writer so it knows the medium and any environment that medium requires. The writer is paraphrasing it back into the scene prose. Against the `drugstore_flash` line in `src/production/looks.js`:

| Look brief | Direction |
| --- | --- |
| skin runs warm and slightly orange, whites carry a magenta or yellow cast | "her features slightly orange against the magenta-tinged whites" |
| the whole frame sits in a narrow contrast range | "muted by the flash's narrow contrast" |
| faces are flat and evenly blasted with no shaping | "flattening his features", "the light flattens the scene" |
| a fixed wide angle, mildly distorts anything near the edges | "the wide lens capturing his", "slightly distorted at the periphery" |
| everything beyond about eight feet falls off into underexposed murk | "reducing the forest background to an underexposed blur" |
| grain is fine but the resolution is soft | "softened by the grain of the photo" |

The cost is that a scene render specifies the medium twice. Once in Assignment, in the writer's loose paraphrase, and once in Capture, in the governed version, with the paraphrase first. The two can disagree.

This traces to a specific deletion. At `c8664ba3` the third `lookRules` entry was cut, and preventing this was its whole job: do not describe the medium itself, capture character compiles separately, and repeating it sends the same instruction twice. Its wording is preserved in the comment block above `handleSceneBrief`.

Note what the writer kept and what it dropped. It copied the optical description, which Capture already handles. It ignored the one part of the look that should change what is in front of the lens: `drugstore_flash` says subjects face the camera and know they are being photographed. Nobody in any of the three directions faces the camera.

**The fix did not go back in the compiler.** It went in the task, as a statement of what a direction is. The deleted look rule was not restored verbatim, because it was written as a rule addressed to a four-field output shape that no longer exists. `lookRules` is unchanged and asserted unchanged by a test. The look still travels to the writer, and it should, because the writer needs to know what the medium implies about behavior in frame, which is the part it is currently missing.

The sentence, added to the end of the third paragraph:

> A direction is what was in front of the lens rather than how the film rendered it, so the color cast, the grain, the contrast, the focus and the lens are all set elsewhere in this prompt and do not belong in the prose.

## Finding 2: the product is in someone's hand every time

"holding a clipboard in one hand and a MycoPop can in the other," "a MycoPop can in her hand," "holding a can of MycoPop."

The task already said the product is one object among several, mentioned once, never the subject. It did not say where the product is, so the writer picked the most obvious thing a person does with a can.

The reason this matters is not composition. The render models do not understand the scale of a can against a body, and this failed in 100 percent of owner testing. Scale without direct interaction has been holding.

The sentence, added to the end of the fourth paragraph:

> The product sits where someone set it down and left it, on a surface in the room, and no one in the frame is holding or touching it.

The wording is positive placement rather than a prohibition, deliberately. A negative leaves the writer nowhere to put the can, and it reads as accumulated caution to the next person holding a brief that says cut rules.

Both reasons are recorded as a dated comment above the task. The last rule cut from this file was cut because nothing next to it said what it was for, and the failure it prevented came back within a day.

## Known contradiction, live and not resolved here

The MycoPop Visual Grammar objects section says the can "is held or set down where a person put it, never arranged." With the second sentence shipped, that artifact tells the writer the opposite of the task.

This is not fixed in code. The owner is taking it as a review edit to that grammar entry after the pending MycoPop re-synthesis. It is written down here so the disagreement is on record while it is live.

The durable fix is a later session: teaching the Visual Grammar synthesis guidance to keep placement out of the objects section, since placement is now the task's business.

## What changed

- `api/production/generate-copy.js`: two sentences in `kinds.scene.task`, plus the dated comment recording what produced them. No other key in that file moved. `lookRules`, `template_surface` and `sales_element` are unchanged.
- `test/scene-brief.test.js`: five tests. Each new sentence is asserted verbatim and in its own paragraph. All four task paragraphs are asserted whole, so a sentence cannot be reworded or dropped while its neighbours still match. The look rules are asserted verbatim for an agnostic look and a binding one, with a count assertion that no third look rule returned.
- `docs/image-pipeline-contract.md`: stage 6, transformation 2.

## Full suite

201 tests, 200 passing, one failing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing `OPENAI_API_KEY` and is pre-existing, recorded as ambient state 10. It was left alone.

## Not in scope, and still open

- The Visual Grammar synthesis guidance and the MycoPop grammar entry, above.
- The product record's exclusions reaching nothing, a separate open gap.
- The meaning sentences the writer is still producing. The task already forbids them. The owner's instruction is to give one run after these two changes before anything moves.
