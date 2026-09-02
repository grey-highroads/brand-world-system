import assert from "node:assert/strict";
import test from "node:test";
import {
  SEEDREAM_EDIT_ENDPOINT,
  SEEDREAM_IMAGE_MODEL,
  SEEDREAM_TEXT_TO_IMAGE_ENDPOINT,
  buildSeedreamEditRequest,
  buildSeedreamTextToImageRequest,
  chooseSeedreamImageEndpoint,
  renderWithSeedreamImages,
  seedreamImageSize,
} from "../src/renderers/seedream-images.js";
import { OPENAI_IMAGE_GENERATIONS_ENDPOINT, OPENAI_IMAGE_MODEL } from "../src/renderers/openai-images.js";
import { generateProductionImage, productPlacementInstruction, resolveRenderEngine } from "../src/production/service.js";

function approvedBrain() {
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

function brief() {
  return {
    scene: "A person arranging flowers at a worn kitchen table in morning light.",
    exclusions: "No showroom polish or readable copy.",
    placement: "Instagram feed",
    format: "4:5 portrait",
  };
}

function emptyStores() {
  let savedJob = null;
  return {
    brainStore: { async read() { return { approvedResult: approvedBrain(), brain: { approvedVersion: 1 }, sources: [] }; } },
    productionStore: {
      async read() { return savedJob; },
      async write(value) { savedJob = value; },
      async writeImage(jobId) { return { pathname: `${jobId}.png`, contentType: "image/png" }; },
    },
    saved: () => savedJob,
  };
}

// A brain carrying one exact-asset source, which is what a locked-asset job
// resolves against. The two-call path only runs when one of these is present.
function lockedAssetStores() {
  let savedJob = null;
  const written = [];
  return {
    brainStore: {
      async read() {
        return {
          approvedResult: approvedBrain(),
          brain: { approvedVersion: 1 },
          sources: [
            {
              id: "asset-yuzu-can-001",
              name: "SLAKE Yuzu Ginger Can",
              authority: "exact-asset",
              declaredType: "packaging",
              detail: "Primary can artwork",
              usage: "Use this file exactly as supplied.",
              files: [{ name: "yuzu-can.png", type: "image/png", blobPathname: "brand-world-system/sources/yuzu-can.png" }],
            },
          ],
        };
      },
      async readSourceFile(pathname) {
        assert.equal(pathname, "brand-world-system/sources/yuzu-can.png");
        return { bytes: Buffer.from("can-pixels"), mimeType: "image/png" };
      },
    },
    productionStore: {
      async read() { return savedJob; },
      async write(value) { savedJob = value; },
      async writeImage(jobId) {
        written.push(jobId);
        return { pathname: `${jobId}.png`, contentType: "image/png" };
      },
    },
    saved: () => savedJob,
    writtenImages: () => written,
  };
}

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, async json() { return body; } };
}

