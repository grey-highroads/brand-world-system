import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createFileProductionStore, outputArtifactPathnames, sceneImageJobId } from "../src/production/store.js";

// A two-call render writes a second image alongside the finished one: the scene
// it made before the product was placed into it. Discard has to take that image
// with the rest of the output, or every two-call job a person throws away pays
// storage forever for a picture nothing can reach.

async function temporaryStore() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "bws-production-store-"));
  return { root, store: createFileProductionStore(root) };
}

function imagePath(root, jobId) {
  return path.join(root, "images", `${jobId}.png`);
}

function packagePath(root, jobId) {
  return path.join(root, "packages", `${jobId}.json`);
}

async function exists(target) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

test("discarding a two-call output removes the final image, the package, and the scene image", async () => {
  const { root, store } = await temporaryStore();
  const jobId = "job-two-call";

  await store.writeImage(jobId, Buffer.from("final"), "image/png");
  await store.writeImage(sceneImageJobId(jobId), Buffer.from("scene"), "image/png");
  await store.writeOutputPackage(jobId, { generationPackage: { twoCall: { sceneImageId: sceneImageJobId(jobId) } } });

  assert.equal(await exists(imagePath(root, jobId)), true);
  assert.equal(await exists(imagePath(root, `${jobId}-scene`)), true);
  assert.equal(await exists(packagePath(root, jobId)), true);

  await store.deleteOutputArtifacts(jobId);

  assert.equal(await exists(imagePath(root, jobId)), false);
  assert.equal(await exists(imagePath(root, `${jobId}-scene`)), false);
  assert.equal(await exists(packagePath(root, jobId)), false);
});

test("discarding a single-call output removes its two artifacts and does not fail on the absent scene image", async () => {
  const { root, store } = await temporaryStore();
  const jobId = "job-single-call";

  await store.writeImage(jobId, Buffer.from("final"), "image/png");
  await store.writeOutputPackage(jobId, { generationPackage: {} });

  await store.deleteOutputArtifacts(jobId);

  assert.equal(await exists(imagePath(root, jobId)), false);
  assert.equal(await exists(packagePath(root, jobId)), false);
});

test("discarding an output that was already discarded stays quiet", async () => {
  const { store } = await temporaryStore();
  await store.deleteOutputArtifacts("job-never-existed");
});

// The store that runs in production deletes blobs rather than files, and its
// deletes go through a client library this suite does not stand up. What can be
// checked without one is the list of paths it hands that library, which is where
// the scene image was missing.
test("the blob discard list carries the scene image beside the output and the package", () => {
  const pathnames = outputArtifactPathnames("acme", "job-42");
  assert.deepEqual(pathnames, [
    "brand-world-system/clients/acme/production/jobs/job-42/output.png",
    "brand-world-system/clients/acme/production/jobs/job-42-scene/output.png",
    "brand-world-system/clients/acme/production/jobs/job-42/package.json",
  ]);
});

// The suffix is written out in two files that cannot import each other. If one
// moves without the other, discard goes back to leaving a scene image behind.
test("the scene job id matches the suffix the render path writes", () => {
  assert.equal(sceneImageJobId("job-42"), "job-42-scene");
});
