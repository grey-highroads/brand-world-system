import { readSynthesisProgress, synthesizeBrandBrain } from "../../src/brand-brain/service.js";
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

  // GET with a request id answers one question: which pass of that synthesis
  // has finished. The browser asks after a dropped connection, because a pass
  // can outlive the connection that started it and passes 1 through 3 leave
  // in-progress state the client cannot otherwise see. It returns the pass
  // number and nothing else from the in-progress brain.
  // See docs/findings-2026-09-07-pass-recovery.md.
  if (request.method === "GET") {
    try {
      const url = new URL(request.url, "http://localhost");
      const progress = await readSynthesisProgress(url.searchParams.get("requestId"), {
        store: createVercelBlobBrandBrainStore({ clientId: resolveClientId(request) }),
      });
      sendJson(response, 200, progress);
    } catch (error) {
      sendPublicError(response, error);
    }
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
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
