import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function prototypeSession() {
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
    setTimeout() {
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
    for (let pass = 0; pass < 6; pass += 1) {
      [...intervals.values()].forEach((callback) => callback());
    }
  }

  return { appRoot, click, input, finishIntervals };
}

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
  assert.match(session.appRoot.innerHTML, /50 items ready/);
  assert.match(session.appRoot.innerHTML, /Approved brand assets/);
  assert.match(session.appRoot.innerHTML, /Exact brand asset/);
  assert.match(session.appRoot.innerHTML, /Approved brand guidance/);
  assert.match(session.appRoot.innerHTML, /Not weighted/);
  assert.match(session.appRoot.innerHTML, /Strong/);
  assert.match(session.appRoot.innerHTML, /Campaign archive/);

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
  assert.match(session.appRoot.innerHTML, /Synthesized guidance/);
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
  assert.match(session.appRoot.innerHTML, /Four scenes from one believable life/);
  assert.match(session.appRoot.innerHTML, /Why these four/);
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

  session.click("approve-brain-artifact");
  assert.match(session.appRoot.innerHTML, /Ready for production/);
  assert.match(session.appRoot.innerHTML, /Future production packages can pin this exact version/);

  session.click("navigate-brain", { screen: "brain-history" });
  assert.match(session.appRoot.innerHTML, /Brand Brain v3 approved/);
  assert.match(session.appRoot.innerHTML, /SLAKE source batch added/);
});
