// Deterministic asset placement, Tier 1. See docs for the brief of 2026-09-14.
//
// The user places a locked asset onto a finished render. This module
// composites the real pixels on the server, optionally runs the existing
// masked shadow pass from composite.js between two overlays, verifies that
// every fully opaque asset pixel in the deliverable matches the source
// artwork exactly, and records the verification result on the output package
// as data.
//
// The three core functions are ported from the proof module written in the
// research sprint of 2026-09-14 (deterministic-compositing-research-sprint.md,
// proof/place.js). The proof demonstrated on a 1536x1024 scene that a frame
// re-encoded by a simulated model pass fails verification on every opaque
// pixel and a frame overlaid after that pass verifies with zero mismatches.
//
// What this module never does: no automatic box placement, no perspective or
// wrap, no blocking on a failed verification, and no claim language. A failed
// verification records as failed and the image saves anyway. The record is
// the point.

import sharp from "sharp";
import { callShadowEdit, shadowInstruction, IMAGE_MODEL, IMAGE_EDITS_ENDPOINT } from "./composite.js";

// The shapes gpt-image-2 accepts, matching composite.js. Grounding is only
// possible at these sizes because the edits endpoint rescales anything else,
// which would move the asset away from where it was placed. Overlay without
// grounding works at any size.
const GROUNDING_SIZES = new Set(["1024x1024", "1536x1024", "1024x1536"]);

// Well under the four megabyte body limit of the edits endpoint, matching the
// ceiling composite.js applies to browser-sent parts.
const MAX_PART_BYTES = 3 * 1024 * 1024;

/* The three ported functions */

// Turn an asset file (SVG or raster) into pixels at the exact size the
// placement box asks for. SVG in means the mark is rendered at final size
// with no upscaling, which is why ADR 0020 kept accepting SVG.
export async function rasterizeAsset(assetBytes, width, height) {
  return sharp(assetBytes)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();
}

// Draw the asset onto a scene at a box. Pure math, no model. The same
// operation the browser does in app/place.js, moved server side so it can run
// after a model pass, at full resolution, on any engine's output.
export async function placeAsset(sceneBytes, assetPng, box) {
  return sharp(sceneBytes)
    .composite([{ input: assetPng, left: box.x, top: box.y }])
    .png()
    .toBuffer();
}

// Compare the deliverable against the source artwork inside the box. Only
// pixels the asset fully owns (alpha 255) are checked, because
// semi-transparent edge pixels blend with whatever is behind them and
// blending is correct behavior, not redrawing.
export async function verifyPlacement(finalBytes, assetPng, box) {
  const asset = await sharp(assetPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const region = await sharp(finalBytes)
    .extract({ left: box.x, top: box.y, width: box.width, height: box.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const a = asset.data;
  const f = region.data;
  let checked = 0;
  let mismatched = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] !== 255) continue;
    checked += 1;
    if (a[i] !== f[i] || a[i + 1] !== f[i + 1] || a[i + 2] !== f[i + 2]) mismatched += 1;
  }
  return {
    checkedPixels: checked,
    mismatchedPixels: mismatched,
    intact: mismatched === 0,
  };
}

/* The shadow mask, built server side */

