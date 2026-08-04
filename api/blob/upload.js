import { handleUpload } from "@vercel/blob/client";
import { hasBrandWorldAccess, readJsonBody, sendJson, sendPublicError } from "../../src/server/http.js";

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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only accepts source uploads." });
    return;
  }
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const error = new Error("Private Vercel storage is not connected to this deployment.");
      error.status = 503;
      throw error;
    }
    const body = await readJsonBody(request, 1024 * 1024);
    if (body.type === "blob.generate-client-token" && !hasBrandWorldAccess(request)) {
      response.setHeader("WWW-Authenticate", 'Basic realm="Brand World System", charset="UTF-8"');
      sendJson(response, 401, { error: "Enter the Brand World installation password to upload a source." });
      return;
    }
    const result = await handleUpload({
      request,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        if (!String(pathname).startsWith("brand-world-system/sources/")) throw new Error("The upload path is invalid.");
        return {
          allowedContentTypes,
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
      onUploadCompleted: async () => {},
    });
    sendJson(response, 200, result);
  } catch (error) {
    sendPublicError(response, error);
  }
}
