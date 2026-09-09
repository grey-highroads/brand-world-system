import assert from "node:assert/strict";
import test from "node:test";
import { SCENE_MOMENT_COUNT, handleSceneBrief, selectMoments, selectWorldArtifacts } from "../api/production/generate-copy.js";
import { resolveLook, SCENE_NO_PEOPLE_DEFAULT_LOOK } from "../src/production/looks.js";
import { compileBrandWorldImagePackage } from "../src/production/package.js";
import { CAPTURE_CHARACTER } from "../src/production/prompt-craft.js";
import crypto from "node:crypto";

// The scene writer returned the same three directions on every run: Nia at her
// dining table, Priya at the fitness studio counter, Marco at the trailhead,
// with the Nia direction nearly word for word across two rounds. It was handed
// every moment and told to build a direction from one of them, so it took the
// first three. The server now picks three at random and the writer never sees
// the rest. See docs/findings-2026-09-07-moment-selection.md.

function moment(index) {
  return {
    id: `moment-${index}`,
    title: `Moment ${index}`,
    when: "Late afternoon",
    where: `Room ${index}`,
    who: "One person, alone.",
    situation: `Someone does thing ${index}.`,
    feeling: `It means something ${index}.`,
  };
}

// Brains in the three shapes the writer reads. "today" is a two-world brain
// with only the today world approved; "evolved" has both; "legacy" is a brain
// saved before ADR 0019, with a people list at the root.
function brainWith(moments, shape = "today") {
  const today = {
    livedWorld: {
      cast: {
        description: "People who fix things for a living and talk while they work.",
        examples: [{ name: "Dana", who: "27, runs the front of a bike shop." }],
      },
    },
    storyArchitecture: { rhythm: "Pressure, then release.", moments },
    visualGrammar: { sections: { light: [{ id: "light-1", statement: "One north window." }] } },
  };
  const evolved = {
    livedWorld: {
      cast: {
        description: "People who repair rather than replace, and are proud of the marks it leaves.",
        examples: [{ name: "Ola", who: "34, reupholsters chairs out of a garage." }],
      },
    },
    storyArchitecture: { rhythm: "Evolved rhythm.", moments },
    visualGrammar: { sections: { light: [{ id: "light-e1", statement: "Tungsten work lamp." }] } },
  };
  const legacy = {
    livedWorld: { people: [{ id: "person-1", name: "Dana", who: "27, runs the front of a bike shop." }] },
    storyArchitecture: { rhythm: "Pressure, then release.", moments },
    visualGrammar: { sections: { light: [{ id: "light-1", statement: "One north window." }] } },
  };
  return {
    brandName: "Fallow",
    brandDescription: "A quiet home goods brand.",
    artifacts: shape === "legacy" ? legacy : shape === "evolved" ? { today, evolved } : { today },
  };
}

