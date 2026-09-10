import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPassRequest,
  collectChatCompletionStream,
  extractChatCompletionText,
  passInstructions,
} from "../src/brand-brain/chat-completions-provider.js";
import { MAX_SOURCE_FILE_BYTES, normalizeSourcesForSynthesis, normalizeUploadedFile } from "../src/brand-brain/source-normalizer.js";
import { synthesizeBrandBrain } from "../src/brand-brain/service.js";
import {
  OPENAI_IMAGE_EDITS_ENDPOINT,
  OPENAI_IMAGE_GENERATIONS_ENDPOINT,
  buildOpenAIImageEditRequest,
  buildOpenAIImageGenerationRequest,
  chooseOpenAIImageEndpoint,
} from "../src/renderers/openai-images.js";
import { DEFAULT_REACH, PASS_IDS, REACH_LEVELS, brandBrainSchema, passSchemas } from "../src/brand-brain/schema.js";
import { assembleBrainFromPasses, readSynthesisProgress, worldArtifacts } from "../src/brand-brain/service.js";
import { assertSafeRemoteUrl, mergeIncrementalSources, selectApprovedBaseline } from "../scripts/dev-server.js";

test("Chat Completions synthesis preserves authority, normalized document text, and image evidence", () => {
  const request = buildPassRequest(1, { sources: [
    {
      id: "approved-guidance",
      name: "Approved strategy",
      type: "Files",
      detail: "strategy.pdf and logo.png",
      authority: "approved-guidance",
      role: "Brand foundation",
      influence: "Not weighted",
      usage: "Follow the signed-off positioning.",
      exclusions: "Ignore workshop alternatives.",
      content: "SOURCE FILE: strategy.pdf\nApproved positioning text.",
      extractedFiles: [{ kind: "text", name: "strategy.pdf", type: "application/pdf", size: 12 }],
      files: [{ kind: "image", name: "logo.png", type: "image/png", size: 12, data: "data:image/png;base64,AAAA" }],
    },
  ] });

  assert.equal(request.model, "gpt-5.6");
  assert.equal(request.store, false);
  assert.equal(request.stream, true);
  assert.deepEqual(request.stream_options, { include_usage: true });
  assert.equal(request.response_format.type, "json_schema");
  assert.equal(request.response_format.json_schema.strict, true);
  const content = request.messages[1].content;
  assert.match(content[0].text, /approved-guidance/);
  assert.match(content[0].text, /declaredMaterialType/);
  assert.match(content[0].text, /Follow the signed-off positioning/);
  assert.match(content[0].text, /Approved positioning text/);
  assert.deepEqual(content[1], {
    type: "image_url",
    image_url: { url: "data:image/png;base64,AAAA", detail: "high" },
  });
  assert.doesNotMatch(JSON.stringify(request), /input_file|input_text|text\.format/);
});

test("incremental synthesis pins the approved baseline and isolates new source evidence", () => {
  const baseline = { brandName: "SLAKE", synthesisSummary: "Approved and active", guidanceSections: [] };
  const request = buildPassRequest(1, {
    sources: [
      {
        id: "new-retail-brief",
        name: "Retail briefing",
        type: "Other business document",
        materialType: "business-document",
        declaredType: "Other business document",
        authority: "brand-evidence",
        role: "Brand foundation",
        influence: "Supporting",
        usage: "Use only as company background.",
        exclusions: "Do not treat growth targets as brand guidance.",
        content: "Expansion timing and operating context.",
      },
    ],
    baseline,
    baselineVersion: 3,
  });

  const prompt = request.messages[1].content[0].text;
  assert.match(prompt, /smallest supported update/);
  assert.match(prompt, /approved version 3/);
  assert.match(prompt, /Copy every unaffected field/);
  assert.match(prompt, /earlier review questions are already resolved/);
  assert.match(prompt, /Retail briefing/);
  assert.match(prompt, /Approved and active/);
});

test("raw Chat Completions JSON is extracted without an SDK helper", () => {
  const output = extractChatCompletionText({
    choices: [{ message: { role: "assistant", content: "{\"brandName\":\"SLAKE\"}" } }],
  });
  assert.equal(output, '{"brandName":"SLAKE"}');
});

test("streamed Chat Completions output is reassembled with usage metadata", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[{"delta":{"content":"{\\"brand"}}]}\n\n'));
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[{"delta":{"content":"Name\\":\\"Fallow\\"}"}}]}\r\n\r\n'));
      controller.enqueue(encoder.encode('data: {"id":"chatcmpl_live","model":"gpt-5.6","choices":[],"usage":{"total_tokens":42}}\n\ndata: [DONE]\n\n'));
      controller.close();
    },
  });

  const completion = await collectChatCompletionStream(stream);
  assert.equal(completion.id, "chatcmpl_live");
  assert.equal(completion.model, "gpt-5.6");
  assert.equal(completion.choices[0].message.content, '{"brandName":"Fallow"}');
  assert.deepEqual(completion.usage, { total_tokens: 42 });
});

test("plain-text uploads are normalized before they reach synthesis", async () => {
  const data = `data:text/plain;base64,${Buffer.from("Approved: make ordinary moments feel considered.").toString("base64")}`;
  const [source] = await normalizeSourcesForSynthesis([
    { id: "note", name: "Approved note", content: "", files: [{ name: "note.txt", type: "text/plain", size: 48, data }] },
  ]);
  assert.match(source.content, /Approved: make ordinary moments feel considered/);
  assert.equal(source.files.length, 0);
  assert.equal(source.extractedFiles[0].kind, "text");
});

test("approved guidance can use a supported raster image as visual evidence", async () => {
  const data = `data:image/png;base64,${Buffer.from("brand-book-page").toString("base64")}`;
  const [source] = await normalizeSourcesForSynthesis([
    {
      id: "approved-brand-book-page",
      materialType: "approved-guidance",
      authority: "approved-guidance",
      files: [{ name: "brand-book-page.png", type: "image/png", size: 15, data }],
    },
  ]);

  assert.equal(source.files.length, 1);
  assert.equal(source.files[0].kind, "image");
  assert.equal(source.files[0].type, "image/png");
});

test("hosted source files are read from private storage before synthesis", async () => {
  const text = "Approved positioning from durable private storage.";
  const file = await normalizeUploadedFile(
    { name: "guidance.txt", type: "text/plain", size: Buffer.byteLength(text), blobPathname: "brand-world-system/sources/guidance.txt" },
    { authority: "approved-guidance" },
    {
      async readStoredFile(pathname) {
        assert.equal(pathname, "brand-world-system/sources/guidance.txt");
        return { bytes: Buffer.from(text), mimeType: "text/plain", size: Buffer.byteLength(text) };
      },
    },
  );
  assert.equal(file.kind, "text");
  assert.match(file.text, /durable private storage/);
});

test("portable document parsing does not depend on macOS metadata tools", async () => {
  const bytes = Buffer.from("{\\rtf1\\ansi Approved brand direction.}");
  const file = await normalizeUploadedFile(
    { name: "guidance.rtf", type: "application/rtf", size: bytes.length, data: `data:application/rtf;base64,${bytes.toString("base64")}` },
    { authority: "approved-guidance" },
  );
  assert.equal(file.kind, "text");
  assert.match(file.text, /Approved brand direction/);
});

// ---------------------------------------------------------------------------
// Eight-pass synthesis (four passes 2026-09-07, eight under ADR 0019 2026-09-09)
// ---------------------------------------------------------------------------

// A store with in-progress state, which is where the half-built brain lives
// between passes. Nothing reaches `stored` until the eighth pass finishes.
function passStore(initial = null) {
  let stored = initial;
  let inProgress = null;
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
  };
}

