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
  record.sections.cast.push({ text: "Late 20s, into bikes and shows, not into optimization.", origin: "stated", at: "2026-09-15T00:00:00.000Z" });
  record.sections.light.push({ text: "One practical source per room, the far side goes dark.", origin: "chosen", at: "2026-09-15T00:01:00.000Z" });
  record.sections.rejects.push({ text: "Neon gradients laid over the photograph.", origin: "rejected", at: "2026-09-15T00:02:00.000Z" });
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
    read.sections.cast.concat(read.sections.light, read.sections.rejects).map((entry) => entry.origin),
    ["stated", "chosen", "rejected"],
  );
  // Normalizing what came back changes nothing: the stored shape is the shape.
  assert.deepEqual(normalizeDirectionRecord(read), record);
  await fs.rm(dir, { recursive: true, force: true });
});

test("the prose keeps rejections visible and the source carries the direction flags", () => {
  const record = recordWithAllOrigins("approved");
  const prose = directionRecordProse(record);
  assert.match(prose, /Lived World, cast:/);
  assert.match(prose, /Visual Grammar, light:/);
  assert.match(prose, /Ruled out:\n- Neon gradients laid over the photograph\./);
  assert.doesNotMatch(prose, /\u2014|\u2013/, "no em or en dash in what synthesis reads");

  const source = directionRecordAsSource(record);
  assert.equal(source.id, "direction-record");
  assert.equal(source.provenance, "ours");
  assert.equal(source.aspiration, "aspiration");
  assert.equal(source.influence, "Lead");
  assert.match(source.content, /direction session/i);
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
  assert.match(instruction, /never reopen one/);
  assert.match(instruction, /Available levels for this brand: "a new world"\./);
  assert.doesNotMatch(instruction, /"a few touches"/);
});

test("the session route rejects a brand whose today Lived World reads established", async () => {
  const store = directionStore(savedBrain({ audienceEvidence: "established" }));
  await assert.rejects(
    runDirectionSessionTurn({ message: "Let us begin.", arrival: "stated" }, { store, env: { OPENAI_API_KEY: "x" }, complete: cannedTurn({}) }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /audience is established/);
      assert.match(error.message, /Nothing was changed/);
      return true;
    },
  );
});

test("the session route refuses before the brand today is approved", async () => {
  const unapproved = savedBrain();
  delete unapproved.approvedResult;
  unapproved.brain = { artifactStatus: "draft" };
  const store = directionStore(unapproved);
  await assert.rejects(
    runDirectionSessionTurn({ message: "Hello." }, { store, env: {}, complete: cannedTurn({}) }),
    /Approve the brand today/,
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
        entries: [
          { section: "cast", text: "Into bikes and live shows.", origin: "stated" },
          { section: "not-a-section", text: "Dropped.", origin: "stated" },
          { section: "light", text: "", origin: "chosen" },
          { section: "patterns", text: "Out late on weekends.", origin: "invented" },
        ],
        reach: { level: "a few touches", because: "Off the list for this brand.", tradeoff: "" },
      }),
    },
  );
  assert.equal(turn.reply, "Where do they spend a Saturday?");
  assert.deepEqual(turn.entries, [
    { section: "cast", text: "Into bikes and live shows.", origin: "stated" },
    { section: "patterns", text: "Out late on weekends.", origin: "stated" },
  ]);
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