// Runs the writer with a stubbed model call and returns what it sent and what
// it replied. The random source is handed in, so a pick is a fact rather than a
// coin toss inside an assertion.
async function runSceneBrief({ moments, random, kind = "scene", look = null, product = null, shape = "today" }) {
  let sent = null;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          choices: [{
            message: {
              content: JSON.stringify({ options: [{ label: "A", brief: "a" }, { label: "B", brief: "b" }, { label: "C", brief: "c" }] }),
            },
          }],
        };
      },
    };
  };
  const response = { setHeader() {}, end(payload) { this.body = payload; } };
  try {
    await handleSceneBrief({
      body: { action: "scene_brief", kind, look },
      brain: brainWith(moments, shape),
      product,
      apiKey: "test-only",
      response,
      random,
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
  return { system: sent.messages[0].content, sent, reply: JSON.parse(response.body) };
}

function momentTitlesIn(systemPrompt) {
  return [...systemPrompt.matchAll(/^Moment (\d+)\./gm)].map((match) => Number(match[1]));
}

test("three moments are selected and the rest never reach the writer", async () => {
  const moments = Array.from({ length: 12 }, (unused, index) => moment(index + 1));
  const { system, reply } = await runSceneBrief({ moments, random: () => 0.5 });

  assert.equal(momentTitlesIn(system).length, SCENE_MOMENT_COUNT);
  assert.equal(reply.momentIds.length, SCENE_MOMENT_COUNT);
  // The nine that were not picked are absent, which is the whole mechanism: the
  // writer cannot favor the top of a list it was not given.
  const sentTitles = new Set(momentTitlesIn(system));
  const missing = moments.filter((entry, index) => !sentTitles.has(index + 1));
  assert.equal(missing.length, 9);
  for (const entry of missing) {
    assert.equal(system.includes(entry.doing), false, `${entry.title} was withheld`);
  }
});

test("two runs against the same brain pick different moments", async () => {
  const moments = Array.from({ length: 12 }, (unused, index) => moment(index + 1));
  // Two fixed sources standing in for two draws from a real one.
  const first = await runSceneBrief({ moments, random: () => 0.05 });
  const second = await runSceneBrief({ moments, random: () => 0.95 });
  assert.notDeepEqual(first.reply.momentIds, second.reply.momentIds);

  // And the live default is a real source rather than anything derived from the
  // request, so repeated calls with the same brain do not settle on one set.
  const picks = new Set();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    picks.add(selectMoments(moments).map((entry) => entry.id).join(","));
  }
  assert.ok(picks.size > 1, "repeated selections vary");
});

test("a brain with three or fewer moments sends what it has", () => {
  for (const count of [0, 1, 2, 3]) {
    const moments = Array.from({ length: count }, (unused, index) => moment(index + 1));
    const selected = selectMoments(moments, () => 0.5);
    assert.equal(selected.length, count);
    assert.deepEqual(selected.map((entry) => entry.id), moments.map((entry) => entry.id));
  }
});

test("a brain with no moments still briefs the writer, without a moments line", async () => {
  const { system, reply } = await runSceneBrief({ moments: [], random: () => 0.5 });
  assert.match(system, /THE STORY/);
  assert.match(system, /Pressure, then release/);
  assert.equal(momentTitlesIn(system).length, 0);
  assert.doesNotMatch(system, /from this world/);
  assert.equal(reply.momentIds, undefined);
  assert.equal(reply.options.length, 3);
});

test("the moment line still carries the whole moment", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  // The fields are the moment and the writer needs them. What changed is the
  // task, not the input.
  assert.match(system, /Moment 1\. Late afternoon, Room 1\. Who is there: One person, alone\. Someone does thing 1\. It means something 1\./);
});

test("the task tells the writer to photograph the moment rather than transcribe it", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  assert.match(system, /A direction is one photograph taken inside a moment/);
  assert.match(system, /a few minutes either side is a different photograph/);
  assert.match(system, /Write the photograph, not the moment/);
  assert.match(system, /A direction is one instant, so every person is in the middle of one thing rather than several in a row/);
  // The instruction that produced the transcription is gone.
  assert.doesNotMatch(system, /each built from one of the moments in THE STORY/);
  // The paragraphs the rewrite was told to leave alone are intact. The second
  // paragraph changed under ADR 0019 and is asserted whole below.
  assert.match(system, /The people are cast from the description in THE LIVED WORLD/);
  assert.match(system, /it is present in the scene as one object among several/);
});

