# Findings, 2026-09-10: the writer receives the look's behavior, and a check strips what it cannot photograph

- Branch: `writer`, three checkpoints, merged to main.
- Brief: the scene writer brief of 2026-09-09.
- Evidence: three directions generated 2026-09-09 against MycoPop's evolved world. Every one ended on a sentence that told the reader what the picture meant. The task text forbade it since 2026-09-07. The four sentences are in `docs/writer-corpus.md`.

## 1. The look leaves RULES

**What was read.** `generate-copy.js` at `9b179465` put the resolved look's full optical description into the `RULES:` block and the instruction not to transcribe it into the third task paragraph. Rules outrank tasks in the same prompt. The writer paraphrased the film and ignored the one thing the look should have changed, which is how people face the camera.

**What changed.** Every entry in `src/production/looks.js` carries a `behavior` field: one sentence saying what the medium changes about the people and the room. That sentence is all the writer receives of the look, in context under `HOW THIS BRAND'S PICTURES ARE TAKEN`, after the grammar and the product line and directly above `RULES:` (`generate-copy.js:841`). The optical line reaches the writer nowhere. The compiler still attaches it in Capture; nothing in the compiler moved.

The environment precedence stays in RULES, reworded because "that medium" no longer refers to a line above it (`:985`). The peopleless suspension sentence now names the heading. The lens sentence from 2026-09-08 moved from task paragraph 3 into RULES on both scene kinds (`LENS_RULE`, `:505` and `:1015`). The rule is a rule; the look is data.

**Placement, and where the brief could not be followed.** The brief asked for the behavior sentence after the world and before the task. The task opens the system prompt and the context follows it, so both cannot hold. It sits after the world and directly before the rules. Reordering the prompt so the task comes after the context is a separate decision, not taken here.

## 2. The meaning rule, the examples, and the check

`MEANING_RULE` (`:512`) replaces the old "is a sentence to cut" sentence in paragraph 3 of both scene kinds. `MEANING_EXAMPLES` is its own paragraph directly after it, so the scene task is five paragraphs and the peopleless task six. Both example pairs are verbatim from the 2026-09-09 job. The first pair names MycoPop, so a writer briefed for another brand sees that name in its instructions. Recorded here as a risk, not fixed.

The check (`MEANING_TELLS`, `:547`; `stripMeaningSentences`, `:588`) runs on scene kinds only, after generation. Whole-word match, case-insensitive, a splitter that keeps quoted sentences together. The tell list is the brief's plus "atmospheric". A direction cut below `MEANING_CHECK_MIN_SENTENCES` (three) is written again once, as a follow-up in the same conversation that names the cut sentences (`:1098`); a second failure returns it stripped with `flagged: true`. "A reminder card sits on the desk" is stripped. That is the cost of a list that is not clever, and it is accepted.

## 3. All three directions ride the job record

Every option now carries an `id` (`:1082`). The response carries `stripped`, `regenerated`, and `model`.

In the app, `state.studio.directions` (`app.js:1455`) holds the offered set after a choice, with `chosenId` and a `chosenEdited` flag set when the brief is hand-edited afterward. `productionRequest` sends it (`:8307`). The job record is written in `src/production/service.js`, not `store.js`; `working.directions` (`service.js:625`) and the saved output package (`:771`) carry it through `offeredDirectionsRecord` (`:491`), which bounds shape and size. The result screen's image card gains a closed "Directions offered" disclosure (`app.js:10687`) with the chosen one marked, stripped sentences under each direction, and the model and world named. Reopening a past output reads it back from the saved package (`:8688`).

Two corrections to the brief. The job record lives in `service.js`, which the brief's file list did not name; one line there was the only way to carry the directions without touching the compiler. "Show what this used" is on the studio suggest panel, not the result screen; the disclosure went on the result screen's image card instead.

`grammarEntries` and `momentIds` on the writer's response were never read by the app. `momentIds` now rides inside the directions record. `grammarEntries` still reaches nothing.

## 4. The model

`OPENAI_WRITER_MODEL`, default `gpt-4o` (`writerModel`, `:494`). Every response and every job record names the model. No `vercel.json` change was needed.

## 5. Wardrobe and room

`WARDROBE_LINE` closes the people paragraph on the scene kind. The peopleless kind gets `SURFACES_LINE`, adapted because nobody in that frame is wearing anything. Neither names a decade.

## Not done, and open

- No CSS for the disclosure. It renders with the existing `studio-add-link`, `mini-pill`, and `section-label` classes and plain list items. `app/styles.css` was not on the file list.
- The behavior sentences are drafts. The language tuning is the owner's.
- `neutral` is still misnamed, and now visibly so. Its behavior sentence says one person holds the camera's gaze from across a room on a long lens, in a room nobody tidied, lit by one positioned light. That describes what the look does, so the sentence stays. It is a specific look wearing the wrong name, which the deferred register already records; the sentence puts the mismatch on the writer's page where a reader can see it.
- The outputs log entry (`recordOutput` in `app.js`) does not carry directions; the saved package does, and review reads from the package.

## Tests

`test/scene-brief.test.js`: 33 tests. RULES holds the lens sentence and no look's optical line; the behavior sentence sits under its heading between the world and the rules, and is absent with no look; the task carries the meaning rule and both pairs verbatim; the check strips each tell; a direction below the floor regenerates exactly once; the response carries ids, stripped, regenerated, and the model; the record sanitizer keeps what it was given and nothing else.

`test/browser-prototype.test.js`: 18 tests. The job record carries three directions and the chosen id; the result screen renders "Directions offered" with the chosen one marked; a category switch drops the set.

Suite before: 236 tests, 235 pass. After: 247 tests, 246 pass. The ambient fixture failure stays.
