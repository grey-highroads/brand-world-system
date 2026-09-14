import { get, put, del } from "@vercel/blob";

// Identity asset records (ADR 0020 step 2). One record per mark; the
// variations live inside the record rather than beside each other as separate
// sources. Namespaced per client and stored like products: an index of
// summaries plus one JSON blob per record.

function identityPrefix(clientId) {
  return `brand-world-system/clients/${clientId}/identity-assets/`;
}

function recordPathname(clientId, assetId) {
  return `${identityPrefix(clientId)}${assetId}.json`;
}

function indexPathname(clientId) {
  return `${identityPrefix(clientId)}index.json`;
}

export function createVercelBlobIdentityAssetStore(options = {}) {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  const clientId = options.clientId || "default";
  const credentials = token ? { token } : {};

  async function readJsonBlobOrNull(pathname) {
    const result = await get(pathname, { access: "private", ...credentials, useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) {
      throw new Error("A stored identity asset record could not be read.");
    }
    return JSON.parse(await new Response(result.stream).text());
  }

  async function writeJsonBlob(pathname, value) {
    await put(pathname, JSON.stringify(value), {
      access: "private",
      ...credentials,
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  }

  return {
    async listAssets() {
      const index = await readJsonBlobOrNull(indexPathname(clientId));
      return Array.isArray(index?.assets) ? index.assets : [];
    },

    async readAsset(assetId) {
      return readJsonBlobOrNull(recordPathname(clientId, assetId));
    },

    // Write a full record and update the index. The record must carry
    // asset_id, asset_name, and version.
    async writeAsset(record) {
      const assetId = record.asset_id;
      if (!assetId) throw new Error("Identity asset record is missing asset_id.");

      await writeJsonBlob(recordPathname(clientId, assetId), record);

      const index = await readJsonBlobOrNull(indexPathname(clientId));
      const assets = Array.isArray(index?.assets) ? index.assets : [];
      const entry = {
        asset_id: assetId,
        asset_name: record.asset_name,
        version: record.version,
        status: record.approved_at ? "approved" : "candidate",
        variation_count: (record.variations || []).length,
        updated_at: new Date().toISOString(),
      };
      const existing = assets.findIndex((a) => a.asset_id === assetId);
      if (existing >= 0) assets[existing] = entry;
      else assets.push(entry);
      await writeJsonBlob(indexPathname(clientId), { assets });

      return record;
    },

    async deleteAsset(assetId) {
      try {
        await del(recordPathname(clientId, assetId), { ...credentials });
      } catch {
        // Already gone. Proceed to clean the index.
      }
      const index = await readJsonBlobOrNull(indexPathname(clientId));
      const assets = Array.isArray(index?.assets) ? index.assets : [];
      const filtered = assets.filter((a) => a.asset_id !== assetId);
      if (filtered.length !== assets.length) {
        await writeJsonBlob(indexPathname(clientId), { assets: filtered });
      }
    },
  };
}
