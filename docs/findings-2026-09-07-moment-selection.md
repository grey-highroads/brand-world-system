# A moment is a situation, not a script, and the server picks which ones the writer sees

- Date: 2026-09-07
- Base commit: `b206f9c05eb9313c424b9dc3d6707da4e4912f2c`
- Modules: `api/production/generate-copy.js`, `docs/image-pipeline-contract.md`, tests
- Status: shipped

## What was wrong

The scene writer returned the same three directions on every run: Nia at her dining table, Priya at the fitness studio counter, Marco at the trailhead. The Nia direction came back nearly word for word across two rounds, with the same laptop, the same headphones and the same water glass pushed back.

Two causes, both in `handleSceneBrief`.

**It was given every moment and told to pick.** The writer received the whole `moments` list and the task said to write three directions each built from one of them. Nothing said which three, so it took the first three. That is what a language model does with a list.

**It read a moment as a script.** The moment for Nia describes her dining table, her headphones and her printed questions, and the writer wrote exactly that, twice. A moment is meant to be a situation the writer walks into and photographs differently each time. A brand with twelve moments should not have twelve pictures.

The second one matters more, because nobody writes scene text by hand. The app is the only author, so the writer has to carry all of the variation itself.

## What changed

**The server picks three moments at random before the context is assembled.** `selectMoments` does a partial Fisher-Yates over a copy and returns three. The writer never sees the others, so it cannot favor the top of a list it was not given. Shuffling rather than picking three indexes also drops the order the artifact happened to be written in, which is the other thing a model reads position from.

The source is `Math.random` rather than a hash of the request, so two runs against the same brain pick differently. It is injectable, so a test can fix it.

An artifact with three or fewer moments sends what it has. One with none compiles the STORY block without a moments line, as before.

The selected ids travel back on the response as `momentIds`, so a job can say which situations its directions were photographing, and a repeat can be told from a re-pick of the same three.

**The task's first paragraph says what a direction is.** It used to say a direction was built from a moment, which reads as an instruction to transcribe one. It now says a direction is one photograph taken inside a moment: the moment says who is there, where, when and what is going on, and the direction is what a camera saw at one instant of that. The same moment on a different day, at a different hour, or a few minutes either side is a different photograph. Write the photograph, not the moment.

One sentence was added to the third paragraph: a direction is one instant, so every person is in the middle of one thing rather than several in a row. A person doing three things in sequence is the transcription failure in miniature.

The people paragraph and the product paragraph are unchanged. No rules were added.

**The moment line is unchanged.** The fields are the moment and the writer needs them. What changed is the task, not the input. If the writer is still transcribing after this, the next lever is how much of `doing` is sent, and that is a decision for the owner on evidence.

## Where I could not satisfy the brief exactly

The acceptance line says the task should be no longer than the current one. Part 2 asks the first paragraph to say five things the old opening sentence did not say, and to keep the other three paragraphs, one of which gains a sentence.

Those do not both fit. The measured counts:

| | before | after |
| --- | --- | --- |
| Paragraph 1 | 27 | 81 |
| Paragraph 2 | 54 | 54 |
| Paragraph 3 | 63 | 84 |
| Paragraph 4 | 33 | 33 |
| Total | 177 | 252 |

Paragraph 1 grows because it now carries the content Part 2 specifies. Paragraph 3 grows by the one sentence Part 2 asks for. Paragraphs 2 and 4 are byte identical.

I wrote paragraph 1 as tightly as I could while saying everything asked, rather than dropping a required sentence to hit a word count or silently blowing past the constraint. If the length matters more than the completeness, the sentence to cut is the one listing three ways the same moment differs, which is 24 words and is the one most likely to be doing the work.

## Verification

- `node --check` on `api/production/generate-copy.js`.
- Full suite: 196 tests, 195 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, pre-existing, left alone.
- No em dashes in any touched file, checked mechanically.

Seven new tests in `test/scene-brief.test.js`, which is new. `handleSceneBrief` is now exported so this can be a real suite test rather than a probe against a copied file.

- Three moments are selected from twelve, the other nine are absent from the prompt entirely, and three ids come back on the response.
- Two runs against the same brain pick different moments, with fixed sources standing in for two draws, plus forty selections through the live default to show it varies.
- Three or fewer moments send what they have, for counts 0 through 3.
- No moments still briefs the writer, with no moments line and no `momentIds` key.
- The moment line still carries the whole moment, asserted against its exact rendered text.
- The task says what Part 2 asked and no longer says a direction is built from a moment.
- `template_surface` and `sales_element` see none of it.

## What to watch

Whether the directions stop repeating. Selection alone guarantees different moments, so three different pictures is now the floor rather than the goal. The real question is whether the same moment twice produces two different photographs, which is what the task rewrite is for and what selection can hide: if you pull the same moment on two runs and get the same direction, the task did not land and the next lever is trimming `doing`.

The `momentIds` on the response is what makes that answerable, since you can tell a re-pick from a repeat.