test("template and sales element kinds are untouched by moment selection", async () => {
  const moments = Array.from({ length: 12 }, (unused, index) => moment(index + 1));
  for (const kind of ["template_surface", "sales_element"]) {
    const { system } = await runSceneBrief({ moments, kind, random: () => 0.5 });
    assert.doesNotMatch(system, /A direction is one photograph taken inside a moment/);
    assert.match(system, kind === "template_surface" ? /reusable branded background surfaces/ : /sit on top of a branded template/);
    // Neither kind's task moved on 2026-09-08. Both sentences added that day
    // went into the scene kind only.
    assert.ok(system.includes(
      kind === "template_surface"
        ? "You write short briefs for reusable branded background surfaces. A surface is a backdrop that other work sits on top of: a gradient, a texture, a lit environment with open space. It is not a finished image and it has no subject of its own."
        : "You write short briefs for a single generated element that will sit on top of a branded template in sales collateral. The element is one object rendered cleanly: a device mockup, a product shot, a demonstration visual."
    ), `${kind} task is unchanged`);
    assert.equal(system.includes("The product sits where someone set it down"), false);
    assert.equal(system.includes("what was in front of the lens"), false);
  }
});

// Three directions written 2026-09-08 against MycoPop with the drugstore_flash
// look, all three of them, paraphrased that look's own line back into the scene
// prose and put the can in someone's hand. The task now says a direction is
// what was in front of the lens, and where the product sits. See
// docs/findings-2026-09-08-lens-and-product-placement.md.

// Every sentence the four task paragraphs carried before 2026-09-08, in the
// paragraph it belongs to. The two additions are asserted separately below, so
// this list is what must survive them.
const EXISTING_TASK_SENTENCES = {
  1: [
    "You write the direction for one photograph.",
    "Below are three moments from this brand's world, and you write one direction from each.",
    "A direction is one photograph taken inside a moment.",
    "The moment says who is there, where, when and what is going on.",
    "Yours is what a camera saw at one instant of that, and the same moment an hour later, on another day, or a few minutes either side is a different photograph.",
    "Write the photograph, not the moment.",
  ],
  // Paragraph two is the ADR 0019 version, asserted whole in its own test
  // below; its sentences are listed here so the paragraph check still holds.
  2: [
    "Take the moment's people, its place, and its time, and write what a camera in that room would see.",
    "The people are cast from the description in THE LIVED WORLD: write particular people who belong there, with what they are doing and how they carry themselves, and do not describe anyone by their job or their age bracket.",
    "Nobody in this frame has appeared in another picture of this brand, so do not use an example's name and do not write an example as themselves.",
  ],
  3: [
    "A good direction puts those people in that place doing separate concrete things.",
    "A direction is one instant, so every person is in the middle of one thing rather than several in a row.",
    "It names a few objects that belong there.",
    "It describes light by where it comes from and how it behaves on what it hits.",
    "Every sentence is something the camera can record, so a sentence about what the picture means or how it should feel is a sentence to cut.",
  ],
  4: [
    "Where a product is named below, it is present in the scene as one object among several, mentioned once, and it is never the subject.",
    "It is not what the moment is about.",
  ],
};

test("the task says a direction is what was in front of the lens", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, look: "drugstore_flash" });
  assert.ok(system.includes(
    "A direction is what was in front of the lens rather than how the film rendered it, so the color cast, the grain, the contrast, the focus and the lens are all set elsewhere in this prompt and do not belong in the prose."
  ), "the lens sentence is in the assembled task");
  // It sits in the third paragraph, after the sentence about cutting anything
  // the camera cannot record, rather than anywhere else in the prompt.
  assert.match(
    system,
    /is a sentence to cut\. A direction is what was in front of the lens rather than how the film rendered it/
  );
});

test("the task says the product sits where someone left it", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  // Verbatim, as written in the brief that produced it.
  assert.ok(system.includes(
    "The product sits where someone set it down and left it, on a surface in the room, and no one in the frame is holding or touching it."
  ), "the product placement sentence is in the assembled task");
  assert.match(
    system,
    /It is not what the moment is about\. The product sits where someone set it down and left it/
  );
});

