import { selectApprovedBaseline } from "../brand-brain/service.js";
import { OPENAI_IMAGE_MODEL, chooseOpenAIImageEndpoint, renderWithOpenAIImages } from "../renderers/openai-images.js";
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

export async function prepareProductionPackage(body, options) {
  const stored = await options.brainStore.read();
  const { approvedBrain, brainVersion } = approvedContext(stored);
  const references = resolveReferences(stored, body.references || []);
  const generationPackage = compileBrandWorldImagePackage({ approvedBrain, brainVersion, brief: body.brief, references });
  return { generationPackage, references, stored };
}

function publicJob(job, imageUrl) {
  if (!job) return null;
  return {
    ...job,
    imageUrl: imageUrl || undefined,
    imagePathname: undefined,
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

  const { generationPackage, references } = await prepareProductionPackage(body, options);
  const working = {
    jobId,
    status: "working",
    createdAt: new Date().toISOString(),
    model: OPENAI_IMAGE_MODEL,
    endpoint: chooseOpenAIImageEndpoint(references),
    generationPackage,
  };
  await options.productionStore.write(working);

  try {
    const referenceImages = await Promise.all(
      references.map(async (reference) => {
        const storedFile = await options.brainStore.readSourceFile(reference.file.blobPathname);
        return {
          name: reference.file.name,
          type: storedFile.mimeType || reference.file.type,
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
    const complete = {
      ...working,
      status: "complete",
      completedAt: new Date().toISOString(),
      imagePathname: savedImage.pathname,
      imageContentType: savedImage.contentType,
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

