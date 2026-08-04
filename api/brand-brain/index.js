import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { requireBrandWorldAccess, sendJson, sendPublicError } from "../../src/server/http.js";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "This route only reads the saved Brand Brain." });
    return;
  }
  try {
    const store = createVercelBlobBrandBrainStore();
    sendJson(response, 200, { saved: await store.read() });
  } catch (error) {
    sendPublicError(response, error);
  }
}
