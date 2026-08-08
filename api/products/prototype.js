import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { synthesizeProductRecord } from "../../src/products/prototype-provider.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// ADR 0012 prototype endpoint. Runs per-product synthesis against one existing
// brain source and returns the raw record. Persists nothing. Remove or replace
// when the product record schema graduates.
//
// This bypasses source-normalizer.js on purpose: it pulls in officeparser as a
// native dependency, which fails to bundle into a fresh serverless function.
// The stored source is already normalized because it went through synthesis
// when it was added to the brain.
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

    // Load raw bytes for raster files so vision content reaches the model.
    // Text sources pass through unchanged.
    const filesWithBytes = await Promise.all((source.files || []).map(async (file) => {
      if (!file.blobPathname || !String(file.type || "").startsWith("image/")) return file;
      try {
        const stored = await store.readSourceFile(file.blobPathname);
        const base64 = Buffer.from(stored.bytes).toString("base64");
        return { ...file, data: `data:${stored.mimeType || file.type};base64,${base64}` };
      } catch {
        return file;
      }
    }));

    const result = await synthesizeProductRecord({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      source: { ...source, files: filesWithBytes },
    });

    sendJson(response, 200, {
      prototype: true,
      persisted: false,
      sourceName: source.name,
      model: result.model,
      usage: result.usage,
      record: result.record,
    });
  } catch (error) {
    sendPublicError(response, error);
  }
}
