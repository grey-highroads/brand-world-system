import { synthesizePassWithChatCompletions } from "./chat-completions-provider.js";
import { DEFAULT_REACH, PASS_IDS, PASS_LABELS, REACH_LEVELS, passStep, passWorld } from "./schema.js";
import { normalizeSourcesForSynthesis } from "./source-normalizer.js";
import { enrichUrlSources } from "./source-reader.js";
import { worldArtifacts } from "./world.js";

// Re-exported so callers that already import the service keep working.
export { worldArtifacts, selectWorldArtifacts } from "./world.js";

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
// Eight-pass synthesis (four passes 2026-09-07, eight under ADR 0019, 2026-09-09)
//
// Passes 1 to 4 write the brand today. Passes 5 to 8 write the brand evolved
// from all sources, with the finished today world supplied as data. The client
// drives eight requests; nothing reaches the saved brain until pass 8 finishes,
// and a failed evolved pass saves nothing, the today world included.
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
const FIRST_EVOLVED_PASS = PASS_IDS.find((id) => passWorld(id) === "evolved");

// An evolved-only rebuild (2026-09-09). The today world did not change, so the
// four today passes are not run again; their results are seeded from the
// stored brain and the four evolved passes run against them. Half the cost of
// a full rebuild, and the path every reach change or authoring change takes.
function todayPassResultsFrom(saved) {
  const root = saved?.approvedResult || saved?.result;
  if (!root) return null;
  const today = worldArtifacts(root, "today") || worldArtifacts(saved?.result, "today");
  if (!today?.livedWorld || !today?.storyArchitecture || !today?.visualGrammar) return null;
  return {
    1: {
      brandName: root.brandName,
      brandDescription: root.brandDescription,
      synthesisSummary: root.synthesisSummary,
      cleanAssetCount: root.cleanAssetCount,
      guidanceSections: root.guidanceSections,
      reviewQuestions: root.reviewQuestions || [],
      dossier: today.dossier,
    },
    2: { livedWorld: today.livedWorld },
    3: { storyArchitecture: today.storyArchitecture },
    4: { visualGrammar: today.visualGrammar },
  };
}

async function runEvolvedStart(body, options) {
  const store = options.store;
  const fetchImpl = options.fetchImpl || fetch;
  const synthesize = options.synthesize || synthesizePassWithChatCompletions;
  const stored = await store.read();
  const todayResults = todayPassResultsFrom(stored);
  if (!todayResults) {
    const error = new Error("There is no brand today to build the evolved world on. Build the Brand Brain first.");
    error.status = 409;
    throw error;
  }
  // New sources may ride the request, the way an update carries them. They
  // are normalized like any intake and merged over the stored set, so a
  // direction source added after approval reaches the evolved passes without
  // re-running the today passes.
  const incoming = Array.isArray(body.sources) && body.sources.length
    ? await normalizeSourcesForSynthesis(await enrichUrlSources(body.sources, fetchImpl), { readStoredFile: store.readSourceFile?.bind(store) })
    : [];
  const previous = await rehydrateSources(stored.sources, store);
  const sources = mergeIncrementalSources(previous, incoming);
  if (!sources.length) {
    const error = new Error("The stored brain has no sources to read. Build the Brand Brain first.");
    error.status = 409;
    throw error;
  }
  const reach = reachFor(body);
  const pass = await synthesize({
    apiKey: options.env.OPENAI_API_KEY,
    model: options.env.OPENAI_MODEL,
    passId: FIRST_EVOLVED_PASS,
    sources,
    priorPasses: todayResults,
    baseline: null,
    baselineVersion: null,
    reach,
    fetchImpl,
  });
  const inProgress = {
    kind: "synthesis-in-progress",
    synthesisRequestId: typeof body.requestId === "string" ? body.requestId.slice(0, 120) : null,
    mode: "evolved",
    dryRun: false,
    baselineVersion: null,
    baseline: null,
    baselineStoredVersion: stored?.brain?.approvedVersion || null,
    storedBrain: stored?.brain || null,
    storedApprovedResult: stored?.approvedResult || null,
    sources: persistedSources(sources),
    synthesisSources: strippedForStorage(sources),
    passResults: { ...todayResults, [FIRST_EVOLVED_PASS]: pass.result },
    passes: [{ pass: FIRST_EVOLVED_PASS, responseId: pass.responseId, model: pass.model, usage: pass.usage || null }],
    reach,
    nextPass: FIRST_EVOLVED_PASS + 1,
    startedAt: new Date().toISOString(),
  };
  await store.writeInProgress(inProgress);
  return passProgress(inProgress);
}

function passError(passId, message, status = 400) {
  const error = new Error(`Pass ${passId}, ${PASS_LABELS[passId]}: ${message}`);
  error.status = status;
  error.pass = passId;
  return error;
}

// The slice of an approved baseline a pass is responsible for. A baseline that
// predates an artifact yields null for that pass, which runs it as a first
// synthesis of that slice, because there is genuinely nothing to update. The
// slice has a world axis: pass 6 is handed the evolved Lived World, and an
// approved brain with no evolved world yields null for every evolved pass.
function baselineForPass(passId, baseline) {
  if (!baseline) return null;
  const artifacts = worldArtifacts(baseline, passWorld(passId)) || {};
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
  const key = { 1: "dossier", 2: "livedWorld", 3: "storyArchitecture", 4: "visualGrammar" }[passStep(passId)];
  return artifacts[key] ? { [key]: artifacts[key] } : null;
}