test("the endpoint is chosen by whether a reference image is attached", () => {
  assert.equal(chooseSeedreamImageEndpoint([]), SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
  assert.equal(chooseSeedreamImageEndpoint([{ name: "can.png", bytes: Uint8Array.from([1]) }]), SEEDREAM_EDIT_ENDPOINT);
});

test("the compiled output size becomes a width and height object", () => {
  assert.deepEqual(seedreamImageSize("1024x1280"), { width: 1024, height: 1280 });
  assert.deepEqual(seedreamImageSize("960x2016"), { width: 960, height: 2016 });
  // "auto" is the package fallback for a format with no own entry. Dropping it
  // leaves the model on its own default rather than on a guessed size.
  assert.equal(seedreamImageSize("auto"), null);
  assert.equal(seedreamImageSize(""), null);
});

test("the text to image request carries the prompt and size and asks for one image", () => {
  const request = buildSeedreamTextToImageRequest({ prompt: "A worn kitchen table", size: "1024x1280", outputFormat: "png" });
  assert.equal(request.endpoint, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
  assert.equal(request.contentType, "application/json");
  assert.equal(request.body.prompt, "A worn kitchen table");
  assert.deepEqual(request.body.image_size, { width: 1024, height: 1280 });
  assert.equal(request.body.num_images, 1);
  assert.equal(request.body.output_format, "png");
  assert.equal(request.body.sync_mode, true);
  assert.equal("image_urls" in request.body, false);
});

test("the edit request passes references as data URIs under image_urls", () => {
  const request = buildSeedreamEditRequest({
    prompt: "Place the can on the table",
    referenceImages: [{ name: "can.png", type: "image/png", bytes: Uint8Array.from(Buffer.from("can-pixels")) }],
    size: "1024x1024",
  });
  assert.equal(request.endpoint, SEEDREAM_EDIT_ENDPOINT);
  assert.equal(request.body.image_urls.length, 1);
  assert.equal(request.body.image_urls[0], `data:image/png;base64,${Buffer.from("can-pixels").toString("base64")}`);
});

test("an edit request without a reference image is refused", () => {
  assert.throws(() => buildSeedreamEditRequest({ prompt: "Anything", referenceImages: [] }), /reference image is required/);
});

test("a missing FAL_KEY names the environment variable", async () => {
  await assert.rejects(
    () => renderWithSeedreamImages({ apiKey: "", prompt: "A worn kitchen table" }),
    /FAL_KEY is not configured/,
  );
});

test("the request authorises with a Key header and returns the shape the service reads", async () => {
  let seen = null;
  const inline = Buffer.from("seedream-pixels").toString("base64");
  const result = await renderWithSeedreamImages({
    apiKey: "fal-test-only",
    prompt: "A worn kitchen table",
    size: "1024x1280",
    async fetchImpl(url, init) {
      seen = { url, init };
      return jsonResponse({ images: [{ url: `data:image/png;base64,${inline}` }] });
    },
  });
  assert.equal(seen.url, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers.Authorization, "Key fal-test-only");
  assert.equal(seen.init.headers["Content-Type"], "application/json");
  assert.equal(JSON.parse(seen.init.body).prompt, "A worn kitchen table");
  assert.equal(result.data[0].b64_json, inline);
  assert.equal(result.usage, null);
});

test("a hosted result URL is fetched and encoded so both engines return one shape", async () => {
  const hosted = "https://v3b.fal.media/files/b/example.png";
  let fetched = "";
  const result = await renderWithSeedreamImages({
    apiKey: "fal-test-only",
    prompt: "A worn kitchen table",
    async fetchImpl(url) {
      if (url === hosted) {
        fetched = url;
        return { ok: true, status: 200, async arrayBuffer() { return Buffer.from("hosted-pixels"); } };
      }
      return jsonResponse({ images: [{ url: hosted }] });
    },
  });
  assert.equal(fetched, hosted);
  assert.equal(result.data[0].b64_json, Buffer.from("hosted-pixels").toString("base64"));
});

test("a failed request reports the message fal returned", async () => {
  await assert.rejects(
    () => renderWithSeedreamImages({
      apiKey: "fal-test-only",
      prompt: "A worn kitchen table",
      async fetchImpl() { return jsonResponse({ detail: "The prompt was rejected." }, false, 422); },
    }),
    /The prompt was rejected/,
  );
});

test("an unknown engine name falls back to the default rather than failing the render", () => {
  assert.equal(resolveRenderEngine("seedream").name, "seedream");
  assert.equal(resolveRenderEngine("SeeDream").name, "seedream");
  assert.equal(resolveRenderEngine("nothing-by-that-name").name, "openai");
  assert.equal(resolveRenderEngine(undefined).name, "openai");
  assert.equal(resolveRenderEngine("constructor").name, "openai");
});

test("the engine value routes to the matching renderer and is recorded on the package", async () => {
  const stores = emptyStores();
  const job = await generateProductionImage(
    { jobId: "render-seedream-1234", brief: brief(), references: [], engine: "seedream" },
    {
      ...stores,
      env: { OPENAI_API_KEY: "openai-test-only", FAL_KEY: "fal-test-only" },
      async fetchImpl() { return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from("image").toString("base64")}` }] }); },
    },
  );
  assert.equal(job.status, "complete");
  assert.equal(stores.saved().engine, "seedream");
  assert.equal(stores.saved().engineLabel, "Seedream 5 Pro");
  assert.equal(stores.saved().model, SEEDREAM_IMAGE_MODEL);
  assert.equal(stores.saved().endpoint, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
});

test("the seedream engine reads its key from FAL_KEY and not the OpenAI key", async () => {
  const stores = emptyStores();
  let authorization = "";
  await generateProductionImage(
    { jobId: "render-seedream-key-1", brief: brief(), references: [], engine: "seedream" },
    {
      ...stores,
      env: { OPENAI_API_KEY: "openai-test-only", FAL_KEY: "fal-test-only" },
      async fetchImpl(url, init) {
        authorization = init.headers.Authorization;
        return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from("image").toString("base64")}` }] });
      },
    },
  );
  assert.equal(authorization, "Key fal-test-only");
});

