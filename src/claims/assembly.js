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

/**
 * @param {object} options
 * @param {object} options.claimsDocument - The brand-level claims document (from the claims store).
 * @param {object|null} options.product - An approved product record, or null.
 * @param {function} options.activeEntries - Filter function from the claims store: (doc, section) => active entries.
 * @param {object} [options.jobScope] - The current job's scope for applicability filtering.
 *   Shape: { channel?, placement?, product_id?, campaign_id? }
 * @returns {{ approved: Array, prohibited: Array, disclosures: Array }}
 */
export function assembleClaimsSet({ claimsDocument, product, activeEntries, jobScope }) {
  const approved = [];
  const prohibited = [];
  const disclosures = [];

  // Source one: brand-level claims document.
  if (claimsDocument) {
    for (const entry of activeEntries(claimsDocument, "approved")) {
      if (scopeMatches(entry.scope, jobScope)) {
        approved.push({
          text: entry.text,
          source: entry.source_ref || "Brand claims",
          scope: "brand",
          entry_id: entry.id,
        });
      }
    }
    for (const entry of activeEntries(claimsDocument, "prohibited")) {
      if (scopeMatches(entry.scope, jobScope)) {
        prohibited.push({
          text: entry.text,
          source: entry.source_ref || "Brand claims",
          scope: "brand",
          entry_id: entry.id,
        });
      }
    }
    for (const entry of activeEntries(claimsDocument, "disclosures")) {
      if (triggerScopeMatches(entry.trigger_scope, jobScope)) {
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

// ---------------------------------------------------------------------------
// Scope matching
//
// A claim's scope declares where it applies. A job's scope declares what
// the job targets. The claim applies when its scope matches the job.
//
// brand_wide always matches. Channel, placement, product, and campaign
// scopes match when the job targets the same value.
//
// This is the same applicability logic the image treatment resolver uses.
// ADR 0013 step 5 extends the resolver to handle product and campaign;
// this function implements the copy-side version and will converge with
// the image-side resolver when step 5 lands.
// ---------------------------------------------------------------------------

function scopeMatches(claimScope, jobScope) {
  if (!claimScope || claimScope.brand_wide) return true;
  if (!jobScope) return true; // No job scope means everything applies.

  if (claimScope.channel && jobScope.channel) {
    if (normalizeScope(claimScope.channel) !== normalizeScope(jobScope.channel)) return false;
  }
  if (claimScope.placement && jobScope.placement) {
    if (normalizeScope(claimScope.placement) !== normalizeScope(jobScope.placement)) return false;
  }
  if (claimScope.product_id && jobScope.product_id) {
    if (claimScope.product_id !== jobScope.product_id) return false;
  }
  if (claimScope.campaign_id && jobScope.campaign_id) {
    if (claimScope.campaign_id !== jobScope.campaign_id) return false;
  }
  return true;
}

function triggerScopeMatches(triggerScope, jobScope) {
  // Disclosures with no trigger scope always apply.
  if (!triggerScope) return true;
  // Otherwise defer to the same matching logic.
  return scopeMatches(triggerScope, jobScope);
}

function normalizeScope(value) {
  return String(value || "").toLowerCase().trim();
}
