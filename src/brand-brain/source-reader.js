import dns from "node:dns/promises";

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
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Source URLs must use http or https.");
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

export async function enrichUrlSources(sources, fetchImpl = fetch) {
  return Promise.all(
    sources.map(async (source) => {
      if (!source.url) return source;
      const webContent = await readRemotePage(source.url, fetchImpl);
      return { ...source, content: [source.content, webContent].filter(Boolean).join("\n\n") };
    }),
  );
}