test("the four task paragraphs keep every sentence they had", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  // The task is four paragraphs separated by blank lines, and the context
  // follows after another blank line, so the first four blocks are the task.
  const blocks = system.split("\n\n");
  for (const [paragraph, sentences] of Object.entries(EXISTING_TASK_SENTENCES)) {
    const body = blocks[Number(paragraph) - 1];
    for (const sentence of sentences) {
      assert.ok(body.includes(sentence), `paragraph ${paragraph} kept: ${sentence}`);
    }
    // And each paragraph is its own sentences and nothing else, so a sentence
    // cannot be quietly reworded or dropped while its neighbours still match.
    // Paragraphs 3 and 4 each carry one sentence added on 2026-09-08, asserted
    // above and appended here.
    const added = {
      3: " A direction is what was in front of the lens rather than how the film rendered it, so the color cast, the grain, the contrast, the focus and the lens are all set elsewhere in this prompt and do not belong in the prose.",
      4: " The product sits where someone set it down and left it, on a surface in the room, and no one in the frame is holding or touching it.",
    }[paragraph] || "";
    assert.equal(body, `${sentences.join(" ")}${added}`, `paragraph ${paragraph} is unchanged apart from what was added`);
  }
  // Still four, so nothing was inserted between them and no fifth was added.
  assert.equal(blocks[0].startsWith("You write the direction for one photograph."), true);
  assert.equal(blocks[3].startsWith("Where a product is named below,"), true);
  assert.equal(blocks[4].startsWith("BRAND:"), true);
});

test("the look still reaches the writer unchanged", async () => {
  // The fix went into the task, not the compiler. The writer needs the look,
  // because what the medium implies about behavior in frame is the part it was
  // dropping.
  const agnostic = resolveLook("drugstore_flash");
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, look: "drugstore_flash" });
  assert.ok(system.includes(
    `- This image is made with a specific photographic medium and the direction has to be something that medium can actually produce: ${agnostic.line}`
  ), "the medium line is carried whole");
  assert.ok(system.includes(
    "- That medium works in any setting, so the environment stays governed by the brand's earned environments."
  ), "an agnostic look leaves the environment to the brand");

  const binding = resolveLook("overcast_editorial");
  const bound = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, look: "overcast_editorial" });
  assert.ok(bound.system.includes(
    `- This image is made with a specific photographic medium and the direction has to be something that medium can actually produce: ${binding.line}`
  ), "the binding look carries the same medium line");
  assert.ok(bound.system.includes(
    `- That medium requires ${binding.requires}. Set the scene somewhere that condition holds.`
  ), "a binding look still decides the setting");

  // And no third look rule came back. The RULES block for a scene with a look
  // holds two look lines and the two shared lines, and nothing else.
  const rules = bound.system.split("RULES:\n")[1].split("\n\nOUTPUT FORMAT:")[0];
  assert.equal(rules.split("\n").filter((line) => line.startsWith("- ")).length, 4);
  assert.doesNotMatch(rules, /Do not describe the medium itself/);
});

test("a scene with no look carries no look rules", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  const rules = system.split("RULES:\n")[1].split("\n\nOUTPUT FORMAT:")[0];
  assert.equal(rules.split("\n").filter((line) => line.startsWith("- ")).length, 2);
});

// ---------------------------------------------------------------------------
// The second scene kind, added 2026-09-08. A photograph of the same moment at a
// point when nobody is in the frame. Same three brain artifacts, same moments,
// same world and visual grammar, and a different task.
// ---------------------------------------------------------------------------

