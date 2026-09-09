import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function prototypeSession(options = {}) {
  const listeners = {};
  const intervals = new Map();
  let nextIntervalId = 1;
  const appRoot = {
    innerHTML: "",
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
  };
  const windowMock = {
    scrollTo() {},
    setTimeout(callback) {
      // Off by default, so a toast that clears itself does not re-render in the
      // middle of an assertion. The synthesis recovery tests need wait() to
      // resolve, and turn it on.
      if (options.runTimeouts && typeof callback === "function") callback();
      return 1;
    },
    setInterval(callback) {
      const id = nextIntervalId;
      nextIntervalId += 1;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
  };
  const context = {
    Blob,
    Date,
    URL: {
      createObjectURL() {
        return "blob:prototype";
      },
      revokeObjectURL() {},
    },
    document: {
      querySelector(selector) {
        return selector === "#app" ? appRoot : null;
      },
      querySelectorAll() {
        return [];
      },
      createElement() {
        return { click() {}, remove() {}, select() {}, style: {} };
      },
      body: { append() {} },
      execCommand() {},
    },
    navigator: { clipboard: { async writeText() {} } },
    window: windowMock,
    console,
  };
  // Absent by default, which is what makes startBrainSynthesis fall through to
  // its simulated path in every other test here.
  if (options.fetch) context.fetch = options.fetch;

  vm.runInNewContext(fs.readFileSync(path.join(rootPath, "app/app.js"), "utf8"), context);

  function click(action, dataset = {}) {
    listeners.click({
      target: {
        closest() {
          return { dataset: { action, ...dataset } };
        },
      },
    });
  }

  function input(action, value, dataset = {}) {
    listeners.input({ target: { value, dataset: { action, ...dataset }, matches(selector) { return selector === `[data-action="${action}"]`; } } });
  }

  function finishIntervals() {
    // Eight synthesis steps since ADR 0019, so ten rounds clears them all.
    for (let pass = 0; pass < 10; pass += 1) {
      [...intervals.values()].forEach((callback) => callback());
    }
  }

  function evaluate(expression) {
    return vm.runInContext(expression, context);
  }

  async function evaluateAsync(expression) {
    return vm.runInContext(expression, context);
  }

  return { appRoot, click, input, finishIntervals, evaluate, evaluateAsync, context };
}

test("Sources landing separates guided intake from the detailed source library", () => {
  const session = prototypeSession();

  session.click("brand-brain");
  session.click("navigate-brain", { screen: "brain-sources" });
  const landing = session.appRoot.innerHTML;

  assert.match(landing, /source-rhythm-stack/);
  assert.match(landing, /source-rhythm-section source-foundation tone-info/);
  assert.match(landing, /source-section-progress/);
  assert.match(landing, /source-foundation-list/);
  assert.match(landing, /source-presence-grid/);
  assert.match(landing, /source-context-entry/);
  assert.match(landing, /<h2>All sources<\/h2>/);
  assert.doesNotMatch(landing, /slot-coverage/);

  const website = landing.indexOf(">Website<");
  const logo = landing.indexOf(">Logo<");
  const guide = landing.indexOf(">Brand guide<");
  const templates = landing.indexOf(">Templates<");
  assert.ok(website < logo && logo < guide && guide < templates, "foundation slots stay in the settled order");
  assert.doesNotMatch(landing, /The main site the Brain should read/);
  assert.doesNotMatch(landing, /The logo files your team uses/);

  session.click("open-slot-intake", { slot: "logo" });
  assert.match(session.appRoot.innerHTML, /source-inline-drawer/);
  assert.match(session.appRoot.innerHTML, /source-drawer-title-logo">Add logo/);
  assert.match(session.appRoot.innerHTML, /<h2>Brand foundation<\/h2>/);
  assert.doesNotMatch(session.appRoot.innerHTML, /Guided source/);
  assert.doesNotMatch(session.appRoot.innerHTML, /What are you adding\?/);
  assert.doesNotMatch(session.appRoot.innerHTML, /What kind of asset\?/);
  assert.match(session.appRoot.innerHTML, /Which variation\? <b>Required<\/b>/);
  const logoDrawer = session.appRoot.innerHTML.slice(session.appRoot.innerHTML.indexOf('id="source-drawer-logo"'));
  assert.ok(logoDrawer.indexOf("Choose or drag a file here") < logoDrawer.indexOf("Which variation?"), "logo upload comes before variation");
  assert.match(session.appRoot.innerHTML, /Source name <b>Required<\/b>/);
  assert.match(session.appRoot.innerHTML, /An official brand mark\. Use exactly as supplied\./);
  session.evaluate('state.brain.sourceAssetVariation = "Monochrome"');
  const logoContract = JSON.parse(JSON.stringify(session.evaluate("sourceContract()")));
  assert.equal(logoContract.assetKind, "logo");
  assert.equal(logoContract.assetVariation, "Monochrome");
  assert.equal(logoContract.provenance, "ours");
  assert.equal(logoContract.aspiration, "current");
  session.evaluate('state.brain.sourceTitle = "Primary logo"');
  session.evaluate('state.brain.pendingFiles = [{ name: "primary-logo.svg", size: 1024, type: "image/svg+xml" }]');
  session.click("add-file-source");
  assert.doesNotMatch(session.appRoot.innerHTML, /source-drawer-title-logo/);
  assert.match(session.appRoot.innerHTML, /Primary logo/);

  session.click("open-slot-intake", { slot: "templates" });
  assert.match(session.appRoot.innerHTML, /Template format <b>Required<\/b>/);
  assert.match(session.appRoot.innerHTML, /Slide \(16:9 widescreen\)/);
  assert.match(session.appRoot.innerHTML, /One-pager \(8\.5 x 11\)/);

  session.click("close-intake-door");
  session.click("open-slot-intake", { slot: "guide" });
  assert.match(session.appRoot.innerHTML, /This file shows logos or other assets on its pages/);
  assert.match(session.appRoot.innerHTML, /Register anything you need to place as a brand asset separately/);

  session.click("close-intake-door");
  session.click("open-slot-intake", { slot: "instagram" });
  assert.match(session.appRoot.innerHTML, /source-drawer-title-instagram">Add Instagram screenshot/);
  assert.match(session.appRoot.innerHTML, /source-presence-grid/);
  assert.doesNotMatch(session.appRoot.innerHTML, /What are you adding\?/);
  assert.doesNotMatch(session.appRoot.innerHTML, /Does this reflect the brand today, or where it is heading\?/);
  assert.match(session.appRoot.innerHTML, /How should the Brain use this\? <b>Required<\/b>/);
  assert.match(session.appRoot.innerHTML, /More control/);
  const socialContract = JSON.parse(JSON.stringify(session.evaluate("sourceContract()")));
  assert.equal(socialContract.authority, "creative-reference");
  assert.equal(socialContract.provenance, "ours");
  assert.equal(socialContract.aspiration, "current");

  session.click("close-intake-door");
  assert.match(session.appRoot.innerHTML, /A recent full-screen capture works best/);
  assert.match(session.appRoot.innerHTML, /We can’t access Instagram directly/);
  assert.match(session.appRoot.innerHTML, /a few recent posts/);

  session.click("open-context-intake");
  assert.match(session.appRoot.innerHTML, /source-drawer-title-context">Add another source/);
  assert.match(session.appRoot.innerHTML, />File<\/button>/);
  assert.match(session.appRoot.innerHTML, />Link<\/button>/);
  assert.match(session.appRoot.innerHTML, /Where did this come from\?/);
  assert.match(session.appRoot.innerHTML, /Our brand/);
  assert.match(session.appRoot.innerHTML, /Outside reference/);
  assert.match(session.appRoot.innerHTML, /Does this show the brand today, or a direction to explore\?/);
  assert.match(session.appRoot.innerHTML, /How should the Brain use this\? <b>Required<\/b>/);
  assert.match(session.appRoot.innerHTML, /What should this teach\?/);
  assert.match(session.appRoot.innerHTML, />Influence<\/span>/);
  assert.doesNotMatch(session.appRoot.innerHTML, /What are you adding\?/);
  assert.doesNotMatch(session.appRoot.innerHTML, /intake-kind-grid/);
  session.click("set-source-provenance", { value: "emulate" });
  session.click("set-source-aspiration", { value: "aspiration" });
  const contextContract = JSON.parse(JSON.stringify(session.evaluate("sourceContract()")));
  assert.equal(contextContract.authority, "creative-reference");
  assert.equal(contextContract.provenance, "emulate");
  assert.equal(contextContract.aspiration, "aspiration");
});

test("Brand Brain prototype connects empty onboarding to a production-ready stored version", () => {
  const session = prototypeSession();

  session.click("brand-brain");
  assert.match(session.appRoot.innerHTML, /Turn what you know into reusable brand guidance/);
  assert.match(session.appRoot.innerHTML, /Overview/);
  assert.match(session.appRoot.innerHTML, /Sources/);
  assert.match(session.appRoot.innerHTML, /Needs review/);
  assert.match(session.appRoot.innerHTML, /Brand guidance/);
  assert.match(session.appRoot.innerHTML, /History/);

  session.click("load-sample-sources");
  assert.match(session.appRoot.innerHTML, /<h2>All sources<\/h2>/);
  assert.match(session.appRoot.innerHTML, /source-library-table-head/);
  assert.match(session.appRoot.innerHTML, /source-library-kind/);
  assert.match(session.appRoot.innerHTML, /Approved brand assets/);
  assert.match(session.appRoot.innerHTML, /Protected assets/);
  assert.match(session.appRoot.innerHTML, /Brand strategy decks/);
  assert.match(session.appRoot.innerHTML, /Campaign archive/);
  assert.doesNotMatch(session.appRoot.innerHTML, />Brand evidence</);

  session.click("open-slot-intake", { slot: "logo" });
  assert.match(session.appRoot.innerHTML, /Which variation\?/);
  assert.match(session.appRoot.innerHTML, /20 MB maximum/);

  session.click("close-intake-door");
  session.click("open-slot-intake", { slot: "guide" });
  assert.match(session.appRoot.innerHTML, /PDF, DOCX, PPTX, text files, PNG, JPG, WEBP/);
  assert.match(session.appRoot.innerHTML, /accept="[^"]*\.png[^"]*\.webp[^"]*"/);
  assert.doesNotMatch(session.appRoot.innerHTML, /accept="[^"]*\.svg/);

  session.click("close-intake-door");
  session.click("toggle-source-details", { id: "approved-brand-assets" });
  assert.match(session.appRoot.innerHTML, /Use these files exactly as supplied/);
  assert.match(session.appRoot.innerHTML, /What should we leave out/);

  session.click("start-brain-synthesis");
  assert.match(session.appRoot.innerHTML, /Building your Brand Brain/);
  session.finishIntervals();
  assert.match(session.appRoot.innerHTML, /Your sources are ready for review/);

  session.click("navigate-brain", { screen: "brain" });
  session.click("approve-clean-assets");
  session.click("resolve-brain-exception", { id: "audience-alignment-conflict", resolution: "keep-source-b" });
  session.click("resolve-brain-exception", { id: "yuzu-pack-duplicate", resolution: "keep-both" });
  session.click("resolve-brain-exception", { id: "four-pm-reset", resolution: "contextual" });
  session.click("resolve-brain-exception", { id: "no-medical-health-claims", resolution: "use-rule" });
  assert.match(session.appRoot.innerHTML, /Your Brand Brain draft is ready/);

  session.click("finish-brain-review");
  assert.match(session.appRoot.innerHTML, /SLAKE Brand Brain v1/);
  assert.match(session.appRoot.innerHTML, /Draft for review/);
  assert.match(session.appRoot.innerHTML, /What the Brand Brain understands/);
  assert.match(session.appRoot.innerHTML, /Why the system reached this view/);
  assert.match(session.appRoot.innerHTML, /Brand foundation dossier/);
  assert.match(session.appRoot.innerHTML, /Comment on this/);
  assert.match(session.appRoot.innerHTML, /category-foundation active/);
  assert.match(session.appRoot.innerHTML, /category-identity/);
  assert.match(session.appRoot.innerHTML, /category-rules/);

  session.click("open-brain-artifact", { id: "dossier" });
  assert.match(session.appRoot.innerHTML, /Brand Dossier/);
  assert.match(session.appRoot.innerHTML, /A person, not a segment/);
  assert.match(session.appRoot.innerHTML, /Pulled from approved identity/);
  assert.match(session.appRoot.innerHTML, /Never optimized/);

  session.click("select-brain-artifact", { id: "lived" });
  assert.match(session.appRoot.innerHTML, /Environments they have earned/);
  assert.match(session.appRoot.innerHTML, /A worked kitchen at 4pm/);

  session.click("select-brain-artifact", { id: "story" });
  // The moments heading stopped promising four on 2026-09-07, when the schema
  // opened moments to between six and twelve. The sample brain still carries
  // four old-shape moments, which is what this session renders, so it doubles
  // as the old-shape reader case.
  assert.match(session.appRoot.innerHTML, /Places a camera could walk into/);
  assert.match(session.appRoot.innerHTML, /Role in the story/);
  assert.match(session.appRoot.innerHTML, /Why these moments/);
  // The sample brain predates the two worlds. It renders as the brand today
  // and nothing else: no evolved heading, no evolved approve.
  assert.match(session.appRoot.innerHTML, /The brand today/);
  assert.doesNotMatch(session.appRoot.innerHTML, /The brand world, evolved/);
  session.click("toggle-guidance-comment", { target: "story:artifact:rhythm" });
  session.input("guidance-comment-draft", "Make the transition into the shared evening more specific.");
  session.click("save-guidance-comment", { target: "story:artifact:rhythm", section: "story", label: "Story Architecture" });
  assert.match(session.appRoot.innerHTML, /Make the transition into the shared evening more specific/);

  session.click("set-guidance-view", { view: "guidance" });
  assert.match(session.appRoot.innerHTML, /1 inline comment saved/);
  session.click("create-comment-revision");
  assert.match(session.appRoot.innerHTML, /SLAKE Brand Brain v2/);

  session.click("toggle-guidance-comment", { target: "foundation:prose:0" });
  session.input("guidance-comment-draft", "Make the role of flavor more prominent.");
  session.click("save-guidance-comment", { target: "foundation:prose:0", section: "foundation" });
  assert.match(session.appRoot.innerHTML, /Make the role of flavor more prominent/);
  assert.match(session.appRoot.innerHTML, /1 inline comment saved/);

  session.click("create-comment-revision");
  assert.match(session.appRoot.innerHTML, /SLAKE Brand Brain v3/);
  assert.match(session.appRoot.innerHTML, /Included in v3/);

  // A legacy brain has one approve, and it is the today approve.
  assert.match(session.appRoot.innerHTML, /data-action="approve-brain-today">Approve for production/);
  assert.doesNotMatch(session.appRoot.innerHTML, /approve-brain-evolved/);
  session.click("approve-brain-today");
  assert.match(session.appRoot.innerHTML, /Ready for production/);
  assert.match(session.appRoot.innerHTML, /Go to Design Studio/);
  assert.equal(session.evaluate("state.brain.evolvedStatus"), "not-created");
  assert.equal(session.evaluate('Object.keys(state.brain.approvedResult.artifacts).join(",")'), "today");

  session.click("navigate-brain", { screen: "brain-history" });
  assert.match(session.appRoot.innerHTML, /Brand Brain v3 approved/);
  assert.match(session.appRoot.innerHTML, /SLAKE source batch added/);

  session.click("navigate-brain", { screen: "brain-sources" });
  assert.match(session.appRoot.innerHTML, /Active v3/);
  session.click("open-context-intake");
  session.click("set-source-form", { kind: "url" });
  session.click("set-source-provenance", { value: "ours" });
  session.click("set-source-aspiration", { value: "current" });
  session.input("brain-source-title", "Retail expansion briefing");
  session.input("brain-source-url", "https://example.com/retail-expansion");
  session.input("brain-source-usage", "Use only as company background; do not treat growth targets as brand guidance.");
  session.click("add-url-source");
  assert.match(session.appRoot.innerHTML, /1 pending/);
  assert.match(session.appRoot.innerHTML, /Prepare proposed update/);
});

test("shared visual polish layer centralizes spacing, surfaces, and semantic states", () => {
  const index = fs.readFileSync(path.join(rootPath, "app/index.html"), "utf8");
  const styles = fs.readFileSync(path.join(rootPath, "app/styles.css"), "utf8");
  const polish = fs.readFileSync(path.join(rootPath, "app/polish.css"), "utf8");
  const app = fs.readFileSync(path.join(rootPath, "app/app.js"), "utf8");

  assert.match(index, /polish\.css/);
  assert.match(polish, /--section-gap: var\(--space-6\)/);
  assert.match(polish, /--card-padding: var\(--space-5\)/);
  assert.match(polish, /\.surface-accent-governed/);
  assert.match(polish, /\.pill-protected/);
  assert.match(polish, /\.asset-icon-image::before/);
  assert.match(app, /surface-accent-governed/);
  assert.match(app, /pill-success/);
  assert.doesNotMatch(app, /style="color: #e6c765/);
  assert.doesNotMatch(styles, /font-family: var\(--body\)/);
});

// ---------------------------------------------------------------------------
// The result screen reads the job's status, not the local one (2026-09-02)
// ---------------------------------------------------------------------------

function workingJob() {
  return 'state.production.job = { jobId: "render-1", status: "working", engine: "seedream", model: "seedream-5-pro", generationPackage: { brainVersion: 1, output: { format: "4:5 portrait" } } }';
}

test("a job still working keeps the rendering state even after the connection drops", () => {
  const session = prototypeSession();
  session.evaluate('state.screen = "result"');
  session.evaluate(workingJob());
  // What a dropped connection used to leave behind: a local error beside a job
  // the server still reports as working.
  session.evaluate('state.production.status = "error"');
  session.evaluate('state.production.error = "The image response was lost."');
  session.evaluate("render()");
  assert.match(session.appRoot.innerHTML, /is rendering the image/);
  assert.doesNotMatch(session.appRoot.innerHTML, /The image was not generated/);
});

test("a job that reports an error renders the failure state with a retry", () => {
  const session = prototypeSession();
  session.evaluate('state.screen = "result"');
  session.evaluate(workingJob());
  session.evaluate('state.production.job.status = "error"');
  session.evaluate('state.production.status = "error"');
  session.evaluate('state.production.error = "The render failed."');
  session.evaluate("render()");
  assert.match(session.appRoot.innerHTML, /The image was not generated/);
  assert.match(session.appRoot.innerHTML, /data-action="retry-generate"/);
});

test("recovery outlasts the render rather than the connection", () => {
  const app = fs.readFileSync(path.join(rootPath, "app/app.js"), "utf8");
  // The loop itself runs on a real clock, so what is checked here is the
  // arithmetic: an eight minute ceiling above the server's 300 second
  // maxDuration, and an interval measured in seconds rather than the old
  // thirty seconds of total patience.
  assert.match(app, /const RECOVERY_CEILING_MS = 8 \* 60 \* 1000;/);
  assert.match(app, /const RECOVERY_POLL_INTERVAL_MS = 2500;/);
});

// The format's craft paragraph is appended to the authored scene before the
// brief is sent. Until 2026-09-02 the join was a bare space, so a scene ending
// without a period ran into the craft text and compiled as "holding a soda can
// The largest shape in the Instagram feed."
test("the scene and its craft paragraph join with a sentence between them", () => {
  const session = prototypeSession();

  assert.equal(
    session.evaluate('joinSceneAndCraft("A hand holding a soda can", "The largest shape in the Instagram feed.")'),
    "A hand holding a soda can. The largest shape in the Instagram feed.",
  );
  // A scene the author already punctuated joins exactly as it did before.
  assert.equal(
    session.evaluate('joinSceneAndCraft("A hand holding a soda can.", "The largest shape in the Instagram feed.")'),
    "A hand holding a soda can. The largest shape in the Instagram feed.",
  );
  assert.equal(
    session.evaluate('joinSceneAndCraft("Who is holding the can?", "Square and small.")'),
    "Who is holding the can? Square and small.",
  );
  assert.equal(session.evaluate('joinSceneAndCraft("", "Square and small.")'), "Square and small.");
  assert.equal(session.evaluate('joinSceneAndCraft("A hand holding a soda can", "")'), "A hand holding a soda can");
});

// ---------------------------------------------------------------------------
// Synthesis pass recovery (2026-09-07)
//
// The first four-pass synthesis on the deployed app reported "Failed to fetch"
// on pass 1 while the server logged two 200s and no error: it had finished the
// pass and stored the in-progress brain, and the browser never saw the reply.
// Any pass can outlive its connection, so a thrown fetch now polls the
// in-progress read instead of ending the synthesis.
// See docs/findings-2026-09-07-pass-recovery.md.
// ---------------------------------------------------------------------------

// A two-world synthesis result in the ADR 0019 shape, small enough to read.
function twoWorldResult() {
  const dossier = (readBody) => ({
    description: "d", sourceCount: 1, categories: ["a", "b"], read: ["x", "y", "z"], readBody, audience: "a", desiredFeeling: "f",
    productTruth: "p", proof: ["a", "b"], palette: [{ name: "Oat", role: "Ground", color: "#d9d0bd" }], materials: ["wood"], culturalCodes: "c",
    guardrails: [{ title: "Never clinical", body: "b" }],
  });
  const lived = (description, name) => ({
    description: "l", sourceCount: 1, categories: ["a", "b"],
    cast: { description, examples: [{ name, who: "who", basis: { origin: "ambition", derivedFrom: "the retro deck", confidence: "Medium" } }] },
    wants: ["w"], rejects: ["r"], tensions: ["t"], patterns: [], emotions: ["e"], social: [], environments: [], belongs: "b", opens: "o",
  });
  const story = (situation) => ({
    description: "s", sourceCount: 1, categories: ["a", "b"], rhythm: "r",
    moments: [{ id: "m-1", title: "The last staple", when: "Evening", where: "A garage", who: "Two people, one working and one watching.", situation, feeling: "f", basis: { origin: "inference", derivedFrom: "d", confidence: "Low" } }],
    why: "w", continuity: ["c"],
  });
  const grammar = { description: "g", sourceCount: 1, categories: ["a", "b"], sections: { people: [], objects: [], places: [], light: [], camera: [], rejects: [] } };
  return {
    brandName: "Fallow",
    brandDescription: "A quiet home goods brand",
    synthesisSummary: "Ordinary moments, considered.",
    cleanAssetCount: 0,
    guidanceSections: ["foundation", "identity", "world", "voice", "creative", "rules"].map((id) => ({ id, name: id, summary: "s", prose: ["p"], principles: ["q"], evidence: [], artifacts: [], productionUse: "u", sourceCount: 1 })),
    reviewQuestions: [],
    artifacts: {
      today: { dossier: dossier("Today read."), livedWorld: lived("People who fix things.", "Dana"), storyArchitecture: story("Pulling a staple."), visualGrammar: grammar },
      evolved: { dossier: dossier("Evolved read."), livedWorld: lived("People who repair rather than replace.", "Ola"), storyArchitecture: story("Pulling the last staple from a chair seat."), visualGrammar: grammar },
    },
  };
}

function jsonReply(payload, ok = true) {
  return {
    ok,
    headers: { get: () => "application/json" },
    async json() {
      return payload;
    },
  };
}

// A server that runs all four passes, with one pass whose reply is lost on the
// way back to the browser. The pass itself completes, exactly as the deployed
// failure did.
function synthesisServer({ dropReplyOnPass = null, failOnPass = null } = {}) {
  const calls = [];
  let completedPass = 0;
  const fetchImpl = async (url, init = {}) => {
    if (String(url).startsWith("/api/brand-brain/synthesize?")) {
      calls.push({ kind: "progress", url: String(url) });
      const requestId = new URL(String(url), "http://localhost").searchParams.get("requestId");
      return jsonReply(
        completedPass > 0 && completedPass < 8
          ? { requestId, inProgress: true, completedPass, nextPass: completedPass + 1, totalPasses: 8 }
          : { requestId, inProgress: false, completedPass: 0 },
      );
    }
    if (String(url) !== "/api/brand-brain/synthesize") {
      // Anything else the app touches while this runs, such as persisting the
      // brain state. Not what these tests are about.
      calls.push({ kind: "other", url: String(url) });
      return jsonReply({ saved: null });
    }
    const payload = JSON.parse(init.body);
    calls.push({ kind: "pass", pass: payload.pass, requestId: payload.requestId, reach: payload.reach });
    if (payload.pass === failOnPass) {
      return jsonReply({ error: `Pass ${payload.pass}, the people and their days: the model call failed` }, false);
    }
    completedPass = payload.pass;
    if (payload.pass === dropReplyOnPass) {
      // The work is done and recorded. The connection dies before the reply.
      throw new TypeError("Failed to fetch");
    }
    if (payload.pass < 8) return jsonReply({ pass: payload.pass, nextPass: payload.pass + 1, complete: false });
    return jsonReply({
      complete: true,
      result: twoWorldResult(),
      model: "gpt-5.6",
      responseId: "chatcmpl-8",
      savedAt: "2026-09-09T22:10:00.000Z",
    });
  };
  return { fetchImpl, calls, passCalls: () => calls.filter((c) => c.kind === "pass").map((c) => c.pass) };
}

async function runSynthesis(server) {
  const session = prototypeSession({ fetch: server.fetchImpl, runTimeouts: true });
  session.evaluate('state.brain.sources = [{ id: "s1", name: "Approved note", authority: "approved-guidance", content: "text", files: [] }]');
  await session.evaluate("startBrainSynthesis()");
  return session;
}

for (const droppedPass of [1, 2, 3, 5, 7]) {
  test(`a dropped connection on pass ${droppedPass} continues to the next pass without the person acting`, async () => {
    const server = synthesisServer({ dropReplyOnPass: droppedPass });
    const session = await runSynthesis(server);

    // Every pass ran exactly once. The dropped pass was polled for, not retried:
    // retrying a pass the server may still be running is the thing to avoid.
    assert.deepEqual(server.passCalls(), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.ok(
      server.calls.some((call) => call.kind === "progress"),
      "the client asked the in-progress read which pass had finished",
    );
    assert.equal(session.evaluate("state.brain.processingError"), "");
    assert.equal(session.evaluate("state.brain.synthesisResponseId"), "chatcmpl-8");
  });
}

test("the evolved passes carry the reach constant and the today passes carry none", async () => {
  const server = synthesisServer();
  await runSynthesis(server);
  const passes = server.calls.filter((c) => c.kind === "pass");
  assert.deepEqual(passes.map((c) => c.reach), [undefined, undefined, undefined, undefined, "a clear direction", "a clear direction", "a clear direction", "a clear direction"]);
});

test("both worlds render, today first, and each approve writes to its own world and version", async () => {
  const server = synthesisServer();
  const session = await runSynthesis(server);
  session.evaluate("state.brain.cleanApproved = true");
  session.click("finish-brain-review");
  assert.equal(session.evaluate("state.brain.artifactStatus"), "draft");
  assert.equal(session.evaluate("state.brain.evolvedStatus"), "draft");

  session.click("set-guidance-view", { view: "artifacts" });
  const html = session.appRoot.innerHTML;
  assert.ok(html.indexOf("The brand today") < html.indexOf("The brand world, evolved"), "today renders first");
  assert.match(html, /Does this describe the brand as it is now\?/);
  assert.match(html, /Is this where the brand is going\?/);
  // Each world shows its own dossier by default, and the cast reader shows the
  // description then the examples with their basis note.
  assert.match(html, /Today read\./);
  assert.match(html, /Evolved read\./);
  session.click("select-brain-artifact", { id: "evolved-lived" });
  assert.match(session.appRoot.innerHTML, /People who repair rather than replace\./);
  assert.match(session.appRoot.innerHTML, /Examples to cast from/);
  assert.match(session.appRoot.innerHTML, /A direction you're reaching for/);
  // Selecting an evolved tab leaves the today reader on its dossier.
  assert.match(session.appRoot.innerHTML, /Today read\./);
  assert.equal(session.evaluate("state.brain.selectedBrainArtifactId"), "dossier");
  session.click("select-brain-artifact", { id: "evolved-story" });
  assert.match(session.appRoot.innerHTML, /Pulling the last staple from a chair seat\./);
  assert.match(session.appRoot.innerHTML, /Two people, one working and one watching\./);
  assert.match(session.appRoot.innerHTML, /Why these moments/);

  // Two approve actions. The evolved one does nothing until today is approved.
  session.click("set-guidance-view", { view: "guidance" });
  assert.match(session.appRoot.innerHTML, /Approve the brand today/);
  session.click("approve-brain-evolved");
  assert.equal(session.evaluate("state.brain.evolvedStatus"), "draft");
  assert.equal(session.evaluate("state.brain.approvedResult"), null);

  session.click("approve-brain-today");
  assert.equal(session.evaluate("state.brain.artifactStatus"), "ready");
  assert.equal(session.evaluate("state.brain.approvedVersion"), 1);
  assert.equal(session.evaluate("state.brain.evolvedStatus"), "draft");
  assert.equal(session.evaluate("state.brain.evolvedApprovedVersion"), 0);
  assert.equal(session.evaluate('Object.keys(state.brain.approvedResult.artifacts).join(",")'), "today");
  assert.equal(session.evaluate("state.brain.approvedResult.guidanceSections.length"), 6);
  assert.match(session.appRoot.innerHTML, /The brand today is approved/);
  assert.match(session.appRoot.innerHTML, /data-action="approve-brain-evolved"/);

  session.click("approve-brain-evolved");
  assert.equal(session.evaluate("state.brain.evolvedStatus"), "ready");
  assert.equal(session.evaluate("state.brain.evolvedApprovedVersion"), 1);
  assert.equal(session.evaluate('Object.keys(state.brain.approvedResult.artifacts).sort().join(",")'), "evolved,today");
  assert.equal(session.evaluate("state.brain.approvedResult.artifacts.evolved.dossier.readBody"), "Evolved read.");
  assert.equal(session.evaluate("state.brain.approvedResult.artifacts.today.dossier.readBody"), "Today read.");
  assert.match(session.appRoot.innerHTML, /Design Studio can use this version/);
  // The persisted snapshot carries both statuses.
  const saveCall = server.calls.filter((c) => c.kind === "other" && c.url === "/api/brand-brain/save").length;
  assert.ok(saveCall > 0, "state was persisted");
});

test("a server error with a body fails immediately and names the pass", async () => {
  const server = synthesisServer({ failOnPass: 2 });
  const session = await runSynthesis(server);

  // Pass 2 answered, so there was nothing to wait for. The loop stops there.
  assert.deepEqual(server.passCalls(), [1, 2]);
  assert.equal(server.calls.some((call) => call.kind === "progress"), false, "a real failure is not polled for");
  assert.match(session.evaluate("state.brain.processingError"), /Pass 2, the people and their days/);
  assert.equal(session.evaluate('state.brain.stage'), "intake");
});

test("the in-progress read never returns the half-built brain", async () => {
  const server = synthesisServer({ dropReplyOnPass: 1 });
  await runSynthesis(server);
  const progressCall = server.calls.find((call) => call.kind === "progress");
  assert.match(progressCall.url, /requestId=synthesis-/);
  // The client asks for one thing and is given one thing. The contract on the
  // server side is covered in test/brand-brain-openai.test.js.
  assert.doesNotMatch(progressCall.url, /result|artifacts|passResults/);
});
