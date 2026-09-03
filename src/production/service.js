import { selectApprovedBaseline } from "../brand-brain/service.js";
import { createVercelBlobProductStore } from "../products/store.js";
import { OPENAI_IMAGE_MODEL, chooseOpenAIImageEndpoint, renderWithOpenAIImages } from "../renderers/openai-images.js";
import { SEEDREAM_EDIT_ENDPOINT, SEEDREAM_IMAGE_MODEL, chooseSeedreamImageEndpoint, renderWithSeedreamImages } from "../renderers/seedream-images.js";
import { assembleClaimsSet } from "../claims/assembly.js";
import { produceCopy } from "../copy/generate.js";
import { displayBudgets, designFor } from "../copy/display-budget.js";
import { buildJobScope } from "../scope/resolver.js";
import { compileBrandWorldImagePackage } from "./package.js";

// Render engines. The compiled prompt is identical for every entry here: this
// table decides which model receives it, never what it says. An unrecognised
// engine value falls back to the default rather than failing the render,
// because a stale client sending an engine name this build does not know
// should still get an image.
export const DEFAULT_RENDER_ENGINE = "openai";
const renderEngines = {
  openai: {
    label: "OpenAI",
    model: OPENAI_IMAGE_MODEL,
    chooseEndpoint: chooseOpenAIImageEndpoint,
    render: renderWithOpenAIImages,
    apiKey: (env) => env.OPENAI_API_KEY,
  },
  seedream: {
    label: "Seedream 5 Pro",
    model: SEEDREAM_IMAGE_MODEL,
    chooseEndpoint: chooseSeedreamImageEndpoint,
    render: renderWithSeedreamImages,
    apiKey: (env) => env.FAL_KEY,
  },
};

export function resolveRenderEngine(requested) {
  const name = String(requested || "").trim().toLowerCase();
  // Own entries only, for the same reason imageSizeForFormat checks its table:
  // a bare lookup would resolve inherited properties and hand a function back
  // as a render engine.
  if (Object.prototype.hasOwnProperty.call(renderEngines, name)) {
    return { name, ...renderEngines[name] };
  }
  return { name: DEFAULT_RENDER_ENGINE, ...renderEngines[DEFAULT_RENDER_ENGINE] };
}

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

