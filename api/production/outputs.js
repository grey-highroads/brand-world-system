import { createVercelBlobProductionStore } from "../../src/production/store.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

const MAX_OUTPUTS = 200;

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  const clientId = resolveClientId(request);
  const store = createVercelBlobProductionStore({ clientId });

  if (request.method === "GET") {
    try {
      const saved = await store.readOutputs();
      sendJson(response, 200, { outputs: saved?.outputs || [] });
    } catch (error) {
      sendPublicError(response, error);
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      if (!Array.isArray(body.outputs)) {
        const error = new Error("The outputs list is missing.");
        error.status = 400;
        throw error;
      }
      // Keep only the most recent outputs to bound storage size.
      // Strip any fields that are only useful in-session (large package data
      // is already saved on the production job itself).
      const trimmed = body.outputs.slice(0, MAX_OUTPUTS).map((output) => ({
        id: output.id,
        label: output.label,
        status: output.status,
        campaignId: output.campaignId || null,
        campaignName: output.campaignName || null,
        assetType: output.assetType || null,
        channel: output.channel || null,
        placement: output.placement || null,
        format: output.format || null,
        scene: output.scene || null,
        brainVersion: output.brainVersion || null,
        createdAt: output.createdAt || null,
        imageUrl: output.imageUrl || null,
      }));
      await store.writeOutputs({ outputs: trimmed, savedAt: new Date().toISOString() });
      sendJson(response, 200, { saved: true, count: trimmed.length });
    } catch (error) {
      sendPublicError(response, error);
    }
    return;
  }

  response.setHeader("Allow", "GET, POST");
  sendJson(response, 405, { error: "This route reads and saves the output log." });
}
