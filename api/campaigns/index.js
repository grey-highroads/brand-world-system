import { createVercelBlobCampaignStore } from "../../src/campaigns/store.js";
import {
  readJsonBody,
  requireBrandWorldAccess,
  resolveClientId,
  sendJson,
  sendPublicError,
} from "../../src/server/http.js";

// Campaign records for the active client (ADR 0011). Every handler builds its
// store from the resolved client id and reads nothing else, so there is no
// path by which one client's campaigns reach another.
//
// GET    -> list this client's campaigns
// POST   -> create or update one campaign
// DELETE -> remove one campaign
export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  try {
    const clientId = resolveClientId(request);
    const store = createVercelBlobCampaignStore({ clientId });

    if (request.method === "GET") {
      const campaigns = await store.listCampaigns();
      sendJson(response, 200, { campaigns });
      return;
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const campaign = await store.writeCampaign(body.campaign || body);
      sendJson(response, 200, { campaign });
      return;
    }

    if (request.method === "DELETE") {
      const body = await readJsonBody(request).catch(() => ({}));
      const campaignId = String(body.campaignId || body.id || "").trim();
      if (!campaignId) {
        sendJson(response, 400, { error: "Name the campaign to remove." });
        return;
      }
      await store.deleteCampaign(campaignId);
      sendJson(response, 200, { deleted: true, id: campaignId });
      return;
    }

    response.setHeader("Allow", "GET, POST, DELETE");
    sendJson(response, 405, {
      error: "GET lists campaigns. POST saves one. DELETE removes one.",
    });
  } catch (error) {
    sendPublicError(response, error);
  }
}