// The call-two instruction for the two-call Seedream path. It is fixed text
// rather than compiled text, because by the time it runs the scene already
// exists and the only work left is putting the real product into it. The
// instruction is one sentence: the giant-can render on 2026-09-02 showed the
// stacked clauses working against each other, and the owner ruled for minimal
// instructions. The noun is hardcoded to "can" because cans are the current
// test subject. The productName argument is ignored and stays in the signature
// so callers do not change; a product-record field replaces the hardcode when
// this proves out. See docs/findings-2026-09-02-scene-placeholder-and-recovery.md.
export function productPlacementInstruction(productName) {
  return `Replace the can with the supplied can image.`;
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
  // ADR 0017 step 4. Read once, per client, and hand the compiler the accepted
  // entries only. Proposed entries have not been ruled and declined ones were
  // ruled against, so neither reaches a prompt. A client with no protections
  // store injected, or none accepted, compiles from livedWorld.rejects exactly
  // as before.
  let refusals = null;
  if (options.refusalsStore) {
    const refusalsDocument = await options.refusalsStore.read();
    const active = options.refusalsStore.activeEntries(refusalsDocument);
    if (active.length) refusals = active;
  }

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

  // Text in the image inverts the normal order. Copy is produced after the
  // render everywhere else, deliberately, so a copy failure never costs an
  // image that already succeeded. A string that has to be rendered has to
  // exist first, so it is produced here, before the compile.
  //
  // The failure is handled rather than propagated: if the copy cannot be
  // written, the job renders without it and says so. A blocked image is a
  // worse outcome than an image missing its headline, and the user can add
  // the copy in a layout tool either way.
  let displayCopy = null;
  let displayCopyBlock = null;
  let displayCopyError = null;
  if (body.renderCopyIntoImage && copyOutputs.includes("headline_set") && options.env?.OPENAI_API_KEY) {
    const zoneId = body.displayZone || "lower_third";
    const format = body.brief?.format || "";
    try {
      // Copy drafted and possibly edited in setup arrives with the job. It is
      // used as sent rather than regenerated, or the image would carry
      // different words than the ones the user approved on screen.
      //
      // Its audit travels with it and was produced by the audit_copy action
      // after the last edit. The interface blocks generation while an edit is
      // unchecked, so a block arriving here has been audited in its current
      // wording, not in some earlier wording.
      if (body.draftedCopy?.fields?.length) {
        displayCopyBlock = {
          copyTypeId: "headline_set",
          label: "Headline set",
          text: body.draftedCopy.fields.map((field) => field.text).filter(Boolean).join("\n"),
          fields: body.draftedCopy.fields,
          model: body.draftedCopy.model || null,
          edited: !!body.draftedCopy.edited,
          generatedAt: body.draftedCopy.generatedAt || new Date().toISOString(),
          audit: body.draftedCopy.audit || {
            status: "errored",
            message: "This copy arrived without a claim check, so it has not been checked against your claims.",
            findings: [],
            totals: null,
          },
        };
      } else {
        displayCopyBlock = await produceCopy({
          copyTypeId: "headline_set",
          brain: approvedBrain,
          product,
          claimsSet: claimsSet || { approved: [], prohibited: [], disclosures: [] },
          context: {
            placement: body.brief?.placement || "",
            copyDirection: body.copyDirection || "",
            scene: body.brief?.scene || "",
            exclusions: body.brief?.exclusions || "",
            displayBudgets: displayBudgets({ format, zoneId, fieldIds: body.displayFields || ["headline"] }),
          },
          apiKey: options.env.OPENAI_API_KEY,
        });
      }
      const wanted = new Set(body.displayFields || ["headline"]);
      displayCopy = {
        zoneId,
        format,
        lines: (displayCopyBlock.fields || [])
          .filter((field) => wanted.has(field.id) && field.text)
          .map((field) => {
            // The design ratios travel with the line so the prompt can state
            // the hierarchy proportionally rather than in absolute sizes.
            const design = designFor(field.id);
            return { id: field.id, label: field.label, text: field.text, ...design };
          }),
      };
      if (!displayCopy.lines.length) displayCopy = null;
    } catch (error) {
      displayCopyError = error.message || "The display copy could not be written.";
    }
  }

  const compileInputs = {
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
    displayCopy,
    refusals,
    // ADR 0018 phase 1 look test. Carried on the brief so it travels with the
    // job through both preflight and generate without a new request field, and
    // so a package records which look produced it.
    look: body.brief?.look || null,
  };
  const generationPackage = compileBrandWorldImagePackage(compileInputs);

  // Two-call rendering on Seedream when a locked asset is present. One edit
  // call carrying the product as a reference renders the product too large:
  // the reference fills its own frame and that framing carries into the
  // generated scene. Hand runs on 2026-09-01 and 2026-09-02 gave correct scale
  // on a reference-free render and correct label fidelity on a separate edit
  // that placed the real product into it, so the render splits in two.
  //
  // The scene prompt is the compiled prompt with the locked asset withheld and
  // the scene-pass mode set, which is the shape this compiler already produces
  // for a job that locks nothing apart from one section body. The same compiler
  // runs twice, so there is no second prompt to keep in step with the first.
  // The locked asset stays on the package and on the record, because the job
  // did lock one.
  //
  // scenePass replaces the Product knowledge body with a plain-product
  // placeholder. The scene call's product is replaced by the placement call, so
  // label artwork and visual direction were never needed there, and carrying
  // them made the model draw the product large enough for the label statements
  // to read. See docs/findings-2026-09-02-scene-placeholder-and-recovery.md.
  const plannedEngine = resolveRenderEngine(body.engine);
  if (plannedEngine.name === "seedream" && lockedAsset) {
    const scenePackage = compileBrandWorldImagePackage({ ...compileInputs, lockedAsset: null, scenePass: true });
    generationPackage.twoCall = {
      engine: plannedEngine.name,
      model: plannedEngine.model,
      scenePrompt: scenePackage.prompt,
      sceneEndpoint: plannedEngine.chooseEndpoint([...(templateAsset ? [templateAsset] : []), ...references]),
      placementInstruction: productPlacementInstruction(product?.product_name),
      placementEndpoint: SEEDREAM_EDIT_ENDPOINT,
      sceneImageId: null,
      scenePathname: null,
    };
  }
  if (generationPackage.copy) {
    generationPackage.copy.displayCopyError = displayCopyError;
    // The block was produced before the render, so it is already done. It is
    // carried forward rather than regenerated, or the image would carry one
    // headline and the package would record a different one.
    if (displayCopyBlock) generationPackage.copy.preproduced = [displayCopyBlock];
  }
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

// A render outruns the platform's gateway timeout, and the gateway retries the
// invocation. On 2026-08-11 that produced two renders of one job sixty seconds
// apart, both writing to the same blob path, so the second silently replaced
// an image the user had already approved.
//
// Two windows govern the response. A duplicate that arrives while the original
// is still rendering waits for it and returns its result, so a retry becomes a
// reader rather than a second renderer. A record still marked working long
// after any render could plausibly still be running is treated as abandoned,
// so a crashed job does not lock its own id forever.
const IN_FLIGHT_POLL_INTERVAL_MS = 2000;
const IN_FLIGHT_WAIT_LIMIT_MS = 200000;
const ABANDONED_AFTER_MS = 300000;

function startedMillisecondsAgo(record) {
  const started = Date.parse(record?.createdAt || "");
  if (Number.isNaN(started)) return Infinity;
  return Date.now() - started;
}

export async function generateProductionImage(body, options) {
  const jobId = safeId(body.jobId, "The production job ID");
  const current = await options.productionStore.read();
  if (current?.jobId === jobId && current.status === "complete") return readProductionJob(options);

  // A duplicate invocation of a job that is still rendering waits for the
  // original rather than starting a second render.
  if (current?.jobId === jobId && current.status === "working" && startedMillisecondsAgo(current) < ABANDONED_AFTER_MS) {
    const deadline = Date.now() + IN_FLIGHT_WAIT_LIMIT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, IN_FLIGHT_POLL_INTERVAL_MS));
      const latest = await options.productionStore.read();
      if (latest?.jobId !== jobId) break;
      if (latest.status === "complete" || latest.status === "error") return readProductionJob(options);
    }
    // Still running at the limit. Report the job as working rather than
    // starting a competing render; the client recovers it from the current
    // job endpoint.
    return readProductionJob(options);
  }

  // Identifies this invocation. If a competing attempt takes ownership of the
  // record while this one is rendering, this attempt discards its result
  // rather than overwriting the blob the other attempt wrote.
  const attemptId = `${jobId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

  const engine = resolveRenderEngine(body.engine);

  const working = {
    jobId,
    attemptId,
    status: "working",
    createdAt: new Date().toISOString(),
    engine: engine.name,
    engineLabel: engine.label,
    model: engine.model,
    endpoint: engine.chooseEndpoint(allReferenceEntries),
    generationPackage,
  };
  await options.productionStore.write(working);

  // Set during package preparation, and only for Seedream with a locked asset.
  // Every other job reads null here and renders in one call exactly as before.
  const twoCall = generationPackage.twoCall || null;

  try {
    const loadReferenceImages = (entries) => Promise.all(
      entries.map(async (entry) => {
        const storedFile = await options.brainStore.readSourceFile(entry.file.blobPathname);
        return {
          name: entry.name,
          type: storedFile.mimeType || entry.file.type,
          bytes: storedFile.bytes,
        };
      }),
    );
    const render = options.render || engine.render;
    const renderOptions = {
      apiKey: engine.apiKey(options.env),
      model: engine.model,
      size: generationPackage.output.size,
      quality: "medium",
      outputFormat: "png",
      fetchImpl: options.fetchImpl || fetch,
    };

    let result;
    let sceneBytes = null;
    if (twoCall) {
      // Call one builds the room. The locked asset is held back so its own
      // framing cannot set the scale of the scene. A template and creative
      // references still travel here, since they exist to steer the scene.
      const sceneEntries = allReferenceEntries.filter((entry) => !entry.isLockedAsset);
      const sceneResult = await render({
        ...renderOptions,
        prompt: twoCall.scenePrompt,
        referenceImages: await loadReferenceImages(sceneEntries),
      });
      const sceneImage = sceneResult?.data?.[0];
      if (!sceneImage?.b64_json) throw new Error(`${engine.label} returned no image data for the scene.`);
      sceneBytes = Buffer.from(sceneImage.b64_json, "base64");

      // Call two puts the real product into that room. Order matters: the
      // scene arrives first as the image being edited, and the locked asset
      // second as the supplied product image the instruction names.
      const lockedEntries = allReferenceEntries.filter((entry) => entry.isLockedAsset);
      result = await render({
        ...renderOptions,
        prompt: twoCall.placementInstruction,
        referenceImages: [
          { name: "scene.png", type: "image/png", bytes: sceneBytes },
          ...(await loadReferenceImages(lockedEntries)),
        ],
      });
    } else {
      result = await render({
        ...renderOptions,
        prompt: generationPackage.prompt,
        referenceImages: await loadReferenceImages(allReferenceEntries),
      });
    }
    const image = result?.data?.[0];
    if (!image?.b64_json) throw new Error(`${engine.label} returned no image data.`);
    const bytes = Buffer.from(image.b64_json, "base64");

    // Last check before anything durable is written. If another attempt has
    // taken over this job, its image is the one the user will see, and
    // writing here would replace it. Abandon instead.
    const ownerBeforeWrite = await options.productionStore.read();
    if (ownerBeforeWrite?.jobId === jobId && ownerBeforeWrite.attemptId && ownerBeforeWrite.attemptId !== attemptId) {
      return readProductionJob(options);
    }

    const savedImage = await options.productionStore.writeImage(jobId, bytes, "image/png");

    // The scene render is written through the same storage path as any
    // finished render, under its own job id, so the owner can see what the
    // placement call changed. A failure here is swallowed on purpose: the
    // deliverable already exists and losing the intermediate does not cost it.
    if (sceneBytes && twoCall) {
      try {
        const sceneImageId = `${jobId}-scene`;
        const savedScene = await options.productionStore.writeImage(sceneImageId, sceneBytes, "image/png");
        twoCall.sceneImageId = sceneImageId;
        twoCall.scenePathname = savedScene.pathname;
      } catch {
        // Only the record of the intermediate is affected.
      }
    }

    // Governed copy (ADR 0014 step 2). The copy runs after the image so a
    // copy failure never costs a render that already succeeded. Each block
    // carries its own audit; a block that could not be produced is recorded
    // as a failure rather than silently omitted, because a missing caption
    // and a caption nobody checked look identical otherwise.
    if (generationPackage.copy) {
      const produced = [];
      const preproduced = new Map((generationPackage.copy.preproduced || []).map((block) => [block.copyTypeId, block]));
      for (const declared of generationPackage.copy.declared) {
        if (preproduced.has(declared.copyTypeId)) {
          produced.push(preproduced.get(declared.copyTypeId));
          continue;
        }
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
      delete generationPackage.copy.preproduced;
    }
    // Persist the compiled package alongside the image so this output stays
    // reviewable after the current-job slot is reused. A failure here should not
    // lose an image that was generated successfully.
    if (options.productionStore.writeOutputPackage) {
      try {
        await options.productionStore.writeOutputPackage(jobId, {
          generationPackage,
          engine: engine.name,
          engineLabel: engine.label,
          model: engine.model,
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
    // Only the attempt that owns the record may mark it failed. Without this,
    // a retried invocation that errors would overwrite the completed record
    // written by the attempt that succeeded, and a finished image would be
    // reported as a failure.
    const ownerOnFailure = await options.productionStore.read();
    const ownsRecord = !ownerOnFailure?.attemptId || ownerOnFailure.attemptId === attemptId;
    if (ownsRecord) {
      await options.productionStore.write({
        ...working,
        status: "error",
        failedAt: new Date().toISOString(),
        error: error.message || "The image could not be generated.",
      });
    }
    throw error;
  }
}


