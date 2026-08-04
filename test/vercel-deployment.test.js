import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hasBrandWorldAccess } from "../src/server/http.js";

const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Vercel build keeps APIs server-side and gives synthesis a five-minute window", () => {
  const config = JSON.parse(fs.readFileSync(path.join(rootPath, "vercel.json"), "utf8"));
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.fluid, true);
  assert.equal(config.functions["api/**/*.js"].maxDuration, 300);
  assert.equal(config.headers[0].headers.find((header) => header.key === "X-Robots-Tag").value, "noindex, nofollow");
});

test("the hosted installation uses one shared access password without roles", () => {
  const password = "test-installation-password";
  const request = {
    headers: { authorization: `Basic ${Buffer.from(`brandworld:${password}`).toString("base64")}` },
  };
  assert.equal(hasBrandWorldAccess(request, password), true);
  assert.equal(hasBrandWorldAccess({ headers: {} }, password), false);
  assert.equal(hasBrandWorldAccess({ headers: { authorization: request.headers.authorization } }, "wrong"), false);
});

test("the browser build includes direct private source uploads", () => {
  const index = fs.readFileSync(path.join(rootPath, "app", "index.html"), "utf8");
  const uploadClient = fs.readFileSync(path.join(rootPath, "app", "upload-client.js"), "utf8");
  assert.match(index, /upload-client\.js/);
  assert.match(uploadClient, /access: "private"/);
  assert.match(uploadClient, /multipart: file\.size/);
  assert.match(uploadClient, /blobPathname/);
});
