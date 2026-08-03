import dns from "node:dns/promises";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeWithChatCompletions } from "../src/brand-brain/chat-completions-provider.js";
import { normalizeSourcesForSynthesis } from "../src/brand-brain/source-normalizer.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(projectRoot, "app");
const defaultStorePath = path.join(projectRoot, ".data", "brand-brain.json");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function loadEnvFile(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

async function readLocalEnv() {
  try {
    return loadEnvFile(await fs.readFile(path.join(projectRoot, ".env.local"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request, limit = 55 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error("The source batch is larger than the 50 MB request limit.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("The request body is not valid JSON.");
    error.status = 400;
    throw error;
  }
}

function isPrivateAddress(address) {
  const normalized = String(address).toLowerCase();
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return true;
  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

export async function assertSafeRemoteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("One of the source URLs is invalid.");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Source URLs must use http or https.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("Local network URLs cannot be read as sources.");
  const records = await dns.lookup(hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new Error("Private network URLs cannot be read as sources.");
  return url;
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function readRemotePage(value, fetchImpl = fetch) {
  let current = await assertSafeRemoteUrl(value);
  for (let redirect = 0; redirect < 4; redirect += 1) {
    const response = await fetchImpl(current, {
      redirect: "manual",
      headers: { "User-Agent": "BrandWorldSystem/0.1 source-reader" },
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      current = await assertSafeRemoteUrl(new URL(response.headers.get("location"), current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Could not read ${current.hostname} (status ${response.status}).`);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > 1_500_000) throw new Error(`The page at ${current.hostname} is too large to use directly.`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/") && !contentType.includes("json") && !contentType.includes("xml")) {
      throw new Error(`The URL at ${current.hostname} is not a readable web page. Upload the file instead.`);
    }
    const text = await response.text();
    if (Buffer.byteLength(text) > 1_500_000) throw new Error(`The page at ${current.hostname} is too large to use directly.`);
    return htmlToText(text).slice(0, 120_000);
  }
  throw new Error("The source URL redirected too many times.");
}

async function enrichUrlSources(sources, fetchImpl) {
  return Promise.all(
    sources.map(async (source) => {
      if (!source.url) return source;
      const webContent = await readRemotePage(source.url, fetchImpl);
      return { ...source, content: [source.content, webContent].filter(Boolean).join("\n\n") };
    }),
  );
}

function persistedSources(sources) {
  return sources.map((source) => ({
    ...source,
    files: (source.files ?? []).map(({ data: _data, ...file }) => file),
  }));
}

export function selectApprovedBaseline(stored) {
  return stored?.approvedResult || (stored?.brain?.artifactStatus === "ready" ? stored.result : null) || null;
}

export function mergeIncrementalSources(previousSources = [], incomingSources = []) {
  const incomingIds = new Set(incomingSources.map((source) => source.id));
  return [...previousSources.filter((source) => !incomingIds.has(source.id)), ...incomingSources];
}

async function readStore(storePath) {
  try {
    return JSON.parse(await fs.readFile(storePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeStore(storePath, value) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

async function serveStatic(request, response) {
  const requestPath = new URL(request.url, "http://localhost").pathname;
  const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(appRoot, relative);
  if (filePath !== appRoot && !filePath.startsWith(`${appRoot}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(data);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500);
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

export function createBrandWorldServer(options = {}) {
  const storePath = options.storePath || process.env.BRAND_BRAIN_STORE_PATH || defaultStorePath;
  const fetchImpl = options.fetchImpl || fetch;
  const synthesize = options.synthesize || synthesizeWithChatCompletions;
  const envPromise = options.env ? Promise.resolve(options.env) : readLocalEnv();

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/api/brand-brain") {
        sendJson(response, 200, { saved: await readStore(storePath) });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/brand-brain/save") {
        const snapshot = await readJson(request, 5 * 1024 * 1024);
        const saved = { ...snapshot, savedAt: new Date().toISOString() };
        await writeStore(storePath, saved);
        sendJson(response, 200, { savedAt: saved.savedAt });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/brand-brain/synthesize") {
        const body = await readJson(request);
        if (!Array.isArray(body.sources) || body.sources.length === 0) {
          sendJson(response, 400, { error: "Add at least one source before building the Brand Brain." });
          return;
        }
        if (body.sources.some((source) => source.intakeVersion === "single-source-v1" && (source.files?.length || 0) > 1)) {
          const error = new Error("Each source can contain only one uploaded file.");
          error.status = 400;
          throw error;
        }
        const uploadedBytes = body.sources.reduce(
          (total, source) => total + (source.files || []).reduce((sum, file) => sum + Number(file.size || 0), 0),
          0,
        );
        if (uploadedBytes > 40 * 1024 * 1024) {
          const error = new Error("One synthesis can contain up to 40 MB of uploaded source files.");
          error.status = 413;
          throw error;
        }
        const incremental = body.mode === "incremental";
        const stored = incremental ? await readStore(storePath) : null;
        const baseline = incremental ? selectApprovedBaseline(stored) : null;
        if (incremental && !baseline) {
          const error = new Error("The approved Brand Brain baseline could not be found. Reopen the approved version before preparing this update.");
          error.status = 409;
          throw error;
        }
        const env = { ...process.env, ...(await envPromise) };
        const incomingSources = await normalizeSourcesForSynthesis(await enrichUrlSources(body.sources, fetchImpl));
        const previousSources = incremental && Array.isArray(stored?.sources) ? stored.sources : [];
        const sources = incremental ? mergeIncrementalSources(previousSources, incomingSources) : incomingSources;
        const synthesis = await synthesize({
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          sources: incomingSources,
          baseline,
          baselineVersion: body.baselineVersion,
          fetchImpl,
        });
        const saved = {
          kind: incremental ? "incremental-synthesis" : "synthesis",
          sources: persistedSources(sources),
          result: synthesis.result,
          approvedResult: baseline,
          baselineVersion: incremental ? body.baselineVersion || stored?.brain?.approvedVersion || stored?.brain?.artifactVersion || null : null,
          responseId: synthesis.responseId,
          model: synthesis.model,
          usage: synthesis.usage,
          brain: incremental
            ? {
                ...(stored?.brain || {}),
                stage: "review",
                processingComplete: true,
                revisionPending: true,
                candidateBaseVersion: body.baselineVersion || stored?.brain?.approvedVersion || stored?.brain?.artifactVersion || 0,
              }
            : undefined,
          savedAt: new Date().toISOString(),
        };
        await writeStore(storePath, saved);
        sendJson(response, 200, saved);
        return;
      }
      await serveStatic(request, response);
    } catch (error) {
      const status = error.status && Number.isInteger(error.status) ? error.status : 500;
      const publicMessage = status >= 500 && !error.message ? "The server could not complete this request." : error.message;
      console.error(`[brand-world-server] ${publicMessage}`);
      sendJson(response, status, { error: publicMessage });
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT || 4173);
  createBrandWorldServer().listen(port, "127.0.0.1", () => {
    console.log(`Brand World System is running at http://localhost:${port}`);
  });
}
