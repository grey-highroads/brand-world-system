import { synthesizePassWithChatCompletions } from "./chat-completions-provider.js";
import { PASS_IDS, PASS_LABELS } from "./schema.js";
import { normalizeSourcesForSynthesis } from "./source-normalizer.js";
import { enrichUrlSources } from "./source-reader.js";

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

export async function saveBrandBrainSnapshot(snapshot, store) {
  const saved = { ...snapshot, savedAt: new Date().toISOString() };
  await store.write(saved);
  return saved;
}

// ---------------------------------------------------------------------------
// Four-pass synthesis (2026-09-07)
//
// One call produced the whole brain until today, and after the Lived World
// widened to several people and the Story Architecture to six to twelve
// moments, that call ran past the route's 300 second limit. The timeout forced
// the split; the reason for it is better than the timeout. In one call every
// artifact was invented in parallel with the others, so the moments could not
// be written about people who already existed and the grammar could not
// describe the rooms the moments already took place in.
//
// The client drives four requests, one per pass, so each pass gets its own
// clock. Four calls inside one request would share one clock and fail the same
// way, only later. Nothing reaches the saved brain until pass 4 finishes.
// See docs/findings-2026-09-07-four-pass-synthesis.md.
// ---------------------------------------------------------------------------

const FIRST_PASS = PASS_IDS[0];
const FINAL_PASS = PASS_IDS[PASS_IDS.length - 1];

function passError(passId, message, status = 400) {
  const error = new Error(`Pass ${passId}, ${PASS_LABELS[passId]}: ${message}`);
  error.status = status;
  error.pass = passId;
  return error;
}

// The slice of an approved baseline a pass is responsible for. A baseline that
// predates an artifact yields null for that pass, which runs it as a first
// synthesis of that slice, because there is genuinely nothing to update.
function baselineForPass(passId, baseline) {
  if (!baseline) return null;
  const artifacts = baseline.artifacts || {};
  if (passId === 1) {
    return {
      brandName: baseline.brandName,
      brandDescription: baseline.brandDescription,
      synthesisSummary: baseline.synthesisSummary,
      cleanAssetCount: baseline.cleanAssetCount,
      guidanceSections: baseline.guidanceSections,
      reviewQuestions: baseline.reviewQuestions,
      dossier: artifacts.dossier,
    };
  }
  const key = { 2: "livedWorld", 3: "storyArchitecture", 4: "visualGrammar" }[passId];
  return artifacts[key] ? { [key]: artifacts[key] } : null;
}

// Image bytes are not carried between passes. A source file that reached the
// server through Blob is re-read from Blob for the pass that needs it, and only
// a file that arrived inline with no Blob path keeps its data in the
// in-progress record. That path is the local-development fallback in
// app/app.js#storeBrandWorldSourceFile, so in the hosted product this record
// holds text and metadata rather than megabytes of base64.
function strippedForStorage(normalizedSources) {
  return normalizedSources.map((source) => ({
    ...source,
    files: (source.files || []).map((file) => (file.blobPathname ? { ...file, data: undefined } : file)),
  }));
}

async function rehydrateSources(storedSources, store) {
  return Promise.all((storedSources || []).map(async (source) => ({
    ...source,
    files: await Promise.all((source.files || []).map(async (file) => {
      if (file.data) return file;
      if (!file.blobPathname || typeof store.readSourceFile !== "function") return file;
      const stored = await store.readSourceFile(file.blobPathname);
      const mimeType = stored.mimeType || file.type || "application/octet-stream";
      return { ...file, data: `data:${mimeType};base64,${stored.bytes.toString("base64")}` };
    })),
  })));
}

// Usage is summed across passes so the saved record reports what the synthesis
// cost rather than what its last call cost. Only numeric fields are added, so a
// provider that adds a nested breakdown later does not turn into NaN here.
function sumUsage(entries) {
  const totals = {};
  let seen = false;
  for (const usage of entries) {
    if (!usage || typeof usage !== "object") continue;
    seen = true;
    for (const [key, value] of Object.entries(usage)) {
      if (typeof value !== "number") continue;
      totals[key] = (totals[key] || 0) + value;
    }
  }
  return seen ? totals : null;
}