function passOutput(passId) {
  return {
    1: {
      brandName: "Fallow",
      brandDescription: "A quiet home goods brand",
      synthesisSummary: "Make ordinary moments feel considered.",
      cleanAssetCount: 3,
      guidanceSections: ["foundation", "identity", "world", "voice", "creative", "rules"].map((id) => ({ id, name: id })),
      reviewQuestions: [{ id: "q-1", type: "other" }],
      dossier: { readBody: "Fallow finds character in useful rooms." },
    },
    2: {
      livedWorld: { cast: { description: "People who fix things for a living.", examples: [{ name: "Dana", who: "27, runs the front of a bike shop." }] } },
      reviewQuestions: [{ id: "q-2", type: "other" }],
    },
    3: {
      storyArchitecture: { moments: [{ id: "moment-1", title: "Coming in the door", who: "One person, arriving alone.", situation: "Shaking rain off a jacket." }] },
      reviewQuestions: [],
    },
    4: {
      visualGrammar: { sections: { people: [{ id: "people-1", statement: "Hands show use." }] } },
      reviewQuestions: [{ id: "q-2", type: "other" }, { id: "q-4", type: "other" }],
    },
    5: {
      dossier: { readBody: "Fallow wants to be the brand of the repaired thing." },
      reviewQuestions: [{ id: "q-5", type: "other" }],
    },
    6: {
      livedWorld: { cast: { description: "People who repair rather than replace.", examples: [{ name: "Ola", who: "34, reupholsters chairs out of a garage." }] } },
      reviewQuestions: [],
    },
    7: {
      storyArchitecture: { moments: [{ id: "moment-e1", title: "The last staple", who: "Two people, one working and one watching.", situation: "Pulling the last staple from a chair seat." }] },
      reviewQuestions: [],
    },
    8: {
      visualGrammar: { sections: { people: [{ id: "people-e1", statement: "Sleeves rolled, forearms marked by the work." }] } },
      reviewQuestions: [{ id: "q-2", type: "other" }],
    },
  }[passId];
}

// Runs every pass the way the client does: pass 1 carries the sources, the rest
// carry only the request id, and the evolved passes carry the reach level.
async function runAllPasses(store, options = {}) {
  const seen = [];
  let last = null;
  for (const pass of PASS_IDS) {
    last = await synthesizeBrandBrain(
      pass === 1
        ? {
            pass,
            mode: options.mode || "initial",
            baselineVersion: options.baselineVersion,
            requestId: "synthesis-pass-test",
            sources: [
              {
                id: "approved-note",
                name: "Approved note",
                authority: "approved-guidance",
                content: "Make ordinary moments feel considered.",
                files: [],
              },
            ],
          }
        : pass >= 5
        ? { pass, requestId: "synthesis-pass-test", reach: options.reach }
        : { pass, requestId: "synthesis-pass-test" },
      {
        store,
        env: { OPENAI_API_KEY: "test-only" },
        async synthesize(call) {
          seen.push(call);
          if (options.failOn === call.passId) throw new Error("the model call failed");
          return { result: passOutput(call.passId), responseId: `chatcmpl-${call.passId}`, model: "gpt-5.6", usage: { total_tokens: call.passId * 10 } };
        },
      },
    );
  }
  return { seen, last };
}

