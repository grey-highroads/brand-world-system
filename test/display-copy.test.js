import assert from "node:assert/strict";
import test from "node:test";
import { budgetFor, displayBudgets, checkDisplayBudgets, shapeFromFormat } from "../src/copy/display-budget.js";
import { protectionBlock, displayCopyBlock } from "../src/production/prompt-craft.js";
import { compileBrandWorldImagePackage } from "../src/production/package.js";
import { produceCopy } from "../src/copy/generate.js";

const brain = {
  brandName: "Slake",
  guidanceSections: [
    { id: "voice", name: "Voice", summary: "Plain", principles: [] },
    { id: "creative", name: "Creative", summary: "Natural light", principles: [] },
  ],
  artifacts: { dossier: {} },
  sources: [],
};

// -------------------------------------------------------------------------
// Budgets
// -------------------------------------------------------------------------

test("format maps to a shape", () => {
  assert.equal(shapeFromFormat("1:1 square"), "square");
  assert.equal(shapeFromFormat("4:5 portrait"), "portrait");
  assert.equal(shapeFromFormat("16:9 landscape"), "landscape");
  assert.equal(shapeFromFormat("9:16 story"), "tall");
  assert.equal(shapeFromFormat(""), "square");
});

test("a wider frame gets more characters per line than a taller one", () => {
  const wide = budgetFor({ format: "16:9 landscape", zoneId: "lower_third" });
  const tall = budgetFor({ format: "9:16 story", zoneId: "lower_third" });
  assert.equal(wide.charsPerLine > tall.charsPerLine, true);
});

test("a narrow zone gets fewer characters per line than a wide one", () => {
  const wide = budgetFor({ format: "1:1 square", zoneId: "lower_third" });
  const narrow = budgetFor({ format: "1:1 square", zoneId: "left_panel" });
  assert.equal(narrow.charsPerLine < wide.charsPerLine, true);
});

test("the headline gets more room than the call to action", () => {
  const budgets = displayBudgets({ format: "1:1 square", zoneId: "lower_third" });
  const headline = budgets.find((b) => b.fieldId === "headline");
  const cta = budgets.find((b) => b.fieldId === "cta");
  assert.equal(headline.maxChars > cta.maxChars, true);
});

test("an over-budget line is flagged deterministically, with the count", () => {
  const budgets = displayBudgets({ format: "1:1 square", zoneId: "left_panel" });
  const fields = [
    { id: "headline", label: "Headline", text: "A".repeat(500) },
    { id: "cta", label: "Call to action", text: "Go" },
  ];
  const findings = checkDisplayBudgets(fields, budgets);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, "display_budget");
  assert.equal(findings[0].field, "Headline");
  assert.match(findings[0].reason, /500 characters/);
});

test("an empty field is not flagged as over budget", () => {
  const budgets = displayBudgets({ format: "1:1 square", zoneId: "lower_third" });
  assert.deepEqual(checkDisplayBudgets([{ id: "headline", label: "Headline", text: "" }], budgets), []);
});

// -------------------------------------------------------------------------
// Text safety scoping
// -------------------------------------------------------------------------

test("without display copy, text safety forbids all letter-like marks", () => {
  const block = protectionBlock({ lockedAsset: null, format: "scene" });
  assert.match(block, /no pseudo-text or letter-like marks anywhere/);
  assert.equal(/Apart from the authored display copy/.test(block), false);
});

test("with display copy, text safety is narrowed rather than dropped", () => {
  const block = protectionBlock({ lockedAsset: null, format: "scene", displayCopy: { lines: [{ text: "x" }] } });
  assert.match(block, /Apart from the authored display copy/);
  // The environmental prohibition must survive the narrowing.
  assert.match(block, /blank, abstract, cropped, or defocused beyond reading/);
  assert.match(block, /Invent no other words/);
});

test("the narrowing applies to locked-asset jobs too, not just world-only", () => {
  const locked = protectionBlock({
    lockedAsset: { name: "Yuzu can", assetType: "packaging" },
    format: "can",
    displayCopy: { lines: [{ text: "x" }] },
  });
  assert.match(locked, /Apart from the authored display copy/);
});

// -------------------------------------------------------------------------
// Prompt inclusion
// -------------------------------------------------------------------------

