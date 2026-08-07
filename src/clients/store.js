import { get, put } from "@vercel/blob";

// The one document that lives outside any client namespace: the flat list of
// clients the steward can switch between. See ADR 0011.
const CLIENT_INDEX_PATHNAME = "brand-world-system/clients/index.json";

// The default client makes the pre-namespace brain reachable after namespacing.
// It is always present in the list even before the index document exists.
const DEFAULT_CLIENT = { id: "default", name: "Default brand", status: "active", configRef: null, createdAt: null };

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "client";
}

function shortId() {
  return (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
}

export function createVercelBlobClientStore(options = {}) {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  const credentials = token ? { token } : {};

  async function readIndexOrNull() {
    const result = await get(CLIENT_INDEX_PATHNAME, { access: "private", ...credentials, useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error("The client list could not be read.");
    return JSON.parse(await new Response(result.stream).text());
  }

  async function writeIndex(clients) {
    await put(CLIENT_INDEX_PATHNAME, JSON.stringify({ clients }), {
      access: "private",
      ...credentials,
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  }

  return {
    async list() {
      const index = await readIndexOrNull();
      const clients = Array.isArray(index?.clients) ? index.clients : [];
      if (!clients.some((client) => client.id === "default")) return [DEFAULT_CLIENT, ...clients];
      return clients;
    },
    async create({ name }) {
      const trimmed = String(name || "").trim();
      if (!trimmed) {
        const error = new Error("A client needs a name.");
        error.status = 400;
        throw error;
      }
      const index = (await readIndexOrNull()) || { clients: [] };
      const clients = Array.isArray(index.clients) ? index.clients : [];
      // The id is server-assigned and never user-managed (ADR 0011).
      let id = `${slugify(trimmed)}-${shortId()}`;
      while (clients.some((client) => client.id === id) || id === "default") {
        id = `${slugify(trimmed)}-${shortId()}`;
      }
      const record = { id, name: trimmed, status: "active", configRef: null, createdAt: new Date().toISOString() };
      clients.push(record);
      await writeIndex(clients);
      return record;
    },
  };
}
