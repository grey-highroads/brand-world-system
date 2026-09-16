import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { directionEntryCount, directionKeptEntryCount, normalizeDirectionRecord } from "../../src/direction/record.js";
import { authorBrandWorld, runDirectionSessionTurn } from "../../src/direction/session.js";
import { normalizeWorld, worldIsWritten } from "../../src/direction/world.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// The direction record and its session (ADR 0021). One dispatching handler,
// following api/brand-brain/index.js.
//
// GET                        -> read the stored direction record, or null
// POST { action: "turn" }    -> run one session turn. The body carries the
//                               record so far, the new message, and how it
//                               arrived; the reply carries what the session
//                               says, options, earned entries, and the reach
//                               recommendation once there is one. Nothing is
//                               written: the client holds the running record.
// POST { action: "save" }    -> persist the record as proposed. Saving never
//                               approves; a proposed record is not read by
//                               synthesis. A save over an approved record is
//                               a revision and takes the next version.
// POST { action: "approve" } -> approve the record in the body and store it.
//                               From here the evolved passes read it as a
//                               source, injected by the synthesis service.

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  try {
    const clientId = resolveClientId(request);
    const store = createVercelBlobBrandBrainStore({ clientId });

    if (request.method === "GET") {
      sendJson(response, 200, { record: await store.readDirection(), world: await store.readWorld() });
      return;
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "GET, POST");
      sendJson(response, 405, { error: "GET reads the direction record. POST dispatches session actions." });
      return;
    }

    const body = await readJsonBody(request, 4 * 1024 * 1024);
    const action = String(body.action || "").trim();

    if (action === "turn") {
      const turn = await runDirectionSessionTurn(body, { store, env: process.env });
      sendJson(response, 200, turn);
      return;
    }

    if (action === "save") {
      const record = normalizeDirectionRecord(body.record);
      if (!record) {
        sendJson(response, 400, { error: "Send the direction record to save." });
        return;
      }
      const stored = await store.readDirection();
      record.status = "proposed";
      delete record.approvedAt;
      if (stored?.status === "approved" && record.version <= stored.version) record.version = stored.version + 1;
      record.updatedAt = new Date().toISOString();
      await store.writeDirection(record);
      sendJson(response, 200, { record });
      return;
    }

    if (action === "approve") {
      const record = normalizeDirectionRecord(body.record) || (await store.readDirection());
      if (!record || !directionEntryCount(record)) {
        sendJson(response, 400, { error: "There is no direction record to approve yet. Hold a session first." });
        return;
      }
      if (!directionKeptEntryCount(record)) {
        sendJson(response, 400, { error: "Every entry in this record is a rejection. Author what should be there instead before approving." });
        return;
      }
      record.status = "approved";
      record.approvedAt = new Date().toISOString();
      record.updatedAt = record.approvedAt;
      await store.writeDirection(record);
      sendJson(response, 200, { record });
      return;
    }

    // Write the world. One call at the end of a session, producing the long
    // document everything else comes from. It is saved as proposed; the owner
    // reads it and approves it separately.
    if (action === "author-world") {
      const { world, stage, nextStage } = await authorBrandWorld(body, { store, env: process.env });
      if (!worldIsWritten(world)) {
        sendJson(response, 502, { error: "That part of the world came back empty. Run it again." });
        return;
      }
      // Saved after every stage, so a dropped connection later costs one
      // stage rather than the whole document.
      const stored = await store.readWorld();
      world.version = body.world ? body.world.version || 1 : (stored ? stored.version + 1 : 1);
      await store.writeWorld(world);
      sendJson(response, 200, { world, stage, nextStage });
      return;
    }

    if (action === "approve-world") {
      const world = normalizeWorld(body.world) || (await store.readWorld());
      if (!world || !worldIsWritten(world)) {
        sendJson(response, 400, { error: "There is no world to approve yet." });
        return;
      }
      world.status = "approved";
      world.approvedAt = new Date().toISOString();
      world.updatedAt = world.approvedAt;
      await store.writeWorld(world);
      sendJson(response, 200, { world });
      return;
    }

    sendJson(response, 400, { error: "Unknown direction action." });
  } catch (error) {
    sendPublicError(response, error);
  }
}
