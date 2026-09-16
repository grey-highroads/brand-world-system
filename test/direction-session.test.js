import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  availableReachLevels,
  directionRecordAsSource,
  directionRecordProse,
  emptyDirectionRecord,
  normalizeDirectionRecord,
} from "../src/direction/record.js";
import {
  buildDirectionSessionInstruction,
  directionSessionFoundation,
  directionSessionModel,
  directionSessionReviewQuestions,
  runDirectionSessionTurn,
} from "../src/direction/session.js";
import { createFileBrandBrainStore } from "../src/brand-brain/store.js";
import { synthesizeBrandBrain } from "../src/brand-brain/service.js";

// ---------------------------------------------------------------------------
// Fixtures. The store mirrors passStore in brand-brain-openai.test.js with
// the direction capability added, because the service gates every ADR 0021
// behavior on the store being able to hold a record.
// ---------------------------------------------------------------------------

function directionStore(initial = null, direction = null) {
  let stored = initial;
  let inProgress = null;
  let record = direction;
  const backups = [];
  return {
    saved: () => stored,
    inProgress: () => inProgress,
    backups: () => backups,
    async read() { return stored; },
    async write(value) { stored = value; },
    async writeBackup(value) { backups.push(value); },
    async readInProgress() { return inProgress; },
    async writeInProgress(value) { inProgress = value; },
    async clearInProgress() { inProgress = null; },
    async readDirection() { return record; },
    async writeDirection(value) { record = value; },
  };
}

function passOutput(passId) {
  return {
    1: {
      brandName: "MycoPop",
      brandDescription: "Canned functional beverage",
      synthesisSummary: "Retro without wellness.",
      cleanAssetCount: 2,
      guidanceSections: ["foundation", "identity", "world", "voice", "creative", "rules"].map((id) => ({ id, name: id })),
      reviewQuestions: [{ id: "q-1", type: "other" }],
      dossier: { readBody: "A can against energy drinks." },
    },
    2: { livedWorld: { audienceEvidence: "not established", cast: { description: "Reasoned from the can; nobody has met them.", examples: [{ name: "Placeholder", who: "Reasoned." }] } }, reviewQuestions: [] },
    3: { storyArchitecture: { moments: [{ id: "moment-1" }] }, reviewQuestions: [] },
    4: { visualGrammar: { sections: { people: [{ id: "people-1" }] } }, reviewQuestions: [] },
    5: { dossier: { readBody: "The can the direction described." }, reviewQuestions: [] },
    6: { livedWorld: { cast: { description: "The people the session decided.", examples: [{ name: "Rae", who: "Rae, 29." }] } }, reviewQuestions: [] },
    7: { storyArchitecture: { moments: [{ id: "moment-e1" }] }, reviewQuestions: [] },
    8: { visualGrammar: { sections: { people: [{ id: "people-e1" }] } }, reviewQuestions: [] },
  }[passId];
}

function fakeSynthesize(seen) {
  return async (call) => {
    seen.push(call);
    return { result: passOutput(call.passId), responseId: `r-${call.passId}`, model: "test", usage: null };
  };
}

async function runInitialPasses(store, seen, passes) {
  let last = null;
  for (const pass of passes) {
    last = await synthesizeBrandBrain(
      pass === 1
        ? { pass, mode: "initial", requestId: "direction-test", sources: [{ id: "site", name: "Site", authority: "brand-evidence", content: "The brand's site.", files: [] }] }
        : pass >= 5
        ? { pass, requestId: "direction-test", reach: "a new world" }
        : { pass, requestId: "direction-test" },
      { store, env: { OPENAI_API_KEY: "test-only" }, synthesize: fakeSynthesize(seen) },
    );
    if (last.complete) break;
  }
  return last;
}

function recordWithAllOrigins(status = "proposed") {
  const record = emptyDirectionRecord({ brandName: "MycoPop", model: "gpt-5.6" });
  record.sections.territory.push({ text: "Late 20s, into shows and skating, off the clock.", origin: "stated", entryKind: "rule", at: "2026-09-15T00:00:00.000Z" });
  record.sections.light.push({ text: "One practical source per room, the far side goes dark.", origin: "chosen", entryKind: "rule", at: "2026-09-15T00:01:00.000Z" });
  record.sections.register.push({ text: "Four of them crowded around a borrowed amp.", origin: "chosen", entryKind: "example", at: "2026-09-15T00:04:00.000Z" });
  record.sections.people.push({ text: "Neon gradients laid over the photograph.", origin: "rejected", entryKind: "rule", at: "2026-09-15T00:02:00.000Z" });
  record.status = status;
  if (status === "approved") record.approvedAt = "2026-09-15T00:03:00.000Z";
  return record;
}

