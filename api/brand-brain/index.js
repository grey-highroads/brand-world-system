import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// Dispatching handler for the Brand Brain and claims document.
//
// GET                              -> read the saved Brand Brain (unchanged)
// POST { action: "read_claims" }   -> read the brand-level claims document
// POST { action: "add_claim" }     -> add an entry to a claims section
// POST { action: "edit_claim" }    -> edit an existing claims entry
// POST { action: "remove_claim" }  -> remove a claims entry

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  try {
    const clientId = resolveClientId(request);

    // GET: read the brain (existing behavior, unchanged).
    if (request.method === "GET") {
      const store = createVercelBlobBrandBrainStore({ clientId });
      sendJson(response, 200, { saved: await store.read() });
      return;
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "GET reads the brain. POST dispatches claims actions." });
      return;
    }

    // POST: dispatch claims operations.
    const body = await readJsonBody(request);
    const action = String(body.action || "").trim();
    const claimsStore = createVercelBlobClaimsStore({ clientId });

    if (action === "read_claims") {
      const doc = await claimsStore.read();
      sendJson(response, 200, {
        claims: doc,
        active: {
          approved: claimsStore.activeEntries(doc, "approved"),
          prohibited: claimsStore.activeEntries(doc, "prohibited"),
          disclosures: claimsStore.activeEntries(doc, "disclosures"),
        },
      });
      return;
    }

    if (action === "add_claim") {
      const section = String(body.section || "").trim();
      const result = await claimsStore.addEntry(section, {
        text: body.text,
        scope: body.scope,
        source_ref: body.source_ref,
        added_by: body.added_by,
        trigger_scope: body.trigger_scope,
      });
      sendJson(response, 200, result);
      return;
    }

    if (action === "edit_claim") {
      const section = String(body.section || "").trim();
      const entryId = String(body.entryId || "").trim();
      const result = await claimsStore.editEntry(section, entryId, {
        text: body.text,
        scope: body.scope,
        source_ref: body.source_ref,
        added_by: body.added_by,
        trigger_scope: body.trigger_scope,
      });
      sendJson(response, 200, result);
      return;
    }

    if (action === "remove_claim") {
      const section = String(body.section || "").trim();
      const entryId = String(body.entryId || "").trim();
      const result = await claimsStore.removeEntry(section, entryId);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 400, {
      error: `Unknown action "${action}". Supported: read_claims, add_claim, edit_claim, remove_claim.`,
    });
  } catch (error) {
    sendPublicError(response, error);
  }
}
