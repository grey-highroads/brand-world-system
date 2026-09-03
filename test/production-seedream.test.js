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
import { compileBrandWorldImagePackage } from "../src/production/package.js";

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

  // Call two is the edit, with the scene first as the image being edited and
  // the asset second as the supplied product image.
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
  // Minimal placement instruction, noun hardcoded to "can". The orientation
  // sentence returned on 2026-09-02 after the mirrored label recurred.
  assert.equal(twoCall.placementInstruction, "Replace the can with the supplied can image. Keep the label upright and readable.");
  assert.notEqual(twoCall.scenePrompt, record.generationPackage.prompt);
  assert.match(record.generationPackage.prompt, /The supplied product image governs artwork and geometry/);
  assert.equal(twoCall.sceneImageId, "seedream-two-call-02-scene");
  // The final call is an edit call, which is what the provenance label reads.
  assert.equal(record.endpoint, SEEDREAM_EDIT_ENDPOINT);
  assert.deepEqual(stores.writtenImages(), ["seedream-two-call-02", "seedream-two-call-02-scene"]);
});

test("the placement instruction carries the orientation sentence and ignores the product name", () => {
  // The orientation sentence returned on 2026-09-02 after the label mirrored on
  // both evening renders under the minimal instruction. Nothing else returned.
  const expected = "Replace the can with the supplied can image. Keep the label upright and readable.";
  assert.equal(productPlacementInstruction("Yuzu Ginger can"), expected);
  assert.equal(productPlacementInstruction(null), expected);
  assert.equal(productPlacementInstruction("  "), expected);
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

// ---------------------------------------------------------------------------
// The scene call describes a plain product (2026-09-02)
// ---------------------------------------------------------------------------

// An approved product record whose visual direction carries the label demands
// that inflated the can on the 2026-09-02 job. The scene call must not see it.
function approvedProduct() {
  return {
    product_id: "yuzu-ginger-can",
    product_name: "Yuzu Ginger can",
    approved_at: "2026-08-01T00:00:00.000Z",
    one_true_thing: "A sparkling tonic brewed rather than mixed.",
    visual_direction: "Show the vertical branding on the can face, with the flavor statement, the energy statement, the caffeine-free statement, and the volume statement all legible.",
    exclusions: ["No droplets"],
    review_questions: [],
    images: [],
  };
}

function productStoreFor(record) {
  return {
    async readProduct(productId) {
      return productId === record.product_id ? record : null;
    },
  };
}

test("the scene call asks for a plain product at true size and carries no label demands", async () => {
  const stores = lockedAssetStores();
  const product = approvedProduct();
  const calls = [];
  await generateProductionImage(
    { jobId: "seedream-placeholder-01", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", productId: product.product_id, engine: "seedream" },
    {
      ...stores,
      productStore: productStoreFor(product),
      env: { FAL_KEY: "fal-test-only" },
      async fetchImpl(url, init) {
        calls.push({ url, body: JSON.parse(init.body) });
        return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from(`render-${calls.length}`).toString("base64")}` }] });
      },
    },
  );

  const scenePrompt = calls[0].body.prompt;
  assert.equal(
    stores.saved().generationPackage.twoCall.scenePrompt,
    scenePrompt,
    "the prompt sent on call one is the recorded scene prompt",
  );
  // Minimal scene placeholder, one sentence, noun hardcoded to "can". The
  // format was named on 2026-09-02 after the stand-in came back the wrong shape.
  assert.match(scenePrompt, /This scene includes a plain unmarked 12 oz sleek can at its real size\./);
  assert.doesNotMatch(scenePrompt, /Yuzu Ginger can, shown as a plain unmarked version/);
  assert.doesNotMatch(scenePrompt, /Visual direction:/);
  assert.doesNotMatch(scenePrompt, /vertical branding/);
  assert.doesNotMatch(scenePrompt, /volume statement/);
  assert.doesNotMatch(scenePrompt, /caffeine-free statement/);

  // The one-call prompt on the same job still carries the full product section,
  // because only the scene pass is placeholdered.
  assert.match(stores.saved().generationPackage.prompt, /Visual direction: Show the vertical branding/);

  // Call two is untouched: the same fixed instruction, named product and all.
  assert.equal(calls[1].body.prompt, productPlacementInstruction("Yuzu Ginger can"));
});

test("the scene pass changes the Product knowledge body and the Protection avoid sentence", () => {
  const inputs = {
    approvedBrain: approvedBrain(),
    brainVersion: 1,
    brief: brief(),
    references: [],
    product: approvedProduct(),
  };
  const normal = compileBrandWorldImagePackage(inputs);
  const scene = compileBrandWorldImagePackage({ ...inputs, scenePass: true });
  // Protection joined Product knowledge on 2026-09-02: product-record
  // exclusions stopped compiling on the scene pass. See the test below.
  assert.deepEqual(
    normal.sections.filter((section, index) => section.body !== scene.sections[index].body).map((section) => section.title),
    ["Product knowledge", "Protection"],
  );
  // Left at its default the option changes nothing, which is what keeps every
  // single-call compile on both engines byte identical.
  assert.equal(
    JSON.stringify(compileBrandWorldImagePackage({ ...inputs, scenePass: false })),
    JSON.stringify(normal),
  );
});

// The 7:38 PM render of 2026-09-02 came back with CAFFEINE FREE painted onto
// the placeholder can, verbatim from the product record's avoid sentence. The
// scene pass draws a blank stand-in, so an avoid sentence naming label text has
// nothing to protect there and reads as an instruction to draw it.
test("the scene pass drops product-record exclusions and keeps the brief's", () => {
  const product = { ...approvedProduct(), exclusions: ["No caffeine-free callout", "No droplets"] };
  const inputs = {
    approvedBrain: approvedBrain(),
    brainVersion: 1,
    brief: brief(),
    references: [],
    product,
  };
  const scene = compileBrandWorldImagePackage({ ...inputs, scenePass: true });
  const single = compileBrandWorldImagePackage(inputs);
  const sceneProtection = scene.sections.find((section) => section.title === "Protection").body;
  const singleProtection = single.sections.find((section) => section.title === "Protection").body;

  assert.doesNotMatch(scene.prompt, /No caffeine-free callout/);
  assert.doesNotMatch(scene.prompt, /No droplets/);
  assert.doesNotMatch(scene.prompt, /per the product record/);
  assert.match(sceneProtection, /Avoid the following, per the brief: No showroom polish or readable copy\./);

  // The single-call compile still carries both, unchanged.
  assert.match(singleProtection, /per the brief and the product record/);
  assert.match(singleProtection, /No caffeine-free callout; No droplets/);
});

// The format's craft paragraph is appended to the scene text in the browser,
// and an authored sentence ending without a period ran straight into it:
// "holding a soda can The largest shape in the Instagram feed."
test("the assignment closes the scene sentence only when the author left it open", () => {
  const base = {
    approvedBrain: approvedBrain(),
    brainVersion: 1,
    references: [],
  };
  const assignment = (scene) => compileBrandWorldImagePackage({
    ...base,
    brief: { ...brief(), scene },
  }).sections.find((section) => section.title === "Assignment").body;

  assert.match(assignment("A hand holding a soda can Wide cinematic banner"), /soda can Wide cinematic banner\./);
  // Already-correct assignments compile to the same bytes as before.
  assert.equal(
    assignment("A person arranging flowers at a worn kitchen table in morning light."),
    "Create one 4:5 portrait brand world image for Instagram feed. A person arranging flowers at a worn kitchen table in morning light.",
  );
  assert.match(assignment("Who is holding the can?"), /Who is holding the can\?$/);
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
