import fs from "node:fs/promises";
import path from "node:path";
import { get, issueSignedToken, presignUrl, put } from "@vercel/blob";

// Client-namespaced production state and images. Client id is server-resolved
// and threaded in through the store factory. See ADR 0011.
const DEFAULT_CLIENT_ID = "default";
// Pre-namespace deployments wrote production state to a single flat path. The
// default client reads through to it once so an in-flight job is not stranded,
// then the next save moves it into the namespace. Remove after the flat blob
// is gone.
const LEGACY_FLAT_PRODUCTION_PATHNAME = "brand-world-system/production/current.json";

function clientRoot(clientId) {
  return `brand-world-system/clients/${clientId}`;
}

function productionStatePathname(clientId) {
  return `${clientRoot(clientId)}/production/current.json`;
}

function productionImagePathname(clientId, jobId, extension) {
  return `${clientRoot(clientId)}/production/jobs/${jobId}/output.${extension}`;
}

export function createFileProductionStore(rootPath) {
  const statePath = path.join(rootPath, "current.json");
  const imageRoot = path.join(rootPath, "images");
  return {
    async read() {
      try {
        return JSON.parse(await fs.readFile(statePath, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
      }
    },
    async write(value) {
      await fs.mkdir(rootPath, { recursive: true });
      await fs.writeFile(statePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    },
    async writeImage(jobId, bytes, contentType = "image/png") {
      await fs.mkdir(imageRoot, { recursive: true });
      const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
      const imagePath = path.join(imageRoot, `${jobId}.${extension}`);
      await fs.writeFile(imagePath, bytes, { mode: 0o600 });
      return { pathname: imagePath, contentType };
    },
    async readImage(pathname) {
      return fs.readFile(pathname);
    },
  };
}

export function createVercelBlobProductionStore(options = {}) {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  const clientId = options.clientId || DEFAULT_CLIENT_ID;
  const credentials = token ? { token } : {};

  async function readJsonBlobOrNull(pathname) {
    const result = await get(pathname, { access: "private", ...credentials, useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error("The saved production job could not be read.");
    return JSON.parse(await new Response(result.stream).text());
  }

  return {
    async read() {
      const current = await readJsonBlobOrNull(productionStatePathname(clientId));
      if (current !== null) return current;
      if (clientId === DEFAULT_CLIENT_ID) return readJsonBlobOrNull(LEGACY_FLAT_PRODUCTION_PATHNAME);
      return null;
    },
    async write(value) {
      await put(productionStatePathname(clientId), JSON.stringify(value), {
        access: "private",
        ...credentials,
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      });
    },
    async writeImage(jobId, bytes, contentType = "image/png") {
      const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
      const pathname = productionImagePathname(clientId, jobId, extension);
      await put(pathname, bytes, {
        access: "private",
        ...credentials,
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType,
        cacheControlMaxAge: 60,
      });
      return { pathname, contentType };
    },
    async imageUrl(pathname) {
      const validUntil = Date.now() + 15 * 60 * 1000;
      const signedToken = await issueSignedToken({ ...credentials, pathname, operations: ["get"], validUntil });
      const result = await presignUrl(signedToken, { access: "private", operation: "get", pathname, validUntil });
      return result.presignedUrl;
    },
  };
}
