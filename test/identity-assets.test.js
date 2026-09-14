import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { convertIdentityAssetsFromSources } from "../src/identity-assets/service.js";
import { placeAssetOnRender } from "../src/production/placement.js";

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect x="40" y="80" width="520" height="140" fill="#f5efe4"/></svg>`;

function stubIdentityStore(initial = []) {
  const written = [];
  return {
    written,
    async listAssets() {
      return initial;
    },
    async readAsset(assetId) {
      return written.find((r) => r.asset_id === assetId) || null;
    },
    async writeAsset(record) {
      written.push(record);
      return record;
    },
  };
}

test("conversion builds one mark record from logo and lockup sources", async () => {
  const brain = {
    sources: [
      { id: "s1", name: "Primary logo", authority: "exact-asset", assetKind: "logo", assetVariation: "Primary",
        usage: "Use exactly as supplied.", files: [
          { name: "logo.svg", type: "image/svg+xml", blobPathname: "brand-world-system/clients/default/sources/logo.svg" },
          { name: "logo.eps", type: "application/postscript", blobPathname: "brand-world-system/clients/default/sources/logo.eps" },
        ] },
      { id: "s2", name: "Mono", authority: "exact-asset", assetKind: "logo", assetVariation: "Other", assetVariationOther: "Reversed white",
        files: [{ name: "mono.png", type: "image/png", blobPathname: "brand-world-system/clients/default/sources/mono.png" }] },
      { id: "s3", name: "Claim lockup", authority: "exact-asset", assetKind: "lockup",
        files: [{ name: "lockup.png", type: "image/png", blobPathname: "brand-world-system/clients/default/sources/lockup.png" }] },
      { id: "s4", name: "Packaging", authority: "exact-asset", assetKind: "packaging",
        files: [{ name: "box.png", type: "image/png", blobPathname: "brand-world-system/clients/default/sources/box.png" }] },
      { id: "s5", name: "Font only", authority: "exact-asset", assetKind: "logo",
        files: [{ name: "mark.ttf", type: "font/ttf", blobPathname: "brand-world-system/clients/default/sources/mark.ttf" }] },
    ],
  };
  const identityStore = stubIdentityStore();
  const result = await convertIdentityAssetsFromSources({
    brainStore: { async read() { return brain; } },
    identityStore,
  });

  assert.equal(result.converted, true);
  assert.equal(identityStore.written.length, 1);
  const record = identityStore.written[0];
  assert.equal(record.asset_id, "brand-mark");
  assert.equal(record.approved_at, null);
  // Three variations: the packaging source is not a mark, and the font-only
  // source has no placeable file so it is skipped and reported.
  assert.equal(record.variations.length, 3);
  assert.deepEqual(record.variations.map((v) => v.variation), ["Primary", "Reversed white", "Claim lockup"]);
  // The EPS is stored but not placeable, so only the SVG carries through as a
  // file on the first variation.
  assert.equal(record.variations[0].files.length, 1);
  assert.equal(record.variations[0].files[0].type, "image/svg+xml");
  assert.deepEqual(result.skipped.map((s) => s.source_id), ["s5"]);
  assert.equal(record.guidance, "Use exactly as supplied.");
  assert.deepEqual(Object.keys(record.rules).sort(), [
    "clear_space", "dark_ground_variation_id", "light_ground_variation_id", "minimum_width_fraction",
  ]);
});

test("conversion refuses when no mark sources exist and when the record is approved", async () => {
  const empty = await convertIdentityAssetsFromSources({
    brainStore: { async read() { return { sources: [] }; } },
    identityStore: stubIdentityStore(),
  });
  assert.equal(empty.converted, false);

  const approved = await convertIdentityAssetsFromSources({
    brainStore: {
      async read() {
        return { sources: [{ id: "s1", assetKind: "logo", files: [{ type: "image/png", blobPathname: "brand-world-system/clients/default/sources/a.png" }] }] };
      },
    },
    identityStore: stubIdentityStore([{ asset_id: "brand-mark", status: "approved" }]),
  });
  assert.equal(approved.converted, false);
  assert.match(approved.reason, /approved/i);
});

test("an identity mark places through the pipeline and the record carries the mark fields", async () => {
  const scene = await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#5c452c"/></svg>`,
  )).png().toBuffer();
  const writtenPackages = [];

  const job = await placeAssetOnRender(
    {
      action: "place-asset",
      backgroundOutputId: "out-1",
      identityAssetId: "brand-mark",
      variationId: "var-1",
      grounding: false,
      box: { x: 40, y: 40, width: 200, height: 100 },
    },
    {
      env: {},
      productionStore: {
        async readOutputImageBytes() { return { bytes: scene, contentType: "image/png" }; },
        async writeImage(jobId, bytes, contentType) { return { pathname: `test/${jobId}.png`, contentType }; },
        async writeOutputPackage(jobId, value) { writtenPackages.push(value); },
      },
      identityStore: {
        async readAsset() {
          return {
            asset_id: "brand-mark",
            variations: [{ variation_id: "var-1", variation: "Primary", files: [
              { file_id: "file-1", type: "image/svg+xml", blob_pathname: "brand-world-system/clients/default/sources/logo.svg" },
            ] }],
          };
        },
      },
      brainStore: {
        async readSourceFile(pathname) {
          assert.equal(pathname, "brand-world-system/clients/default/sources/logo.svg");
          return { bytes: Buffer.from(logoSvg), mimeType: "image/svg+xml" };
        },
      },
    },
  );

  assert.equal(job.status, "complete");
  assert.equal(job.verification.intact, true);
  assert.equal(writtenPackages.length, 1);
  const placement = writtenPackages[0].placement;
  assert.equal(placement.identityAssetId, "brand-mark");
  assert.equal(placement.variationId, "var-1");
  assert.equal(placement.fileId, "file-1");
  assert.equal(placement.variation, "Primary");
  assert.equal(placement.grounding, false);
  assert.equal("productId" in placement, false);
});
