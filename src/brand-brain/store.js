import fs from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

const statePathname = "brand-world-system/state/current.json";

export function createFileBrandBrainStore(storePath) {
  return {
    async read() {
      try {
        return JSON.parse(await fs.readFile(storePath, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
      }
    },
    async write(value) {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.writeFile(storePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    },
    async readSourceFile() {
      throw new Error("Hosted source storage is not configured for this local server.");
    },
  };
}

export function createVercelBlobBrandBrainStore(options = {}) {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  const credentials = token ? { token } : {};
  return {
    async read() {
      const result = await get(statePathname, { access: "private", ...credentials, useCache: false });
      if (!result) return null;
      if (result.statusCode !== 200 || !result.stream) throw new Error("The stored Brand Brain could not be read.");
      return JSON.parse(await new Response(result.stream).text());
    },
    async write(value) {
      await put(statePathname, JSON.stringify(value), {
        access: "private",
        ...credentials,
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
      });
    },
    async readSourceFile(pathname) {
      if (!pathname || !String(pathname).startsWith("brand-world-system/sources/")) {
        throw new Error("The stored source file reference is invalid.");
      }
      const result = await get(pathname, { access: "private", ...credentials, useCache: false });
      if (!result || result.statusCode !== 200 || !result.stream) throw new Error("One of the stored source files could not be read.");
      return {
        bytes: Buffer.from(await new Response(result.stream).arrayBuffer()),
        mimeType: result.blob.contentType,
        size: result.blob.size,
      };
    },
  };
}