// The approved task text, as the owner wrote it. Matched against the string so
// an edit to the task in api/production/generate-copy.js fails here.
const NO_PEOPLE_TASK_PARAGRAPHS = [
  "You write the direction for one photograph. Below are three moments from this brand's world, and you write one direction from each. A direction is one photograph taken inside a moment, at a point when nobody is in the frame. The moment says who is there, where, when and what is going on. Yours is what a camera saw in that place a few minutes before they arrived, a few minutes after they left, or at an hour when the room is theirs but empty.",
  "The people are still the reason the room looks the way it does. They are the kind of people THE LIVED WORLD describes, and nobody in particular: the room belongs to someone cast from that description who has appeared in no other picture of this brand. Write what their activity left behind: a chair at the angle someone pushed it to, tools laid out in the order they were being used, a cup with something still in it, a surface worn where hands go. Use the moment's place and its time. Do not write a person into the frame, do not write a hand or part of a body, and do not say that the room is empty. Describe what is there completely enough that there is nothing left to add.",
  "Name one thing in the frame that is not the product and give it size and position, so the eye has somewhere to land first. Without a person the frame has no natural subject, and whatever is largest and most contrasted becomes one. A direction is one instant, so the room is in one state rather than several. It names a few objects that belong there and gives each one a state and the reason it is in that state. It describes light by where it comes from and how it behaves on what it hits. Every sentence is something the camera can record, so a sentence about what the picture means is a sentence to cut. A direction is what was in front of the lens rather than how the film rendered it, so the color, the grain, the contrast, the focus and the lens are set elsewhere in this prompt and do not belong in the prose.",
  "Where a product is named below, it appears once. It sits where someone set it down on a surface in the room, and it is never the subject and never centered.",
  "The three directions are not all at the same distance from the people. One is a place someone left minutes ago. One is a place at rest. In one the product is the closest thing the frame has to a subject.",
];

test("the peopleless kind carries the approved task text", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", random: () => 0.5 });
  const blocks = system.split("\n\n");
  assert.equal(blocks.length > NO_PEOPLE_TASK_PARAGRAPHS.length, true);
  NO_PEOPLE_TASK_PARAGRAPHS.forEach((paragraph, index) => {
    assert.equal(blocks[index], paragraph, `paragraph ${index + 1} is the approved text`);
  });
  // Five paragraphs and nothing inserted after them, so the context starts
  // where it does on the people kind.
  assert.equal(blocks[NO_PEOPLE_TASK_PARAGRAPHS.length].startsWith("BRAND:"), true);
  // And the people kind's task is not what arrived.
  assert.equal(system.includes("Write the photograph, not the moment."), false);
});

test("the peopleless kind takes the scene output shape and the scene word budget", async () => {
  const short = await runSceneBrief({ moments: [moment(1)], kind: "template_surface", random: () => 0.5 });
  const scene = await runSceneBrief({ moments: [moment(1)], kind: "scene", random: () => 0.5 });
  const peopleless = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", random: () => 0.5 });

  const outputFormat = (system) => system.split("OUTPUT FORMAT:\n")[1];
  assert.equal(outputFormat(peopleless.system), outputFormat(scene.system));
  assert.match(outputFormat(peopleless.system), /between 120 and 220 words/);
  assert.equal(peopleless.sent.max_tokens, scene.sent.max_tokens);
  assert.equal(peopleless.sent.max_tokens, 2200);

  // And the short-brief branch is still the short-brief branch.
  assert.notEqual(outputFormat(short.system), outputFormat(scene.system));
  assert.equal(short.sent.max_tokens, 800);
  assert.match(short.system, /Two or three sentences per brief/);
  assert.equal(peopleless.system.includes("Two or three sentences per brief"), false);
});

test("the peopleless kind keeps the cast and says whose place this is", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", random: () => 0.5 });
  // The cast description and the examples, names and all.
  assert.match(system, /People who fix things for a living and talk while they work\./);
  assert.match(system, /Dana\. 27, runs the front of a bike shop\./);
  assert.match(system, /The people whose place this is\. Their activity is the reason the room is in the state it is in:/);
  assert.equal(system.includes("Write these people, by name. Do not invent others"), false);
  // The grammar's people section arrives under a label that says whose place
  // it is, and the people kind's label does not appear.
  assert.equal(system.includes("Who appears on camera"), false);
});

