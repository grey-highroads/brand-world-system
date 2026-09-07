import assert from "node:assert/strict";
import test from "node:test";
import { SCENE_MOMENT_COUNT, handleSceneBrief, selectMoments } from "../api/production/generate-copy.js";

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
    who: ["person-1"],
    doing: `Dana does thing ${index}.`,
    feeling: `It means something ${index}.`,
  };
}

function brainWith(moments) {
  return {
    brandName: "Fallow",
    brandDescription: "A quiet home goods brand.",
    artifacts: {
      livedWorld: {
        people: [{ id: "person-1", name: "Dana", who: "27, runs the front of a bike shop." }],
      },
      storyArchitecture: { rhythm: "Pressure, then release.", moments },
      visualGrammar: { sections: { light: [{ id: "light-1", statement: "One north window." }] } },
    },
  };
}

// Runs the writer with a stubbed model call and returns what it sent and what
// it replied. The random source is handed in, so a pick is a fact rather than a
// coin toss inside an assertion.
async function runSceneBrief({ moments, random, kind = "scene" }) {
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
      body: { action: "scene_brief", kind },
      brain: brainWith(moments),
      product: null,
      apiKey: "test-only",
      response,
      random,
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
  return { system: sent.messages[0].content, reply: JSON.parse(response.body) };
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
  assert.match(system, /Moment 1\. Late afternoon, Room 1\. Dana is there\. Dana does thing 1\. It means something 1\./);
});

test("the task tells the writer to photograph the moment rather than transcribe it", async () => {
  const { system } = await runSceneBrief({ moments: [moment(1)], random: () => 0.5 });
  assert.match(system, /A direction is one photograph taken inside a moment/);
  assert.match(system, /a few minutes either side is a different photograph/);
  assert.match(system, /Write the photograph, not the moment/);
  assert.match(system, /A direction is one instant, so every person is in the middle of one thing rather than several in a row/);
  // The instruction that produced the transcription is gone.
  assert.doesNotMatch(system, /each built from one of the moments in THE STORY/);
  // The paragraphs the rewrite was told to leave alone are intact.
  assert.match(system, /The people are the ones named in THE LIVED WORLD/);
  assert.match(system, /it is present in the scene as one object among several/);
});

test("template and sales element kinds are untouched by moment selection", async () => {
  const moments = Array.from({ length: 12 }, (unused, index) => moment(index + 1));
  for (const kind of ["template_surface", "sales_element"]) {
    const { system } = await runSceneBrief({ moments, kind, random: () => 0.5 });
    assert.doesNotMatch(system, /A direction is one photograph taken inside a moment/);
    assert.match(system, kind === "template_surface" ? /reusable branded background surfaces/ : /sit on top of a branded template/);
  }
});
