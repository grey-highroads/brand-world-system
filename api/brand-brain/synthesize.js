import { synthesizeBrandBrain } from "../../src/brand-brain/service.js";
import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { readJsonBody, requireBrandWorldAccess, sendJson, sendPublicError } from "../../src/server/http.js";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only prepares a Brand Brain." });
    return;
  }
  try {
    const body = await readJsonBody(request);
    const saved = await synthesizeBrandBrain(body, {
      store: createVercelBlobBrandBrainStore(),
      env: process.env,
    });
    sendJson(response, 200, saved);
  } catch (error) {
    sendPublicError(response, error);
  }
}