// The reach level an evolved pass runs at. The app sends the level; a request
// that carries none, or an unknown one, runs at the default rather than
// failing, because the level is not yet a control anyone can set on screen.
function reachFor(body) {
  const requested = typeof body?.reach === "string" ? body.reach.trim() : "";
  return REACH_LEVELS.includes(requested) ? requested : DEFAULT_REACH;
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

// The assembled brain has the shape brandBrainSchema describes: brand fields,
// guidance and review questions at the root from pass 1, and two worlds under
// artifacts. Nothing downstream of the store can tell it was built in passes.
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
      today: {
        dossier: one.dossier,
        livedWorld: passResults[2]?.livedWorld,
        storyArchitecture: passResults[3]?.storyArchitecture,
        visualGrammar: passResults[4]?.visualGrammar,
      },
      evolved: {
        dossier: passResults[5]?.dossier,
        livedWorld: passResults[6]?.livedWorld,
        storyArchitecture: passResults[7]?.storyArchitecture,
        visualGrammar: passResults[8]?.visualGrammar,
      },
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

// What the browser is allowed to know about a synthesis it lost the connection
// to: which pass has finished. Nothing else from the in-progress record leaves
// the server, so the half-built brain stays unreachable by anything that could
// render it.
//
// A request id that does not match, or no in-progress state at all, is not an
// error. The client polls this while the server may still be writing, and an
// error there would read as a failure when the honest answer is "not yet".
// See docs/findings-2026-09-07-pass-recovery.md.
export async function readSynthesisProgress(requestId, options) {
  const store = options.store;
  const id = typeof requestId === "string" ? requestId.slice(0, 120) : null;
  if (!id || typeof store?.readInProgress !== "function") {
    return { requestId: id, inProgress: false, completedPass: 0 };
  }
  const inProgress = await store.readInProgress();
  if (!inProgress || inProgress.synthesisRequestId !== id) {
    return { requestId: id, inProgress: false, completedPass: 0 };
  }
  return {
    requestId: id,
    inProgress: true,
    completedPass: Number(inProgress.nextPass || FIRST_PASS) - 1,
    nextPass: Number(inProgress.nextPass || FIRST_PASS),
    totalPasses: PASS_IDS.length,
  };
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
    if (body.mode === "evolved" && passId === FIRST_EVOLVED_PASS) return await runEvolvedStart(body, options);
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
  // An evolved pass runs at the reach level on its request. The level is
  // recorded on the in-progress record from the first evolved pass so the
  // saved brain can say what its evolved world was built at.
  const evolved = passWorld(passId) === "evolved";
  const reach = evolved ? reachFor(body) : undefined;
  const pass = await synthesize({
    apiKey: options.env.OPENAI_API_KEY,
    model: options.env.OPENAI_MODEL,
    passId,
    sources,
    priorPasses: inProgress.passResults,
    baseline: baselineForPass(passId, inProgress.baseline),
    baselineVersion: inProgress.baselineVersion,
    reach,
    fetchImpl,
  });

  const passResults = { ...inProgress.passResults, [passId]: pass.result };
  const passes = [...inProgress.passes, { pass: passId, responseId: pass.responseId, model: pass.model, usage: pass.usage || null }];
  const reachRecord = evolved ? { reach: inProgress.reach || reach } : {};

  if (passId !== FINAL_PASS) {
    const next = { ...inProgress, ...reachRecord, passResults, passes, nextPass: passId + 1 };
    await store.writeInProgress(next);
    return passProgress(next);
  }

  const incremental = inProgress.mode === "incremental";
  const evolvedOnly = inProgress.mode === "evolved";
  const firstPassEntry = passes.find((entry) => entry.pass === FIRST_PASS) || passes[0];
  // An evolved-only rebuild keeps the approved today world and replaces only
  // the evolved candidate. The prior evolved approval is withdrawn: the new
  // world needs its own decision, and the writer reads today until it gets one.
  const priorApproved = evolvedOnly ? inProgress.storedApprovedResult : null;
  const evolvedApprovedResult = priorApproved
    ? { ...priorApproved, artifacts: { today: worldArtifacts(priorApproved, "today") || undefined } }
    : null;
  const saved = {
    kind: incremental ? "incremental-synthesis" : evolvedOnly ? "evolved-synthesis" : "synthesis",
    synthesisRequestId: inProgress.synthesisRequestId,
    sources: inProgress.sources,
    result: assembleBrainFromPasses(passResults),
    // The reach the evolved world was built at. The writer never reads it;
    // it is the record of how far the aspiration sources were allowed to go.
    reach: reachRecord.reach || null,
    approvedResult: evolvedOnly ? evolvedApprovedResult : inProgress.baseline,
    baselineVersion: incremental ? inProgress.baselineVersion || inProgress.baselineStoredVersion || null : null,
    responseId: firstPassEntry?.responseId || null,
    model: firstPassEntry?.model || null,
    usage: sumUsage(passes.map((entry) => entry.usage)),
    // Per-pass provenance. The saved shape above is what it always was; this is
    // the one addition, and nothing reads it to decide anything.
    passes: passes.map((entry) => ({ pass: entry.pass, label: PASS_LABELS[entry.pass], responseId: entry.responseId, model: entry.model, usage: entry.usage })),
    brain: evolvedOnly
      ? {
          ...(inProgress.storedBrain || {}),
          stage: "ready",
          processingComplete: true,
          evolvedStatus: "draft",
          evolvedApprovedVersion: 0,
        }
      : incremental
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