function savedBrain({ audienceEvidence = "not established" } = {}) {
  return {
    kind: "synthesis",
    sources: [{ id: "site", name: "Site" }],
    result: { brandName: "MycoPop" },
    approvedResult: {
      brandName: "MycoPop",
      brandDescription: "Canned functional beverage",
      reviewQuestions: [
        { id: "q-open", title: "Who is this for", summary: "No customer evidence was supplied.", rationale: "The Lived World was reasoned from the can.", actions: [] },
        {
          id: "q-ruled",
          title: "Two palettes disagree",
          summary: "The site and the deck use different greens.",
          rationale: "Production needs one.",
          actions: [{ id: "keep-site", label: "Keep the site palette", detail: "The deck predates the rebrand." }],
        },
      ],
      artifacts: {
        today: {
          dossier: {
            productTruth: "No caffeine, functional mushrooms, positioned against energy drinks.",
            proof: ["Clean label"],
            materials: ["Aluminum can"],
            culturalCodes: "",
            palette: [{ name: "Deep plum", role: "Primary", color: "#3a1f47" }],
            guardrails: [{ title: "No medical claims", body: "The brand refuses wellness-outcome claims." }],
            audience: "",
            desiredFeeling: "",
          },
          livedWorld: { audienceEvidence, cast: { description: "Reasoned from the brand's own material; nobody has met them." } },
          storyArchitecture: { moments: [] },
          visualGrammar: { sections: {} },
        },
      },
    },
    brain: { artifactStatus: "ready", resolutions: { "q-ruled": "keep-site" } },
  };
}

function cannedTurn(payload) {
  return async () => ({ model: "gpt-5.6-test", choices: [{ message: { content: JSON.stringify(payload) } }] });
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

test("a record with entries of all three origins round-trips through the store unchanged", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "bws-direction-"));
  const store = createFileBrandBrainStore(path.join(dir, "state", "current.json"));
  const record = normalizeDirectionRecord(recordWithAllOrigins("approved"));
  await store.writeDirection(record);
  const read = await store.readDirection();
  assert.deepEqual(read, record);
  assert.deepEqual(
    read.sections.territory.concat(read.sections.light, read.sections.people).map((entry) => entry.origin),
    ["stated", "chosen", "rejected"],
  );
  assert.deepEqual(read.sections.register.map((entry) => entry.entryKind), ["example"]);
  // Normalizing what came back changes nothing: the stored shape is the shape.
  assert.deepEqual(normalizeDirectionRecord(read), record);
  await fs.rm(dir, { recursive: true, force: true });
});

test("the prose keeps rejections visible and the source carries the direction flags", () => {
  const record = recordWithAllOrigins("approved");
  const prose = directionRecordProse(record);
  assert.match(prose, /The world:/);
  assert.match(prose, /How it is lit:/);
  assert.match(prose, /Ruled out:\n- Neon gradients laid over the photograph\./);
  // An example is labelled as one and carries the instruction not to
  // reproduce it. This is the line that stops one described scene becoming
  // the whole world.
  assert.match(prose, /For example, and not to be reproduced: Four of them crowded around a borrowed amp\./);
  assert.match(prose, /Examples illustrate a rule and are not scenes to reproduce/);
  assert.match(prose, /cast someone new for every picture/);
  assert.doesNotMatch(prose, /\u2014|\u2013/, "no em or en dash in what synthesis reads");

  const source = directionRecordAsSource(record);
  assert.equal(source.id, "direction-record");
  assert.equal(source.provenance, "ours");
  assert.equal(source.aspiration, "aspiration");
  assert.equal(source.influence, "Lead");
  assert.match(source.content, /direction session/i);
  assert.match(source.usage, /casting range rather than a cast list/);
});

test("the reach list holds only a new world when the audience is not established, and never it otherwise", () => {
  assert.deepEqual(availableReachLevels({ audienceEvidence: "not established" }), ["a new world"]);
  assert.deepEqual(availableReachLevels({ audienceEvidence: "established" }), ["a few touches", "a clear direction"]);
});

// ---------------------------------------------------------------------------
// The session route
// ---------------------------------------------------------------------------

