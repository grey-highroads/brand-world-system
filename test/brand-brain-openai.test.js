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
import { PASS_IDS, brandBrainSchema, passSchemas } from "../src/brand-brain/schema.js";
import { assembleBrainFromPasses, readSynthesisProgress } from "../src/brand-brain/service.js";
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
// Four-pass synthesis (2026-09-07)
// ---------------------------------------------------------------------------

// A store with in-progress state, which is where the half-built brain lives
// between passes. Nothing reaches `stored` until the fourth pass finishes.
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
      livedWorld: { people: [{ id: "person-1", name: "Dana", who: "27, runs the front of a bike shop." }] },
      reviewQuestions: [{ id: "q-2", type: "other" }],
    },
    3: {
      storyArchitecture: { moments: [{ id: "moment-1", title: "Coming in the door", who: ["person-1"] }] },
      reviewQuestions: [],
    },
    4: {
      visualGrammar: { sections: { people: [{ id: "people-1", statement: "Hands show use." }] } },
      reviewQuestions: [{ id: "q-2", type: "other" }, { id: "q-4", type: "other" }],
    },
  }[passId];
}

// Runs every pass the way the client does: pass 1 carries the sources, the rest
// carry only the request id.
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

test("four passes assemble one brain with the shape a single call used to return", async () => {
  const store = passStore();
  const { seen, last } = await runAllPasses(store);

  assert.deepEqual(seen.map((call) => call.passId), [1, 2, 3, 4]);
  assert.equal(last.complete, true);
  assert.equal(store.saved().result.brandName, "Fallow");
  assert.equal(store.saved().result.artifacts.livedWorld.people[0].name, "Dana");
  assert.equal(store.saved().result.artifacts.storyArchitecture.moments[0].id, "moment-1");
  assert.equal(store.saved().result.artifacts.visualGrammar.sections.people[0].id, "people-1");
  assert.equal(store.saved().result.artifacts.dossier.readBody, "Fallow finds character in useful rooms.");
  assert.equal(store.saved().synthesisRequestId, "synthesis-pass-test");
  assert.equal(store.saved().sources[0].id, "approved-note");

  // The saved shape is what it was. responseId and model carry pass 1's values,
  // usage sums across passes, and the per-pass ids are the one addition.
  assert.equal(store.saved().responseId, "chatcmpl-1");
  assert.equal(store.saved().model, "gpt-5.6");
  assert.deepEqual(store.saved().usage, { total_tokens: 100 });
  assert.deepEqual(store.saved().passes.map((entry) => entry.pass), [1, 2, 3, 4]);
  assert.equal(store.saved().passes[1].label, "the people and their days");

  // Review questions from every pass survive, deduplicated by id: pass 4 raised
  // q-2 again, and it appears once.
  assert.deepEqual(store.saved().result.reviewQuestions.map((q) => q.id), ["q-1", "q-2", "q-4"]);

  // The in-progress record is gone once the synthesis finishes.
  assert.equal(store.inProgress(), null);
});