// ---------------------------------------------------------------------------
// ADR 0019: the writer reads the evolved world, and casts from a description
// ---------------------------------------------------------------------------

test("the writer reads the evolved world when present, the today world when not, and the legacy root otherwise", async () => {
  const evolved = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, shape: "evolved" });
  assert.match(evolved.system, /People who repair rather than replace/);
  assert.match(evolved.system, /Ola\. 34, reupholsters chairs out of a garage\./);
  assert.match(evolved.system, /Tungsten work lamp\./);
  assert.equal(evolved.system.includes("People who fix things for a living"), false, "the today world is not sent when the evolved one is");
  assert.equal(evolved.reply.world, "evolved");

  const today = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, shape: "today" });
  assert.match(today.system, /People who fix things for a living/);
  assert.equal(today.system.includes("Ola."), false);
  assert.equal(today.reply.world, "today");

  const legacy = await runSceneBrief({ moments: [moment(1)], random: () => 0.5, shape: "legacy" });
  assert.match(legacy.system, /Dana\. 27, runs the front of a bike shop\./);
  assert.match(legacy.system, /One north window\./);
  assert.equal(legacy.reply.world, "today");

  // The function that decides, on its own.
  assert.equal(selectWorldArtifacts({ artifacts: { today: { a: 1 }, evolved: { b: 2 } } }).world, "evolved");
  assert.equal(selectWorldArtifacts({ artifacts: { today: { a: 1 } } }).world, "today");
  assert.deepEqual(selectWorldArtifacts({ artifacts: { livedWorld: {} } }), { world: "today", artifacts: { livedWorld: {} } });
  assert.deepEqual(selectWorldArtifacts(null), { world: "today", artifacts: {} });
});

test("the people block carries the cast description and the examples, and the roster instruction is gone", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  assert.match(system, /These are the kind of people who belong here\. Cast someone new for this picture from this description, and never reuse an example's name:\nPeople who fix things for a living and talk while they work\.\nExamples to cast from, not to reuse:\nDana\. 27, runs the front of a bike shop\./);
  assert.equal(system.includes("Write these people, by name. Do not invent others"), false);
  assert.equal(system.includes("Do not invent others"), false);
});

test("the moments line carries prose who and the situation", async () => {
  const { system } = await runSceneBrief({ moments: [moment(3)], random: () => 0.5 });
  assert.match(system, /Moment 3\. Late afternoon, Room 3\. Who is there: One person, alone\. Someone does thing 3\. It means something 3\./);
  // A legacy brain's id list still resolves through its people list.
  const legacyMoment = { ...moment(4), who: ["person-1"], situation: undefined, doing: "Dana does thing 4." };
  const legacy = await runSceneBrief({ moments: [legacyMoment], random: () => 0.5, shape: "legacy" });
  assert.match(legacy.system, /Moment 4\. Late afternoon, Room 4\. Dana is there\. Dana does thing 4\./);
});

test("the task's people paragraph casts from the description and says nobody recurs", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  const paragraph = system.split("\n\n")[1];
  assert.equal(
    paragraph,
    "Take the moment's people, its place, and its time, and write what a camera in that room would see. The people are cast from the description in THE LIVED WORLD: write particular people who belong there, with what they are doing and how they carry themselves, and do not describe anyone by their job or their age bracket. Nobody in this frame has appeared in another picture of this brand, so do not use an example's name and do not write an example as themselves.",
  );
  assert.equal(system.includes("Use their names and write them as themselves."), false);
  const peopleless = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", random: () => 0.5 });
  assert.match(peopleless.system.split("\n\n")[1], /^The people are still the reason the room looks the way it does\. They are the kind of people THE LIVED WORLD describes, and nobody in particular: the room belongs to someone cast from that description who has appeared in no other picture of this brand\. Write what their activity left behind:/);
});