test("a render request with no engine value behaves exactly as it did before the picker", async () => {
  const stores = emptyStores();
  let calls = 0;
  const job = await generateProductionImage(
    { jobId: "render-default-1234", brief: brief(), references: [] },
    {
      ...stores,
      env: { OPENAI_API_KEY: "openai-test-only" },
      async render() {
        calls += 1;
        return { data: [{ b64_json: Buffer.from("image").toString("base64") }] };
      },
    },
  );
  assert.equal(calls, 1);
  assert.equal(job.status, "complete");
  assert.equal(stores.saved().engine, "openai");
  assert.equal(stores.saved().model, OPENAI_IMAGE_MODEL);
  assert.equal(stores.saved().endpoint, OPENAI_IMAGE_GENERATIONS_ENDPOINT);
});

test("the compiled prompt does not vary by engine", async () => {
  const prompts = [];
  for (const engine of [undefined, "openai", "seedream"]) {
    const stores = emptyStores();
    await generateProductionImage(
      { jobId: `render-parity-${engine || "none"}-1`, brief: brief(), references: [], engine },
      {
        ...stores,
        env: { OPENAI_API_KEY: "openai-test-only", FAL_KEY: "fal-test-only" },
        async render({ prompt }) {
          prompts.push(prompt);
          return { data: [{ b64_json: Buffer.from("image").toString("base64") }] };
        },
      },
    );
  }
  assert.equal(prompts.length, 3);
  assert.equal(prompts[0], prompts[1]);
  assert.equal(prompts[1], prompts[2]);
});

// ---------------------------------------------------------------------------
// Two-call rendering when a locked asset is present (2026-09-02)
// ---------------------------------------------------------------------------

