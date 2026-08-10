import { selectApprovedBaseline } from "../brand-brain/service.js";
import { createVercelBlobProductStore } from "../products/store.js";
import { OPENAI_IMAGE_MODEL, chooseOpenAIImageEndpoint, renderWithOpenAIImages } from "../renderers/openai-images.js";
import { assembleClaimsSet } from "../claims/assembly.js";
import { produceCopy } from "../copy/generate.js";
import { buildJobScope } from "../scope/resolver.js";
import { compileBrandWorldImagePackage } from "./package.js";

const rasterTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedRoles = new Set(["Lighting + mood", "Composition", "Materials", "Casting", "Style calibration", "Differentiate away"]);
const allowedInfluence = new Set(["Lead", "Strong", "Supporting", "Light"]);

function safeId(value, label) {
  const id = String(value || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{7,100}$/.test(id)) {
    const error = new Error(`${label} is invalid.`);
    error.status = 400;
    throw error;
  }
  return id;
}

function approvedContext(stored) {
  const approvedBrain = selectApprovedBaseline(stored);
  if (!approvedBrain) {
    const error = new Error("Approve a Brand Brain before generating production work.");
    error.status = 409;
    throw error;
  }
  return {
    approvedBrain,
    brainVersion: stored?.brain?.approvedVersion || stored?.brain?.artifactVersion || stored?.baselineVersion || 1,
  };
}

function resolveReferences(stored, requested = []) {
  if (!Array.isArray(requested) || requested.length > 8) {
    const error = new Error("Choose no more than eight creative source images.");
    error.status = 400;
    throw error;
  }
  const sourceById = new Map((stored?.sources || []).map((source) => [source.id, source]));
  return requested.map((selection) => {
    const source = sourceById.get(selection.id);
    if (!source || source.authority === "exact-asset" || source.authority === "approved-guidance") {
      const error = new Error("One selected creative source is not available for this production job.");
      error.status = 400;
      throw error;
    }
    const file = (source.files || []).find((candidate) => rasterTypes.has(String(candidate.type || "").toLowerCase()) && candidate.blobPathname);
    if (!file) {
      const error = new Error(`${source.name || "A selected source"} does not contain a usable PNG, JPG, or WEBP image.`);
      error.status = 400;
      throw error;
    }
    return {
      source,
      file,
      role: allowedRoles.has(selection.role) ? selection.role : "Style calibration",
      influence: allowedInfluence.has(selection.influence) ? selection.influence : "Supporting",
      usageInstruction: String(selection.usageInstruction || source.usage || "").slice(0, 1000),
    };
  });
}

/**
 * Resolve a locked asset from stored sources. The user selects which
 * exact-asset source to lock for this job by ID. The source must have
 * authority "exact-asset" and contain a raster file stored in Blob.
 *
 * Returns null when no locked asset is requested (world-only image).
 */
function resolveLockedAsset(stored, lockedAssetId) {
  if (!lockedAssetId) return null;
  const sourceById = new Map((stored?.sources || []).map((source) => [source.id, source]));
  const source = sourceById.get(lockedAssetId);
  if (!source) {
    const error = new Error("The selected protected asset was not found.");
    error.status = 400;
    throw error;
  }
  if (source.authority !== "exact-asset") {
    const error = new Error("Only a protected brand asset can be locked for production.");
    error.status = 400;
    throw error;
  }
  const file = (source.files || []).find((candidate) => rasterTypes.has(String(candidate.type || "").toLowerCase()) && candidate.blobPathname);
  if (!file) {
    const error = new Error(`${source.name || "The selected asset"} does not contain a usable PNG, JPG, or WEBP image. Upload a raster version of the asset.`);
    error.status = 400;
    throw error;
  }
  return {
    source,
    file,
    name: source.name || "Protected asset",
    assetType: source.declaredType || source.detail || "packaging",
    fileName: file.name,
  };
}

/**
 * Resolve a template asset for composition. Templates are exact-asset sources
 * tagged with templateMeta. The generated element is placed onto it. Returns
 * null when no template is selected.
 */
function resolveTemplateAsset(stored, templateAssetId) {
  if (!templateAssetId) return null;
  const sourceById = new Map((stored?.sources || []).map((source) => [source.id, source]));
  const source = sourceById.get(templateAssetId);
  if (!source) {
    const error = new Error("The selected template was not found.");
    error.status = 400;
    throw error;
  }
  if (!source.templateMeta?.isTemplate) {
    const error = new Error("The selected source is not a template.");
    error.status = 400;
    throw error;
  }
  const file = (source.files || []).find((candidate) => rasterTypes.has(String(candidate.type || "").toLowerCase()) && candidate.blobPathname);
  if (!file) {
    const error = new Error(`${source.name || "The selected template"} does not contain a usable image.`);
    error.status = 400;
    throw error;
  }
  return {
    source,
    file,
    name: source.name || "Background template",
    ratio: source.templateMeta.ratio || "",
    fileName: file.name,
  };
}

