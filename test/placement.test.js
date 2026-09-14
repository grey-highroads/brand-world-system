import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  rasterizeAsset,
  placeAsset,
  verifyPlacement,
  runPlacementPipeline,
  placeAssetOnRender,
} from "../src/production/placement.js";

// A stand-in scene and a stand-in mark, the same shapes the proof module used
// in the research sprint of 2026-09-14. The mark has fine strokes and a
// transparent field, which is the shape of a real wordmark and the thing a
// generative redraw mangles first.
const SCENE_W = 640;
const SCENE_H = 480;

const sceneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE_W}" height="${SCENE_H}">
  <rect width="${SCENE_W}" height="${SCENE_H}" fill="#5c452c"/>
  <rect y="${SCENE_H * 0.6}" width="${SCENE_W}" height="${SCENE_H * 0.4}" fill="#2a2118"/>
</svg>`;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
  <circle cx="150" cy="150" r="110" fill="none" stroke="#f5efe4" stroke-width="14"/>
  <path d="M 90 190 L 150 90 L 210 190" fill="none" stroke="#f5efe4" stroke-width="14" stroke-linecap="round"/>
  <rect x="300" y="110" width="220" height="80" fill="#f5efe4"/>
</svg>`;

const box = { x: 120, y: 200, width: 300, height: 150 };

function sceneBytes() {
  return sharp(Buffer.from(sceneSvg)).png().toBuffer();
}

// The stand-in for a model pass, copied from the proof's run-demo.js: a JPEG
// re-encode plus a light blur, which is the honest floor of what a generative
// edit endpoint does to every pixel of the frame.
async function simulateModelPass(bytes) {
  const jpeg = await sharp(bytes).blur(0.5).jpeg({ quality: 90 }).toBuffer();
  return sharp(jpeg).png().toBuffer();
}

test("verification catches a redrawn frame and passes an overlaid one", async () => {
  const scene = await sceneBytes();
  const logo = await rasterizeAsset(Buffer.from(logoSvg), box.width, box.height);

  const composed = await placeAsset(scene, logo, box);
  const afterModel = await simulateModelPass(composed);

  const failCheck = await verifyPlacement(afterModel, logo, box);
  assert.equal(failCheck.intact, false, "a re-encoded frame must fail verification");
  assert.ok(failCheck.mismatchedPixels > 0);
  assert.ok(failCheck.checkedPixels > 0);

  const finalImage = await placeAsset(afterModel, logo, box);
  const passCheck = await verifyPlacement(finalImage, logo, box);
  assert.equal(passCheck.intact, true, "an overlaid frame must pass verification");
  assert.equal(passCheck.mismatchedPixels, 0);
  assert.equal(passCheck.checkedPixels, failCheck.checkedPixels);
});

test("SVG rasterization produces the box sizes asked for", async () => {
  for (const size of [{ width: 300, height: 150 }, { width: 90, height: 45 }]) {
    const png = await rasterizeAsset(Buffer.from(logoSvg), size.width, size.height);
    const meta = await sharp(png).metadata();
    assert.equal(meta.width, size.width);
    assert.equal(meta.height, size.height);
    assert.equal(meta.channels, 4, "the rasterized asset keeps its alpha channel");
  }
});

test("the grounding-off pipeline makes zero network calls and verifies intact", async () => {
  let networkCalls = 0;
  const outcome = await runPlacementPipeline(
    {
      renderBytes: await sceneBytes(),
      assetBytes: Buffer.from(logoSvg),
      box,
      grounding: false,
    },
    {
      env: {},
      fetchImpl: async () => {
        networkCalls += 1;
        throw new Error("the grounding-off path must not reach the network");
      },
    },
  );
  assert.equal(networkCalls, 0);
  assert.equal(outcome.groundingRan, false);
  assert.equal(outcome.verification.intact, true);
  assert.equal(outcome.verification.mismatchedPixels, 0);
  assert.ok(outcome.verification.checkedPixels > 0);
  const meta = await sharp(outcome.bytes).metadata();
  assert.equal(meta.width, SCENE_W);
  assert.equal(meta.height, SCENE_H);
});

