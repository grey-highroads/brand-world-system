import { issueSignedToken, presignUrl } from "@vercel/blob";
import { hasBrandWorldAccess, readJsonBody, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

const maximumSizeInBytes = 20 * 1024 * 1024;
const allowedContentTypes = [
  "application/json",
  "application/octet-stream",
  "application/pdf",
  "application/rtf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/xml",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "text/*",
];

function isAllowedContentType(contentType) {
  return allowedContentTypes.some((allowed) => allowed === contentType || (allowed.endsWith("/*") && contentType.startsWith(allowed.slice(0, -1))));
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only accepts source uploads." });
    return;
  }
  try {
    if (!hasBrandWorldAccess(request)) {
      response.setHeader("WWW-Authenticate", 'Basic realm="Brand World System", charset="UTF-8"');
      sendJson(response, 401, { error: "Enter the Brand World installation password to upload a source." });
      return;
    }
    const clientId = resolveClientId(request);
    const body = await readJsonBody(request, 1024 * 1024);
    const pathname = String(body.pathname || "");
    const contentType = String(body.contentType || "application/octet-stream").toLowerCase();
    const size = Number(body.size);
    // Uploads are confined to the caller's own client namespace (ADR 0011).
    if (!pathname.startsWith(`brand-world-system/clients/${clientId}/sources/`)) throw new Error("The upload path is invalid.");
    if (!Number.isFinite(size) || size <= 0 || size > maximumSizeInBytes) throw new Error("Choose one source file no larger than 20 MB.");
    if (!isAllowedContentType(contentType)) throw new Error("That file format is not supported for this source.");

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const credentials = token ? { token } : {};
    const validUntil = Date.now() + 10 * 60 * 1000;
    const signedToken = await issueSignedToken({
      ...credentials,
      pathname,
      operations: ["put"],
      validUntil,
      allowedContentTypes: [contentType],
      maximumSizeInBytes,
    });
    const result = await presignUrl(signedToken, {
      access: "private",
      operation: "put",
      pathname,
      validUntil,
      allowedContentTypes: [contentType],
      maximumSizeInBytes,
      allowOverwrite: false,
      addRandomSuffix: false,
    });
    sendJson(response, 200, { pathname, presignedUrl: result.presignedUrl });
  } catch (error) {
    sendPublicError(response, error);
  }
}