/**
 * Resolve a product record by id from the product store. Returns null when
 * no product is requested. The product record's claims, features, exclusions,
 * and visual direction feed into the compiled prompt (ADR 0012 step 4).
 */
async function resolveProduct(productStore, productId) {
  if (!productId) return null;
  const record = await productStore.readProduct(productId);
  if (!record) {
    const error = new Error(`The selected product "${productId}" was not found. Synthesize the product record first.`);
    error.status = 400;
    throw error;
  }
  // Only approved product records may be consumed by production. A candidate
  // is a synthesized record waiting for human review. This matches the
  // approval discipline the brain already uses.
  if (!record.approved_at) {
    const error = new Error(`The product record "${record.product_name}" is a candidate and has not been approved. Review and approve it before producing work from it.`);
    error.status = 409;
    throw error;
  }
  return record;
}

export async function prepareProductionPackage(body, options) {
  const stored = await options.brainStore.read();
  const { approvedBrain, brainVersion } = approvedContext(stored);
  const references = resolveReferences(stored, body.references || []);
  let lockedAsset = resolveLockedAsset(stored, body.lockedAssetId);
  const templateAsset = resolveTemplateAsset(stored, body.templateAssetId);
  // Resolve the product record when the request names one (ADR 0012 step 4).
  // The product store is passed in by the endpoint or constructed here from
  // the client id when available.
  const productStore = options.productStore || null;
  const product = productStore ? await resolveProduct(productStore, body.productId || null) : null;

  // Product imagery. An isolated image is the product itself and becomes the
  // protected subject when the job has not already locked something else. An
  // in-context image shows the product in use and joins the creative
  // references, where it informs the scene without being reproduced.
  const productImages = Array.isArray(product?.images) ? product.images : [];
  if (!lockedAsset) {
    const isolated = productImages.find((image) => image.kind === "isolated" && image.blob_pathname);
    if (isolated) {
      lockedAsset = {
        source: { id: `product:${product.product_id}`, name: `${product.product_name} product image` },
        file: {
          name: isolated.file_name,
          type: isolated.content_type,
          blobPathname: isolated.blob_pathname,
        },
        name: `${product.product_name} product image`,
        assetType: "product",
        fileName: isolated.file_name,
      };
    }
  }
  for (const image of productImages) {
    if (image.kind !== "in_context" || !image.blob_pathname) continue;
    if (references.length >= 8) break;
    references.push({
      source: { id: `product:${product.product_id}:${image.image_id}`, name: `${product.product_name} in use` },
      file: { name: image.file_name, type: image.content_type, blobPathname: image.blob_pathname },
      role: "Style calibration",
      influence: "Supporting",
      usageInstruction: image.caption
        ? `Shows how ${product.product_name} appears in real use: ${image.caption}. Match the placement, scale, and handling, not the specific scene.`
        : `Shows how ${product.product_name} appears in real use. Match the placement, scale, and handling, not the specific scene.`,
    });
  }

  // Copy outputs (ADR 0014 step 2). The claims set is assembled once and
  // reused: it steers generation and it is recorded in the package as the
  // governing set. A job that declares no copy output does no claims work and
  // compiles exactly as it did before this existed.
  const copyOutputs = resolveCopyOutputs(body.copyOutputs);
  let claimsSet = null;
  if (copyOutputs.length > 0 && options.claimsStore) {
    const claimsDocument = await options.claimsStore.read();
    claimsSet = assembleClaimsSet({
      claimsDocument,
      product,
      activeEntries: options.claimsStore.activeEntries,
      jobScope: buildJobScope({
        placement: body.brief?.placement,
        productId: body.productId,
        campaignId: body.campaign?.id,
        segment: body.segment,
      }),
    });
  }

  const generationPackage = compileBrandWorldImagePackage({
    approvedBrain,
    brainVersion,
    brief: body.brief,
    references,
    lockedAsset,
    templateAsset,
    campaign: body.campaign || null,
    product,
    copyOutputs,
    claimsSet,
  });
  return { generationPackage, references, lockedAsset, templateAsset, stored, approvedBrain, product, claimsSet };
}

// A copy output is declared by id. Unknown ids are dropped rather than
// failing the job: an image that generated is worth more than a hard stop on
// a catalog entry the client no longer has.
function resolveCopyOutputs(requested) {
  if (!Array.isArray(requested)) return [];
  return requested
    .map((entry) => (typeof entry === "string" ? entry : entry?.copyTypeId))
    .filter((id) => typeof id === "string" && id.length > 0)
    .slice(0, 4);
}

function publicJob(job, imageUrl) {
  if (!job) return null;
  return {
    ...job,
    imageUrl: job.imagePublicUrl || imageUrl || undefined,
    imagePathname: undefined,
    imagePublicUrl: undefined,
    errorDetail: undefined,
  };
}