test("a box that runs off the picture is refused before any work happens", async () => {
  await assert.rejects(
    runPlacementPipeline(
      {
        renderBytes: await sceneBytes(),
        assetBytes: Buffer.from(logoSvg),
        box: { x: 500, y: 400, width: 300, height: 150 },
        grounding: false,
      },
      { env: {} },
    ),
    /runs off the edge/,
  );
});

test("the output record shape is pinned", async () => {
  const scene = await sceneBytes();
  const writtenPackages = [];
  const writtenImages = [];

  const job = await placeAssetOnRender(
    {
      action: "place-asset",
      backgroundOutputId: "out-1",
      productId: "prod-1",
      productImageId: "img-1",
      grounding: false,
      lightNote: "the left side of the frame",
      lightPush: 1,
      box,
    },
    {
      env: {},
      productionStore: {
        async readOutputImageBytes() {
          return { bytes: scene, contentType: "image/png" };
        },
        async writeImage(jobId, bytes, contentType) {
          writtenImages.push({ jobId, bytes, contentType });
          return { pathname: `test/${jobId}.png`, contentType };
        },
        async writeOutputPackage(jobId, value) {
          writtenPackages.push({ jobId, value });
        },
      },
      productStore: {
        async readProduct() {
          return { product_id: "prod-1", images: [{ image_id: "img-1", kind: "isolated", blob_pathname: "brand-world-system/clients/default/products/img-1.png" }] };
        },
        async readImageBytes() {
          return Buffer.from(logoSvg);
        },
      },
    },
  );

  assert.equal(writtenImages.length, 1);
  assert.equal(writtenImages[0].contentType, "image/png");
  assert.equal(writtenPackages.length, 1);

  const record = writtenPackages[0].value;
  assert.deepEqual(Object.keys(record).sort(), ["placement", "savedAt", "size", "verification"]);
  assert.deepEqual(Object.keys(record.placement).sort(), [
    "backgroundOutputId",
    "box",
    "grounding",
    "groundingEndpoint",
    "groundingModel",
    "lightNote",
    "productId",
    "productImageId",
  ]);
  assert.equal(record.placement.backgroundOutputId, "out-1");
  assert.equal(record.placement.productId, "prod-1");
  assert.equal(record.placement.productImageId, "img-1");
  assert.deepEqual(record.placement.box, box);
  assert.equal(record.placement.grounding, false);
  assert.equal(record.placement.groundingModel, null);
  assert.equal(record.placement.groundingEndpoint, null);
  assert.deepEqual(Object.keys(record.verification).sort(), ["checkedPixels", "intact", "mismatchedPixels"]);
  assert.equal(record.verification.intact, true);
  assert.equal(record.size, `${SCENE_W}x${SCENE_H}`);

  assert.equal(job.status, "complete");
  assert.equal(job.grounding, false);
  assert.deepEqual(job.verification, record.verification);
  assert.match(job.jobId, /^placed-/);
});

test("the grounded pipeline sends the shadow request and overlays the real artwork on top", async () => {
  // A scene at a size the edits endpoint accepts, so grounding is allowed.
  const wide = await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#5c452c"/></svg>`,
  )).png().toBuffer();
  const groundedBox = { x: 300, y: 500, width: 400, height: 200 };

  let request = null;
  const outcome = await runPlacementPipeline(
    {
      renderBytes: wide,
      assetBytes: Buffer.from(logoSvg),
      box: groundedBox,
      grounding: true,
      lightNote: "the left side of the frame",
      lightPush: 1,
    },
    {
      env: { OPENAI_API_KEY: "test-key" },
      fetchImpl: async (url, init) => {
        request = { url, init };
        // Stand in for the model: hand back the frame it was sent, re-encoded
        // the way a real edit pass re-encodes everything.
        const sent = init.body.get("image");
        const bytes = Buffer.from(await sent.arrayBuffer());
        const redrawn = await simulateModelPass(bytes);
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: [{ b64_json: redrawn.toString("base64") }] }),
        };
      },
    },
  );

  assert.ok(request, "the grounded path must call the edits endpoint");
  assert.ok(String(request.url).includes("images/edits"));
  assert.ok(request.init.body.get("mask"), "the shadow request carries a mask");
  assert.equal(outcome.groundingRan, true);
  assert.equal(outcome.verification.intact, true, "the overlay after the model pass restores the artwork exactly");
  assert.equal(outcome.verification.mismatchedPixels, 0);
});
