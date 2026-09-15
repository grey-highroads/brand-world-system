import assert from "node:assert/strict";
import test from "node:test";
import {
  inferPackageFormat,
  integrationSentence,
  protectionBlock,
  neutralizeStateLanguage,
  auditConstraints,
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
  // Updated 2026-08-31 with the compiled prompt reset: stale assertion brought current to the shipped sentence.
  assert.match(canResult, /Place it physically in the scene/);

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

// `peopleExcluded` was removed on 2026-08-18. It was hardcoded false at its
// only call site and never changed a compiled prompt. A person who wants
// nobody in the frame writes it in the brief's exclusions field, which
// compiles verbatim into this same section. The replacement assertion holds
// the removal: no path through this function may assert an absence of people
// on its own authority.
test("protection block never asserts an absence of people on its own", () => {
  for (const block of [
    protectionBlock({ lockedAsset: null, format: null }),
    protectionBlock({ lockedAsset: { name: "SLAKE wordmark", assetType: "logo" }, format: "package" }),
    protectionBlock({ lockedAsset: { name: "SLAKE Yuzu Can", assetType: "packaging" }, format: "can" }),
  ]) {
    assert.doesNotMatch(block, /No (?:additional )?people or hands/);
  }
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
  // Updated 2026-08-31 with the compiled prompt reset: stale assertion brought current to the shipped fidelity sentence.
  assert.match(block, /governs artwork and geometry only/);
  assert.match(block, /logo, wordmark, typography, label hierarchy/);
  assert.match(block, /closed and sealed/);
  assert.match(block, /condensation/);
  assert.match(block, /pseudo-text/);
});

test("non-stateful product format skips the state-lock sentence", () => {
  const block = protectionBlock({
    lockedAsset: { name: "Hero card", assetType: "packaging" },
    format: "package",
  });
  // Updated 2026-08-31 with the compiled prompt reset: stale assertion brought current to the shipped fidelity sentence.
  assert.match(block, /The supplied package governs artwork and geometry only/);
  assert.doesNotMatch(block, /closed and sealed/);
});

// ---------------------------------------------------------------------------
// Aesthetic modes
// ---------------------------------------------------------------------------

// The aesthetic modes tests were removed on 2026-08-19 with the system they
// covered. Three of them exercised selectAestheticMode signal matching and
// openingLine's tabletop clause; the fourth asserted that no opening line
// hardcoded an aspect ratio word. ADR 0018 ruling five retired the system, so
// there is nothing left for them to hold.
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

test("the measured proportion section states the ratio in plain words", async () => {
  const { measuredProportionSection } = await import("../src/production/prompt-craft.js");
  const tall = measuredProportionSection({ width: 500, height: 1200 });
  assert.match(tall, /2\.4 times as tall as it is wide/);
  assert.match(tall, /do not widen it/);
  const wide = measuredProportionSection({ width: 1200, height: 500 });
  assert.match(wide, /2\.4 times as wide as it is tall/);
  const square = measuredProportionSection({ width: 1000, height: 1050 });
  assert.match(square, /about as tall as it is wide/);
  assert.equal(measuredProportionSection(null), "");
  assert.equal(measuredProportionSection({ width: 0, height: 500 }), "");
});

test("the proportion compiles as its own scene section and is absent when unmeasured", async () => {
  const { compileBrandWorldImagePackage } = await import("../src/production/package.js");
  const section = (id, name) => ({ id, name, summary: `${name}.`, principles: [name], productionUse: name });
  const inputs = {
    approvedBrain: {
      brandName: "Test Brand",
      brandDescription: "A test brand",
      synthesisSummary: "Summary.",
      sourceCount: 1,
      guidanceSections: [
        section("foundation", "Brand foundation"), section("identity", "Identity"),
        section("world", "World and story"), section("voice", "Voice and messaging"),
        section("creative", "Creative direction"), section("rules", "Creative rules"),
      ],
      artifacts: {},
    },
    brainVersion: 1,
    brief: { scene: "A can rests on a workbench in afternoon light.", placement: "Instagram feed", format: "4:5 portrait" },
    lockedAsset: { source: { id: "s1", name: "Can cut-out" }, file: { name: "can.png", type: "image/png", blobPathname: "brand-world-system/clients/default/sources/can.png" } },
  };
  const withMeasure = compileBrandWorldImagePackage({ ...inputs, lockedAssetProportion: { width: 500, height: 1200 } });
  assert.match(withMeasure.prompt, /SUPPLIED PRODUCT IMAGE/);
  assert.match(withMeasure.prompt, /2\.4 times as tall as it is wide/);

  const withoutMeasure = compileBrandWorldImagePackage({ ...inputs });
  assert.doesNotMatch(withoutMeasure.prompt, /SUPPLIED PRODUCT IMAGE/);

  const template = compileBrandWorldImagePackage({ ...inputs, brief: { scene: "A surface.", placement: "Brand template", format: "4:5 portrait", deliverable: "template" }, lockedAssetProportion: { width: 500, height: 1200 } });
  assert.doesNotMatch(template.prompt, /SUPPLIED PRODUCT IMAGE/);
});

test("the stated real-world size compiles into relational scale language", async () => {
  const { realWorldScaleSentences } = await import("../src/production/prompt-craft.js");
  const slim = realWorldScaleSentences({ height_cm: 13.4, width_cm: 5.3 });
  assert.match(slim, /13\.4 centimeters tall and 5\.3 centimeters across/);
  assert.match(slim, /shorter than the hand is long/);
  assert.match(slim, /closes fully around it, fingers overlapping the thumb/);
  assert.match(slim, /Do not render the product larger than this real size/);

  const bottle = realWorldScaleSentences({ height_cm: 30 });
  assert.doesNotMatch(bottle, /the product is small/);
  assert.doesNotMatch(bottle, /hand's length tall/);

  const tallboy = realWorldScaleSentences({ height_cm: 18, width_cm: 6.9 });
  assert.match(tallboy, /about a hand's length tall/);

  assert.equal(realWorldScaleSentences(null), "");
  assert.equal(realWorldScaleSentences({ height_cm: 0 }), "");
});

test("the compiled section carries both facts when the product states a size", async () => {
  const { compileBrandWorldImagePackage } = await import("../src/production/package.js");
  const section = (id, name) => ({ id, name, summary: `${name}.`, principles: [name], productionUse: name });
  const approvedBrain = {
    brandName: "Test Brand", brandDescription: "A test brand", synthesisSummary: "Summary.", sourceCount: 1,
    guidanceSections: [
      section("foundation", "Brand foundation"), section("identity", "Identity"),
      section("world", "World and story"), section("voice", "Voice and messaging"),
      section("creative", "Creative direction"), section("rules", "Creative rules"),
    ],
    artifacts: {},
  };
  const compiled = compileBrandWorldImagePackage({
    approvedBrain,
    brainVersion: 1,
    brief: { scene: "A can rests on a workbench.", placement: "Instagram feed", format: "4:5 portrait" },
    lockedAsset: { source: { id: "s1", name: "Can cut-out" }, file: { name: "can.png", type: "image/png", blobPathname: "brand-world-system/clients/default/sources/can.png" } },
    lockedAssetProportion: { width: 500, height: 1200 },
    product: { product_id: "p1", product_name: "Test Can", physical_size: { height_cm: 13.4, width_cm: 5.3 } },
  });
  assert.match(compiled.prompt, /2\.4 times as tall as it is wide/);
  assert.match(compiled.prompt, /13\.4 centimeters tall/);
  assert.match(compiled.prompt, /Size everything in the scene against that/);
});