// The same mask shape app/place.js paints in the browser: black everywhere
// means leave the picture alone, and a soft-edged elliptical hole below the
// box is the only place the model may paint shadow. The geometry and the
// gradient stops are copied from buildMask in app/place.js so the two paths
// ask the model for the same thing.
export async function buildShadowMask(width, height, box, lightPush = 0) {
  const radiusX = box.width * 1.15;
  const radiusY = Math.max(box.height * 0.3, box.width * 0.34);
  const centreX = box.x + box.width / 2 + lightPush * box.width * 0.35;
  const centreY = box.y + box.height + radiusY * 0.25;

  // The browser gradient runs from an inner circle at a quarter of the radius
  // to the outer edge, holding full strength inside the inner circle. The SVG
  // stops below reproduce that curve on a single gradient: full to 0.25, then
  // 0.85 at the point matching the browser's 0.6 stop, then clear at the edge.
  const punch = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="hole" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="0.25" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="0.7" stop-color="#ffffff" stop-opacity="0.85"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="${centreX}" cy="${centreY}" rx="${radiusX}" ry="${radiusY}" fill="url(#hole)"/>
  </svg>`;

  const punchPng = await sharp(Buffer.from(punch)).png().toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  })
    .composite([{ input: punchPng, blend: "dest-out" }])
    .png()
    .toBuffer();
}

/* The pipeline */

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizedBox(rawBox, width, height) {
  const box = {
    x: Math.round(Number(rawBox?.x)),
    y: Math.round(Number(rawBox?.y)),
    width: Math.round(Number(rawBox?.width)),
    height: Math.round(Number(rawBox?.height)),
  };
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) {
    throw badRequest("The placement box did not arrive with usable numbers.");
  }
  if (box.width < 1 || box.height < 1) {
    throw badRequest("The placement box is too small to place anything into.");
  }
  if (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height) {
    throw badRequest("The placement box runs off the edge of the picture. Move it fully inside and try again.");
  }
  return box;
}

// Overlay, optional grounding, overlay again, verify. When grounding is off
// this is overlay plus verify and makes no model call. Returns the final
// bytes and the verification result together, because the two belong to each
// other: the result describes exactly those bytes.
export async function runPlacementPipeline({ renderBytes, assetBytes, box: rawBox, grounding, lightNote, lightPush }, options = {}) {
  const meta = await sharp(renderBytes).metadata();
  const width = meta.width;
  const height = meta.height;
  if (!width || !height) throw badRequest("That background could not be read as a picture.");
  const box = normalizedBox(rawBox, width, height);

  const assetPng = await rasterizeAsset(assetBytes, box.width, box.height);

  // First overlay. Without grounding this is also the last.
  let composed = await placeAsset(renderBytes, assetPng, box);
  let groundingRan = false;

  if (grounding) {
    const size = `${width}x${height}`;
    if (!GROUNDING_SIZES.has(size)) {
      throw badRequest(`That background is ${width} by ${height}, which is not a shape the shadow pass can work on. Place without grounding instead.`);
    }
    // The edits endpoint takes the composite as JPEG the way the browser path
    // sends it, which keeps the request small. The mask must stay PNG because
    // its transparency is the instruction.
    const compositeJpeg = await sharp(composed).jpeg({ quality: 92 }).toBuffer();
    const mask = await buildShadowMask(width, height, box, lightPush || 0);
    if (compositeJpeg.length > MAX_PART_BYTES || mask.length > MAX_PART_BYTES) {
      throw badRequest("That picture is too large to send for the shadow pass. Place without grounding, or use a smaller background.");
    }
    const result = await callShadowEdit({
      apiKey: options.env?.OPENAI_API_KEY,
      composite: { bytes: compositeJpeg, type: "image/jpeg" },
      mask: { bytes: mask, type: "image/png" },
      prompt: shadowInstruction(lightNote),
      size,
      fetchImpl: options.fetchImpl || fetch,
    });
    const image = result?.data?.[0];
    if (!image?.b64_json) throw new Error("The shadow pass returned no picture.");
    const grounded = Buffer.from(image.b64_json, "base64");

    // The model re-encodes the whole frame, so the artwork it returns is the
    // model's. The second overlay puts the real pixels back on top after all
    // generative work. This is the step that makes the verification meaningful.
    composed = await placeAsset(grounded, assetPng, box);
    groundingRan = true;
  }

  const verification = await verifyPlacement(composed, assetPng, box);

  return { bytes: composed, box, verification, groundingRan, width, height };
}

/* Dispatch */

function jobIdFor() {
  return `placed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// The action handler behind api/production/generate.js. Reads the render and
// the asset from storage itself, so the pixels being placed are the stored
// pixels the record points at rather than whatever a browser sent up. Saves
// under its own job id and never touches the current job slot, for the same
// reason placeOnBackground does not.
//
// Two kinds of asset can be placed. A product cut-out arrives as productId
// plus productImageId. A brand mark arrives as identityAssetId, variationId,
// and fileId, resolved through the identity asset record to the source file
// the brain already stores, and read through the brain store's guarded
// reader so only this client's own files are reachable.
export async function placeAssetOnRender(body, options) {
  const backgroundOutputId = String(body.backgroundOutputId || "");
  if (!backgroundOutputId) throw badRequest("Choose a background first.");

  const identityAssetId = String(body.identityAssetId || "");
  let assetBytes = null;
  let placementSource = null;

  if (identityAssetId) {
    const variationId = String(body.variationId || "");
    const fileId = String(body.fileId || "");
    if (!variationId) throw badRequest("Choose which version of the mark to place.");
    const record = await options.identityStore.readAsset(identityAssetId);
    const variation = (record?.variations || []).find((entry) => entry.variation_id === variationId);
    if (!variation) throw badRequest("That version of the mark could not be found.");
    const file = fileId
      ? (variation.files || []).find((entry) => entry.file_id === fileId)
      : (variation.files || [])[0];
    if (!file?.blob_pathname) throw badRequest("That version of the mark has no placeable file.");
    const stored = await options.brainStore.readSourceFile(file.blob_pathname);
    assetBytes = stored?.bytes;
    if (!assetBytes?.length) throw badRequest("The mark's file could not be read from storage.");
    placementSource = {
      identityAssetId,
      variationId,
      fileId: file.file_id,
      variation: variation.variation || "",
    };
  } else {
    const productId = String(body.productId || "");
    const productImageId = String(body.productImageId || "");
    if (!productId || !productImageId) throw badRequest("Choose a product picture to place.");
    const product = await options.productStore.readProduct(productId);
    const imageRecord = (product?.images || []).find((image) => image.image_id === productImageId);
    if (!imageRecord?.blob_pathname) throw badRequest("That product picture could not be found.");
    assetBytes = await options.productStore.readImageBytes(imageRecord.blob_pathname);
    if (!assetBytes?.length) throw badRequest("That product picture could not be read from storage.");
    placementSource = { productId, productImageId };
  }

  const render = await options.productionStore.readOutputImageBytes(backgroundOutputId);
  if (!render?.bytes?.length) throw badRequest("That background could not be found.");

  const grounding = body.grounding === true;
  const outcome = await runPlacementPipeline(
    {
      renderBytes: render.bytes,
      assetBytes,
      box: body.box,
      grounding,
      lightNote: String(body.lightNote || "").slice(0, 300),
      lightPush: Number(body.lightPush) || 0,
    },
    options,
  );

  const jobId = jobIdFor();
  await options.productionStore.writeImage(jobId, outcome.bytes, "image/png");

  // Provenance. Shaped like the place-on-background record and extended with
  // the verification result. Deliberately not a compiled package: this output
  // was not compiled from a brand brain, and a record pretending otherwise
  // would read as governed work when it is not.
  if (options.productionStore.writeOutputPackage) {
    try {
      await options.productionStore.writeOutputPackage(jobId, {
        placement: {
          backgroundOutputId,
          ...placementSource,
          box: outcome.box,
          lightNote: String(body.lightNote || "").slice(0, 300),
          grounding: outcome.groundingRan,
          groundingModel: outcome.groundingRan ? IMAGE_MODEL : null,
          groundingEndpoint: outcome.groundingRan ? IMAGE_EDITS_ENDPOINT : null,
        },
        verification: outcome.verification,
        size: `${outcome.width}x${outcome.height}`,
        savedAt: new Date().toISOString(),
      });
    } catch {
      // The picture is saved either way. Only later provenance is affected.
    }
  }

  return {
    jobId,
    status: "complete",
    size: `${outcome.width}x${outcome.height}`,
    grounding: outcome.groundingRan,
    verification: outcome.verification,
    completedAt: new Date().toISOString(),
  };
}
