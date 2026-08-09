// Scope resolution (roadmap item 3, ADR 0013 step 5).
//
// A single scope-matching module consumed by both the image production
// path (package.js, treatments) and the copy governance path (claims
// assembly). Replaces the inline scopeAppliesToPlacement in package.js
// and the inline scopeMatches in claims/assembly.js.
//
// Two scope formats coexist:
//
// 1. Brain review question scope: an array of entries, each either
//    [label, value] or {label, value}. This is what the brain synthesis
//    emits on scoped rules (e.g., [{label: "channel", value: "paid social"}]).
//
// 2. Claims document scope: a plain object with optional keys
//    (brand_wide, channel, placement, product_id, campaign_id). This is
//    what the claims store uses.
//
// Both are checked against a normalized job scope built from the production
// brief's placement, product, and campaign.

// ---------------------------------------------------------------------------
// Placement-to-channel mapping
// ---------------------------------------------------------------------------

const placementScopes = {
  "Instagram feed": { channel: "social", platform: "instagram" },
  "Instagram story": { channel: "social", platform: "instagram" },
  "LinkedIn feed": { channel: "social", platform: "linkedin" },
  "Facebook feed": { channel: "social", platform: "facebook" },
  "X feed": { channel: "social", platform: "x" },
  "Threads feed": { channel: "social", platform: "threads" },
  "Pinterest pin": { channel: "social", platform: "pinterest" },
  "TikTok cover": { channel: "social", platform: "tiktok" },
  "YouTube thumbnail": { channel: "social", platform: "youtube" },
  "Website feature": { channel: "web", platform: "website" },
  "Website hero": { channel: "web", platform: "website" },
  "Blog header": { channel: "web", platform: "website" },
  "Email hero": { channel: "email", platform: "email" },
  "Sales enablement": { channel: "sales", platform: "collateral" },
  "Brand template": { channel: "brand", platform: "template" },
  "Presentation slide": { channel: "presentation", platform: "slides" },
  // Paid placements
  "Meta feed ad": { channel: "paid_social", platform: "meta" },
  "Meta story ad": { channel: "paid_social", platform: "meta" },
  "LinkedIn sponsored": { channel: "paid_social", platform: "linkedin" },
  "X promoted": { channel: "paid_social", platform: "x" },
  "Google display": { channel: "display", platform: "google" },
  "Display ad": { channel: "display", platform: "display" },
};

// ---------------------------------------------------------------------------
// Build a normalized job scope from production context
// ---------------------------------------------------------------------------

/**
 * @param {object} options
 * @param {string} [options.placement] - The job's placement string (e.g. "Instagram feed").
 * @param {string} [options.productId] - The job's product id.
 * @param {string} [options.campaignId] - The job's campaign id.
 * @returns {{ channel: string|null, platform: string|null, product_id: string|null, campaign_id: string|null }}
 */
export function buildJobScope({ placement, productId, campaignId } = {}) {
  const mapped = placementScopes[placement] || {};
  return {
    channel: mapped.channel || null,
    platform: mapped.platform || null,
    placement: placement || null,
    product_id: productId || null,
    campaign_id: campaignId || null,
  };
}

// ---------------------------------------------------------------------------
// Scope matching: array format (brain review questions)
// ---------------------------------------------------------------------------

/**
 * Check whether a brain review question's scope array applies to the
 * current job scope. This is the extended version of the original
 * scopeAppliesToPlacement, now handling product and campaign axes.
 *
 * @param {Array} ruleScope - Array of [label, value] or {label, value}.
 * @param {object} jobScope - Normalized job scope from buildJobScope.
 * @returns {boolean}
 */
export function arrayScopeAppliesToJob(ruleScope, jobScope) {
  if (!ruleScope || !ruleScope.length) return true;
  if (!jobScope) return true;

  for (const entry of ruleScope) {
    const label = normalize(Array.isArray(entry) ? entry[0] : entry.label || "");
    const value = normalize(Array.isArray(entry) ? entry[1] : entry.value || "");

    if (label === "channel" || label === "channels") {
      if (value !== "all channels" && jobScope.channel && !value.includes(jobScope.channel)) {
        return false;
      }
    }

    if (label === "placements" || label === "placement") {
      if (!value.startsWith("all") && jobScope.platform && !value.includes(jobScope.platform)) {
        return false;
      }
    }

    if (label === "product" || label === "product_id" || label === "products") {
      if (value !== "all products" && jobScope.product_id && !value.includes(normalize(jobScope.product_id))) {
        return false;
      }
    }

    if (label === "campaign" || label === "campaign_id" || label === "campaigns") {
      if (value !== "all campaigns" && jobScope.campaign_id && !value.includes(normalize(jobScope.campaign_id))) {
        return false;
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Scope matching: object format (claims document)
// ---------------------------------------------------------------------------

/**
 * Check whether a claims entry's scope object applies to the current
 * job scope. Replaces the inline scopeMatches in claims/assembly.js.
 *
 * @param {object} claimScope - Object with optional keys: brand_wide, channel,
 *   placement, product_id, campaign_id.
 * @param {object} jobScope - Normalized job scope from buildJobScope.
 * @returns {boolean}
 */
export function objectScopeAppliesToJob(claimScope, jobScope) {
  if (!claimScope || claimScope.brand_wide) return true;
  if (!jobScope) return true;

  if (claimScope.channel && jobScope.channel) {
    if (normalize(claimScope.channel) !== normalize(jobScope.channel)) return false;
  }
  if (claimScope.placement && jobScope.placement) {
    // Check against both the raw placement string and the mapped platform.
    const claimPlacement = normalize(claimScope.placement);
    const jobPlacement = normalize(jobScope.placement);
    const jobPlatform = normalize(jobScope.platform || "");
    if (claimPlacement !== jobPlacement && !jobPlatform.includes(claimPlacement)) return false;
  }
  if (claimScope.product_id && jobScope.product_id) {
    if (claimScope.product_id !== jobScope.product_id) return false;
  }
  if (claimScope.campaign_id && jobScope.campaign_id) {
    if (claimScope.campaign_id !== jobScope.campaign_id) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------

/**
 * Check whether a scope declaration applies to a job. Detects the format
 * (array or object) and dispatches to the right matcher.
 *
 * @param {Array|object} scope - The rule or claim's scope declaration.
 * @param {object} jobScope - Normalized job scope from buildJobScope.
 * @returns {boolean}
 */
export function scopeAppliesToJob(scope, jobScope) {
  if (Array.isArray(scope)) {
    return arrayScopeAppliesToJob(scope, jobScope);
  }
  return objectScopeAppliesToJob(scope, jobScope);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}
