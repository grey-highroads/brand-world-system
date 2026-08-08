import { issueSignedToken, presignUrl } from "@vercel/blob";
import { hasBrandWorldAccess, readJsonBody, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

// Returns a short-lived presigned GET URL for a source file stored under the
// caller's client namespace. Source files are stored with private access, so a
// signed URL is required to display them (thumbnails, previews). See ADR 0011.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only returns source read URLs." });
    return;
  }
  try {
    if (!hasBrandWorldAccess(request)) {
      response.setHeader("WWW-Authenticate", 'Basic realm="Brand World System", charset="UTF-8"');
      sendJson(response, 401, { error: "Enter the Brand World installation password to read a source." });
      return;
    }
    const clientId = resolveClientId(request);
    const body = await readJsonBody(request, 1024 * 1024);
    const pathname = String(body.pathname || "");
    // Reads are confined to the caller's own client namespace (ADR 0011).
    if (!pathname.startsWith(`brand-world-system/clients/${clientId}/sources/`)) throw new Error("The read path is invalid.");

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const credentials = token ? { token } : {};
    const validUntil = Date.now() + 15 * 60 * 1000;
    const signedToken = await issueSignedToken({
      ...credentials,
      pathname,
      operations: ["get"],
      validUntil,
    });
    const result = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
    });
    sendJson(response, 200, { pathname, presignedUrl: result.presignedUrl });
  } catch (error) {
    sendPublicError(response, error);
  }
}
