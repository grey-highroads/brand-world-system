import { get, put, del } from "@vercel/blob";

// Per-record campaign storage namespaced under the client, on the same pattern
// as products. See ADR 0011 and src/products/store.js. Each campaign lives at
// its own key under the client's namespace, with an index listing the client's
// campaigns.
//
// Before this store existed, campaigns were a literal array in the browser's
// initial state. That array was shared across every client and was lost on
// reload. Nothing about a campaign belongs outside a client namespace, so the
// path is the boundary: a store built for one client id cannot read or write
// another client's records.

function campaignsPrefix(clientId) {
  return `brand-world-system/clients/${clientId}/campaigns/`;
}

function campaignPathname(clientId, campaignId) {
  return `${campaignsPrefix(clientId)}${campaignId}.json`;
}

function indexPathname(clientId) {
  return `${campaignsPrefix(clientId)}index.json`;
}

// The campaign id is generated in the browser and arrives over the wire, and it
// becomes a path segment. Sanitize it here for the same reason resolveClientId
// sanitizes the client id: a path segment taken from a request is a traversal
// risk until it is constrained to a safe character set.
export function sanitizeCampaignId(value) {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return cleaned;
}

// The twenty fields the campaign creation form builds, plus the record's own
// timestamps. Anything the client sends outside this list is dropped, so the
// stored shape stays the shape the application reads.
const TEXT_FIELDS = [
  "name",
  "description",
  "objective",
  "audience",
  "currentBelief",
  "desiredBelief",
  "desiredAction",
  "campaignIdea",
  "messageTerritory",
  "proofPoints",
  "preserve",
  "explore",
  "paletteShift",
  "productFocus",
  "startDate",
  "endDate",
];

export function normalizeCampaignRecord(input = {}, existing = null) {
  const record = { id: sanitizeCampaignId(input.id) };
  for (const field of TEXT_FIELDS) {
    record[field] = String(input[field] ?? existing?.[field] ?? "").trim();
  }
  const channels = Array.isArray(input.channels)
    ? input.channels
    : Array.isArray(existing?.channels)
      ? existing.channels
      : [];
  record.channels = channels.map((channel) => String(channel));
  const learnings = Array.isArray(input.learnings)
    ? input.learnings
    : Array.isArray(existing?.learnings)
      ? existing.learnings
      : [];
  record.learnings = learnings;
  record.createdAt = input.createdAt || existing?.createdAt || new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  return record;
}

// The Blob operations are injectable so the store can be exercised against an
// in-memory backend in tests. Production passes nothing and gets @vercel/blob.
function defaultBlobOperations() {
  return { get, put, del };
}

export function createInMemoryCampaignBlobOperations(store = new Map()) {
  return {
    store,
    async get(pathname) {
      if (!store.has(pathname)) return null;
      return {
        statusCode: 200,
        stream: new Response(store.get(pathname)).body,
      };
    },
    async put(pathname, body) {
      store.set(pathname, String(body));
    },
    async del(pathname) {
      if (!store.has(pathname)) throw new Error("No stored campaign at that path.");
      store.delete(pathname);
    },
  };
}

export function createVercelBlobCampaignStore(options = {}) {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  const clientId = options.clientId || "default";
  const credentials = token ? { token } : {};
  const blob = options.blob || defaultBlobOperations();

  async function readJsonBlobOrNull(pathname) {
    const result = await blob.get(pathname, {
      access: "private",
      ...credentials,
      useCache: false,
    });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) {
      throw new Error("A stored campaign record could not be read.");
    }
    return JSON.parse(await new Response(result.stream).text());
  }

  async function writeJsonBlob(pathname, value) {
    await blob.put(pathname, JSON.stringify(value), {
      access: "private",
      ...credentials,
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  }

  return {
    clientId,

    // Every campaign record for this client, full records rather than index
    // summaries. The application holds the whole list in state and reads
    // fields off it on many screens, so a summary index would only force a
    // second round of reads.
    async listCampaigns() {
      const index = await readJsonBlobOrNull(indexPathname(clientId));
      const ids = Array.isArray(index?.campaigns) ? index.campaigns : [];
      const records = [];
      for (const id of ids) {
        const record = await readJsonBlobOrNull(campaignPathname(clientId, id));
        if (record) records.push(record);
      }
      return records;
    },

    async readCampaign(campaignId) {
      const id = sanitizeCampaignId(campaignId);
      if (!id) return null;
      return readJsonBlobOrNull(campaignPathname(clientId, id));
    },

    // Create or update one campaign. An existing record is read first so a
    // partial update keeps the fields it did not send.
    async writeCampaign(input) {
      const id = sanitizeCampaignId(input?.id);
      if (!id) {
        const error = new Error("A campaign needs an id before it can be saved.");
        error.status = 400;
        throw error;
      }
      const existing = await readJsonBlobOrNull(campaignPathname(clientId, id));
      const record = normalizeCampaignRecord({ ...input, id }, existing);
      if (!record.name) {
        const error = new Error("A campaign needs a name before it can be saved.");
        error.status = 400;
        throw error;
      }

      await writeJsonBlob(campaignPathname(clientId, id), record);

      const index = await readJsonBlobOrNull(indexPathname(clientId));
      const ids = Array.isArray(index?.campaigns) ? index.campaigns : [];
      if (!ids.includes(id)) {
        ids.push(id);
        await writeJsonBlob(indexPathname(clientId), { campaigns: ids });
      }

      return record;
    },

    async deleteCampaign(campaignId) {
      const id = sanitizeCampaignId(campaignId);
      if (!id) return;
      try {
        await blob.del(campaignPathname(clientId, id), { ...credentials });
      } catch {
        // Already gone or never existed. Clean the index either way.
      }
      const index = await readJsonBlobOrNull(indexPathname(clientId));
      const ids = Array.isArray(index?.campaigns) ? index.campaigns : [];
      const filtered = ids.filter((entry) => entry !== id);
      if (filtered.length !== ids.length) {
        await writeJsonBlob(indexPathname(clientId), { campaigns: filtered });
      }
    },
  };
}