test("a look on the peopleless kind carries the sentence that suspends its subject behavior", async () => {
  const look = resolveLook("neutral");
  const { system } = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", look: "neutral", random: () => 0.5 });
  assert.ok(system.includes(`- This image is made with a specific photographic medium and the direction has to be something that medium can actually produce: ${look.line}`));
  assert.ok(system.includes(
    "- Nobody is in the frame, so anything that medium says about how a subject behaves on camera, how a face or skin renders, or how a person holds themselves does not apply here. Its color, its contrast, its grain, and how it holds or loses focus apply in full."
  ), "the precedence sentence is in the RULES block");

  // Three look lines on this kind with a look, and none of them on the people
  // kind, where the medium still governs behavior in frame.
  const rules = (system) => system.split("RULES:\n")[1].split("\n\nOUTPUT FORMAT:")[0].split("\n").filter((line) => line.startsWith("- "));
  assert.equal(rules(system).length, 5);
  const people = await runSceneBrief({ moments: [moment(1)], kind: "scene", look: "neutral", random: () => 0.5 });
  assert.equal(rules(people.system).length, 4);
  assert.equal(people.system.includes("Nobody is in the frame"), false);

});

test("the peopleless kind resolves the default look at suggest time", async () => {
  const fallback = resolveLook(SCENE_NO_PEOPLE_DEFAULT_LOOK);
  const { system } = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", random: () => 0.5 });
  // The direction is written for the medium rather than fitted to it at compile
  // time, so the writer sees the default the compiler would have supplied.
  assert.ok(system.includes(fallback.line), "the default look's line reaches the writer");
  assert.ok(system.includes("Nobody is in the frame, so anything that medium says"), "and its subject behavior is suspended");
  // The default is environment-agnostic, so it leaves the setting to the brand.
  assert.equal(fallback.environment, "agnostic");
  assert.ok(system.includes(
    "- That medium works in any setting, so the environment stays governed by the brand's earned environments."
  ), "an unasked-for default does not decide where the scene is set");

  // A chosen look still wins over the default.
  const chosen = await runSceneBrief({ moments: [moment(1)], kind: "scene_no_people", look: "film_noir", random: () => 0.5 });
  assert.ok(chosen.system.includes(resolveLook("film_noir").line));
  assert.equal(chosen.system.includes(fallback.line), false);

  // And the people kind defaults to nothing, exactly as before.
  const people = await runSceneBrief({ moments: [moment(1)], kind: "scene", random: () => 0.5 });
  const rules = people.system.split("RULES:\n")[1].split("\n\nOUTPUT FORMAT:")[0];
  assert.equal(rules.split("\n").filter((line) => line.startsWith("- ")).length, 2);
  assert.equal(people.system.includes(fallback.line), false);
});

// ---------------------------------------------------------------------------
// The kind reaching the compiler
// ---------------------------------------------------------------------------

function compileBrain() {
  const section = (id, name) => ({
    id,
    name,
    summary: `${name} summary from approved guidance.`,
    principles: [`Follow ${name.toLowerCase()} deliberately`],
    productionUse: `Use the approved ${name.toLowerCase()} direction.`,
  });
  return {
    brandName: "Fallow",
    brandDescription: "A quiet home goods brand",
    synthesisSummary: "Make ordinary domestic moments feel considered.",
    guidanceSections: [
      section("foundation", "Brand foundation"),
      section("identity", "Identity"),
      section("world", "World and story"),
      section("voice", "Voice and messaging"),
      section("creative", "Creative direction"),
      section("rules", "Creative rules"),
    ],
    artifacts: {
      dossier: {
        readBody: "Fallow finds character in useful, lived-in rooms.",
        audience: "People who value useful objects and unforced beauty.",
        desiredFeeling: "Calm, observant, and at home.",
        palette: [{ name: "Clay", role: "Warmth", color: "#A36F54" }],
        materials: ["Worn oak", "Washed linen", "Soft daylight"],
        guardrails: [{ title: "Never pristine", body: "The world should show real use." }],
      },
    },
  };
}