test("a locked asset on Seedream renders the scene first and then places the product", async () => {
  const stores = lockedAssetStores();
  const calls = [];
  const job = await generateProductionImage(
    { jobId: "seedream-two-call-01", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "seedream" },
    {
      ...stores,
      env: { FAL_KEY: "fal-test-only" },
      async fetchImpl(url, init) {
        calls.push({ url, body: JSON.parse(init.body) });
        return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from(`render-${calls.length}`).toString("base64")}` }] });
      },
    },
  );

  assert.equal(job.status, "complete");
  assert.equal(calls.length, 2);

  // Call one is text to image with nothing supplied, so the scene sets its own
  // scale rather than inheriting the product reference's framing.
  assert.equal(calls[0].url, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
  assert.equal("image_urls" in calls[0].body, false);
  assert.doesNotMatch(calls[0].body.prompt, /The supplied product image governs artwork and geometry/);
  assert.doesNotMatch(calls[0].body.prompt, /closed and sealed exactly as supplied/);
  assert.doesNotMatch(calls[0].body.prompt, /Exactly one unit of the product/);

  // Call two is the edit, with the scene first and the asset second, because
  // the instruction names them by figure number.
  assert.equal(calls[1].url, SEEDREAM_EDIT_ENDPOINT);
  assert.equal(calls[1].body.image_urls.length, 2);
  assert.equal(calls[1].body.image_urls[0], `data:image/png;base64,${Buffer.from("render-1").toString("base64")}`);
  assert.equal(calls[1].body.image_urls[1], `data:image/png;base64,${Buffer.from("can-pixels").toString("base64")}`);
  assert.equal(calls[1].body.prompt, productPlacementInstruction(""));
});

test("the record carries both prompts, both endpoints, and both images", async () => {
  const stores = lockedAssetStores();
  await generateProductionImage(
    { jobId: "seedream-two-call-02", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "seedream" },
    {
      ...stores,
      env: { FAL_KEY: "fal-test-only" },
      async fetchImpl() {
        return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from("image").toString("base64")}` }] });
      },
    },
  );

  const record = stores.saved();
  const twoCall = record.generationPackage.twoCall;
  assert.ok(twoCall, "the package records the two-call plan");
  assert.equal(twoCall.model, SEEDREAM_IMAGE_MODEL);
  assert.equal(twoCall.sceneEndpoint, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
  assert.equal(twoCall.placementEndpoint, SEEDREAM_EDIT_ENDPOINT);
  assert.match(twoCall.placementInstruction, /^Replace the product in Figure 1/);
  assert.notEqual(twoCall.scenePrompt, record.generationPackage.prompt);
  assert.match(record.generationPackage.prompt, /The supplied product image governs artwork and geometry/);
  assert.equal(twoCall.sceneImageId, "seedream-two-call-02-scene");
  // The final call is an edit call, which is what the provenance label reads.
  assert.equal(record.endpoint, SEEDREAM_EDIT_ENDPOINT);
  assert.deepEqual(stores.writtenImages(), ["seedream-two-call-02", "seedream-two-call-02-scene"]);
});

test("the placement instruction names the product when a product record supplies one", () => {
  assert.match(productPlacementInstruction("Yuzu Ginger can"), /^Replace the Yuzu Ginger can in Figure 1 with the one shown in Figure 2\./);
  assert.match(productPlacementInstruction(null), /^Replace the product in Figure 1/);
  assert.match(productPlacementInstruction("  "), /^Replace the product in Figure 1/);
  assert.match(productPlacementInstruction("Yuzu Ginger can"), /Keep the label upright and oriented as in Figure 2\./);
});

test("seedream with no locked asset still renders in one call", async () => {
  const stores = emptyStores();
  let calls = 0;
  await generateProductionImage(
    { jobId: "seedream-one-call-01", brief: brief(), references: [], engine: "seedream" },
    {
      ...stores,
      env: { FAL_KEY: "fal-test-only" },
      async render() {
        calls += 1;
        return { data: [{ b64_json: Buffer.from("image").toString("base64") }] };
      },
    },
  );
  assert.equal(calls, 1);
  assert.equal(stores.saved().generationPackage.twoCall, undefined);
  assert.equal(stores.saved().endpoint, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
});

test("openai with a locked asset is untouched by the two-call path", async () => {
  const stores = lockedAssetStores();
  const prompts = [];
  await generateProductionImage(
    { jobId: "openai-locked-asset-01", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "openai" },
    {
      ...stores,
      env: { OPENAI_API_KEY: "openai-test-only" },
      async render({ prompt, referenceImages }) {
        prompts.push({ prompt, count: referenceImages.length });
        return { data: [{ b64_json: Buffer.from("image").toString("base64") }] };
      },
    },
  );
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].count, 1);
  assert.equal(prompts[0].prompt, stores.saved().generationPackage.prompt);
  assert.equal(stores.saved().generationPackage.twoCall, undefined);
  assert.deepEqual(stores.writtenImages(), ["openai-locked-asset-01"]);
});
