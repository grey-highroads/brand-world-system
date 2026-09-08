# Brief: a second kind of scene, with nobody in the frame

Date: 2026-09-08
Repo state this brief was written against: `main` at `14f7e6836e`
Owner ruling: the task text in section 3 is approved as written. Do not reword it.

## Push first

If you hit the tool limit with work on disk and nothing pushed, push before you
do anything else, including before you write your report. Two sessions were lost
that way in the last week.

## What this session does

The studio can produce one kind of photograph: a moment with people in it. This
session adds a second, a photograph of the same moment at a point when nobody is
in the frame, and gives the user the choice between them.

This is not a still life and it is not a template surface. It reads the same
three brain artifacts, is written from the same moments, and carries the same
world and visual grammar. The only difference is that the camera arrives when
the room is empty.

## What is already settled

Do not reopen these. If you think one of them is wrong, say so in your report and
build it as written anyway.

- The framing: the moment governs, and the camera arrives before the people
  arrived, after they left, or at an hour when the place is theirs and empty.
- The prose never says the room is empty. Two hand pulls on 2026-09-08 returned
  empty frames from complete description with no prohibition and no absence
  sentence, so the description carries it.
- A look is required on this kind. The `CAPTURE_CHARACTER` fallback is not
  touched in this session.
- The user control is a choice inside the studio form, not a new studio
  category. Category is where the image goes. This is what the image is.

## 1. The new kind

In `api/production/generate-copy.js`, add a fourth entry to the `kinds` map
inside `handleSceneBrief`, with id `scene_no_people`.

Its `task` is the following text, verbatim. It is approved. Do not edit it, do
not reflow it, do not add a rule to it.

```
You write the direction for one photograph. Below are three moments from this
brand's world, and you write one direction from each. A direction is one
photograph taken inside a moment, at a point when nobody is in the frame. The
moment says who is there, where, when and what is going on. Yours is what a
camera saw in that place a few minutes before they arrived, a few minutes after
they left, or at an hour when the room is theirs but empty.

The people are still the reason the room looks the way it does. Write what their
activity left behind: a chair at the angle someone pushed it to, tools laid out
in the order they were being used, a cup with something still in it, a surface
worn where hands go. Use the moment's place and its time. Do not write a person
into the frame, do not write a hand or part of a body, and do not say that the
room is empty. Describe what is there completely enough that there is nothing
left to add.

Name one thing in the frame that is not the product and give it size and
position, so the eye has somewhere to land first. Without a person the frame has
no natural subject, and whatever is largest and most contrasted becomes one. A
direction is one instant, so the room is in one state rather than several. It
names a few objects that belong there and gives each one a state and the reason
it is in that state. It describes light by where it comes from and how it
behaves on what it hits. Every sentence is something the camera can record, so a
sentence about what the picture means is a sentence to cut. A direction is what
was in front of the lens rather than how the film rendered it, so the color, the
grain, the contrast, the focus and the lens are set elsewhere in this prompt and
do not belong in the prose.

Where a product is named below, it appears once. It sits where someone set it
down on a surface in the room, and it is never the subject and never centered.

The three directions are not all at the same distance from the people. One is a
place someone left minutes ago. One is a place at rest. In one the product is
the closest thing the frame has to a subject.
```

The kind carries no `rules` array. Like `scene`, it takes only the shared rules
already assembled below the kinds map.

The paragraph beginning "Name one thing in the frame" exists because of a
finding from the 2026-09-08 pulls: the can is the only saturated warm object in
these frames, so it becomes the subject by color unless something else in the
room has real visual weight. On the people kind that rule is held up by a person
doing something. Here nothing holds it up, so the writer has to name the subject.

## 2. Output shape and word budget

`scene_no_people` uses the same output shape, word budget, and `max_tokens` as
`scene`. Everywhere the code currently tests `String(body.kind || "scene") ===
"scene"` to decide between the scene shape and the short-brief shape, both scene
kinds take the scene branch. Introduce one predicate rather than repeating the
comparison at each site.

## 3. Context assembly

