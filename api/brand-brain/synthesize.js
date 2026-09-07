import { synthesizeBrandBrain } from "../../src/brand-brain/service.js";
import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// Synthesis runs in four ordered passes, one request each, as of 2026-09-07.
// The body carries `pass`; pass 1 carries the sources and the mode, and passes
// 2 through 4 carry only the request id, because the server holds the
// in-progress brain between them. Four calls inside one request would share one
// 300 second clock and time out the way the single call did, only later.
// See docs/findings-2026-09-07-four-pass-synthesis.md.
export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only prepares a Brand Brain." });
    return;
  }
  try {
    const clientId = resolveClientId(request);
    const body = await readJsonBody(request, 45 * 1024 * 1024);
    const saved = await synthesizeBrandBrain(body, {
      store: createVercelBlobBrandBrainStore({ clientId }),
      env: process.env,
    });
    sendJson(response, 200, saved);
  } catch (error) {
    sendPublicError(response, error);
  }
}