test("each pass receives what the passes before it wrote", async () => {
  const store = passStore();
  const { seen } = await runAllPasses(store);
  const call = (passId) => seen.find((entry) => entry.passId === passId);

  assert.deepEqual(Object.keys(call(1).priorPasses), []);
  assert.deepEqual(Object.keys(call(2).priorPasses), ["1"]);
  // Pass 3 places known people into moments. It receives the Lived World, so
  // the ids its moments name are ids that already exist.
  assert.equal(call(3).priorPasses[2].livedWorld.people[0].id, "person-1");
  // Pass 4 describes the physical world of those moments, so it receives them.
  assert.equal(call(4).priorPasses[3].storyArchitecture.moments[0].title, "Coming in the door");
  assert.equal(call(4).priorPasses[2].livedWorld.people[0].name, "Dana");
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
  const store = passStore();
  await assert.rejects(
    () => runAllPasses(store, { failOn: 3 }),
    (error) => {
      assert.equal(error.pass, 3);
      assert.match(error.message, /the model call failed/);
      return true;
    },
  );
  assert.equal(store.saved(), null, "a failed synthesis writes no brain");
  assert.equal(store.inProgress(), null, "a failed synthesis leaves no half-built work");
  assert.deepEqual(store.backups(), [], "nothing was replaced, so nothing was backed up");
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

test("incremental synthesis hands each pass its own slice of the approved baseline", async () => {
  const baseline = {
    brandName: "Fallow",
    guidanceSections: [{ id: "foundation" }],
    reviewQuestions: [],
    artifacts: {
      dossier: { readBody: "approved dossier" },
      livedWorld: { people: [{ id: "person-9", name: "Approved Dana" }] },
      storyArchitecture: { moments: [{ id: "moment-9" }] },
      visualGrammar: { sections: {} },
    },
  };
  const store = passStore({ approvedResult: baseline, brain: { approvedVersion: 3 }, sources: [] });
  const { seen } = await runAllPasses(store, { mode: "incremental", baselineVersion: 3 });

  const call = (passId) => seen.find((entry) => entry.passId === passId);
  assert.equal(call(1).baseline.dossier.readBody, "approved dossier");
  assert.equal(call(1).baseline.brandName, "Fallow");
  assert.equal(call(2).baseline.livedWorld.people[0].id, "person-9");
  assert.equal(call(3).baseline.storyArchitecture.moments[0].id, "moment-9");
  assert.deepEqual(Object.keys(call(4).baseline), ["visualGrammar"]);
  // A pass sees only its own slice, so pass 2 cannot quietly rewrite guidance.
  assert.equal("guidanceSections" in call(2).baseline, false);

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
});

test("a rebuild backs the existing brain up once, on the pass that replaces it", async () => {
  const store = passStore({ result: { brandName: "Previous" }, sources: [] });
  await runAllPasses(store);
  assert.equal(store.backups().length, 1);
  assert.equal(store.backups()[0].result.brandName, "Previous");
});

test("each pass answers to its own slice of the schema, and the slices cover the brain", () => {
  assert.deepEqual(PASS_IDS, [1, 2, 3, 4]);
  const sliceKeys = PASS_IDS.flatMap((id) => Object.keys(passSchemas[id].properties));
  for (const key of ["dossier", "livedWorld", "storyArchitecture", "visualGrammar"]) {
    assert.ok(sliceKeys.includes(key), `${key} is written by some pass`);
  }
  for (const key of Object.keys(brandBrainSchema.properties)) {
    if (key === "artifacts") continue;
    assert.ok(sliceKeys.includes(key), `${key} is written by some pass`);
  }
  // Only pass 1 writes the guidance sections, so no later pass can rewrite them.
  assert.deepEqual(PASS_IDS.filter((id) => "guidanceSections" in passSchemas[id].properties), [1]);
});

test("the assembled brain has every top-level key brandBrainSchema names", () => {
  const assembled = assembleBrainFromPasses({ 1: passOutput(1), 2: passOutput(2), 3: passOutput(3), 4: passOutput(4) });
  assert.deepEqual(Object.keys(assembled).sort(), Object.keys(brandBrainSchema.properties).sort());
  assert.deepEqual(
    Object.keys(assembled.artifacts).sort(),
    Object.keys(brandBrainSchema.properties.artifacts.properties).sort(),
  );
  // Four passes can raise up to eight questions each, so the assembled cap is
  // four times the pass cap. Nothing is dropped on merge.
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
  assert.match(instruction, /This is pass 3 of 4/);
  assert.match(instruction, /Story Architecture:/);
  // The Lived World and Visual Grammar rules belong to other passes and are not
  // sent here. The whole point of the split is that a call is told what it is
  // doing rather than everything the system knows.
  assert.doesNotMatch(instruction, /Where the rejects come from:/);
  assert.doesNotMatch(instruction, /Camera entries are settings:/);
  const text = request.messages[1].content[0].text;
  assert.match(text, /ALREADY WRITTEN, PASS 2, the people and their days/);
  assert.match(text, /person-1/);
  // Pass 3 places people into moments from what the earlier passes wrote, so it
  // is sent the source register but not the source images.
  assert.equal(request.messages[1].content.length, 1);
  assert.match(text, /"id": "s1"/);
});

test("passes that read the sources directly still receive the images", () => {
  for (const passId of [1, 2, 4]) {
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

test("the Lived World schema asks for several people rather than one portrait", () => {
  const lived = brandBrainSchema.properties.artifacts.properties.livedWorld;
  assert.equal("person" in lived.properties, false, "the single person string is gone");
  const people = lived.properties.people;
  assert.equal(people.type, "array");
  assert.equal(people.minItems, 2);
  assert.equal(people.maxItems, 5);
  assert.deepEqual(people.items.required, ["id", "name", "who", "basis"]);
  assert.equal(people.items.additionalProperties, false);
  // A person entry has to be castable, so the description says so rather than
  // leaving the model to decide that a segment counts.
  assert.match(people.items.properties.who.description, /audience description is not a person/);
  assert.ok(lived.required.includes("people"));
  assert.equal(lived.required.includes("person"), false);
});

test("a Story Architecture moment names when, where, who, and what is being done", () => {
  const moments = brandBrainSchema.properties.artifacts.properties.storyArchitecture.properties.moments;
  assert.equal(moments.minItems, 6);
  assert.equal(moments.maxItems, 12);
  assert.deepEqual(moments.items.required, ["id", "title", "when", "where", "who", "doing", "feeling", "basis"]);
  // The product beat is gone. A moment that exists to show the product is the
  // failure this change was made to stop.
  for (const gone of ["product", "index", "scale", "role", "action"]) {
    assert.equal(gone in moments.items.properties, false, `the ${gone} field is gone from a moment`);
  }
  // who is a list of Lived World person ids, at least one.
  assert.equal(moments.items.properties.who.type, "array");
  assert.equal(moments.items.properties.who.minItems, 1);
  assert.match(moments.items.properties.who.description, /by their ids/);
  assert.equal(moments.items.properties.basis.properties.origin.enum.includes("ambition"), true,
    "the shared basis object still permits ambition; the instructions are what forbid it here");
});

test("the synthesis instructions brief Story Architecture and the Lived World people", () => {
  const instructions = [1, 2, 3, 4].map(passInstructions).join("\n\n");
  assert.match(instructions, /Story Architecture:/);
  assert.match(instructions, /it is an ad, and it belongs nowhere in this artifact/);
  assert.match(instructions, /names the people present by their Lived World ids|by their Lived World ids/);
  // The Lived World now briefs people, and says plainly what a segment looks
  // like, because "a late 20s professional" is what the old shape produced.
  assert.match(instructions, /is a segment/);
  assert.match(instructions, /each one particular enough to put in a room/);
  assert.doesNotMatch(instructions, /It is a portrait of a person and their days/);
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