export async function readProductionJob(options) {
  const job = await options.productionStore.read();
  const imageUrl = job?.status === "complete" && job.imagePathname && options.productionStore.imageUrl
    ? await options.productionStore.imageUrl(job.imagePathname)
    : null;
  return publicJob(job, imageUrl);
}

export async function generateProductionImage(body, options) {
  const jobId = safeId(body.jobId, "The production job ID");
  const current = await options.productionStore.read();
  if (current?.jobId === jobId && current.status === "complete") return readProductionJob(options);

  const { generationPackage, references, lockedAsset, templateAsset, approvedBrain, product, claimsSet } = await prepareProductionPackage(body, options);

  // The template (when present) is the first reference image: the base layer
  // the element is composed onto. The locked asset follows as the identity
  // source, then creative references.
  const allReferenceEntries = [];
  if (templateAsset) {
    allReferenceEntries.push({ file: templateAsset.file, name: templateAsset.fileName, isTemplate: true });
  }
  if (lockedAsset) {
    allReferenceEntries.push({ file: lockedAsset.file, name: lockedAsset.fileName, isLockedAsset: true });
  }
  for (const ref of references) {
    allReferenceEntries.push({ file: ref.file, name: ref.file.name, isLockedAsset: false });
  }

  const working = {
    jobId,
    status: "working",
    createdAt: new Date().toISOString(),
    model: OPENAI_IMAGE_MODEL,
    endpoint: chooseOpenAIImageEndpoint(allReferenceEntries),
    generationPackage,
  };
  await options.productionStore.write(working);

  try {
    const referenceImages = await Promise.all(
      allReferenceEntries.map(async (entry) => {
        const storedFile = await options.brainStore.readSourceFile(entry.file.blobPathname);
        return {
          name: entry.name,
          type: storedFile.mimeType || entry.file.type,
          bytes: storedFile.bytes,
        };
      }),
    );
    const result = await (options.render || renderWithOpenAIImages)({
      apiKey: options.env.OPENAI_API_KEY,
      prompt: generationPackage.prompt,
      referenceImages,
      model: OPENAI_IMAGE_MODEL,
      size: generationPackage.output.size,
      quality: "medium",
      outputFormat: "png",
      fetchImpl: options.fetchImpl || fetch,
    });
    const image = result?.data?.[0];
    if (!image?.b64_json) throw new Error("OpenAI returned no image data.");
    const bytes = Buffer.from(image.b64_json, "base64");
    const savedImage = await options.productionStore.writeImage(jobId, bytes, "image/png");

    // Governed copy (ADR 0014 step 2). The copy runs after the image so a
    // copy failure never costs a render that already succeeded. Each block
    // carries its own audit; a block that could not be produced is recorded
    // as a failure rather than silently omitted, because a missing caption
    // and a caption nobody checked look identical otherwise.
    if (generationPackage.copy) {
      const produced = [];
      for (const declared of generationPackage.copy.declared) {
        try {
          produced.push(await produceCopy({
            copyTypeId: declared.copyTypeId,
            brain: approvedBrain,
            product,
            claimsSet: claimsSet || { approved: [], prohibited: [], disclosures: [] },
            context: {
              placement: generationPackage.output?.placement || "",
              copyDirection: body.copyDirection || "",
              scene: generationPackage.brief?.scene || "",
              exclusions: generationPackage.brief?.exclusions || "",
            },
            apiKey: options.env.OPENAI_API_KEY,
          }));
        } catch (error) {
          produced.push({
            copyTypeId: declared.copyTypeId,
            text: "",
            failed: true,
            error: error.message || "The copy could not be written.",
            audit: {
              status: "errored",
              message: "The copy was not produced, so nothing was checked against your claims.",
              findings: [],
              totals: null,
            },
          });
        }
      }
      generationPackage.copy.produced = produced;
    }
    // Persist the compiled package alongside the image so this output stays
    // reviewable after the current-job slot is reused. A failure here should not
    // lose an image that was generated successfully.
    if (options.productionStore.writeOutputPackage) {
      try {
        await options.productionStore.writeOutputPackage(jobId, {
          generationPackage,
          model: OPENAI_IMAGE_MODEL,
          endpoint: working.endpoint,
          savedAt: new Date().toISOString(),
        });
      } catch {
        // The output is still usable in-session; only later review is affected.
      }
    }
    const complete = {
      ...working,
      status: "complete",
      completedAt: new Date().toISOString(),
      imagePathname: savedImage.pathname,
      imageContentType: savedImage.contentType,
      imagePublicUrl: null,
      usage: result.usage || null,
    };
    await options.productionStore.write(complete);
    return readProductionJob(options);
  } catch (error) {
    await options.productionStore.write({
      ...working,
      status: "error",
      failedAt: new Date().toISOString(),
      error: error.message || "The image could not be generated.",
    });
    throw error;
  }
}