test("eight passes assemble one brain with two worlds and guidance at the root", async () => {
  const store = passStore();
  const { seen, last } = await runAllPasses(store);

  assert.deepEqual(seen.map((call) => call.passId), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(last.complete, true);
  const result = store.saved().result;
  assert.equal(result.brandName, "Fallow");
  assert.deepEqual(Object.keys(result.artifacts).sort(), ["evolved", "today"]);
  assert.equal(result.artifacts.today.livedWorld.cast.examples[0].name, "Dana");
  assert.equal(result.artifacts.today.storyArchitecture.moments[0].id, "moment-1");
  assert.equal(result.artifacts.today.visualGrammar.sections.people[0].id, "people-1");
  assert.equal(result.artifacts.today.dossier.readBody, "Fallow finds character in useful rooms.");
  assert.equal(result.artifacts.evolved.dossier.readBody, "Fallow wants to be the brand of the repaired thing.");
  assert.equal(result.artifacts.evolved.livedWorld.cast.examples[0].name, "Ola");
  assert.equal(result.artifacts.evolved.storyArchitecture.moments[0].id, "moment-e1");
  assert.equal(result.artifacts.evolved.visualGrammar.sections.people[0].id, "people-e1");
  // Guidance sections and brand fields are written once, in pass 1, and stay
  // at the root rather than under either world.
  assert.equal(result.guidanceSections.length, 6);
  assert.equal("guidanceSections" in result.artifacts.today, false);
  assert.equal("dossier" in result.artifacts, false);
  assert.equal(store.saved().synthesisRequestId, "synthesis-pass-test");
  assert.equal(store.saved().sources[0].id, "approved-note");
  // The reach the evolved world was built at is recorded on the saved payload.
  assert.equal(store.saved().reach, DEFAULT_REACH);

  // responseId and model carry pass 1's values, usage sums across passes, and
  // the per-pass ids are recorded.
  assert.equal(store.saved().responseId, "chatcmpl-1");
  assert.equal(store.saved().model, "gpt-5.6");
  assert.deepEqual(store.saved().usage, { total_tokens: 360 });
  assert.deepEqual(store.saved().passes.map((entry) => entry.pass), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(store.saved().passes[1].label, "the people and their days");
  assert.equal(store.saved().passes[5].label, "the people it is reaching for");

  // Review questions from every pass survive, deduplicated by id: passes 4 and
  // 8 raised q-2 again, and it appears once.
  assert.deepEqual(result.reviewQuestions.map((q) => q.id), ["q-1", "q-2", "q-4", "q-5"]);

  // The in-progress record is gone once the synthesis finishes.
  assert.equal(store.inProgress(), null);
});

test("each pass receives what the passes before it wrote, and every evolved pass receives the whole today world", async () => {
  const store = passStore();
  const { seen } = await runAllPasses(store);
  const call = (passId) => seen.find((entry) => entry.passId === passId);

  assert.deepEqual(Object.keys(call(1).priorPasses), []);
  assert.deepEqual(Object.keys(call(2).priorPasses), ["1"]);
  // Pass 3 places the cast into moments. It receives the Lived World.
  assert.equal(call(3).priorPasses[2].livedWorld.cast.examples[0].name, "Dana");
  // Pass 4 describes the physical world of those moments, so it receives them.
  assert.equal(call(4).priorPasses[3].storyArchitecture.moments[0].title, "Coming in the door");
  assert.equal(call(4).priorPasses[2].livedWorld.cast.examples[0].name, "Dana");
  // Every evolved pass receives the full today world, passes 1 through 4, plus
  // the evolved passes before it and nothing after it.
  assert.deepEqual(Object.keys(call(5).priorPasses), ["1", "2", "3", "4"]);
  assert.deepEqual(Object.keys(call(6).priorPasses), ["1", "2", "3", "4", "5"]);
  assert.deepEqual(Object.keys(call(7).priorPasses), ["1", "2", "3", "4", "5", "6"]);
  assert.deepEqual(Object.keys(call(8).priorPasses), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.equal(call(8).priorPasses[4].visualGrammar.sections.people[0].id, "people-1");
  assert.equal(call(8).priorPasses[7].storyArchitecture.moments[0].id, "moment-e1");
  // And the prior-pass text names the world each earlier pass belongs to.
  const request = buildPassRequest(6, { sources: [], priorPasses: call(6).priorPasses });
  const text = request.messages[1].content[0].text;
  assert.match(text, /ALREADY WRITTEN, PASS 2, the brand today, the people and their days/);
  assert.match(text, /ALREADY WRITTEN, PASS 5, the brand world, evolved, the brand as it wants to be seen/);
});

test("the reach level travels on the evolved passes only, and defaults when a request carries none", async () => {
  const store = passStore();
  const { seen } = await runAllPasses(store, { reach: "a new world" });
  for (const call of seen) {
    if (call.passId >= 5) assert.equal(call.reach, "a new world", `pass ${call.passId} carries the reach`);
    else assert.equal(call.reach, undefined, `pass ${call.passId} carries no reach`);
  }
  assert.equal(store.saved().reach, "a new world");

  const unknown = passStore();
  const run = await runAllPasses(unknown, { reach: "sixty percent" });
  assert.equal(run.seen.find((call) => call.passId === 5).reach, DEFAULT_REACH);
});

test("nothing is saved before the last pass, and the half-built brain is not returned", async () => {
  const store = passStore();
  const first = await synthesizeBrandBrain(
    {
      pass: 1,
      mode: "initial",
      requestId: "synthesis-partial-test",
      sources: [{ id: "note", name: "Note", authority: "approved-guidance", content: "text", files: [] }],
    },
    {
      store,
      env: { OPENAI_API_KEY: "test-only" },
      async synthesize({ passId }) {
        return { result: passOutput(passId), responseId: `chatcmpl-${passId}`, model: "gpt-5.6", usage: null };
      },
    },
  );
  assert.equal(first.complete, false);
  assert.equal(first.nextPass, 2);
  assert.equal(store.saved(), null, "the saved brain is untouched until the last pass");
  assert.equal(store.inProgress().nextPass, 2);
  // The partial brain stays on the server. Sending it would put an incomplete
  // artifact set in the browser where something could try to render it.
  assert.equal("result" in first, false);
});

test("a failed pass saves nothing, names the pass, and clears the half-built work", async () => {
  for (const failOn of [3, 7]) {
    const store = passStore();
    await assert.rejects(
      () => runAllPasses(store, { failOn }),
      (error) => {
        assert.equal(error.pass, failOn);
        assert.match(error.message, /the model call failed/);
        return true;
      },
    );
    // A failed evolved pass saves nothing either: the finished today world goes
    // with it rather than being saved half a brain.
    assert.equal(store.saved(), null, `a synthesis failing on pass ${failOn} writes no brain`);
    assert.equal(store.inProgress(), null, "a failed synthesis leaves no half-built work");
    assert.deepEqual(store.backups(), [], "nothing was replaced, so nothing was backed up");
  }
});

test("a later pass without a synthesis in progress is refused rather than started halfway", async () => {
  const store = passStore();
  await assert.rejects(
    () => synthesizeBrandBrain({ pass: 3, requestId: "orphan" }, { store, env: { OPENAI_API_KEY: "test-only" }, async synthesize() { throw new Error("should not be called"); } }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /Pass 3, moments in their world/);
      assert.match(error.message, /Start again from the first pass/);
      return true;
    },
  );
  assert.equal(store.saved(), null);
});

test("incremental synthesis hands each pass its own slice of the approved baseline, by world", async () => {
  const baseline = {
    brandName: "Fallow",
    guidanceSections: [{ id: "foundation" }],
    reviewQuestions: [],
    artifacts: {
      today: {
        dossier: { readBody: "approved dossier" },
        livedWorld: { cast: { description: "approved cast", examples: [{ name: "Approved Dana" }] } },
        storyArchitecture: { moments: [{ id: "moment-9" }] },
        visualGrammar: { sections: {} },
      },
      evolved: {
        dossier: { readBody: "approved evolved dossier" },
        livedWorld: { cast: { description: "approved evolved cast", examples: [{ name: "Approved Ola" }] } },
        storyArchitecture: { moments: [{ id: "moment-e9" }] },
        visualGrammar: { sections: { people: [] } },
      },
    },
  };
  const store = passStore({ approvedResult: baseline, brain: { approvedVersion: 3 }, sources: [] });
  const { seen } = await runAllPasses(store, { mode: "incremental", baselineVersion: 3 });

  const call = (passId) => seen.find((entry) => entry.passId === passId);
  assert.equal(call(1).baseline.dossier.readBody, "approved dossier");
  assert.equal(call(1).baseline.brandName, "Fallow");
  assert.equal(call(2).baseline.livedWorld.cast.examples[0].name, "Approved Dana");
  assert.equal(call(3).baseline.storyArchitecture.moments[0].id, "moment-9");
  assert.deepEqual(Object.keys(call(4).baseline), ["visualGrammar"]);
  // The world axis: the evolved passes are handed the evolved slices.
  assert.deepEqual(call(5).baseline, { dossier: { readBody: "approved evolved dossier" } });
  assert.equal(call(6).baseline.livedWorld.cast.examples[0].name, "Approved Ola");
  assert.equal(call(7).baseline.storyArchitecture.moments[0].id, "moment-e9");
  assert.deepEqual(Object.keys(call(8).baseline), ["visualGrammar"]);
  // A pass sees only its own slice, so pass 2 cannot quietly rewrite guidance.
  assert.equal("guidanceSections" in call(2).baseline, false);
  assert.equal("brandName" in call(5).baseline, false);

  assert.equal(store.saved().kind, "incremental-synthesis");
  assert.equal(store.saved().baselineVersion, 3);
  assert.equal(store.saved().brain.revisionPending, true);
  assert.equal(store.saved().approvedResult.brandName, "Fallow");
});

test("a baseline that predates an artifact runs that pass as a first synthesis of it", async () => {
  const baseline = { brandName: "Fallow", guidanceSections: [], reviewQuestions: [], artifacts: { dossier: {} } };
  const store = passStore({ approvedResult: baseline, brain: { approvedVersion: 2 }, sources: [] });
  const { seen } = await runAllPasses(store, { mode: "incremental", baselineVersion: 2 });
  // There is genuinely nothing to update, so the pass is not handed an empty
  // baseline to copy fields from.
  assert.equal(seen.find((entry) => entry.passId === 3).baseline, null);
  // A single artifacts object with no world under it is a brain saved before
  // ADR 0019. It reads as the today world, and it has no evolved world.
  for (const passId of [5, 6, 7, 8]) {
    assert.equal(seen.find((entry) => entry.passId === passId).baseline, null, `pass ${passId} has no evolved slice to update`);
  }
});

test("a brain saved before the two worlds reads as today with no evolved world", () => {
  const legacy = { artifacts: { dossier: { readBody: "legacy" }, livedWorld: { people: [] } } };
  assert.equal(worldArtifacts(legacy, "today").dossier.readBody, "legacy");
  assert.equal(worldArtifacts(legacy, "evolved"), null);
  const current = { artifacts: { today: { dossier: { readBody: "t" } }, evolved: { dossier: { readBody: "e" } } } };
  assert.equal(worldArtifacts(current, "today").dossier.readBody, "t");
  assert.equal(worldArtifacts(current, "evolved").dossier.readBody, "e");
  assert.equal(worldArtifacts(null, "today"), null);
});

test("a rebuild backs the existing brain up once, on the final pass that replaces it", async () => {
  const store = passStore({ result: { brandName: "Previous" }, sources: [] });
  const { seen } = await runAllPasses(store);
  assert.equal(store.backups().length, 1);
  assert.equal(store.backups()[0].result.brandName, "Previous");
  assert.equal(seen.length, 8);
});

test("each pass answers to its own slice of the schema, and the slices cover both worlds", () => {
  assert.deepEqual(PASS_IDS, [1, 2, 3, 4, 5, 6, 7, 8]);
  const sliceKeys = PASS_IDS.flatMap((id) => Object.keys(passSchemas[id].properties));
  for (const key of ["dossier", "livedWorld", "storyArchitecture", "visualGrammar"]) {
    assert.equal(sliceKeys.filter((k) => k === key).length, 2, `${key} is written once per world`);
  }
  for (const key of Object.keys(brandBrainSchema.properties)) {
    if (key === "artifacts") continue;
    assert.ok(sliceKeys.includes(key), `${key} is written by some pass`);
  }
  // Only pass 1 writes the guidance sections and the brand fields, so no later
  // pass, evolved passes included, can rewrite them.
  assert.deepEqual(PASS_IDS.filter((id) => "guidanceSections" in passSchemas[id].properties), [1]);
  assert.deepEqual(PASS_IDS.filter((id) => "brandName" in passSchemas[id].properties), [1]);
  // The pass 1 evolved slice is the dossier plus review questions and nothing else.
  assert.deepEqual(Object.keys(passSchemas[5].properties).sort(), ["dossier", "reviewQuestions"]);
  // Evolved passes 2 through 4 reuse the today slices.
  assert.equal(passSchemas[6], passSchemas[2] === passSchemas[6] ? passSchemas[2] : passSchemas[6]);
  assert.deepEqual(passSchemas[6], passSchemas[2]);
  assert.deepEqual(passSchemas[7], passSchemas[3]);
  assert.deepEqual(passSchemas[8], passSchemas[4]);
});

test("the assembled brain has every top-level key brandBrainSchema names", () => {
  const assembled = assembleBrainFromPasses(Object.fromEntries(PASS_IDS.map((id) => [id, passOutput(id)])));
  assert.deepEqual(Object.keys(assembled).sort(), Object.keys(brandBrainSchema.properties).sort());
  assert.deepEqual(
    Object.keys(assembled.artifacts).sort(),
    Object.keys(brandBrainSchema.properties.artifacts.properties).sort(),
  );
  for (const world of ["today", "evolved"]) {
    assert.deepEqual(
      Object.keys(assembled.artifacts[world]).sort(),
      Object.keys(brandBrainSchema.properties.artifacts.properties[world].properties).sort(),
    );
  }
  // The assembled review question cap is four times the pass cap and is left
  // where it was. Nothing is dropped on merge.
  assert.equal(brandBrainSchema.properties.reviewQuestions.maxItems, 32);
  assert.equal(passSchemas[1].properties.reviewQuestions.maxItems, 8);
});

test("a pass request carries only its own pass instruction and schema", () => {
  const request = buildPassRequest(3, {
    sources: [{ id: "s1", name: "Source", files: [{ kind: "image", name: "a.png", type: "image/png", data: "data:image/png;base64,AAAA" }] }],
    priorPasses: { 1: passOutput(1), 2: passOutput(2) },
  });
  assert.equal(request.response_format.json_schema.name, "brand_brain_pass_3");
  assert.equal(request.response_format.json_schema.schema, passSchemas[3]);
  const instruction = request.messages[0].content;
  assert.match(instruction, /This is pass 3 of 8/);
  assert.match(instruction, /Story Architecture:/);
  // The Lived World and Visual Grammar rules belong to other passes and are not
  // sent here. The whole point of the split is that a call is told what it is
  // doing rather than everything the system knows.
  assert.doesNotMatch(instruction, /Where the rejects come from:/);
  assert.doesNotMatch(instruction, /Camera entries are settings:/);
  const text = request.messages[1].content[0].text;
  assert.match(text, /ALREADY WRITTEN, PASS 2, the brand today, the people and their days/);
  assert.match(text, /Dana/);
  // Pass 3 places people into moments from what the earlier passes wrote, so it
  // is sent the source register but not the source images.
  assert.equal(request.messages[1].content.length, 1);
  assert.match(text, /"id": "s1"/);
});

test("passes that read the sources directly still receive the images", () => {
  for (const passId of [1, 2, 4, 5, 6, 8]) {
    const request = buildPassRequest(passId, {
      sources: [{ id: "s1", name: "Source", files: [{ kind: "image", name: "a.png", type: "image/png", data: "data:image/png;base64,AAAA" }] }],
      priorPasses: {},
    });
    assert.equal(request.messages[1].content.length, 2, `pass ${passId} sends the image`);
    assert.deepEqual(request.messages[1].content[1], {
      type: "image_url",
      image_url: { url: "data:image/png;base64,AAAA", detail: "high" },
    });
  }
});

test("protected unsupported files remain exact metadata and source size limits are enforced", async () => {
  const svg = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z"/></svg>').toString("base64")}`;
  const [source] = await normalizeSourcesForSynthesis([
    {
      id: "protected-logo",
      authority: "exact-asset",
      files: [{ name: "wordmark.svg", type: "image/svg+xml", size: 72, data: svg }],
    },
  ]);
  assert.equal(source.files.length, 0);
  assert.equal(source.extractedFiles[0].kind, "metadata");
  assert.match(source.extractedFiles[0].note, /preserved as supplied/);

  await assert.rejects(
    () => normalizeUploadedFile({ name: "oversized.pdf", type: "application/pdf", size: MAX_SOURCE_FILE_BYTES + 1 }),
    /larger than the 20 MB source limit/,
  );
});

test("OpenAI image routing preserves the compiled prompt exactly", () => {
  const prompt = "STYLE ANCHOR\nExact tuned fragment; preserve punctuation and spacing.";
  const generation = buildOpenAIImageGenerationRequest({ prompt });
  assert.equal(generation.endpoint, OPENAI_IMAGE_GENERATIONS_ENDPOINT);
  assert.equal(generation.body.prompt, prompt);
  assert.equal(chooseOpenAIImageEndpoint([]), OPENAI_IMAGE_GENERATIONS_ENDPOINT);

  const edit = buildOpenAIImageEditRequest({
    prompt,
    referenceImages: [{ name: "canonical.png", type: "image/png", data: "data:image/png;base64,AAAA" }],
  });
  assert.equal(edit.endpoint, OPENAI_IMAGE_EDITS_ENDPOINT);
  assert.equal(edit.body.get("prompt"), prompt);
  assert.equal(chooseOpenAIImageEndpoint([{ name: "canonical.png" }]), OPENAI_IMAGE_EDITS_ENDPOINT);
});

test("URL intake rejects local and private network targets", async () => {
  await assert.rejects(() => assertSafeRemoteUrl("http://127.0.0.1:4173/private"), /Private network URLs/);
  await assert.rejects(() => assertSafeRemoteUrl("http://localhost:4173/private"), /Local network URLs/);
});

test("incremental synthesis keeps the stored approved baseline and merges only new source records", () => {
  const baseline = { brandName: "SLAKE", guidanceSections: [{ id: "foundation", summary: "Approved" }] };
  const stored = {
    result: { brandName: "Candidate" },
    approvedResult: baseline,
    brain: { artifactStatus: "draft" },
  };
  assert.deepEqual(selectApprovedBaseline(stored), baseline);

  const merged = mergeIncrementalSources(
    [
      { id: "approved-source", name: "Approved source" },
      { id: "replaced-source", name: "Old record" },
    ],
    [
      { id: "replaced-source", name: "Updated record" },
      { id: "new-source", name: "New source" },
    ],
  );
  assert.deepEqual(merged.map((source) => source.name), ["Approved source", "Updated record", "New source"]);
});

// ---------------------------------------------------------------------------
// The world artifacts (2026-09-07)
//
// Story Architecture became a set of moments in the world of the Lived World's
// people, and the Lived World gained those people. The schema is the contract
// the model is held to, so these check the shape rather than the prose.
// See docs/findings-2026-09-07-world-artifacts.md.
// ---------------------------------------------------------------------------

test("the Lived World schema asks for a cast rather than a roster", () => {
  const lived = brandBrainSchema.properties.artifacts.properties.today.properties.livedWorld;
  assert.equal("person" in lived.properties, false, "the single person string is gone");
  assert.equal("people" in lived.properties, false, "the counted people list is gone");
  const cast = lived.properties.cast;
  assert.deepEqual(cast.required, ["description", "examples"]);
  assert.equal(cast.additionalProperties, false);
  assert.match(cast.properties.description.description, /twenty pictures could cast twenty different people/);
  const examples = cast.properties.examples;
  assert.equal(examples.type, "array");
  assert.equal(examples.minItems, 1);
  assert.equal("maxItems" in examples, false, "there is no ceiling on examples");
  assert.match(examples.description, /not a roster/);
  // An example carries no id: nothing downstream refers to one, because nobody
  // recurs across a brand's pictures.
  assert.deepEqual(examples.items.required, ["name", "who", "basis"]);
  assert.equal(examples.items.additionalProperties, false);
  assert.match(examples.items.properties.who.description, /audience description is not a person/);
  assert.ok(lived.required.includes("cast"));
  // Both worlds share the definition.
  assert.deepEqual(brandBrainSchema.properties.artifacts.properties.evolved.properties.livedWorld, lived);
});

test("a Story Architecture moment names when, where, who is there, and the situation underway", () => {
  const moments = brandBrainSchema.properties.artifacts.properties.today.properties.storyArchitecture.properties.moments;
  assert.equal(moments.minItems, 6);
  assert.equal("maxItems" in moments, false, "there is no ceiling on moments");
  assert.deepEqual(moments.items.required, ["id", "title", "when", "where", "who", "situation", "feeling", "basis"]);
  // The product beat is gone, and so is the script.
  for (const gone of ["product", "index", "scale", "role", "action", "doing"]) {
    assert.equal(gone in moments.items.properties, false, `the ${gone} field is gone from a moment`);
  }
  // who is prose describing who is there, not a list of ids.
  assert.equal(moments.items.properties.who.type, "string");
  assert.match(moments.items.properties.who.description, /rather than a list of names or ids/);
  assert.match(moments.items.properties.situation.description, /a situation and not a sequence/);
  assert.equal(moments.items.properties.basis.properties.origin.enum.includes("ambition"), true);
});

test("the grammar's people section is casting range", () => {
  const people = brandBrainSchema.properties.artifacts.properties.today.properties.visualGrammar.properties.sections.properties.people;
  assert.match(people.description, /range of who appears, not one entry per named person/);
});

test("the synthesis instructions brief a cast and situations, and the today passes keep the fence", () => {
  const today = [1, 2, 3, 4].map((id) => passInstructions(id));
  const evolved = [5, 6, 7, 8].map((id) => passInstructions(id));
  const all = [...today, ...evolved].join("\n\n");
  assert.match(all, /Story Architecture:/);
  assert.match(all, /it is an ad, and it belongs nowhere in this artifact/);
  assert.match(all, /is a segment/);
  assert.doesNotMatch(all, /It is a portrait of a person and their days/);
  // The cast, not characters. The Dana sentence stays as the example of
  // specificity; the instruction to write several such people is gone, and the
  // id requirement with it.
  assert.match(today[1], /"Dana, 27, runs the front of a bike shop and talks with her hands" is a person/);
  assert.match(today[1], /No person recurs across this brand's pictures/);
  assert.doesNotMatch(today[1], /The people carry ids/);
  assert.doesNotMatch(all, /by their Lived World ids/);
  // Situations, not scripts.
  assert.match(today[2], /"situation" is one thing underway/);
  assert.match(today[2], /a photographer arriving at any minute of it finds a different picture/);
  assert.doesNotMatch(all, /"doing" is what is happening/);
  // The grammar people section describes range.
  assert.match(today[3], /It describes the range of who appears, not one entry per named person/);

  // The fence sentences, verbatim, on the today passes 2 and 3 and not on the
  // evolved ones, which carry the ambition test instead.
  const livedFence = `The schema also permits "ambition" as an origin. Never use it in the Lived World. It belongs to the visual grammar artifact and the rules for when it applies elsewhere are not written yet, so a Lived World entry is "evidence" or "inference" and nothing else.`;
  const storyFence = `, and it is never "ambition"`;
  const ambitionTest = `An entry carries "basis.origin" of "ambition" when it would not say what it says with the aspiration sources removed`;
  assert.ok(today[1].includes(livedFence), "today pass 2 carries the Lived World fence verbatim");
  assert.ok(today[2].includes(storyFence), "today pass 3 carries the Story Architecture fence");
  assert.ok(!today[1].includes(ambitionTest) && !today[2].includes(ambitionTest), "today passes do not carry the ambition test");
  assert.ok(!evolved[1].includes(livedFence), "evolved pass 2 does not carry the Lived World fence");
  assert.ok(!evolved[2].includes(storyFence), "evolved pass 3 does not carry the Story Architecture fence");
  assert.ok(evolved[1].includes(ambitionTest) && evolved[2].includes(ambitionTest), "evolved passes 2 and 3 carry the ambition test");
  // The rejects rule keeps its fence in both runs.
  const rejectsFence = `Rejects carry an origin of "evidence" or "inference" and never "ambition"`;
  assert.ok(today[3].includes(rejectsFence) && evolved[3].includes(rejectsFence));
  // Apart from the fence, the pass 2 and pass 3 rules are the same text on
  // both runs. Nothing else in those blocks changed between the worlds.
  const rulesBlock = (instruction, heading) => instruction.slice(instruction.indexOf(heading), instruction.indexOf("Review question language:"));
  const withoutFence = (block, fence) => block.replace(fence, "").split("\n").filter((line) => line !== "- " && !line.includes(ambitionTest)).join("\n");
  assert.equal(withoutFence(rulesBlock(today[1], "Lived World:"), livedFence), withoutFence(rulesBlock(evolved[1], "Lived World:"), livedFence));
  assert.equal(withoutFence(rulesBlock(today[2], "Story Architecture:"), storyFence), withoutFence(rulesBlock(evolved[2], "Story Architecture:"), storyFence));
});

test("the influence sentence sits in the authority rules every pass carries", () => {
  const influence = "Influence sets how far a direction source reaches, not how strongly it is written.";
  for (const id of PASS_IDS) {
    const instruction = passInstructions(id);
    assert.ok(instruction.includes(influence), `pass ${id} carries the influence sentence`);
    // Once, in the authority rules, and no longer inside the grammar block.
    assert.equal(instruction.split(influence).length - 1, 1, `pass ${id} carries it exactly once`);
  }
  assert.ok(passInstructions(4).indexOf(influence) < passInstructions(4).indexOf("Visual Grammar:"));
});

test("the evolved passes carry the reach sentence for the requested level and only that one", () => {
  const openings = {
    "a few touches": "Reach for this evolved world: a few touches.",
    "a clear direction": "Reach for this evolved world: a clear direction.",
    "a new world": "Reach for this evolved world: a new world.",
  };
  assert.deepEqual(REACH_LEVELS, Object.keys(openings));
  for (const level of REACH_LEVELS) {
    for (const id of [5, 6, 7, 8]) {
      const instruction = passInstructions(id, { reach: level });
      for (const [other, opening] of Object.entries(openings)) {
        assert.equal(instruction.includes(opening), other === level, `pass ${id} at "${level}" carries ${other === level ? "" : "no "}sentence for "${other}"`);
      }
      // The reach sentence follows the pass task and precedes the authority rules.
      assert.ok(instruction.indexOf(openings[level]) > instruction.indexOf(`This is pass ${id} of 8`));
      assert.ok(instruction.indexOf(openings[level]) < instruction.indexOf("Authority rules:"));
    }
  }
  // A missing or unknown level falls back to the default rather than to no sentence.
  assert.ok(passInstructions(6).includes(openings[DEFAULT_REACH]));
  assert.ok(passInstructions(6, { reach: "half" }).includes(openings[DEFAULT_REACH]));
  // Today passes carry none.
  for (const id of [1, 2, 3, 4]) {
    assert.doesNotMatch(passInstructions(id, { reach: "a new world" }), /Reach for this evolved world/);
  }
  // And the request builder passes the level through.
  const request = buildPassRequest(7, { sources: [], priorPasses: {}, reach: "a few touches" });
  assert.match(request.messages[0].content, /Reach for this evolved world: a few touches/);
});

test("the evolved pass tasks say which run they are and that the today world is finished", () => {
  for (const id of [5, 6, 7, 8]) {
    const instruction = passInstructions(id);
    assert.match(instruction, new RegExp(`This is pass ${id} of 8`));
    assert.match(instruction, /write the brand evolved/);
    assert.match(instruction, /The brand today is finished and is supplied below as data: passes 1 through 4/);
  }
  assert.match(passInstructions(5), /Write the Brand Dossier for the evolved world, and any review questions it raises\. Nothing else\./);
  assert.match(passInstructions(5), /Do not write the brand name, the brand description, the synthesis summary, the clean asset count, or the guidance sections/);
  assert.match(passInstructions(6), /Pass 5, the evolved dossier, is also finished and supplied/);
  assert.match(passInstructions(7), /Passes 5 and 6, the evolved dossier and the evolved Lived World, are also finished and supplied/);
  assert.match(passInstructions(8), /Passes 5, 6 and 7, the evolved dossier, Lived World and Story Architecture, are also finished and supplied/);
  for (const id of [1, 2, 3, 4]) {
    assert.match(passInstructions(id), /write the brand today/);
  }
});

// ---------------------------------------------------------------------------
// The in-progress read (2026-09-07)
//
// A pass can outlive the connection that started it. This is the one thing the
// browser may learn about a synthesis it lost: which pass has finished.
// See docs/findings-2026-09-07-pass-recovery.md.
// ---------------------------------------------------------------------------

test("the in-progress read reports the completed pass and nothing else", async () => {
  const store = passStore();
  await synthesizeBrandBrain(
    {
      pass: 1,
      mode: "initial",
      requestId: "synthesis-progress-test",
      sources: [{ id: "note", name: "Note", authority: "approved-guidance", content: "text", files: [] }],
    },
    {
      store,
      env: { OPENAI_API_KEY: "test-only" },
      async synthesize({ passId }) {
        return { result: passOutput(passId), responseId: `chatcmpl-${passId}`, model: "gpt-5.6", usage: null };
      },
    },
  );

  const progress = await readSynthesisProgress("synthesis-progress-test", { store });
  assert.deepEqual(progress, {
    requestId: "synthesis-progress-test",
    inProgress: true,
    completedPass: 1,
    nextPass: 2,
    totalPasses: 8,
  });
  // The half-built brain stays on the server. Nothing in the reply carries it.
  const serialized = JSON.stringify(progress);
  assert.doesNotMatch(serialized, /Fallow|guidanceSections|dossier|passResults/);
});

test("the in-progress read answers plainly rather than erroring when there is nothing to report", async () => {
  const store = passStore();
  for (const requestId of ["never-started", null, undefined]) {
    const progress = await readSynthesisProgress(requestId, { store });
    assert.equal(progress.inProgress, false);
    assert.equal(progress.completedPass, 0);
  }
});

test("the in-progress read does not answer for a different synthesis", async () => {
  const store = passStore();
  await store.writeInProgress({ synthesisRequestId: "synthesis-a", nextPass: 3 });
  assert.equal((await readSynthesisProgress("synthesis-a", { store })).completedPass, 2);
  assert.equal((await readSynthesisProgress("synthesis-b", { store })).inProgress, false);
});

test("a finished synthesis reports nothing in progress, because its record is cleared", async () => {
  const store = passStore();
  await runAllPasses(store);
  assert.equal((await readSynthesisProgress("synthesis-pass-test", { store })).inProgress, false);
});

// The evolved run authors; the today run audits (owner ruling, 2026-09-09).
test("the evolved passes carry the authoring rules and the today passes carry none", () => {
  const opening = "Authoring rules for the brand evolved:";
  const know = "You know this category and you know the aesthetic the direction sources name. Bring that knowledge.";
  for (const id of [5, 6, 7, 8]) {
    const instruction = passInstructions(id);
    assert.ok(instruction.includes(opening) && instruction.includes(know), `pass ${id} carries the authoring rules`);
    assert.ok(instruction.indexOf(opening) < instruction.indexOf("Authority rules:"), "authoring precedes authority");
    assert.doesNotMatch(instruction, /Build an evidence-backed Brand Brain from only the supplied sources/);
    assert.doesNotMatch(instruction, /create a review question rather than filling the gap/);
  }
  for (const id of [1, 2, 3, 4]) {
    const instruction = passInstructions(id);
    assert.doesNotMatch(instruction, /Authoring rules for the brand evolved/);
    assert.match(instruction, /Build an evidence-backed Brand Brain from only the supplied sources/);
  }
  // The grammar's thin-is-honest posture belongs to the today run only.
  assert.match(passInstructions(4), /A thin section is correct output/);
  assert.doesNotMatch(passInstructions(8), /A thin section is correct output/);
  assert.match(passInstructions(8), /A thin section is a failure of this run/);
  assert.match(passInstructions(8), /A camera section any brand could use is not finished/);
  assert.equal(DEFAULT_REACH, "a new world");
});

// ---------------------------------------------------------------------------
// Evolved-only rebuild (2026-09-09)
// ---------------------------------------------------------------------------

// The today world did not change, so the four today passes are seeded from
// the stored brain and only passes 5 to 8 run. The today approval stands; the
// prior evolved approval is withdrawn so the new world gets its own decision.
test("an evolved-only rebuild runs four passes on the stored today world and keeps today approved", async () => {
  const store = passStore();
  await runAllPasses(store, { reach: "a clear direction" });
  const full = store.saved();
  // Approve both worlds the way the app does.
  const approved = { ...full.result, artifacts: { today: full.result.artifacts.today, evolved: full.result.artifacts.evolved } };
  await store.write({ ...full, approvedResult: approved, brain: { stage: "ready", artifactStatus: "ready", approvedVersion: 1, evolvedStatus: "ready", evolvedApprovedVersion: 1 } });

  const seen = [];
  let last = null;
  for (const pass of [5, 6, 7, 8]) {
    last = await synthesizeBrandBrain(
      pass === 5
        ? { pass, mode: "evolved", requestId: "evolved-rebuild-test", reach: "a new world" }
        : { pass, requestId: "evolved-rebuild-test", reach: "a new world" },
      {
        store,
        env: { OPENAI_API_KEY: "test-only" },
        async synthesize(call) {
          seen.push(call);
          return { result: { ...passOutput(call.passId), ...(call.passId === 6 ? { livedWorld: { cast: { description: "New people.", examples: [{ name: "Rae", who: "Rae, 29." }] } } } : {}) }, responseId: `r-${call.passId}`, model: "test" };
        },
      },
    );
  }
  assert.deepEqual(seen.map((c) => c.passId), [5, 6, 7, 8], "only the evolved passes ran");
  // Each evolved pass saw the stored today world as passes 1 through 4.
  for (const call of seen) {
    assert.equal(call.priorPasses[2].livedWorld, full.result.artifacts.today.livedWorld, `pass ${call.passId} reads the stored today Lived World`);
    assert.equal(call.reach, "a new world");
    assert.ok(Array.isArray(call.sources) && call.sources.length, "the stored sources were rehydrated");
  }
  assert.equal(last.complete, true);
  const saved = store.saved();
  assert.equal(saved.kind, "evolved-synthesis");
  assert.equal(saved.reach, "a new world");
  assert.deepEqual(saved.result.artifacts.today, full.result.artifacts.today, "the today world is carried over unchanged");
  assert.equal(saved.result.artifacts.evolved.livedWorld.cast.description, "New people.");
  // Today stays approved; the old evolved approval is gone.
  assert.deepEqual(saved.approvedResult.artifacts.today, full.result.artifacts.today);
  assert.equal(saved.approvedResult.artifacts.evolved, undefined);
  assert.equal(saved.brain.artifactStatus, "ready");
  assert.equal(saved.brain.evolvedStatus, "draft");
  assert.equal(saved.brain.evolvedApprovedVersion, 0);
  assert.equal(saved.brain.stage, "ready");
  assert.equal(store.backups().length, 1, "the rebuild backed up the stored brain like any other replace");
});

test("an evolved-only rebuild refuses when there is no stored today world", async () => {
  const store = passStore();
  await assert.rejects(
    synthesizeBrandBrain({ pass: 5, mode: "evolved", requestId: "x" }, { store, env: { OPENAI_API_KEY: "test-only" }, async synthesize() { throw new Error("must not be called"); } }),
    /no brand today/,
  );
});