// The assembled brain has exactly the shape one call used to return. Nothing
// downstream of the store can tell it was built in four passes.
export function assembleBrainFromPasses(passResults) {
  const one = passResults[1] || {};
  const reviewQuestions = [];
  const seenQuestionIds = new Set();
  for (const passId of PASS_IDS) {
    for (const question of passResults[passId]?.reviewQuestions || []) {
      if (question?.id && seenQuestionIds.has(question.id)) continue;
      if (question?.id) seenQuestionIds.add(question.id);
      reviewQuestions.push(question);
    }
  }
  return {
    brandName: one.brandName,
    brandDescription: one.brandDescription,
    synthesisSummary: one.synthesisSummary,
    cleanAssetCount: one.cleanAssetCount,
    guidanceSections: one.guidanceSections,
    reviewQuestions,
    artifacts: {
      dossier: one.dossier,
      livedWorld: passResults[2]?.livedWorld,
      storyArchitecture: passResults[3]?.storyArchitecture,
      visualGrammar: passResults[4]?.visualGrammar,
    },
  };
}

function validateSynthesisBody(body) {
  if (!Array.isArray(body.sources) || body.sources.length === 0) {
    const error = new Error("Add at least one source before building the Brand Brain.");
    error.status = 400;
    throw error;
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
}

export async function synthesizeBrandBrain(body, options) {
  const passId = body.pass === undefined || body.pass === null ? FIRST_PASS : Number(body.pass);
  if (!PASS_IDS.includes(passId)) {
    const error = new Error(`There is no synthesis pass ${body.pass}.`);
    error.status = 400;
    throw error;
  }
  const store = options.store;
  try {
    return passId === FIRST_PASS
      ? await runFirstPass(body, options)
      : await runLaterPass(passId, body, options);
  } catch (error) {
    // A failed pass ends the synthesis. Nothing was written to the saved brain,
    // and the half-built work goes with it, so the next attempt starts at pass
    // one against a clean slate rather than resuming something broken.
    if (typeof store?.clearInProgress === "function") {
      try {
        await store.clearInProgress();
      } catch {
        // The synthesis already failed. Reporting a second failure about the
        // cleanup would replace the message that says what actually went wrong.
      }
    }
    if (!error.pass) error.pass = passId;
    throw error;
  }
}

async function runFirstPass(body, options) {
  const store = options.store;
  const fetchImpl = options.fetchImpl || fetch;
  const synthesize = options.synthesize || synthesizePassWithChatCompletions;
  validateSynthesisBody(body);

  const incremental = body.mode === "incremental";
  // A dry run computes the candidate and returns it without touching stored
  // state. It exists so a synthesis can be evaluated without persisting one,
  // which no other path allows.
  const dryRun = body.dryRun === true;
  const stored = incremental ? await store.read() : null;
  const baseline = incremental ? selectApprovedBaseline(stored) : null;
  if (incremental && !baseline) {
    const error = new Error("The approved Brand Brain baseline could not be found. Reopen the approved version before preparing this update.");
    error.status = 409;
    throw error;
  }

  const incomingSources = await normalizeSourcesForSynthesis(await enrichUrlSources(body.sources, fetchImpl), {
    readStoredFile: store.readSourceFile?.bind(store),
  });
  const previousSources = incremental && Array.isArray(stored?.sources) ? stored.sources : [];
  const sources = incremental ? mergeIncrementalSources(previousSources, incomingSources) : incomingSources;

  const pass = await synthesize({
    apiKey: options.env.OPENAI_API_KEY,
    model: options.env.OPENAI_MODEL,
    passId: FIRST_PASS,
    sources: incomingSources,
    priorPasses: {},
    baseline: baselineForPass(FIRST_PASS, baseline),
    baselineVersion: body.baselineVersion,
    fetchImpl,
  });

  const inProgress = {
    kind: "synthesis-in-progress",
    synthesisRequestId: typeof body.requestId === "string" ? body.requestId.slice(0, 120) : null,
    mode: incremental ? "incremental" : "initial",
    dryRun,
    baselineVersion: body.baselineVersion || null,
    baseline,
    baselineStoredVersion: stored?.brain?.approvedVersion || stored?.brain?.artifactVersion || null,
    storedBrain: stored?.brain || null,
    sources: persistedSources(sources),
    synthesisSources: strippedForStorage(incomingSources),
    passResults: { 1: pass.result },
    passes: [{ pass: FIRST_PASS, responseId: pass.responseId, model: pass.model, usage: pass.usage || null }],
    nextPass: FIRST_PASS + 1,
    startedAt: new Date().toISOString(),
  };
  await store.writeInProgress(inProgress);
  return passProgress(inProgress);
}

async function runLaterPass(passId, body, options) {
  const store = options.store;
  const fetchImpl = options.fetchImpl || fetch;
  const synthesize = options.synthesize || synthesizePassWithChatCompletions;

  const inProgress = await store.readInProgress?.();
  if (!inProgress) {
    throw passError(passId, "the synthesis this pass belongs to is not in progress. Start again from the first pass.", 409);
  }
  const requestId = typeof body.requestId === "string" ? body.requestId.slice(0, 120) : null;
  if (requestId && inProgress.synthesisRequestId && requestId !== inProgress.synthesisRequestId) {
    throw passError(passId, "this pass belongs to a different synthesis than the one in progress. Start again from the first pass.", 409);
  }
  if (passId !== inProgress.nextPass) {
    throw passError(passId, `the synthesis is waiting for pass ${inProgress.nextPass}. Start again from the first pass.`, 409);
  }

  const sources = await rehydrateSources(inProgress.synthesisSources, store);
  const pass = await synthesize({
    apiKey: options.env.OPENAI_API_KEY,
    model: options.env.OPENAI_MODEL,
    passId,
    sources,
    priorPasses: inProgress.passResults,
    baseline: baselineForPass(passId, inProgress.baseline),
    baselineVersion: inProgress.baselineVersion,
    fetchImpl,
  });

  const passResults = { ...inProgress.passResults, [passId]: pass.result };
  const passes = [...inProgress.passes, { pass: passId, responseId: pass.responseId, model: pass.model, usage: pass.usage || null }];

  if (passId !== FINAL_PASS) {
    const next = { ...inProgress, passResults, passes, nextPass: passId + 1 };
    await store.writeInProgress(next);
    return passProgress(next);
  }

  const incremental = inProgress.mode === "incremental";
  const firstPassEntry = passes.find((entry) => entry.pass === FIRST_PASS) || passes[0];
  const saved = {
    kind: incremental ? "incremental-synthesis" : "synthesis",
    synthesisRequestId: inProgress.synthesisRequestId,
    sources: inProgress.sources,
    result: assembleBrainFromPasses(passResults),
    approvedResult: inProgress.baseline,
    baselineVersion: incremental ? inProgress.baselineVersion || inProgress.baselineStoredVersion || null : null,
    responseId: firstPassEntry?.responseId || null,
    model: firstPassEntry?.model || null,
    usage: sumUsage(passes.map((entry) => entry.usage)),
    // Per-pass provenance. The saved shape above is what it always was; this is
    // the one addition, and nothing reads it to decide anything.
    passes: passes.map((entry) => ({ pass: entry.pass, label: PASS_LABELS[entry.pass], responseId: entry.responseId, model: entry.model, usage: entry.usage })),
    brain: incremental
      ? {
          ...(inProgress.storedBrain || {}),
          stage: "review",
          processingComplete: true,
          revisionPending: true,
          candidateBaseVersion: inProgress.baselineVersion || inProgress.baselineStoredVersion || 0,
        }
      : undefined,
    savedAt: new Date().toISOString(),
  };

  if (inProgress.dryRun) {
    // Returns before any write, so nothing below runs: no backup is taken
    // because nothing is being replaced, and stored state is untouched. The
    // flag travels back on the payload so a captured result cannot be mistaken
    // for something the system stored. The in-progress record still goes, since
    // this synthesis is finished either way.
    await store.clearInProgress?.();
    return { ...saved, dryRun: true, pass: FINAL_PASS, complete: true };
  }

  // A non-incremental synthesis replaces the stored payload rather than adding
  // a candidate beside it: the write below carries approvedResult null and no
  // brain block, so the approved brain and its state are gone. The blob store
  // overwrites in place with no suffix, so the loss is permanent. Back the
  // existing payload up first, and refuse to proceed if the backup fails,
  // because destroying a brain to save a failed rebuild is the wrong trade.
  // This is a mitigation, not the fix. The fix is a rebuild that produces a
  // candidate for review instead of erasing first; see docs/deferred-work.md.
  //
  // The backup now happens after every model call rather than before the only
  // one, which is strictly safer: three of the four ways this synthesis can
  // fail no longer reach the replace at all.
  if (!incremental) {
    const existing = await store.read();
    if (existing && typeof store.writeBackup === "function") {
      try {
        await store.writeBackup(existing);
      } catch (backupError) {
        const error = new Error("The current Brand Brain could not be backed up, so it was not replaced. Nothing changed. Try again in a moment.");
        error.status = 503;
        error.cause = backupError;
        throw error;
      }
    }
  }

  await store.write(saved);
  await store.clearInProgress?.();
  return { ...saved, pass: FINAL_PASS, complete: true };
}

// What a pass that is not the last one returns. The client needs to know which
// pass to run next and that this one worked; it does not need the half-built
// brain, and sending it would put a partial artifact set in the browser where
// something could render it.
function passProgress(inProgress) {
  return {
    pass: inProgress.nextPass - 1,
    nextPass: inProgress.nextPass,
    complete: false,
    synthesisRequestId: inProgress.synthesisRequestId,
    passes: inProgress.passes.map((entry) => ({ pass: entry.pass, label: PASS_LABELS[entry.pass], responseId: entry.responseId, model: entry.model })),
  };
}
