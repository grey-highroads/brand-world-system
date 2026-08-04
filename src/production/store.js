import fs from "node:fs/promises";
import path from "node:path";
import { get, issueSignedToken, presignUrl, put } from "@vercel/blob";

const productionStatePathname = "brand-world-system/production/current.json";

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
  const credentials = token ? { token } : {};
  return {
    async read() {
      const result = await get(productionStatePathname, { access: "private", ...credentials, useCache: false });
      if (!result) return null;
      if (result.statusCode !== 200 || !result.stream) throw new Error("The saved production job could not be read.");
      return JSON.parse(await new Response(result.stream).text());
    },
    async write(value) {
      await put(productionStatePathname, JSON.stringify(value), {
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
      const pathname = `brand-world-system/production/jobs/${jobId}/output.${extension}`;
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

