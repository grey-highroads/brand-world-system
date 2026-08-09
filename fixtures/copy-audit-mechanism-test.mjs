// ADR 0013 mechanism test: copy audit against a synthetic claims fixture.
//
// Run from the repo root:
//   OPENAI_API_KEY=sk-... node fixtures/copy-audit-mechanism-test.mjs
//
// Pass criteria (from the code review):
//   1. Every verbatim violation is flagged as "prohibited".
//   2. Every paraphrase violation is flagged as "prohibited".
//   3. No non-violating adjacent sample is flagged as "prohibited".
//   4. The audit-failed path is exercised and distinguishable from clean.

import { readFileSync } from "fs";
import { auditCopyAgainstClaims } from "../src/claims/copy-audit.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Set OPENAI_API_KEY before running.");
  process.exit(1);
}

const fixture = JSON.parse(readFileSync(new URL("./copy-audit-fixture.json", import.meta.url), "utf-8"));

const approvedClaims = fixture.approved.map((e) => ({ text: e.text, source: e.source_ref }));
const prohibitedClaims = fixture.prohibited.map((e) => ({ text: e.text, source: e.source_ref }));

const results = {
  verbatim: [],
  paraphrase: [],
  adjacent: [],
  errorPath: null,
};

async function runGroup(label, samples) {
  const groupResults = [];
  for (const sample of samples) {
    const audit = await auditCopyAgainstClaims({
      copy: sample,
      approvedClaims,
      prohibitedClaims,
      apiKey,
    });
    const prohibited = (audit.sentences || []).filter((s) => s.classification === "prohibited");
    groupResults.push({
      sample,
      prohibitedCount: prohibited.length,
      prohibited: prohibited.map((s) => ({ sentence: s.sentence, match: s.match, reason: s.reason })),
      error: audit.error || null,
    });
    // Rate limit courtesy
    await new Promise((r) => setTimeout(r, 500));
  }
  return groupResults;
}

async function main() {
  console.log("Running ADR 0013 copy audit mechanism test...\n");

  console.log("Group 1: Verbatim violations (expect all flagged as prohibited)");
  results.verbatim = await runGroup("verbatim", fixture.copy_samples.verbatim_violations);

  console.log("Group 2: Paraphrase violations (expect all flagged as prohibited)");
  results.paraphrase = await runGroup("paraphrase", fixture.copy_samples.paraphrase_violations);

  console.log("Group 3: Adjacent non-violations (expect none flagged as prohibited)");
  results.adjacent = await runGroup("adjacent", fixture.copy_samples.adjacent_non_violations);

  // Group 4: Error path. Send an invalid API key to trigger the error branch.
  console.log("Group 4: Error path (expect { error, sentences: [] })");
  const errorResult = await auditCopyAgainstClaims({
    copy: "This is test copy.",
    approvedClaims,
    prohibitedClaims,
    apiKey: "sk-invalid-key-for-error-path-test",
  });
  results.errorPath = {
    hasError: !!errorResult.error,
    errorMessage: errorResult.error || null,
    sentencesEmpty: Array.isArray(errorResult.sentences) && errorResult.sentences.length === 0,
  };

  // Evaluate pass criteria
  console.log("\n===== RESULTS =====\n");

  const verbatimPass = results.verbatim.every((r) => r.prohibitedCount > 0);
  console.log(`Criterion 1 (verbatim violations flagged): ${verbatimPass ? "PASS" : "FAIL"}`);
  for (const r of results.verbatim) {
    console.log(`  ${r.prohibitedCount > 0 ? "OK" : "MISS"}: "${r.sample.slice(0, 60)}..." -> ${r.prohibitedCount} prohibited`);
  }

  const paraphrasePass = results.paraphrase.every((r) => r.prohibitedCount > 0);
  console.log(`\nCriterion 2 (paraphrase violations flagged): ${paraphrasePass ? "PASS" : "FAIL"}`);
  for (const r of results.paraphrase) {
    console.log(`  ${r.prohibitedCount > 0 ? "OK" : "MISS"}: "${r.sample.slice(0, 60)}..." -> ${r.prohibitedCount} prohibited`);
  }

  const adjacentPass = results.adjacent.every((r) => r.prohibitedCount === 0);
  console.log(`\nCriterion 3 (adjacent non-violations clean): ${adjacentPass ? "PASS" : "FAIL"}`);
  for (const r of results.adjacent) {
    console.log(`  ${r.prohibitedCount === 0 ? "OK" : "FALSE POS"}: "${r.sample.slice(0, 60)}..." -> ${r.prohibitedCount} prohibited`);
  }

  const errorPass = results.errorPath.hasError && results.errorPath.sentencesEmpty;
  console.log(`\nCriterion 4 (error path distinguishable): ${errorPass ? "PASS" : "FAIL"}`);
  console.log(`  error: ${results.errorPath.errorMessage}`);
  console.log(`  sentences empty: ${results.errorPath.sentencesEmpty}`);

  const allPass = verbatimPass && paraphrasePass && adjacentPass && errorPass;
  console.log(`\n===== OVERALL: ${allPass ? "PASS" : "FAIL"} =====`);

  // Output full results as JSON for the evaluation memo
  console.log("\n===== FULL RESULTS JSON =====\n");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
