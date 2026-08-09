import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { normalizeSourcesForSynthesis } from "../../src/brand-brain/source-normalizer.js";
import { synthesizeProductRecord } from "../../src/products/prototype-provider.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// ADR 0012 prototype endpoint. Runs per-product synthesis against one existing
// brain source and returns the raw record. Persists nothing.
//
// Normalization is inline here because it is what turns the stored PDF, DOCX,
// or PPTX bytes into the extracted text the model actually reads. The earlier
// bundling concern turned out to be the 12-function Hobby-plan ceiling, not an
// officeparser bundling problem.
export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  try {
    const clientId = resolveClientId(request);
    const store = createVercelBlobBrandBrainStore({ clientId });
    const stored = await store.read();
    const sources = stored?.sources || [];

    if (request.method === "GET") {
      sendJson(response, 200, {
        note: "POST { sourceId } to synthesize a product record from that source.",
        sources: sources.map((s) => ({ id: s.id, name: s.name, type: s.type, authority: s.authority })),
      });
      return;
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "GET lists sources. POST runs the prototype synthesis." });
      return;
    }

    const body = await readJsonBody(request);
    const source = sources.find((s) => s.id === String(body.sourceId || ""));
    if (!source) {
      sendJson(response, 400, { error: "sourceId did not match a stored source. GET this route to list sources." });
      return;
    }

    // Reuse the brain's normalization so PDF, DOCX, PPTX, and text files reach
    // the model as extracted text on source.content, and raster files reach it
    // as vision entries on source.files. Same discipline the brain uses.
    const [normalized] = await normalizeSourcesForSynthesis([source], {
      readStoredFile: store.readSourceFile?.bind(store),
    });

    const result = await synthesizeProductRecord({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      source: normalized,
    });

    sendJson(response, 200, {
      prototype: true,
      persisted: false,
      sourceName: source.name,
      contentLength: normalized.content ? normalized.content.length : 0,
      visionFiles: (normalized.files || []).length,
      model: result.model,
      usage: result.usage,
      record: result.record,
    });
  } catch (error) {
    sendPublicError(response, error);
  }
}