test("the display copy block states the exact string and forbids alteration", () => {
  const block = displayCopyBlock({
    lines: [{ id: "headline", label: "Headline", text: "Fewer empty chairs" }],
    zone: { id: "lower_third", label: "Lower third", description: "across the lower third of the frame", charsPerLine: 34 },
    format: "1:1 square",
  });
  assert.match(block, /"Fewer empty chairs"/);
  assert.match(block, /set exactly as written/);
  assert.match(block, /Reproduce every character exactly/);
  assert.match(block, /Do not paraphrase/);
  // The zone is a composition instruction, not only a placement one.
  assert.match(block, /Leave clean, uncluttered space/);
});

test("no lines with text produces no block", () => {
  assert.equal(displayCopyBlock({ lines: [], zone: { description: "x" } }), "");
  assert.equal(displayCopyBlock({ lines: [{ text: "" }], zone: { description: "x" } }), "");
});

// -------------------------------------------------------------------------
// Compiler
// -------------------------------------------------------------------------

const baseBrief = { scene: "A clinician at a workstation", placement: "LinkedIn feed", format: "1:1 square", assetType: "scene" };

test("a job with no display copy compiles no display section and no record", () => {
  const pkg = compileBrandWorldImagePackage({ approvedBrain: brain, brainVersion: 1, brief: baseBrief });
  assert.equal(/DISPLAY COPY/.test(pkg.prompt), false);
  assert.equal("copy" in pkg, false);
});

test("a job with display copy carries the string in the prompt and on the record", () => {
  const pkg = compileBrandWorldImagePackage({
    approvedBrain: brain,
    brainVersion: 1,
    brief: baseBrief,
    copyOutputs: ["headline_set"],
    claimsSet: { approved: [], prohibited: [], disclosures: [] },
    displayCopy: {
      zoneId: "lower_third",
      format: "1:1 square",
      lines: [{ id: "headline", label: "Headline", text: "Fewer empty chairs" }],
    },
  });
  assert.match(pkg.prompt, /DISPLAY COPY/);
  assert.match(pkg.prompt, /Fewer empty chairs/);
  assert.equal(pkg.copy.display.lines[0].text, "Fewer empty chairs");
  assert.equal(pkg.copy.display.zoneId, "lower_third");
});

test("a recorded display copy contract is never marked verified", () => {
  const pkg = compileBrandWorldImagePackage({
    approvedBrain: brain,
    brainVersion: 1,
    brief: baseBrief,
    copyOutputs: ["headline_set"],
    claimsSet: { approved: [], prohibited: [], disclosures: [] },
    displayCopy: { zoneId: "center", lines: [{ id: "headline", label: "Headline", text: "x" }] },
  });
  // Read-back verification is not built. Nothing may assert it passed.
  assert.equal(pkg.copy.display.verified, false);
});

// -------------------------------------------------------------------------
// Generation under a character budget
// -------------------------------------------------------------------------

test("character budgets reach the prompt and the audit when display copy is requested", async () => {
  let captured = "";
  const block = await produceCopy({
    copyTypeId: "headline_set",
    brain,
    claimsSet: { approved: [], prohibited: [], disclosures: [] },
    context: {
      placement: "LinkedIn feed",
      displayBudgets: displayBudgets({ format: "1:1 square", zoneId: "left_panel", fieldIds: ["headline"] }),
    },
    apiKey: "unused",
    fetchImpl: async (url, init) => {
      captured = JSON.parse(init.body).messages[0].content;
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ headline: "B".repeat(400), subhead: "s", cta: "c" }) } }] }) };
    },
  });
  assert.match(captured, /characters/);
  assert.match(captured, /rendered into the image/);
  const budgetFindings = block.audit.findings.filter((f) => f.kind === "display_budget");
  assert.equal(budgetFindings.length, 1);
});

test("without display budgets the headline set still uses word limits", async () => {
  let captured = "";
  await produceCopy({
    copyTypeId: "headline_set",
    brain,
    claimsSet: { approved: [], prohibited: [], disclosures: [] },
    context: { placement: "Sales enablement" },
    apiKey: "unused",
    fetchImpl: async (url, init) => {
      captured = JSON.parse(init.body).messages[0].content;
      return { ok: true, json: async () => ({ choices: [{ message: { content: '{"headline":"A","subhead":"B","cta":"C"}' } }] }) };
    },
  });
  assert.match(captured, /Maximum 10 words/);
});
