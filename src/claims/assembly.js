// Assemble the governed claims set for a production job (ADR 0013).
//
// Two sources, one union:
// 1. Brand-level claims document (approved, prohibited, disclosures),
//    filtered by scope to match the current job.
// 2. Approved product record (approved_claim_language as approved claims,
//    exclusions as prohibited claims), when the job names a product.
//
// The assembly is a union of two reads. Nothing is paraphrased, merged,
// or reconciled.
//
// Fail direction is asymmetric (code review 2026-08-09):
//   approved  -> fail closed (exclude when axis unresolvable)
//   prohibited -> fail open  (include when axis unresolvable)
//   disclosures -> fail closed

import { objectScopeAppliesToJob } from "../scope/resolver.js";

const FAIL_CLOSED = { unmatchedAxis: "exclude" };
const FAIL_OPEN   = { unmatchedAxis: "include" };

/**
 * @param {object} options
 * @param {object} options.claimsDocument - The brand-level claims document (from the claims store).
 * @param {object|null} options.product - An approved product record, or null.
 * @param {function} options.activeEntries - Filter function from the claims store: (doc, section) => active entries.
 * @param {object} [options.jobScope] - Normalized job scope from buildJobScope.
 * @returns {{ approved: Array, prohibited: Array, disclosures: Array }}
 */
export function assembleClaimsSet({ claimsDocument, product, activeEntries, jobScope }) {
  const approved = [];
  const prohibited = [];
  const disclosures = [];

  // Source one: brand-level claims document.
  if (claimsDocument) {
    for (const entry of activeEntries(claimsDocument, "approved")) {
      if (objectScopeAppliesToJob(entry.scope, jobScope, FAIL_CLOSED)) {
        approved.push({
          text: entry.text,
          source: entry.source_ref || "Brand claims",
          scope: "brand",
          entry_id: entry.id,
        });
      }
    }
    for (const entry of activeEntries(claimsDocument, "prohibited")) {
      if (objectScopeAppliesToJob(entry.scope, jobScope, FAIL_OPEN)) {
        prohibited.push({
          text: entry.text,
          source: entry.source_ref || "Brand claims",
          scope: "brand",
          entry_id: entry.id,
        });
      }
    }
    for (const entry of activeEntries(claimsDocument, "disclosures")) {
      if (objectScopeAppliesToJob(entry.trigger_scope, jobScope, FAIL_CLOSED)) {
        disclosures.push({
          text: entry.text,
          source: entry.source_ref || "Brand claims",
          trigger_scope: entry.trigger_scope,
          entry_id: entry.id,
        });
      }
    }
  }

  // Source two: approved product record.
  if (product) {
    for (const feature of product.features || []) {
      if (feature.approved_claim_language) {
        approved.push({
          text: feature.approved_claim_language,
          source: `Product: ${product.product_name}, feature: ${feature.name}`,
          scope: "product",
        });
      }
    }
    for (const exclusion of product.exclusions || []) {
      prohibited.push({
        text: exclusion,
        source: `Product: ${product.product_name}`,
        scope: "product",
      });
    }
  }

  return { approved, prohibited, disclosures };
}
