import { createVercelBlobProductionStore } from "../../src/production/store.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

const MAX_OUTPUTS = 200;
// Signing is per-image work. Only the most recent outputs are ever shown as
// thumbnails, so bound how many URLs one read mints.
const MAX_SIGNED_IMAGES = 60;

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  const clientId = resolveClientId(request);
  const store = createVercelBlobProductionStore({ clientId });

  if (request.method === "GET") {
    try {
      const saved = await store.readOutputs();
      const outputs = saved?.outputs || [];
      // Presigned image URLs live for fifteen minutes, so any URL persisted in
      // the log is stale by the time it is read back. Mint a fresh one per
      // output instead. hadImage marks records that produced an image, so we
      // do not sign paths for outputs that never had one.
      const refreshed = await Promise.all(
        outputs.slice(0, MAX_SIGNED_IMAGES).map(async (output) => {
          if (!store.outputImageUrl) return output;
          if (!output.hadImage && !output.imageUrl) return output;
          try {
            return { ...output, imageUrl: await store.outputImageUrl(output.id) };
          } catch {
            return { ...output, imageUrl: null };
          }
        }),
      );
      sendJson(response, 200, { outputs: [...refreshed, ...outputs.slice(MAX_SIGNED_IMAGES)] });
    } catch (error) {
      sendPublicError(response, error);
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const body = await readJsonBody(request);

      // Discarding an output is a hard delete. The image blob and the log
      // record both go, so no surface has to remember to filter it out.
      if (body.action === "discard") {
        const outputId = String(body.outputId || "");
        if (!outputId) {
          const error = new Error("The output to discard is missing.");
          error.status = 400;
          throw error;
        }
        const saved = await store.readOutputs();
        const remaining = (saved?.outputs || []).filter((output) => output.id !== outputId);
        await store.writeOutputs({ outputs: remaining, savedAt: new Date().toISOString() });
        // The record is gone either way. A missing or already-deleted image
        // should not fail the request.
        try {
          if (store.deleteOutputImage) await store.deleteOutputImage(outputId);
        } catch {
          // The blob is orphaned rather than the delete being reported as failed.
        }
        sendJson(response, 200, { discarded: true, count: remaining.length });
        return;
      }

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
        // The URL itself expires and is kept only as a legacy fallback. The
        // durable fact is whether this output ever produced an image.
        imageUrl: output.imageUrl || null,
        hadImage: Boolean(output.hadImage || output.imageUrl),
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
