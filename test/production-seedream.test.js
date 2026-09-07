import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const servicePath = path.join(srcDir, "production", "service.js");

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

// The edit endpoint defaults image_size to auto_2K, which follows the input
// image. Naming a size on an edit reads as a request to generate a new frame
// rather than to change one object in the frame we supplied, and the whole
// frame came back subtly redrawn on 2026-09-02. The key is omitted rather than
// sent as auto_2K so the documented default applies.
test("the edit request sends no image_size even when the caller passes a size", () => {
  const request = buildSeedreamEditRequest({
    prompt: "Place the can on the table",
    referenceImages: [{ name: "can.png", type: "image/png", bytes: Uint8Array.from(Buffer.from("can-pixels")) }],
    size: "1024x1024",
  });
  assert.equal("image_size" in request.body, false);
  // Everything else on the edit body is unchanged.
  assert.equal(request.body.num_images, 1);
  assert.equal(request.body.output_format, "png");
  assert.equal(request.body.sync_mode, true);
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
// The two-call render, disabled 2026-09-07
//
// The branch existed to withhold the product from call one and swap the real
// asset in on call two, which worked because the scene pass replaced the
// Product knowledge section with a plain-product placeholder. No product
// section compiles on any scene render as of c8664ba3, so call one would draw
// an invented product and call two would be asked to replace "the can" in a
// frame that may hold two. The owner ruled single call with the locked asset.
//
// The branch body is preserved behind one value. The tests below cover both
// states: the live path renders in one call, and the flag-flip test exercises
// the preserved code end to end so it cannot rot while it waits.
// See docs/findings-2026-09-07-two-call-disabled.md.
// ---------------------------------------------------------------------------

test("a locked asset on Seedream renders in one call with the asset supplied", async () => {
  const stores = lockedAssetStores();
  const calls = [];
  const job = await generateProductionImage(
    { jobId: "seedream-single-call-01", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "seedream" },
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
  assert.equal(calls.length, 1);

  // One edit call, because an image is supplied. The locked asset is the only
  // thing supplied, and the prompt is the compiled single-call prompt rather
  // than the fixed placement instruction.
  assert.equal(calls[0].url, SEEDREAM_EDIT_ENDPOINT);
  assert.equal(calls[0].body.image_urls.length, 1);
  assert.equal(calls[0].body.image_urls[0], `data:image/png;base64,${Buffer.from("can-pixels").toString("base64")}`);
  assert.equal(calls[0].body.prompt, stores.saved().generationPackage.prompt);
  assert.notEqual(calls[0].body.prompt, productPlacementInstruction(""));
});

test("a locked asset on Seedream records no two-call plan and writes one image", async () => {
  const stores = lockedAssetStores();
  await generateProductionImage(
    { jobId: "seedream-single-call-02", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "seedream" },
    {
      ...stores,
      env: { FAL_KEY: "fal-test-only" },
      async fetchImpl() {
        return jsonResponse({ images: [{ url: `data:image/png;base64,${Buffer.from("image").toString("base64")}` }] });
      },
    },
  );

  const record = stores.saved();
  assert.equal(record.generationPackage.twoCall, undefined);
  // The compiled package is otherwise unchanged: the locked asset is still on
  // it, and the compile is still the three-section scene shape.
  assert.equal(record.generationPackage.lockedAsset.name, "SLAKE Yuzu Ginger Can");
  assert.deepEqual(
    record.generationPackage.sections.map((section) => section.title),
    ["Assignment", "Capture", "Output"],
  );
  assert.equal(record.endpoint, SEEDREAM_EDIT_ENDPOINT);
  // No scene intermediate is written, so the discard path has one image to find.
  assert.deepEqual(stores.writtenImages(), ["seedream-single-call-02"]);
});

// The preserved branch, exercised by flipping the one value that disables it.
// The module is copied to a temporary file with the flag set true and its
// relative imports rewritten to absolute ones, so the real branch body runs
// against the real compiler. This fails if someone deletes the branch, renames
// the flag, or lets the preserved code drift out of working order, and it is
// the reason the code can sit disabled without quietly rotting.
test("flipping twoCallEnabled restores the two-call render", async () => {
  const source = fs.readFileSync(servicePath, "utf8");
  assert.equal(
    source.split("const twoCallEnabled = false;").length - 1,
    1,
    "the two-call flag is one value in one place",
  );
  const flipped = source
    .replace("const twoCallEnabled = false;", "const twoCallEnabled = true;")
    .replaceAll('from "../', `from "${pathToFileURL(path.join(srcDir, "x")).href.replace(/x$/, "")}`)
    .replaceAll('from "./', `from "${pathToFileURL(path.join(srcDir, "production", "x")).href.replace(/x$/, "")}`);
  const tempPath = path.join(os.tmpdir(), `bws-two-call-flip-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, flipped);
  try {
    const flippedModule = await import(pathToFileURL(tempPath).href);
    const stores = lockedAssetStores();
    const calls = [];
    const job = await flippedModule.generateProductionImage(
      { jobId: "seedream-flip-01", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", engine: "seedream" },
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

    // Call two is the edit, with the scene first as the image being edited and
    // the asset second as the supplied product image.
    assert.equal(calls[1].url, SEEDREAM_EDIT_ENDPOINT);
    assert.equal(calls[1].body.image_urls.length, 2);
    assert.equal(calls[1].body.image_urls[0], `data:image/png;base64,${Buffer.from("render-1").toString("base64")}`);
    assert.equal(calls[1].body.image_urls[1], `data:image/png;base64,${Buffer.from("can-pixels").toString("base64")}`);
    assert.equal(calls[1].body.prompt, productPlacementInstruction(""));

    const record = stores.saved();
    const twoCall = record.generationPackage.twoCall;
    assert.ok(twoCall, "the package records the two-call plan");
    assert.equal(twoCall.model, SEEDREAM_IMAGE_MODEL);
    assert.equal(twoCall.sceneEndpoint, SEEDREAM_TEXT_TO_IMAGE_ENDPOINT);
    assert.equal(twoCall.placementEndpoint, SEEDREAM_EDIT_ENDPOINT);
    assert.equal(twoCall.placementInstruction, "Replace the can in Figure 1 with the can in Figure 2. Match the size and position of the can already in Figure 1. Everything else in Figure 1 stays exactly as it is.");
    // Both passes compile the same three sections, so the scene prompt and the
    // single-call prompt are equal. The calls differ in what they send beside it.
    assert.equal(twoCall.scenePrompt, record.generationPackage.prompt);
    assert.deepEqual(twoCall.sceneSections.map((section) => section.title), ["Assignment", "Capture", "Output"]);
    assert.equal(twoCall.sceneImageId, "seedream-flip-01-scene");
    assert.equal(record.endpoint, SEEDREAM_EDIT_ENDPOINT);
    assert.deepEqual(stores.writtenImages(), ["seedream-flip-01", "seedream-flip-01-scene"]);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
});

test("the placement instruction names both figures and ignores the product name", () => {
  // The edit endpoint's own prompt convention identifies inputs by figure
  // number. Naming no figures left the model to guess which supplied image was
  // the scene, and both 2026-09-02 evening renders came back with an invented
  // label and a re-rendered frame. The matching sentence was added after the
  // grounded render returned the replacement can at roughly twice the width
  // and three times the height of the can it replaced. The orientation
  // sentence is gone: its evidence was collected while the edit was
  // ungrounded, and the first grounded render returned the label the right way
  // up without it being asked for.
  const expected = "Replace the can in Figure 1 with the can in Figure 2. Match the size and position of the can already in Figure 1. Everything else in Figure 1 stays exactly as it is.";
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

// This test used to read the scene call's prompt off call one. There is no call
// one now. What it was really pinning is that the product record's label
// demands do not reach the renderer, which is still worth holding: the visual
// direction asked for four legible statements on the can face, and carrying it
// is what made the model draw the product large enough to read.
test("the product record's label demands do not reach the renderer", async () => {
  const stores = lockedAssetStores();
  const product = approvedProduct();
  const calls = [];
  await generateProductionImage(
    { jobId: "seedream-single-call-03", brief: brief(), references: [], lockedAssetId: "asset-yuzu-can-001", productId: product.product_id, engine: "seedream" },
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

  assert.equal(calls.length, 1);
  const prompt = calls[0].body.prompt;
  assert.equal(prompt, stores.saved().generationPackage.prompt);
  assert.doesNotMatch(prompt, /This scene includes a plain unmarked tall narrow can/);
  assert.doesNotMatch(prompt, /Visual direction:/);
  assert.doesNotMatch(prompt, /vertical branding/);
  assert.doesNotMatch(prompt, /volume statement/);
  assert.doesNotMatch(prompt, /caffeine-free statement/);
  assert.doesNotMatch(prompt, /No droplets/);
});

// scenePass used to change the Product knowledge body and the Protection avoid
// sentence. Neither section compiles on a scene render as of 2026-09-07, so the
// flag now changes nothing in the compiled sections. It is left in place: the
// two-call branch still reads it, and the scene pass still compiles with the
// locked asset withheld, which is what keeps call one from rendering the
// product before call two places it.
test("the scene pass and the single call compile the same three sections", () => {
  const inputs = {
    approvedBrain: approvedBrain(),
    brainVersion: 1,
    brief: brief(),
    references: [],
    product: approvedProduct(),
  };
  const normal = compileBrandWorldImagePackage(inputs);
  const scene = compileBrandWorldImagePackage({ ...inputs, scenePass: true });
  assert.deepEqual(normal.sections.map((section) => section.title), ["Assignment", "Capture", "Output"]);
  assert.deepEqual(scene.sections.map((section) => section.title), ["Assignment", "Capture", "Output"]);
  assert.equal(scene.prompt, normal.prompt);
  // Left at its default the option changes nothing, which is what keeps every
  // single-call compile on both engines byte identical.
  assert.equal(
    JSON.stringify(compileBrandWorldImagePackage({ ...inputs, scenePass: false })),
    JSON.stringify(normal),
  );
});

// The 7:38 PM render of 2026-09-02 came back with CAFFEINE FREE painted onto
// the placeholder can, verbatim from the product record's avoid sentence, which
// is why product-record exclusions stopped compiling on the scene pass. As of
// 2026-09-07 no exclusions compile into a scene prompt on either pass. They
// stay on the record and in the constraint audit, which now reports them as not
// carried.
test("no exclusions compile into a scene prompt on either pass, and both stay on the record", () => {
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

  for (const pkg of [scene, single]) {
    assert.equal(pkg.sections.find((section) => section.title === "Protection"), undefined);
    assert.doesNotMatch(pkg.prompt, /No caffeine-free callout/);
    assert.doesNotMatch(pkg.prompt, /No droplets/);
    assert.doesNotMatch(pkg.prompt, /No showroom polish or readable copy/);
    assert.doesNotMatch(pkg.prompt, /Avoid the following/);
  }

  assert.equal(single.brief.exclusions, "No showroom polish or readable copy.");
  assert.equal(single.product.product_name, product.product_name);
  const audited = single.constraintAudit.find((entry) => entry.source === "Brief exclusion");
  assert.notEqual(audited.status, "carried");
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
