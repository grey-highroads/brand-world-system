import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
export const MAX_SOURCE_FILE_BYTES = 20 * 1024 * 1024;
const visionMimeTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);
const directTextExtensions = new Set([".csv", ".html", ".json", ".md", ".rtf", ".text", ".txt", ".xml"]);
const directTextMimeTypes = new Set([
  "application/json",
  "application/rtf",
  "application/xml",
  "text/csv",
  "text/html",
  "text/markdown",
  "text/plain",
  "text/rtf",
  "text/xml",
]);

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) throw new Error("An uploaded file could not be decoded.");
  const mimeType = match[1] || "application/octet-stream";
  const bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]), "utf8");
  return { mimeType, bytes };
}

function cleanExtractedText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 160_000);
}

async function extractWithMacMetadata(bytes, filename) {
  if (process.platform !== "darwin") {
    throw new Error(`${filename} needs a local document extractor before it can be synthesized on this platform.`);
  }
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "brand-world-source-"));
  const safeName = path.basename(filename).replace(/[^A-Za-z0-9._-]/g, "_") || "source-file";
  const sourcePath = path.join(temporaryDirectory, safeName);
  const metadataPath = path.join(temporaryDirectory, "metadata.plist");

  try {
    await fs.writeFile(sourcePath, bytes, { mode: 0o600 });
    await execFileAsync("/usr/bin/mdimport", ["-t", "-o", metadataPath, sourcePath], { maxBuffer: 12 * 1024 * 1024 });
    const { stdout } = await execFileAsync("/usr/bin/plutil", ["-extract", "kMDItemTextContent", "raw", "-o", "-", metadataPath], {
      maxBuffer: 12 * 1024 * 1024,
    });
    const text = cleanExtractedText(stdout);
    if (!text) throw new Error(`${filename} did not contain readable text.`);
    return text;
  } catch (error) {
    if (error.message?.includes(filename)) throw error;
    throw new Error(`Could not extract readable text from ${filename}. Convert it to PDF or plain text and try again.`);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export async function normalizeUploadedFile(file, source = {}) {
  if (Number(file.size || 0) > MAX_SOURCE_FILE_BYTES) {
    const error = new Error(`${file.name || "The uploaded file"} is larger than the 20 MB source limit.`);
    error.status = 413;
    throw error;
  }
  if (!file.data) return { kind: "metadata", name: file.name, type: file.type, size: file.size };
  const decoded = decodeDataUrl(file.data);
  if (decoded.bytes.length > MAX_SOURCE_FILE_BYTES) {
    const error = new Error(`${file.name || "The uploaded file"} is larger than the 20 MB source limit.`);
    error.status = 413;
    throw error;
  }
  const mimeType = file.type || decoded.mimeType;
  if (visionMimeTypes.has(mimeType)) return { kind: "image", ...file, type: mimeType };

  if (source.authority === "exact-asset") {
    return {
      kind: "metadata",
      name: file.name,
      type: mimeType,
      size: file.size,
      note: "Protected source preserved as supplied; this file format was not visually interpreted during synthesis.",
    };
  }

  const extension = path.extname(file.name || "").toLowerCase();
  const text = directTextMimeTypes.has(mimeType) || directTextExtensions.has(extension)
    ? cleanExtractedText(decoded.bytes.toString("utf8"))
    : await extractWithMacMetadata(decoded.bytes, file.name || "uploaded document");

  if (!text) throw new Error(`${file.name || "The uploaded file"} did not contain readable text.`);
  return { kind: "text", name: file.name, type: mimeType, size: file.size, text };
}

export async function normalizeSourcesForSynthesis(sources) {
  return Promise.all(
    sources.map(async (source) => {
      const normalizedFiles = await Promise.all((source.files ?? []).map((file) => normalizeUploadedFile(file, source)));
      const extractedText = normalizedFiles.filter((file) => file.kind === "text").map((file) => `SOURCE FILE: ${file.name}\n${file.text}`);
      return {
        ...source,
        content: [source.content, ...extractedText].filter(Boolean).join("\n\n"),
        files: normalizedFiles.filter((file) => file.kind === "image"),
        extractedFiles: normalizedFiles.map(({ data: _data, text: _text, ...file }) => file),
      };
    }),
  );
}
