import assert from "node:assert/strict";
import test from "node:test";
import {
  inferPackageFormat,
  integrationSentence,
  protectionBlock,
  selectAestheticMode,
  openingLine,
  neutralizeStateLanguage,
  auditConstraints,
  AESTHETIC_MODES,
} from "../src/production/prompt-craft.js";

// ---------------------------------------------------------------------------
// Format inference
// ---------------------------------------------------------------------------

test("inferPackageFormat recognizes common CPG formats from asset metadata", () => {
  assert.equal(inferPackageFormat({ name: "SLAKE Yuzu Ginger Can" }), "can");
  assert.equal(inferPackageFormat({ name: "Protein Tub Chocolate" }), "tub");
  assert.equal(inferPackageFormat({ name: "Recovery Pouch" }), "pouch");
  assert.equal(inferPackageFormat({ name: "Dropper Bottle 30ml" }), "bottle");
  assert.equal(inferPackageFormat({ name: "Gummy Jar Elderberry" }), "jar");
  assert.equal(inferPackageFormat({ name: "Trail Mix Box" }), "box");
  assert.equal(inferPackageFormat({ name: "Hard Cooler 45qt" }), "cooler");
  assert.equal(inferPackageFormat({ name: "Brand hero shot" }), "package");
  assert.equal(inferPackageFormat(null), "package");
});

// ---------------------------------------------------------------------------
// Integration sentence
// ---------------------------------------------------------------------------

test("integrationSentence adds format-specific physical behaviors", () => {
  const canResult = integrationSentence("can");
  assert.match(canResult, /condensation/);
  assert.match(canResult, /photographed in the scene/);

  const pouchResult = integrationSentence("pouch");
  assert.match(pouchResult, /crinkle/);

  const bottleResult = integrationSentence("bottle");
  assert.match(bottleResult, /condensation|edge reflection/);

  const jarResult = integrationSentence("jar");
  assert.match(jarResult, /contact shadow/);
  assert.doesNotMatch(jarResult, /condensation|crinkle/);
});

// ---------------------------------------------------------------------------
// Protection block
// ---------------------------------------------------------------------------

test("world-only protection block prevents invented products and text", () => {
  const block = protectionBlock({ lockedAsset: null, format: null });
  assert.match(block, /no additional focal object/i);
  assert.match(block, /pseudo-text/);
  assert.doesNotMatch(block, /preserve the supplied/i);
  assert.doesNotMatch(block, /No people/);
});

test("world-only protection block adds people exclusion when requested", () => {
  const block = protectionBlock({ lockedAsset: null, format: null, peopleExcluded: true });
  assert.match(block, /No people or hands/);
});

test("non-product locked asset gets identity preservation", () => {
  const block = protectionBlock({
    lockedAsset: { name: "SLAKE wordmark", assetType: "logo" },
    format: "package",
  });
  assert.match(block, /identity source of truth/);
  assert.match(block, /Do not redraw/);
  assert.doesNotMatch(block, /closed and sealed/);
});

test("locked product asset gets format-aware protection with state lock", () => {
  const block = protectionBlock({
    lockedAsset: { name: "SLAKE Yuzu Can", assetType: "packaging" },
    format: "can",
  });
  assert.match(block, /logo, label hierarchy, typography, colors, proportions/);
  assert.match(block, /closed and sealed/);
  assert.match(block, /condensation/);
  assert.match(block, /pseudo-text/);
});

test("non-stateful product format skips the state-lock sentence", () => {
  const block = protectionBlock({
    lockedAsset: { name: "Hero card", assetType: "packaging" },
    format: "package",
  });
  assert.match(block, /Preserve the supplied package/);
  assert.doesNotMatch(block, /closed and sealed/);
});

// ---------------------------------------------------------------------------
// Aesthetic modes
// ---------------------------------------------------------------------------

test("selectAestheticMode detects documentary and editorial signals", () => {
  assert.equal(selectAestheticMode("An observed, documentary feel").id, "documentary_lifestyle");
  assert.equal(selectAestheticMode("Editorial, magazine-quality composition").id, "editorial_commercial");
  assert.equal(selectAestheticMode("Phone-camera vernacular").id, "vernacular_ugc");
  assert.equal(selectAestheticMode("Premium and cinematic").id, "cinematic_film_still");
  assert.equal(selectAestheticMode("").id, "cinematic_film_still");
  assert.equal(selectAestheticMode(null).id, "cinematic_film_still");
});

test("openingLine strips tabletop clause for world-only images", () => {
  const worldOnly = openingLine(AESTHETIC_MODES.cinematic_film_still, false);
  assert.doesNotMatch(worldOnly, /tabletop/);

  const withProduct = openingLine(AESTHETIC_MODES.cinematic_film_still, true);
  // The cinematic opening does not have a tabletop clause in BWS, so both should be the same framing line
  assert.ok(withProduct.length > 20);
});

// ---------------------------------------------------------------------------
// State-lock neutralization
// ---------------------------------------------------------------------------

test("neutralizeStateLanguage rewrites contradictory state language", () => {
  const result = neutralizeStateLanguage("A jar opened on the counter, lid off, contents spilling out");
  assert.match(result.text, /jar closed and sealed/);
  assert.match(result.text, /the lid on/);
  assert.match(result.text, /contents held inside/);
  assert.ok(result.changed.length >= 3);
});

test("neutralizeStateLanguage passes clean prose through unchanged", () => {
  const scene = "A sealed jar resting on a wooden table in morning light.";
  const result = neutralizeStateLanguage(scene);
  assert.equal(result.text, scene);
  assert.equal(result.changed.length, 0);
});

test("neutralizeStateLanguage handles multiple state violations", () => {
  const result = neutralizeStateLanguage("The bottle sits opened, uncapped, with contents visible");
  assert.match(result.text, /sits/);
  assert.doesNotMatch(result.text, /opened/);
  assert.match(result.text, /capped/);
  assert.match(result.text, /contents held inside/);
});

// ---------------------------------------------------------------------------
// Constraint audit
// ---------------------------------------------------------------------------

test("auditConstraints checks guardrails and exclusions against the prompt", () => {
  const prompt = "PROTECTION\nNever pristine: The world should show real use. Also avoid: No showroom polish.";
  const audit = auditConstraints({
    guardrails: [{ title: "Never pristine", body: "The world should show real use." }],
    exclusions: "No showroom polish",
    prompt,
  });
  assert.equal(audit.length, 2);
  assert.equal(audit[0].status, "carried");
  assert.equal(audit[0].source, "Brand Brain guardrail");
  assert.equal(audit[1].status, "carried");
  assert.equal(audit[1].source, "Brief exclusion");
});

test("auditConstraints flags missing rules as review", () => {
  const audit = auditConstraints({
    guardrails: [{ title: "No animals", body: "Never show animals in brand imagery." }],
    exclusions: "",
    prompt: "Create a brand world image with warm lighting.",
  });
  assert.equal(audit.length, 1);
  assert.equal(audit[0].status, "review");
});

test("auditConstraints returns empty for no rules", () => {
  const audit = auditConstraints({ guardrails: [], exclusions: "", prompt: "anything" });
  assert.equal(audit.length, 0);
});