Two changes, both inside `handleSceneBrief`, both applying only when the kind is
`scene_no_people`. Everything else in the assembly is unchanged, including
`selectMoments`, which is reused exactly as it is.

**The Lived World people line.** It currently reads "The people this is about.
Write these people, by name. Do not invent others:" followed by the list. On this
kind that instruction contradicts the task. Replace the lead line with wording to
this effect, and the exact words are yours: these are the people whose place this
is, and their activity is the reason the room is in the state it is in. Keep the
list itself, names and all, unchanged. A brain synthesized before 2026-09-07
carries a single `person` string instead of a list, and that path keeps working.

**The grammar's people section.** It currently arrives labeled "Who appears on
camera". On this kind it arrives with a label saying who the place belongs to.
The entries themselves are unchanged and the ambition marker still travels. Do
not withhold the section: its entries carry wardrobe and era detail that is where
a jacket over a chair or a knit cap on a counter comes from.

The `grammarEntries` array that travels back with the suggestions is unchanged,
so the job still records which grammar statements shaped the direction.

## 4. The look rule

`lookRules` is assembled from the resolved look just below the kinds map. When
the kind is `scene_no_people` and a look is resolved, add one sentence to that
array saying that the medium's instructions about how subjects behave on camera
do not apply because nobody is in the frame, and that its color, contrast, grain,
and focus behavior apply in full. The exact wording is yours.

This exists because several look lines describe faces, skin, hair, and how a
subject holds the camera. `neutral` and `color_slide_1975` are the clearest
cases. This is a precedence fix of the same shape as the one that made binding
looks decide the setting.

Flagged for the record: this sentence has not been tested. If a person appears in
a render on a face-heavy look, the sentence is not enough and the fallback is
filtering the look list for this kind. Do not build the filter now.

## 5. The kind reaches the compiler

Today `compileBrandWorldImagePackage` in `src/production/package.js` derives
`isTemplate` and `isSalesEnablement` from `placement`, the output destination.
The writer's kind never reaches it. Carry the kind on the brief record and read
it in the compiler.

In this session the compiler does one thing with it: when the kind is
`scene_no_people`, a look is required, and a request arriving without one is a
validation failure with a message a person can act on. Nothing else branches on
it. Do not add sections, do not restore Protection on this path, and do not
change the Assignment, Capture, or Output bodies.

Record the kind on the stored production record alongside the look, so a job can
say later which kind of image it was.

## 6. The user control

In `app/app.js`, add a two-option control to the studio form near
`studioLookField`, on all four forms that currently pass `kind: "scene"` into
`sceneSuggestField`: social, website, showcase, and ad. The template and sales
forms do not get it.

Labels: "With people" and "Place and product". Default is "With people", so
existing behavior is unchanged for someone who does not touch it.

The selection sets the `kind` passed to the suggest call and rides on the brief
record through to the compiler. Because a look is required on the second option,
selecting it when no look is chosen should say so at the point of choice rather
than at generate time.

## 7. Tests

`test/scene-brief.test.js` exists and covers the current shape. Add to it rather
than starting a new file.

- The kinds map returns the approved task text for `scene_no_people`, matched
  against the string, so an edit to the task fails the suite.
- `scene_no_people` takes the scene output shape and the scene word budget.
- On `scene_no_people`, the Lived World people list is present and the "Write
  these people, by name" instruction is not.
- On `scene_no_people` with a look resolved, the added look sentence is in the
  system prompt.
- A `scene_no_people` compile with no look fails validation, and the same brief
  with a look compiles.
- The existing `scene` assertions still pass unchanged. A compiled `scene`
  package is byte identical to the base commit.

## Out of scope

- Synthesis. Do not touch `schema.js` or `chat-completions-provider.js`. Do not
  re-synthesize any brain.
- The `CAPTURE_CHARACTER` fallback and the human texture floor.
- Restoring the Protection section on the scene path.
- Filtering the look library.
- The three dead parity harnesses in `fixtures/`.

## If the brief is wrong

Stop and say so. Briefs from this desk have carried a wrong contract claim, a
dead fence, and an acceptance line that would have silently dropped display copy,
and the builder was right every time. Raise it in your report rather than
building around it.
