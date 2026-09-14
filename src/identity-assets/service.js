// Identity asset service (ADR 0020 step 2). The conversion turns the logo and
// lockup sources a brand already registered into one governed record whose
// variations are the marks the person uploaded. Nothing is synthesized and no
// file moves: each variation points at the blob the source already stored,
// which keeps the brain reading the same files it always read.

// Formats deterministic placement can rasterize. SVG leads on purpose: ADR
// 0020 kept accepting vectors because placement renders them at final size
// with no upscaling.
const PLACEABLE_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];

function shortId() {
  return (
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();
}

function variationLabel(source) {
  if (source.assetVariation === "Other" && source.assetVariationOther) return source.assetVariationOther;
  if (source.assetVariation) return source.assetVariation;
  return source.name || "Unnamed variation";
}

function placeableFiles(source) {
  return (source.files || [])
    .filter((file) => PLACEABLE_TYPES.includes(String(file.type || "").toLowerCase()) && file.blobPathname)
    .map((file) => ({
      file_id: `file-${shortId()}`,
      file_name: file.name || "",
      type: String(file.type || "").toLowerCase(),
      blob_pathname: file.blobPathname,
    }));
}

// Reads the brain's logo and lockup sources and writes one identity asset
// record carrying each as a variation. One record per mark is the ADR's rule;
// with no person in the loop to say which sources are which mark, the
// conversion makes a single record and leaves splitting a multi-mark brand to
// the management screens. Running it again replaces the converted record with
// a fresh read of the sources, so a rerun after adding a logo source picks it
// up. An approved record is never replaced.
export async function convertIdentityAssetsFromSources({ brainStore, identityStore }) {
  const brain = await brainStore.read();
  const sources = Array.isArray(brain?.sources) ? brain.sources : [];
  const markSources = sources.filter(
    (source) => ["logo", "lockup"].includes(source.assetKind) && !source.templateMeta && !source.productMeta,
  );

  if (!markSources.length) {
    return { converted: false, reason: "No logo or lockup sources are registered for this brand." };
  }

  const variations = [];
  const skipped = [];
  for (const source of markSources) {
    const files = placeableFiles(source);
    if (!files.length) {
      skipped.push({ source_id: source.id, name: source.name || "", reason: "No file in a placeable format." });
      continue;
    }
    variations.push({
      variation_id: `var-${shortId()}`,
      variation: variationLabel(source),
      asset_kind: source.assetKind,
      source_id: source.id,
      source_name: source.name || "",
      files,
    });
  }

  if (!variations.length) {
    return { converted: false, reason: "The registered logo sources hold no files in a placeable format.", skipped };
  }

  const existing = (await identityStore.listAssets()).find((entry) => entry.asset_id === "brand-mark");
  if (existing?.status === "approved") {
    return { converted: false, reason: "The brand mark record is approved. Approved records are not replaced by conversion.", skipped };
  }

  const record = {
    asset_id: "brand-mark",
    asset_name: "Brand mark",
    version: 1,
    variations,
    // Machine-actionable placement rules per ADR 0020. Empty at conversion
    // because the sources carry no structured rules; filled through the
    // management screens. usage and exclusions text from the sources goes to
    // guidance so nothing typed at intake is lost.
    rules: {
      light_ground_variation_id: null,
      dark_ground_variation_id: null,
      minimum_width_fraction: null,
      clear_space: null,
    },
    guidance: markSources
      .map((source) => [source.usage, source.exclusions].filter(Boolean).join(" "))
      .filter(Boolean)
      .join("\n"),
    converted_from_source_ids: markSources.map((source) => source.id),
    created_at: new Date().toISOString(),
    approved_at: null,
  };

  await identityStore.writeAsset(record);
  return { converted: true, record, skipped };
}

export async function listIdentityAssets({ identityStore }) {
  return identityStore.listAssets();
}

export async function readIdentityAsset({ identityStore, assetId }) {
  const record = await identityStore.readAsset(assetId);
  if (!record) {
    const error = new Error("That identity asset record could not be found.");
    error.status = 404;
    throw error;
  }
  return record;
}