function compileBrief(extra = {}) {
  return {
    scene: "A person arranging flowers at a worn kitchen table in morning light.",
    exclusions: "No showroom polish or readable copy.",
    placement: "Instagram feed",
    format: "4:5 portrait",
    ...extra,
  };
}

const capture = (pkg) => pkg.sections.find((section) => section.title === "Capture")?.body;

test("a peopleless compile with no look chosen resolves the default look instead of the capture floor", () => {
  const pkg = compileBrandWorldImagePackage({
    approvedBrain: compileBrain(),
    brainVersion: 4,
    brief: compileBrief({ kind: "scene_no_people" }),
    references: [],
  });
  const fallback = resolveLook(SCENE_NO_PEOPLE_DEFAULT_LOOK);
  assert.equal(capture(pkg), fallback.line);
  // The floor is a paragraph mostly about skin, and it appears nowhere.
  assert.equal(pkg.prompt.includes(CAPTURE_CHARACTER), false);
  // A defaulted look is a real look on the record, so the result screen can
  // name the medium without knowing whether the user chose it.
  assert.equal(pkg.look?.id, SCENE_NO_PEOPLE_DEFAULT_LOOK);
  assert.equal(pkg.kind, "scene_no_people");
});

test("a peopleless compile with a look chosen uses that look, not the default", () => {
  const pkg = compileBrandWorldImagePackage({
    approvedBrain: compileBrain(),
    brainVersion: 4,
    brief: compileBrief({ kind: "scene_no_people" }),
    references: [],
    look: "neutral",
  });
  assert.equal(pkg.look?.id, "neutral");
  assert.equal(capture(pkg), resolveLook("neutral").line);
  assert.equal(capture(pkg) === resolveLook(SCENE_NO_PEOPLE_DEFAULT_LOOK).line, false);
});

test("a scene compile with no look still falls back to the shared capture floor", () => {
  for (const brief of [compileBrief(), compileBrief({ kind: "scene" })]) {
    const pkg = compileBrandWorldImagePackage({ approvedBrain: compileBrain(), brainVersion: 4, brief, references: [] });
    assert.equal(capture(pkg), CAPTURE_CHARACTER);
    assert.equal(pkg.look, null);
    assert.equal(pkg.kind, "scene");
  }
});

// The compiled scene prompt and sections, hashed at 14f7e6836e, the commit this
// work was written against. The kind reaching the compiler must not move a byte
// of what a with-people render sends.
//
// The package object itself is not hashed here, because it now carries one key
// it did not carry at that commit: `kind`. That key is the record of which kind
// made the image and is asserted above. Every other field, and the whole of the
// prompt and the sections, is unchanged.
const BASE_COMMIT_SCENE_PROMPT_SHA = "a0191d7329702644f51ccf24b84c9f3a081b81d36cf0e0f0fb987936e7518c38";
const BASE_COMMIT_SCENE_SECTIONS_SHA = "1cbaed05a833dc8607c5297d7ade107eb7c811eb3d8c775d3889a91031377c5e";

test("a compiled scene prompt is byte identical to the base commit", () => {
  const pkg = compileBrandWorldImagePackage({
    approvedBrain: compileBrain(),
    brainVersion: 4,
    brief: compileBrief(),
    references: [],
  });
  const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
  assert.equal(sha(pkg.prompt), BASE_COMMIT_SCENE_PROMPT_SHA);
  assert.equal(sha(JSON.stringify(pkg.sections)), BASE_COMMIT_SCENE_SECTIONS_SHA);

  // And the kind on the brief changes nothing on the scene path.
  const explicit = compileBrandWorldImagePackage({
    approvedBrain: compileBrain(),
    brainVersion: 4,
    brief: compileBrief({ kind: "scene" }),
    references: [],
  });
  assert.equal(explicit.prompt, pkg.prompt);
});
