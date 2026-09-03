// ByteDance Seedream 5.0 Pro through fal.ai, added as a second render engine
// beside the OpenAI renderer. The point of this file is to put the existing
// compiled prompt in front of a different model without changing the prompt,
// so nothing here rewrites, profiles, or supplements what the compiler emits.
//
// Two shapes are deliberately matched rather than invented. The exported
// surface mirrors src/renderers/openai-images.js so the dispatch in
// src/production/service.js can pick between them by name. The return value
// mirrors what that service already consumes from OpenAI, which is
// { data: [{ b64_json }], usage }, so the consumption site sees one shape from
// both engines and nothing downstream has to ask which engine ran.
//
// Endpoint IDs are the fal Pro paths, which carry no fal-ai prefix. The Lite
// variants do carry it. Verified against the fal model pages on 2026-09-01.

export const SEEDREAM_IMAGE_MODEL = "bytedance/seedream/v5/pro";
export const SEEDREAM_TEXT_TO_IMAGE_ENDPOINT = "https://fal.run/bytedance/seedream/v5/pro/text-to-image";
export const SEEDREAM_EDIT_ENDPOINT = "https://fal.run/bytedance/seedream/v5/pro/edit";

const SEEDREAM_OUTPUT_FORMATS = new Set(["png", "jpeg"]);

function requiredPrompt(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("A compiled production prompt is required.");
  return prompt;
}

function outputFormatFor(outputFormat) {
  const value = String(outputFormat || "").toLowerCase();
  return SEEDREAM_OUTPUT_FORMATS.has(value) ? value : "png";
}

// The package emits a concrete "WIDTHxHEIGHT" string for every format it
// knows, and "auto" only reaches here if some other caller sends it. An
// unparseable size is dropped rather than guessed at, which leaves the model
// on its own default instead of on a size nobody chose.
export function seedreamImageSize(size) {
  const match = String(size || "").match(/^(\d{2,5})x(\d{2,5})$/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

// Reference images arrive from the production service as decoded bytes, because
// the source blobs they came from are stored private and fal's runner fetches
// input URLs without credentials. A data URI is therefore the only reference
// form that works without adding an upload hop.
export function seedreamReferenceUrl(image) {
  if (image?.bytes instanceof Uint8Array) {
    const encoded = Buffer.from(image.bytes).toString("base64");
    return `data:${image.type || "image/png"};base64,${encoded}`;
  }
  const data = String(image?.data || "");
  if (/^data:[^;,]*;base64,/.test(data)) return data;
  if (/^https?:\/\//.test(data)) return data;
  throw new Error(`Reference image ${image?.name || "image"} is not valid image data.`);
}

export function chooseSeedreamImageEndpoint(referenceImages = []) {
  return referenceImages.length ? SEEDREAM_EDIT_ENDPOINT : SEEDREAM_TEXT_TO_IMAGE_ENDPOINT;
}

function baseInput({ prompt, outputFormat }) {
  return {
    prompt: requiredPrompt(prompt),
    num_images: 1,
    output_format: outputFormatFor(outputFormat),
    // Returns the result inline as a data URI, which saves a second network
    // round trip to fetch the rendered file back before it is stored.
    sync_mode: true,
  };
}

export function buildSeedreamTextToImageRequest({ prompt, size = "auto", outputFormat = "png" }) {
  const body = baseInput({ prompt, outputFormat });
  const imageSize = seedreamImageSize(size);
  if (imageSize) body.image_size = imageSize;
  return {
    endpoint: SEEDREAM_TEXT_TO_IMAGE_ENDPOINT,
    contentType: "application/json",
    body,
  };
}

// No image_size on an edit. The fal schema for the edit endpoint defaults the
// field to auto_2K, which means the output follows the input image, and
// naming an output size on an edit reads as a request to generate a new frame
// rather than to change one object in the frame we supplied. The key is
// omitted rather than sent as auto_2K so the documented default applies. The
// size argument stays in the signature because callers pass one shared options
// object to both builders. Renders on 2026-09-02 came back with the whole
// frame subtly redrawn; this is one of the two grounding fixes for that.
export function buildSeedreamEditRequest({ prompt, referenceImages, size = "auto", outputFormat = "png" }) {
  if (!Array.isArray(referenceImages) || !referenceImages.length) throw new Error("At least one reference image is required for a Seedream edit request.");
  return {
    endpoint: SEEDREAM_EDIT_ENDPOINT,
    contentType: "application/json",
    body: {
      ...baseInput({ prompt, outputFormat }),
      image_urls: referenceImages.map((image) => seedreamReferenceUrl(image)),
    },
  };
}

function errorMessage(result, status) {
  const detail = result?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0];
    if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
  }
  if (typeof result?.error === "string" && result.error.trim()) return result.error;
  return `Seedream image request failed with status ${status}.`;
}

// fal returns hosted image URLs, or an inline data URI under sync_mode. Both
// are resolved to Base64 here so the production service reads one shape from
// either engine.
async function encodeResultImage(image, fetchImpl) {
  const url = String(image?.url || "");
  const inline = url.match(/^data:[^;,]*;base64,([A-Za-z0-9+/=]+)$/);
  if (inline) return inline[1];
  if (!/^https?:\/\//.test(url)) throw new Error("Seedream returned no image data.");
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`The rendered Seedream image could not be retrieved (status ${response.status}).`);
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}

export async function renderWithSeedreamImages({ apiKey, prompt, referenceImages = [], fetchImpl = fetch, ...options }) {
  if (!apiKey) throw new Error("FAL_KEY is not configured.");
  const request = referenceImages.length
    ? buildSeedreamEditRequest({ prompt, referenceImages, ...options })
    : buildSeedreamTextToImageRequest({ prompt, ...options });
  const response = await fetchImpl(request.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request.body),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(errorMessage(result, response.status));
    error.status = response.status;
    throw error;
  }
  const image = result?.images?.[0];
  if (!image) throw new Error("Seedream returned no image data.");
  return {
    data: [{ b64_json: await encodeResultImage(image, fetchImpl) }],
    // fal reports no token usage for this model, and an invented number would
    // read on the record as if it had been measured.
    usage: null,
  };
}
