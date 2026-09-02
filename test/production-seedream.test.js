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
import { generateProductionImage, resolveRenderEngine } from "../src/production/service.js";

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