test("the session payload carries the open review questions, and a ruled one with its ruling", () => {
  const saved = savedBrain();
  const questions = directionSessionReviewQuestions(saved);
  assert.deepEqual(questions.unanswered.map((q) => q.title), ["Who is this for"]);
  assert.equal(questions.answered.length, 1);
  assert.equal(questions.answered[0].title, "Two palettes disagree");
  assert.match(questions.answered[0].ruling, /Keep the site palette/);

  const instruction = buildDirectionSessionInstruction({
    foundation: directionSessionFoundation(saved),
    reviewQuestions: questions,
    record: emptyDirectionRecord({ brandName: "MycoPop" }),
    arrival: "stated",
    reachLevels: ["a new world"],
  });
  assert.match(instruction, /Who is this for/);
  assert.match(instruction, /Keep the site palette/);
  assert.match(instruction, /The ruled ones carry the owner's answer and are settled/);
  assert.match(instruction, /Available levels for this brand: "a new world"\./);
  assert.doesNotMatch(instruction, /"a few touches"/);
  // The session proposes rather than interviews, and records rules rather
  // than scenes. Both are the point of the 2026-09-15 reshape.
  assert.match(instruction, /You propose, they react/);
  assert.match(instruction, /A world is not a scene/);
  assert.match(instruction, /Write rules, not scenes/);
  // The people are written deep and as a casting range. Both halves matter:
  // a vague description gives the writer nothing, and a recurring named
  // person puts the same face in every frame.
  assert.match(instruction, /casting range, never as a character/);
  assert.match(instruction, /twenty pictures cast twenty different people/);
  assert.match(instruction, /Reach past occupation/);
});

test("a settled audience runs the same session, held fixed rather than reopened", async () => {
  const store = directionStore(savedBrain({ audienceEvidence: "established" }));
  const turn = await runDirectionSessionTurn(
    { message: "Make it look like a bigger brand.", arrival: "stated" },
    { store, env: { OPENAI_API_KEY: "x" }, complete: cannedTurn({ reply: "Here are two.", worlds: [], options: [], entries: [], reach: null }) },
  );
  assert.equal(turn.settled, true);
  assert.deepEqual(turn.reachLevels, ["a few touches", "a clear direction"]);

  const instruction = buildDirectionSessionInstruction({
    foundation: directionSessionFoundation(saved
      = savedBrain({ audienceEvidence: "established" })),
    reviewQuestions: { unanswered: [], answered: [] },
    record: emptyDirectionRecord({ brandName: "Simply Agree" }),
    arrival: "stated",
    reachLevels: ["a few touches", "a clear direction"],
    settled: true,
  });
  assert.match(instruction, /audience is settled/);
  assert.match(instruction, /never reopen them/);
  assert.match(instruction, /sophisticated reads as clean/);
  assert.doesNotMatch(instruction, /not established/);
});
let saved;

test("the session runs off the foundation read, before the brand today is approved", async () => {
  // The session is where the world gets decided, so it no longer waits behind
  // a full four pass synthesis and an approval of a world nobody directed.
  const unapproved = savedBrain();
  unapproved.result = unapproved.approvedResult;
  delete unapproved.approvedResult;
  unapproved.brain = { artifactStatus: "draft" };
  const store = directionStore(unapproved);
  const turn = await runDirectionSessionTurn(
    { message: "Hello." },
    { store, env: { OPENAI_API_KEY: "x" }, complete: cannedTurn({ reply: "Here are two worlds.", worlds: [], options: [], entries: [], reach: null }) },
  );
  assert.equal(turn.reply, "Here are two worlds.");
});

test("the session refuses when the sources have not been read at all", async () => {
  const store = directionStore({ kind: "synthesis", sources: [], brain: {} });
  await assert.rejects(
    runDirectionSessionTurn({ message: "Hello." }, { store, env: {}, complete: cannedTurn({}) }),
    /Read the brand's sources first/,
  );
});

test("a turn keeps valid entries, tags unknown origins with the arrival, and drops a reach outside the list", async () => {
  const store = directionStore(savedBrain());
  const turn = await runDirectionSessionTurn(
    {
      message: "They are into bikes and live shows.",
      arrival: "stated",
      record: emptyDirectionRecord({ brandName: "MycoPop" }),
      turns: [{ role: "session", text: "Who do you picture holding this can?" }],
    },
    {
      store,
      env: { OPENAI_API_KEY: "x" },
      complete: cannedTurn({
        reply: "Where do they spend a Saturday?",
        options: ["Show me some territories", "I know what it is NOT"],
        worlds: [{ name: "Late shift", sketch: "A territory with room in it." }, { name: "", sketch: "dropped" }],
        entries: [
          { section: "territory", text: "Into shows and skating.", origin: "stated", entryKind: "rule" },
          { section: "not-a-section", text: "Dropped.", origin: "stated", entryKind: "rule" },
          { section: "light", text: "", origin: "chosen", entryKind: "rule" },
          { section: "register", text: "Nobody is working.", origin: "invented", entryKind: "scene" },
        ],
        reach: { level: "a few touches", because: "Off the list for this brand.", tradeoff: "" },
      }),
    },
  );
  assert.equal(turn.reply, "Where do they spend a Saturday?");
  assert.deepEqual(turn.entries, [
    { section: "territory", text: "Into shows and skating.", origin: "stated", entryKind: "rule" },
    { section: "register", text: "Nobody is working.", origin: "stated", entryKind: "rule" },
  ]);
  assert.deepEqual(turn.worlds, [{ name: "Late shift", sketch: "A territory with room in it." }]);
  assert.equal(turn.settled, false);
  assert.equal(turn.reach, null, "a level outside this brand's list is not a recommendation");
  assert.deepEqual(turn.reachLevels, ["a new world"]);
  assert.equal(turn.model, "gpt-5.6-test");
});

test("the session model follows the environment override and falls back to the synthesis model", () => {
  assert.equal(directionSessionModel({ OPENAI_DIRECTION_MODEL: "gpt-x" }), "gpt-x");
  assert.equal(directionSessionModel({ OPENAI_MODEL: "gpt-5.6" }), "gpt-5.6");
  assert.equal(typeof directionSessionModel({}), "string");
});

// ---------------------------------------------------------------------------
// Stopping at pass 4, and the record as a source
// ---------------------------------------------------------------------------

test("an initial synthesis for a brand with no approved direction record stops after pass 4 and saves the today world", async () => {
  const store = directionStore(null, null);
  const seen = [];
  const last = await runInitialPasses(store, seen, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seen.map((call) => call.passId), [1, 2, 3, 4], "the evolved passes did not run");
  assert.equal(last.complete, true);
  assert.equal(last.pass, 4);
  const saved = store.saved();
  assert.equal(saved.kind, "synthesis");
  assert.equal(saved.result.artifacts.today.livedWorld.audienceEvidence, "not established");
  assert.equal("evolved" in saved.result.artifacts, false, "no empty evolved world rides the saved brain");
  assert.equal(saved.reach, null);
  assert.equal(store.inProgress(), null);
});

test("a proposed direction record still stops the initial synthesis at pass 4", async () => {
  const store = directionStore(null, recordWithAllOrigins("proposed"));
  const seen = [];
  const last = await runInitialPasses(store, seen, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seen.map((call) => call.passId), [1, 2, 3, 4]);
  assert.equal(last.complete, true);
  for (const call of seen) {
    assert.equal(call.sources.some((source) => source.id === "direction-record"), false, "a proposed record is not returned to synthesis");
  }
});

test("a brand with an approved direction record runs all eight, and the record reaches only the evolved registers", async () => {
  const store = directionStore(null, recordWithAllOrigins("approved"));
  const seen = [];
  const last = await runInitialPasses(store, seen, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(seen.map((call) => call.passId), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(last.complete, true);
  assert.equal(last.pass, 8);
  for (const call of seen.slice(0, 4)) {
    assert.equal(call.sources.some((source) => source.id === "direction-record"), false, `the today pass ${call.passId} never sees direction material`);
  }
  for (const call of seen.slice(4)) {
    const direction = call.sources.find((source) => source.id === "direction-record");
    assert.ok(direction, `the evolved pass ${call.passId} reads the record`);
    assert.equal(direction.provenance, "ours");
    assert.equal(direction.aspiration, "aspiration");
  }
  const saved = store.saved();
  assert.deepEqual(Object.keys(saved.result.artifacts).sort(), ["evolved", "today"]);
  assert.equal(saved.sources.some((source) => source.id === "direction-record"), false, "the intake list stays what the user supplied");
});

test("an evolved-only run reads the approved record as a source, and not a proposed one", async () => {
  async function evolvedRegister(record) {
    const base = directionStore(null, null);
    const seen = [];
    await runInitialPasses(base, seen, [1, 2, 3, 4]);
    const four = base.saved();
    await base.write({ ...four, approvedResult: { ...four.result }, brain: { artifactStatus: "ready", approvedVersion: 1 } });
    await base.writeDirection(record);
    const evolvedSeen = [];
    for (const pass of [5, 6, 7, 8]) {
      await synthesizeBrandBrain(
        pass === 5
          ? { pass, mode: "evolved", requestId: "evolved-direction-test", reach: "a new world" }
          : { pass, requestId: "evolved-direction-test", reach: "a new world" },
        { store: base, env: { OPENAI_API_KEY: "test-only" }, synthesize: fakeSynthesize(evolvedSeen) },
      );
    }
    return evolvedSeen;
  }

  const withApproved = await evolvedRegister(recordWithAllOrigins("approved"));
  for (const call of withApproved) {
    assert.ok(call.sources.some((source) => source.id === "direction-record"), `pass ${call.passId} reads the approved record`);
  }
  const withProposed = await evolvedRegister(recordWithAllOrigins("proposed"));
  for (const call of withProposed) {
    assert.equal(call.sources.some((source) => source.id === "direction-record"), false, `pass ${call.passId} does not read a proposed record`);
  }
});

// ---------------------------------------------------------------------------
// The world document
// ---------------------------------------------------------------------------

test("the world round-trips, counts its words, and renders as one piece of prose", async () => {
  const { emptyWorld, normalizeWorld, worldIsWritten, worldProse, worldWordCount, worldAsSource } = await import("../src/direction/world.js");
  const world = emptyWorld({ brandName: "MycoPop", model: "gpt-5.6" });
  assert.equal(worldIsWritten(world), false);
  world.title = "Nothing on the calendar";
  world.sections.thesis = "A world of people with time they did not have to ask for.";
  world.sections.people = "Late twenties into late thirties, in it for the thing rather than the scene around it.";
  world.sections.places = "A field at the back of a festival, a stairwell, a car park at two in the morning.";
  world.decisions = [
    { text: "No optimization language anywhere in frame.", because: "Reads as wellness.", scope: "this brand", active: true },
    { text: "That one kitchen with the marble island.", because: "Too staged.", scope: "this picture", active: true },
  ];
  const clean = normalizeWorld(world);
  assert.equal(worldIsWritten(clean), true);
  assert.ok(worldWordCount(clean) > 20);

  const prose = worldProse(clean);
  assert.match(prose, /## The people/);
  assert.match(prose, /## Where it happens/);
  assert.doesNotMatch(prose, /## What is around them/, "an empty section writes nothing");
  // Only brand scoped decisions travel. A rejection about one picture is not
  // a rule about the world.
  assert.match(prose, /No optimization language/);
  assert.doesNotMatch(prose, /marble island/);
  assert.doesNotMatch(prose, /\u2014|\u2013/);

  const source = worldAsSource(clean);
  assert.equal(source.provenance, "ours");
  assert.equal(source.aspiration, "aspiration");
  assert.match(source.usage, /casting range rather than a cast list/);
  assert.match(source.usage, /possibilities to depart from/);
});

test("the authoring instruction sends the facts, the session, and the decisions", async () => {
  const { buildWorldAuthoringInstruction, worldAuthoringSchema } = await import("../src/direction/author.js");
  const instruction = buildWorldAuthoringInstruction({
    foundation: { brand: "MycoPop", productTruth: "No caffeine." },
    transcript: "PROPOSED: Two worlds.\n\nOWNER: The second one, without the garage.",
    landed: "The second one.",
    decisions: [{ text: "No garages.", because: "Reads as labor.", scope: "this brand", active: true }],
  });
  assert.match(instruction, /No caffeine/);
  assert.match(instruction, /without the garage/);
  assert.match(instruction, /Reads as labor/);
  assert.match(instruction, /Write it long/);
  assert.match(instruction, /casting range, never a cast/);
  assert.match(instruction, /twenty pictures of tables/);
  assert.doesNotMatch(instruction, /\u2014/);
  // Every section the document holds is asked for in one call, so the parts
  // are written against each other rather than separately.
  assert.deepEqual(Object.keys(worldAuthoringSchema.properties.sections.properties).length, 9);
});

test("an approved world replaces the derived artifacts in the writer's context", async () => {
  const { buildSceneRequest } = await import("../api/production/generate-copy.js").then((mod) => ({ buildSceneRequest: mod.worldSceneTask }));
  const task = buildSceneRequest({ peopleless: false, count: 3 });
  assert.match(task, /each one is a different picture from this brand's world/);
  assert.match(task, /possibilities to depart from rather than a list to work through/);
  assert.match(task, /pictures of people sitting at tables is a failure/);
  assert.doesNotMatch(task, /three moments/);
});
