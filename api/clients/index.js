import { createVercelBlobClientStore } from "../../src/clients/store.js";
import { readJsonBody, requireBrandWorldAccess, sendJson, sendPublicError } from "../../src/server/http.js";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  try {
    const store = createVercelBlobClientStore();
    if (request.method === "GET") {
      sendJson(response, 200, { clients: await store.list() });
      return;
    }
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const client = await store.create({ name: body.name });
      sendJson(response, 201, { client });
      return;
    }
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "This route lists clients or creates one." });
  } catch (error) {
    sendPublicError(response, error);
  }
}
