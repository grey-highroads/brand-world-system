import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { generateProductionImage } from "../../src/production/service.js";
import { createVercelBlobProductionStore } from "../../src/production/store.js";
import { readJsonBody, requireBrandWorldAccess, sendJson, sendPublicError } from "../../src/server/http.js";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only generates production images." });
    return;
  }
  try {
    const body = await readJsonBody(request);
    const job = await generateProductionImage(body, {
      brainStore: createVercelBlobBrandBrainStore(),
      productionStore: createVercelBlobProductionStore(),
      env: process.env,
    });
    sendJson(response, 200, { job });
  } catch (error) {
    sendPublicError(response, error);
  }
}

