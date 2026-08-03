const deliverables = [
  {
    id: "product-lifestyle",
    name: "Product lifestyle image",
    description: "Create a one-off image around an approved product.",
    contract: "Exact product in a generated scene. Image-only output.",
    active: "Yuzu Ginger in progress · 1 active",
    available: true,
  },
  {
    id: "product-showcase",
    name: "Product showcase",
    description: "Create a polished, product-focused image with an approved pack.",
    contract: "Exact product in a flexible composition. Image-only output.",
  },
  {
    id: "instagram-story",
    name: "Instagram story",
    description: "Create a 9:16 graphic with an optional headline.",
    contract: "Product and logo stay exact. Text is an editable layer.",
  },
  {
    id: "social-feed",
    name: "Social feed image",
    description: "Create a 4:5 or square graphic with optional text.",
    contract: "Placement and format resolve the output contract.",
  },
  {
    id: "static-ad",
    name: "Static ad",
    description: "Create artwork plus the fields required for publishing.",
    contract: "Artwork, platform copy, CTA, and destination travel together.",
  },
  {
    id: "blog-hero",
    name: "Blog post hero",
    description: "Create image-only art for a recurring article placement.",
    contract: "Composition respects the configured editorial safe area.",
  },
];

const placementFormats = {
  "Instagram feed": ["4:5 portrait", "1:1 square"],
  "Instagram story": ["9:16 portrait"],
  "LinkedIn feed": ["1:1 square", "1.91:1 landscape"],
  "Website feature": ["16:9 landscape", "4:3 landscape"],
};

const referenceLibrary = [
  {
    id: "afternoon-reset",
    name: "Afternoon reset",
    detail: "Warm window light and an unhurried domestic moment",
    sourceType: "Approved library image",
    provenance: "SLAKE brand library · asset 172",
    role: "Lighting + mood",
    influence: "Strong",
    usageInstruction: "Use the warm side light and everyday emotional register; ignore the subject’s clothing.",
    confidence: "High",
    evidence: ["low window light from camera left", "unhurried domestic gesture"],
    thumb: "light",
  },
  {
    id: "lifestyle-composition",
    name: "Lifestyle composition",
    detail: "Product-forward framing with human context",
    sourceType: "Approved library image",
    provenance: "SLAKE brand library · asset 208",
    role: "Composition",
    influence: "Supporting",
    usageInstruction: "Borrow the product-to-person scale and negative space; do not copy the setting.",
    confidence: "High",
    evidence: ["product remains readable at a human scale", "negative space above and right"],
    thumb: "composition",
  },
  {
    id: "surface-study",
    name: "Surface and material study",
    detail: "Pale stone, tactile linen, and honest domestic wear",
    sourceType: "Uploaded image",
    provenance: "Added to this job · surface-study.jpg",
    role: "Materials",
    influence: "Supporting",
    usageInstruction: "Use only the stone, linen, and softly worn material behavior.",
    confidence: "High",
    evidence: ["pale honed stone", "natural linen with visible weave"],
    thumb: "light",
  },
  {
    id: "social-rhythm-grid",
    name: "Everyday social rhythm",
    detail: "A grid of small, candid reset moments across the day",
    sourceType: "Image grid",
    provenance: "SLAKE reference board · grid 04",
    role: "Style calibration",
    influence: "Light",
    usageInstruction: "Use the candid pacing as calibration; do not reproduce a grid or any individual tile.",
    confidence: "Medium",
    evidence: ["alternating close and medium distance", "consistent warm-neutral palette"],
    thumb: "grid",
  },
];

const brainBatch = {
  id: "slake-foundational-library-001",
  name: "SLAKE foundational library",
  assetCount: 50,
  cleanCount: 47,
  sources: ["Website export", "Strategy deck", "Campaign archive", "Stakeholder notes"],
  rights: "Ownership checked · Cleared for internal use",
};

const brainExceptions = [
  {
    id: "audience-alignment-conflict",
    type: "contradiction",
    typeLabel: "Conflicting guidance",
    signal: "Strong match",
    title: "Audience alignment conflict",
    summary: "Two trusted-looking sources describe very different audiences for SLAKE.",
    origin: "Found by comparing sources",
    confidence: "High",
    method: "We compared how each source describes the audience and found a meaningful mismatch.",
    rationale: "The two sources imply different casting, pacing, environments, and narrative priorities.",
    relationships: ["Audience", "Visual style", "Casting"],
    evidence: [
      {
        label: "Strategy deck",
        ref: "Source 017 · slide 12",
        quote: "The SLAKE consumer is the ambitious optimizer, seeking peak performance and metabolic efficiency.",
      },
      {
        label: "Website export",
        ref: "Source 042 · About",
        quote: "The SLAKE consumer seeks an unhurried domestic reset and a quiet moment of recovery.",
      },
    ],
    actions: [
      {
        id: "keep-source-a",
        label: "Keep strategy deck guidance",
        detail: "Use the optimizer definition. Keep the website excerpt attached as background only.",
      },
      {
        id: "keep-source-b",
        label: "Keep website guidance",
        detail: "Use the unhurried-reset definition. Keep the strategy excerpt attached as background only.",
      },
      {
        id: "keep-both",
        label: "Keep both as valid guidance",
        detail: "Keep both for different situations. Neither one automatically takes priority over the other.",
      },
      {
        id: "leave-unresolved",
        label: "Leave unresolved",
        detail: "Keep both sources for reference, but do not use this audience guidance in future work yet.",
      },
    ],
  },
  {
    id: "yuzu-pack-duplicate",
    type: "duplicate",
    typeLabel: "Possible duplicate",
    signal: "Exact file match",
    title: "Yuzu Ginger pack renders",
    summary: "Two differently named files appear to contain the same pack render.",
    origin: "Found by comparing files",
    confidence: "High",
    method: "The file contents and every pixel match, even though the filenames are different.",
    rationale: "Keeping both without a clear reason could hide where each file came from and make the wrong one easier to choose.",
    relationships: ["Yuzu Ginger", "Approved product image", "Packaging"],
    evidence: [
      {
        label: "Campaign archive",
        ref: "slake_yg_v3.png",
        quote: "SHA-256 61ca…92f1 · 4000 × 4000 · approved campaign export",
      },
      {
        label: "Stakeholder notes",
        ref: "Pack_Master_FINAL.png",
        quote: "SHA-256 61ca…92f1 · 4000 × 4000 · attached to product handoff",
      },
    ],
    actions: [
      {
        id: "keep-file-a",
        label: "Keep slake_yg_v3.png",
        detail: "Use the campaign archive file. Keep the second filename in the record for reference.",
      },
      {
        id: "keep-file-b",
        label: "Keep Pack_Master_FINAL.png",
        detail: "Use the stakeholder handoff file. Keep the campaign filename in the record for reference.",
      },
      {
        id: "keep-both",
        label: "Keep both as distinct records",
        detail: "Keep both available with their own source history. Similar files may serve different valid purposes.",
      },
      {
        id: "leave-unresolved",
        label: "Leave unresolved",
        detail: "Keep both files in the library, but do not offer either one for future work yet.",
      },
    ],
  },
  {
    id: "four-pm-reset",
    type: "suspected-canon",
    typeLabel: "Possible brand principle",
    signal: "Found in 11 assets",
    title: "The 4pm Reset ritual",
    summary: "A repeated brand idea appears across past work, but no guideline formally defines it.",
    origin: "Suggested by the system",
    confidence: "Medium",
    method: "We found the same visual and storytelling pattern across 11 separate pieces of past work.",
    rationale: "The pattern is useful and consistent, but repetition alone does not make it core brand guidance.",
    relationships: ["Brand story", "Audience", "Photography", "Creative guidance"],
    evidence: [
      {
        label: "Campaign archive",
        ref: "7 supporting assets",
        quote: "Late-afternoon domestic pauses recur with warm side light, a single can, and unfinished everyday activity.",
      },
      {
        label: "Strategy and notes",
        ref: "4 supporting assets",
        quote: "The phrase 4pm Reset appears repeatedly, but no source declares it an approved identity principle.",
      },
    ],
    actions: [
      {
        id: "contextual",
        label: "Use as helpful guidance",
        detail: "Make the ritual available for future work while keeping it clearly marked as a system suggestion.",
      },
      {
        id: "evidence-only",
        label: "Keep as reference only",
        detail: "Keep the pattern and its source material, but do not use it to guide future work.",
      },
      {
        id: "dismiss-proposal",
        label: "Discard this suggestion",
        detail: "Remove the suggestion from review while keeping the original source material in the library.",
      },
    ],
  },
  {
    id: "no-medical-health-claims",
    type: "brand-rule",
    typeLabel: "Brand rule",
    signal: "Needs a decision",
    title: "Avoid medical or health claims",
    summary: "A proposed rule would keep medical claims and clinical styling out of SLAKE paid social.",
    origin: "Suggested by the system",
    confidence: "High",
    statement: "Do not add medicinal cues, health claims, treatment language, or clinical styling.",
    rationale: "SLAKE should feel restorative without making a health promise or appearing clinical.",
    scope: [
      ["Brand", "SLAKE"],
      ["Products", "All products"],
      ["Channel", "Paid social"],
      ["Placements", "All paid-social placements"],
      ["Formats", "All paid-social formats"],
      ["Campaigns", "All campaigns"],
    ],
    evidence: [
      {
        label: "Strategy deck",
        ref: "Claims boundaries",
        quote: "The approved positioning is restorative and everyday, without medical, treatment, or clinical promises.",
      },
      {
        label: "Campaign review notes",
        ref: "Repeated correction",
        quote: "Medical symbols, treatment language, and clinical-white styling were repeatedly removed from paid-social work.",
      },
    ],
    actions: [
      {
        id: "use-rule",
        label: "Use this rule",
        detail: "Apply it to future paid-social work for SLAKE. This adds the rule to core brand guidance.",
      },
      {
        id: "keep-for-later",
        label: "Keep for later",
        detail: "Save the suggestion and its evidence, but do not apply it to future work yet.",
      },
      {
        id: "discard-suggestion",
        label: "Discard this suggestion",
        detail: "Remove the suggestion from review. The original sources remain available in the library.",
      },
    ],
  },
];

const state = {
  screen: "chooser",
  selectedDeliverable: deliverables[0],
  brief: {
    scene:
      "Lifestyle image for Yuzu Ginger. Warm interior, late-afternoon light, the 4pm reset moment. One person, unhurried, mid-task.",
    exclusions: "Glossy wellness styling, ingredient piles, medical cues, or added copy.",
    placement: "Instagram feed",
    format: "4:5 portrait",
  },
  references: referenceLibrary.slice(0, 2).map((item) => ({ ...item })),
  sourcePickerOpen: false,
  brain: {
    selectedExceptionId: brainExceptions[0].id,
    cleanApproved: false,
    resolutions: {},
    promotionRationale: "Make the 4pm Reset part of SLAKE's core brand guidance while keeping its supporting sources attached.",
    canonPromoted: false,
  },
  toast: "",
};

const root = document.querySelector("#app");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentCrumb() {
  if (state.screen === "brain") return "Brand brain / Review";
  if (state.screen === "brain-canon") return "Brand brain / Core guidance";
  if (state.screen === "chooser") return "Production";
  if (state.screen === "brief") return "Production / Product lifestyle image";
  if (state.screen === "preflight") return "Production / Product lifestyle image / Preflight";
  return "Production / Product lifestyle image / Result";
}

function shell(content) {
  const inBrain = state.screen.startsWith("brain");
  const attentionCount = inBrain
    ? brainExceptions.filter((item) => !state.brain.resolutions[item.id]).length
    : 3;
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <button class="brand-switcher" type="button" aria-label="Switch brand">
          <span class="brand-mark">S</span>
          <span>
            <span class="brand-name">SLAKE</span>
            <span class="brand-description">Adaptogen sparkling water</span>
          </span>
          <span aria-hidden="true">⌄</span>
        </button>

        <nav class="sidebar-nav" aria-label="Primary navigation">
          ${navItem("Workspace", false)}
          ${navItem("Production", !inBrain, "chooser")}
          ${navItem("Brand brain", inBrain, "brand-brain")}
          ${navItem("Library", false)}
          ${navItem("Activity", false)}
        </nav>

        <div class="sidebar-footer">
          <p class="eyebrow">Workspace</p>
          ${navItem("Workflow settings", false)}
          <div class="profile">
            <span class="avatar">AL</span>
            <span>
              <strong>Alex Lin</strong>
              <span>SLAKE project</span>
            </span>
          </div>
        </div>
      </aside>

      <main class="main-column">
        <header class="topbar">
          <div class="breadcrumb"><strong>SLAKE</strong> &nbsp;/&nbsp; ${escapeHtml(currentCrumb())}</div>
          <div class="search">Search knowledge, jobs, and assets</div>
          <div class="attention-pill">Needs you <span>${attentionCount}</span></div>
        </header>
        ${content}
      </main>
      ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ""}
    </div>
  `;
}

function navItem(label, active, action = "") {
  return `
    <button
      class="nav-item ${active ? "active" : ""}"
      type="button"
      ${action ? `data-action="${action}"` : ""}
      ${active ? 'aria-current="page"' : ""}
    >
      <span class="nav-glyph" aria-hidden="true"></span>
      <span>${label}</span>
    </button>
  `;
}

function pageHeader(title, description) {
  return `
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(title)}</h1>
      <p class="page-description">${escapeHtml(description)}</p>
    </header>
  `;
}

function renderChooser() {
  const cards = deliverables
    .map(
      (item, index) => `
        <button
          class="deliverable-card ${index === 0 ? "featured" : ""}"
          type="button"
          ${item.available ? `data-action="choose-deliverable" data-id="${item.id}"` : "disabled"}
        >
          <span class="card-topline">
            <h2>${escapeHtml(item.name)}</h2>
            ${item.available ? '<span class="card-arrow" aria-hidden="true">›</span>' : '<span class="mini-pill">Configured</span>'}
          </span>
          <p>${escapeHtml(item.description)}</p>
          <span class="contract-line">${escapeHtml(item.contract)}</span>
          ${item.active ? `<span class="active-note">${escapeHtml(item.active)}</span>` : ""}
        </button>
      `,
    )
    .join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "Choose a deliverable",
        "Choose from SLAKE’s configured production workflows. Brand rules and output structure travel with the work.",
      )}
      <div class="grid deliverable-grid">${cards}</div>
    </section>
  `);
}

function selectedBrainException() {
  return brainExceptions.find((item) => item.id === state.brain.selectedExceptionId) ?? brainExceptions[0];
}

function brainStatusClass(type) {
  if (type === "contradiction") return "danger";
  if (type === "suspected-canon") return "governed";
  if (type === "brand-rule") return "rule";
  return "evidence";
}

function brainResolutionLabel(resolution) {
  if (!resolution) return "";
  if (resolution === "leave-unresolved") return "Deferred";
  if (resolution === "evidence-only") return "Evidence only";
  if (["dismiss-proposal", "discard-suggestion"].includes(resolution)) return "Discarded";
  if (resolution === "keep-for-later") return "Saved for later";
  if (resolution === "use-rule") return "In use";
  return "Resolved";
}

function brainQueueItem(item) {
  const active = item.id === state.brain.selectedExceptionId;
  const resolution = state.brain.resolutions[item.id];
  return `
    <button
      class="brain-queue-item ${active ? "active" : ""}"
      type="button"
      data-action="select-brain-exception"
      data-id="${escapeHtml(item.id)}"
      ${active ? 'aria-current="true"' : ""}
    >
      <span class="brain-queue-topline">
        <span class="brain-status ${brainStatusClass(item.type)}">${escapeHtml(item.typeLabel)}</span>
        <span class="brain-signal">${resolution ? brainResolutionLabel(resolution) : escapeHtml(item.signal)}</span>
      </span>
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.summary)}</span>
    </button>
  `;
}

function brainEvidenceCard(item) {
  return `
    <article class="brain-evidence-card">
      <span class="brain-evidence-topline">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.ref)}</span>
      </span>
      <p>${escapeHtml(item.quote)}</p>
    </article>
  `;
}

function brainDecisionAction(action, selected, activeResolution) {
  return `
    <button
      class="brain-decision-action ${activeResolution === action.id ? "selected" : ""}"
      type="button"
      data-action="resolve-brain-exception"
      data-id="${escapeHtml(selected.id)}"
      data-resolution="${escapeHtml(action.id)}"
    >
      <span class="brain-decision-title"><strong>${escapeHtml(action.label)}</strong><span aria-hidden="true">›</span></span>
      <span>${escapeHtml(action.detail)}</span>
    </button>
  `;
}

function renderBrandBrain() {
  const selected = selectedBrainException();
  const resolution = state.brain.resolutions[selected.id];
  const canonReady = selected.id === "four-pm-reset" && resolution === "contextual";
  const isBrandRule = selected.type === "brand-rule";
  const queue = brainExceptions.map(brainQueueItem).join("");
  const evidence = selected.evidence.map(brainEvidenceCard).join("");
  const relationships = (selected.relationships ?? [])
    .map((relationship) => `<span>${escapeHtml(relationship)}</span>`)
    .join("");
  const actions = selected.actions.map((action) => brainDecisionAction(action, selected, resolution)).join("");
  const detailContent = isBrandRule
    ? `
        <div class="brain-rule-detail">
          <section class="brain-rule-statement">
            <span class="section-label">What this rule says</span>
            <p>${escapeHtml(selected.statement)}</p>
          </section>

          <section>
            <span class="section-label">Why this matters</span>
            <p>${escapeHtml(selected.rationale)}</p>
          </section>

          <section>
            <span class="section-label">Where this came from</span>
            <div class="brain-evidence-grid">${evidence}</div>
          </section>

          <section>
            <span class="section-label">Where this applies</span>
            <div class="brain-rule-scope">
              ${selected.scope
                .map(
                  ([label, value]) => `
                    <span><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></span>
                  `,
                )
                .join("")}
            </div>
          </section>

          <section>
            <span class="section-label">When it does not apply</span>
            <div class="brain-rule-empty">
              <strong>No exceptions in this version</strong>
              <span>If the rule feels too broad, keep it for later and refine it outside this review.</span>
            </div>
          </section>
        </div>
      `
    : `
        <section class="brain-detail-section">
          <span class="section-label">What we found</span>
          <div class="brain-evidence-grid">${evidence}</div>
        </section>

        <div class="brain-reasoning-grid">
          <section><span class="section-label">How we found it</span><p>${escapeHtml(selected.method)}</p></section>
          <section><span class="section-label">Why this matters</span><p>${escapeHtml(selected.rationale)}</p></section>
        </div>

        <div class="brain-relationships">
          <span class="section-label">What this could affect</span>
          <span class="evidence-chips">${relationships}</span>
        </div>
      `;
  const ruleOutcome = {
    "use-rule": "This rule will guide future SLAKE paid-social work.",
    "keep-for-later": "The suggestion and its evidence are saved, but the rule will not guide future work yet.",
    "discard-suggestion": "The suggestion is closed. Its original source material remains in the library.",
  }[resolution];
  const decisionFollowUp = isBrandRule
    ? `
        <section class="brain-rule-outcome ${resolution ? "decided" : ""}">
          <span class="section-label">What happens next</span>
          <p>${escapeHtml(ruleOutcome ?? "Choose an option above. Nothing changes until you make a decision.")}</p>
        </section>
      `
    : `
        <section class="brain-canon-gate ${canonReady ? "ready" : ""}">
          <span class="brain-canon-heading"><strong>Core brand guidance</strong><span>${canonReady ? "Ready to review" : "Reviewed separately"}</span></span>
          <p>${
            selected.id === "four-pm-reset"
              ? canonReady
                ? "This pattern is now available as helpful guidance. You can separately decide whether it should become part of SLAKE's core brand guidance."
                : "First choose ‘Use as helpful guidance.’ Adding it to core brand guidance remains a separate decision."
              : "This decision resolves only this review item. It does not change SLAKE's core brand guidance."
          }</p>
          <button
            class="button ${canonReady ? "secondary" : ""}"
            type="button"
            data-action="review-canon-promotion"
            ${canonReady ? "" : "disabled"}
          >Review change to core guidance</button>
        </section>

        <section class="brain-policy-note">
          <span class="section-label">Brand rule</span>
          <strong>Avoid medical or health claims</strong>
          <span>Applies to SLAKE paid social</span>
        </section>
      `;

  return shell(`
    <section class="workspace brain-workspace">
      ${pageHeader(
        "Build the Brand Brain",
        "Review the few items that need a decision. Everything else can move forward quickly without changing the brand's core guidance.",
      )}

      <section class="brain-fast-path">
        <div class="brain-batch-identity">
          <span class="section-label">Batch</span>
          <strong>${escapeHtml(brainBatch.name)}</strong>
          <span>${brainBatch.assetCount} assets · ${escapeHtml(brainBatch.sources.join(" · "))}</span>
        </div>
        <div class="brain-clean-count">
          <span class="brain-clean-dot" aria-hidden="true"></span>
          <span><strong>${brainBatch.cleanCount} clean assets</strong><span>${escapeHtml(brainBatch.rights)}</span></span>
        </div>
        <div class="brain-fast-action">
          <span>Approved items can be used in future work. Your core brand guidance stays the same.</span>
          <button
            class="button primary"
            type="button"
            data-action="approve-clean-assets"
            ${state.brain.cleanApproved ? "disabled" : ""}
          >${state.brain.cleanApproved ? "47 approved for future work" : "Approve 47 for future work"}</button>
        </div>
      </section>

      <div class="brain-review-grid">
        <aside class="brain-queue card" aria-label="Items requiring review">
          <div class="brain-panel-heading">
            <span>
              <span class="eyebrow">Review</span>
              <strong>Needs judgment</strong>
            </span>
            <span class="attention-count">${brainExceptions.length}</span>
          </div>
          <div class="brain-queue-list">${queue}</div>
          <div class="brain-batch-note">
            <span class="section-label">Sources in this batch</span>
            <p>${escapeHtml(brainBatch.sources.join(", "))}.</p>
            <strong>${escapeHtml(brainBatch.rights)}</strong>
          </div>
        </aside>

        <section class="brain-detail card">
          <header class="brain-detail-header">
            <span class="brain-status ${brainStatusClass(selected.type)}">${escapeHtml(selected.typeLabel)}</span>
            <h2>${escapeHtml(selected.title)}</h2>
            <p>${escapeHtml(selected.summary)}</p>
            <div class="brain-epistemics">
              <span><strong>How we found it</strong>${escapeHtml(selected.origin)}</span>
              <span><strong>How certain</strong>${escapeHtml(selected.confidence)}</span>
              <span><strong>Why it was flagged</strong>${escapeHtml(selected.signal)}</span>
            </div>
          </header>

          ${detailContent}
        </section>

        <aside class="brain-decision card">
          <div class="brain-panel-heading">
            <span><span class="eyebrow">Your decision</span><strong>What should happen?</strong></span>
          </div>
          <div class="brain-decision-list">${actions}</div>
          ${decisionFollowUp}
        </aside>
      </div>
    </section>
  `);
}

function renderCanonPromotion() {
  const ritual = brainExceptions.find((item) => item.id === "four-pm-reset");
  const evidence = ritual.evidence.map(brainEvidenceCard).join("");

  return shell(`
    <section class="workspace canon-workspace">
      ${pageHeader(
        "Add to core brand guidance",
        "Decide whether the 4pm Reset should guide SLAKE work by default. Its earlier approval as helpful guidance remains unchanged.",
      )}

      <div class="canon-grid">
        <div>
          <section class="card canon-entity-card">
            <div class="card-header">
              <span><span class="section-label">Proposed brand principle</span><h2>The 4pm Reset ritual</h2></span>
              <span class="brain-status governed">Found in past work · approved for use</span>
            </div>
            <p class="canon-definition">SLAKE belongs in an everyday late-afternoon pause: restorative, domestic, and unhurried rather than clinical, aspirational, or optimized.</p>
            <div class="brain-evidence-grid">${evidence}</div>
          </section>

          <section class="card">
            <div class="card-header"><h2>What will change</h2><span class="status-pill">Before you confirm</span></div>
            <div class="canon-impact-grid">
              <article><strong>Future creative work</strong><span>The 4pm Reset becomes a standing brand principle instead of an optional reference.</span></article>
              <article><strong>Supporting examples</strong><span>All 11 source items stay attached so people can see where the principle came from.</span></article>
              <article><strong>Brand rules</strong><span>The rule against medical or health claims still applies.</span></article>
              <article><strong>Change history</strong><span>The reason for this decision and the earlier state are saved together.</span></article>
            </div>
          </section>

          ${state.brain.canonPromoted ? `
            <section class="card canon-record">
              <div class="card-header"><h2>Change saved</h2><span class="brain-status success">Core guidance</span></div>
              <dl>
                <div><dt>Change</dt><dd>Added the 4pm Reset to core guidance</dd></div>
                <div><dt>Previously</dt><dd>Approved as helpful guidance</dd></div>
              </dl>
            </section>
          ` : ""}
        </div>

        <aside>
          <section class="card canon-decision-card">
            <div class="card-header"><h2>Make this core guidance</h2><span class="mini-pill">Separate decision</span></div>
            <label class="canon-rationale">
              <span class="section-label">Why should this become core guidance?</span>
              <textarea data-action="promotion-rationale">${escapeHtml(state.brain.promotionRationale)}</textarea>
            </label>
            <div class="canon-consequence">
              <strong>This changes core brand guidance</strong>
              <p>Future work will follow this principle by default until the brand guidance is deliberately changed again.</p>
            </div>
            <button
              class="button primary"
              type="button"
              data-action="promote-canon"
              ${state.brain.canonPromoted ? "disabled" : ""}
            >${state.brain.canonPromoted ? "Added to core guidance" : "Add to core brand guidance"}</button>
            <button class="button" type="button" data-action="back-to-brain">Back to review</button>
          </section>
        </aside>
      </div>
    </section>
  `);
}

function renderBrief() {
  const formats = placementFormats[state.brief.placement];
  const referenceRows = state.references.map(referenceEditor).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "New product lifestyle image",
        "SLAKE keeps the approved pack, logo, and claims exact. Describe the scene you need.",
      )}

      <div class="content-grid">
        <section class="card">
          <div class="card-header">
            <h2>Your brief</h2>
            <span class="mini-pill">Scene image</span>
          </div>

          <div class="field-grid">
            <div class="field full">
              <label for="scene">What are you making?</label>
              <textarea id="scene" data-action="scene-input">${escapeHtml(state.brief.scene)}</textarea>
            </div>
            <div class="field full">
              <label for="exclusions">Anything to avoid?</label>
              <input class="input-like" id="exclusions" data-action="exclusions-input" value="${escapeHtml(state.brief.exclusions)}">
              <span class="field-note">Job-specific exclusions are compiled into the package as constraints, not creative references.</span>
            </div>
            <div class="field">
              <label for="placement">Placement</label>
              <select id="placement" data-action="placement-change">
                ${Object.keys(placementFormats)
                  .map((placement) => option(placement, state.brief.placement))
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="format">Format for ${escapeHtml(state.brief.placement)}</label>
              <select id="format" data-action="format-change">
                ${formats.map((format) => option(format, state.brief.format)).join("")}
              </select>
            </div>
          </div>

          <div class="reference-section">
            <div class="reference-heading">
              <div>
                <span class="section-label">Creative inputs (optional)</span>
                <p>Add a source only when you can name what it should influence. Brand rules and exact assets are never weighted here.</p>
              </div>
              <button class="button ghost" type="button" data-action="toggle-source-picker">${state.sourcePickerOpen ? "Close" : "+ Add source"}</button>
            </div>
            ${renderSourcePicker()}
            <div class="reference-list">
              ${referenceRows || '<p class="page-description">No creative inputs added. Brand guidance still applies.</p>'}
            </div>
          </div>
        </section>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>What stays exact</h2>
              <span class="status-pill">Locked</span>
            </div>
            <ul class="exact-list">
              <li><strong>SLAKE Yuzu Ginger can</strong><span>Composed in, not redrawn</span></li>
              <li><strong>Wordmark and logo</strong><span>Reproduced exactly</span></li>
              <li><strong>Approved claims only</strong><span>No generated or inferred claims</span></li>
            </ul>
            <div class="rule-card">
              <span class="section-label">Rule in play</span>
              <div class="rule">
                <span class="mini-pill">Prohibited</span>
                <span><strong>No health or cognitive claims</strong><span>All public copy and imagery, every channel</span></span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="save-draft">Save draft</button>
        <button class="button primary" type="button" data-action="continue-preflight">Continue to Preflight ›</button>
      </div>
    </section>
  `);
}

function referenceEditor(item, index) {
  return `
    <article class="reference-card">
      <span class="thumb ${item.thumb}" aria-hidden="true"></span>
      <span class="reference-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.detail)}</span>
        <span class="reference-meta"><span class="mini-pill">${escapeHtml(item.sourceType)}</span><span>${escapeHtml(item.confidence)}-confidence read</span></span>
      </span>
      <button class="icon-button" type="button" data-action="remove-reference" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
      <span class="reference-controls">
        <label>
          <span>Use for</span>
          <select data-action="reference-role" data-index="${index}" aria-label="Role for ${escapeHtml(item.name)}">
            ${["Lighting + mood", "Composition", "Materials", "Casting", "Style calibration", "Differentiate away"]
              .map((role) => option(role, item.role))
              .join("")}
          </select>
        </label>
        <label>
          <span>Influence</span>
          <select data-action="reference-influence" data-index="${index}" aria-label="Influence for ${escapeHtml(item.name)}">
            ${["Lead", "Strong", "Supporting", "Light"].map((level) => option(level, item.influence)).join("")}
          </select>
        </label>
        <label class="guidance-field">
          <span>Usage instruction</span>
          <input class="usage-input" data-action="reference-guidance" data-index="${index}" value="${escapeHtml(item.usageInstruction)}" aria-label="Usage instruction for ${escapeHtml(item.name)}">
        </label>
      </span>
    </article>
  `;
}

function renderSourcePicker() {
  if (!state.sourcePickerOpen) return "";
  const available = referenceLibrary.filter(
    (item) => !state.references.some((reference) => reference.id === item.id),
  );
  return `
    <section class="source-picker">
      <div class="source-picker-heading">
        <span><strong>Choose another source</strong><span>Uploads, URLs, named references, and grids will use this same input contract.</span></span>
        <span class="mini-pill">Prototype library</span>
      </div>
      <div class="source-options">
        ${available.length
          ? available
              .map(
                (item) => `
                  <button class="source-option" type="button" data-action="attach-source" data-id="${item.id}">
                    <span class="thumb ${item.thumb}" aria-hidden="true"></span>
                    <span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sourceType)} · ${escapeHtml(item.provenance)}</span></span>
                    <span aria-hidden="true">+</span>
                  </button>
                `,
              )
              .join("")
          : '<p class="page-description">All prototype sources are already attached.</p>'}
      </div>
    </section>
  `;
}

function option(value, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`;
}

function compiledComponents() {
  return [
    "World / 4pm Reset Ritual",
    "Visual grammar / Warm Domestic Naturalism",
    "Photography / Late-Afternoon Window Light",
    "Product / Yuzu Ginger Can v3",
    "Policy / Claims Guardrails",
    `Output / ${state.brief.placement} ${state.brief.format}`,
  ];
}

function promptSections() {
  const referenceDirection = state.references.length
    ? `${state.references
        .map(
          (item) =>
            `${item.name}. ${item.influence.toLowerCase()} influence for ${item.role.toLowerCase()}: ${item.usageInstruction} The source read identified ${item.evidence.join(" and ")}.`,
        )
        .join(" ")} These inputs may not alter the exact product, approved claims, or Brand Brain rules.`
    : "No creative reference images are attached; resolve flexible choices from the approved brand-world guidance.";

  return [
    {
      title: "Subject fidelity",
      body: "Place the approved SLAKE Yuzu Ginger can exactly as supplied. Preserve silhouette, geometry, orange-red field, cream label, wordmark, flavor name, and approved claims; never redraw the pack.",
    },
    {
      title: "Brand world",
      body: `${state.brief.scene} Interpret this as SLAKE’s “4pm Reset”: restorative and everyday, never medicinal, aspirational, or spa-like.`,
    },
    {
      title: "Visual grammar",
      body: "Use warm editorial naturalism. Lead with oat and cream, muted sage, and sun-washed terracotta. Favor tactile linen, unglazed ceramic, pale stone, and honest domestic wear; avoid glossy wellness styling.",
    },
    {
      title: "Light and composition",
      body: `Use low window light from camera left, soft long shadows, and a gentle rim on the can. Compose one ${state.brief.format} image for ${state.brief.placement}; keep the can in the lower-middle third, the person secondary, and negative space above and right.`,
    },
    {
      title: "Reference handling",
      body: referenceDirection,
    },
    {
      title: "Content control",
      body: `Generate one image. Add no copy, health symbols, ingredients, extra products, altered claims, or redesigned packaging. Also avoid: ${state.brief.exclusions}`,
    },
  ];
}

function renderPreflight() {
  const sources = compiledComponents()
    .map((source) => `<span class="source-chip">${escapeHtml(source)}</span>`)
    .join("");
  const prompt = promptSections()
    .map(
      (section) => `<p><strong>${escapeHtml(section.title.toUpperCase())}</strong>: ${escapeHtml(section.body)}</p>`,
    )
    .join("");

  return shell(`
    <section class="workspace">
      ${pageHeader("Preflight", "Review the compiled generation package before generating.")}

      <div class="preflight-grid">
        <div>
          <section class="card">
            <div class="card-header">
              <h2>Compiled prompt</h2>
              <span class="status-pill">Built from Brand Brain</span>
            </div>
            <div class="prompt-panel">
              <span class="component-kicker">Compiled components</span>
              <div class="source-chips">${sources}</div>
              <div class="compiled-prompt">${prompt}</div>
            </div>
            <div class="utility-actions">
              <button class="button" type="button" data-action="copy-prompt">Copy prompt</button>
              <button class="button" type="button" data-action="download-package">Download package</button>
            </div>
          </section>

          <section class="card">
            <div class="card-header"><h2>Production contract</h2></div>
            <ul class="contract-list">
              <li><strong>Exact:</strong> product, package artwork, logo, and approved claims</li>
              <li><strong>Flexible:</strong> scene, lighting, casting, and composition</li>
              <li><strong>Excluded:</strong> added claims and text layers</li>
            </ul>
          </section>
        </div>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>Generation inputs</h2>
              <span class="mini-pill">${state.references.length + 1} inputs</span>
            </div>
            <div class="input-list">
              <article class="input-row">
                <span class="thumb product" aria-hidden="true"><span class="can"></span></span>
                <span><strong>Approved Yuzu Ginger can</strong><span>Selected product · exact source</span></span>
              </article>
              ${state.references.map(referenceInput).join("")}
            </div>
            <div class="resolution-section">
              <span class="section-label">How inputs resolved</span>
              <div class="resolution-list">${state.references.map(referenceResolution).join("")}</div>
            </div>
          </section>

          <section class="card ready-card">
            <div class="card-header"><h2>Ready to generate</h2><span class="mini-pill">Verified</span></div>
            <p>The prompt, inputs, output contract, and governing policy snapshot are complete.</p>
            <button class="button secondary" type="button" data-action="generate">Generate</button>
          </section>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="back-to-brief">‹ Back to brief</button>
      </div>
    </section>
  `);
}

function referenceInput(item) {
  return `
    <article class="input-row">
      <span class="thumb ${item.thumb}" aria-hidden="true"></span>
      <span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sourceType)} · ${escapeHtml(item.role.toLowerCase())} · ${escapeHtml(item.influence.toLowerCase())}</span></span>
    </article>
  `;
}

function referenceResolution(item) {
  return `
    <article class="resolution-row">
      <span class="resolution-topline"><strong>${escapeHtml(item.name)}</strong><span class="included-status">Included</span></span>
      <p>${escapeHtml(item.usageInstruction)}</p>
      <span class="evidence-chips">${item.evidence.map((piece) => `<span>${escapeHtml(piece)}</span>`).join("")}</span>
      <span class="resolution-note">Compatible with policy · ${escapeHtml(item.confidence.toLowerCase())} reader confidence</span>
    </article>
  `;
}

function renderResult() {
  return shell(`
    <section class="workspace">
      ${pageHeader("Generated result", "A static prototype result for reviewing the next workflow state.")}

      <div class="result-grid">
        <section class="card">
          <div class="card-header">
            <h2>SLAKE Yuzu Ginger · 4pm Reset</h2>
            <span class="mini-pill">Generated</span>
          </div>
          <div class="mock-output" role="img" aria-label="Stylized placeholder of a SLAKE can in a warm afternoon kitchen scene">
            <span class="figure"></span>
            <span class="hero-can"></span>
            <span class="result-caption"><strong>${escapeHtml(state.brief.format)}</strong><span>Mock result · no model invoked</span></span>
          </div>
        </section>

        <aside>
          <section class="card">
            <div class="card-header"><h2>Evaluation</h2><span class="mini-pill">4 passed</span></div>
            <ul class="check-list">
              <li>Package silhouette and artwork remain exact</li>
              <li>No unapproved copy or health claim introduced</li>
              <li>Output matches ${escapeHtml(state.brief.placement)} ${escapeHtml(state.brief.format)}</li>
              <li>Scene follows the 4pm Reset visual-world guidance</li>
            </ul>
          </section>

          <section class="card">
            <div class="card-header"><h2>What next?</h2></div>
            <p class="page-description">Stage review, revision, approval, and memory write-back remain outside today’s prototype.</p>
            <div class="actions">
              <button class="button" type="button" data-action="back-to-preflight">View package</button>
              <button class="button primary" type="button" data-action="start-new">Start new</button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  `);
}

function render() {
  if (state.screen === "brain") root.innerHTML = renderBrandBrain();
  else if (state.screen === "brain-canon") root.innerHTML = renderCanonPromotion();
  else if (state.screen === "brief") root.innerHTML = renderBrief();
  else if (state.screen === "preflight") root.innerHTML = renderPreflight();
  else if (state.screen === "result") root.innerHTML = renderResult();
  else root.innerHTML = renderChooser();
}

function navigate(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}

function plainPrompt() {
  return promptSections()
    .map((section) => `${section.title.toUpperCase()}\n${section.body}`)
    .join("\n\n");
}

async function copyPrompt() {
  const value = plainPrompt();
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  setToast("Compiled prompt copied");
}

function downloadPackage() {
  const generationPackage = {
    version: "prototype-2",
    installation_id: "slake-higher-roads-demo",
    deliverable: state.selectedDeliverable.id,
    output: { ...state.brief, quantity: 1 },
    compiled_components: compiledComponents(),
    prompt: plainPrompt(),
    generation_inputs: [
      {
        id: "slake-yuzu-ginger-can-v3",
        source_type: "approved_asset",
        source_ref: "SLAKE product library · Yuzu Ginger Can v3",
        authority_class: "canonical_asset",
        role: "exact_subject",
        handling: "exact",
      },
      ...state.references.map((item) => ({
        id: item.id,
        source_type: item.sourceType,
        provenance: item.provenance,
        authority_class: "creative_evidence",
        handling: "flexible",
        role: item.role,
        influence: item.influence,
        usage_instruction: item.usageInstruction,
        reader: "prototype-image-reader-v1",
        confidence: item.confidence,
        extracted_evidence: item.evidence,
        resolution: "included",
      })),
    ],
    request_constraints: {
      requirements: [state.brief.scene],
      exclusions: [state.brief.exclusions],
    },
    policy: {
      exact: ["product", "package_artwork", "logo", "approved_claims"],
      flexible: ["scene", "lighting", "casting", "composition"],
      excluded: ["added_claims", "text_layers"],
    },
  };
  const file = new Blob([JSON.stringify(generationPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "slake-product-lifestyle-generation-package.json";
  anchor.click();
  URL.revokeObjectURL(url);
  setToast("Generation package downloaded");
}

root.addEventListener("input", (event) => {
  if (event.target.matches('[data-action="promotion-rationale"]')) {
    state.brain.promotionRationale = event.target.value;
  }
  if (event.target.matches('[data-action="scene-input"]')) {
    state.brief.scene = event.target.value;
  }
  if (event.target.matches('[data-action="exclusions-input"]')) {
    state.brief.exclusions = event.target.value;
  }
  if (event.target.matches('[data-action="reference-guidance"]')) {
    state.references[Number(event.target.dataset.index)].usageInstruction = event.target.value;
  }
});

root.addEventListener("change", (event) => {
  const action = event.target.dataset.action;
  if (action === "placement-change") {
    state.brief.placement = event.target.value;
    state.brief.format = placementFormats[state.brief.placement][0];
    render();
  }
  if (action === "format-change") state.brief.format = event.target.value;
  if (action === "reference-role") {
    state.references[Number(event.target.dataset.index)].role = event.target.value;
  }
  if (action === "reference-influence") {
    state.references[Number(event.target.dataset.index)].influence = event.target.value;
  }
});

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "chooser") navigate("chooser");
  if (action === "brand-brain") navigate("brain");
  if (action === "select-brain-exception") {
    state.brain.selectedExceptionId = target.dataset.id;
    render();
  }
  if (action === "approve-clean-assets" && !state.brain.cleanApproved) {
    state.brain.cleanApproved = true;
    setToast("47 assets approved for future work. Core brand guidance unchanged.");
  }
  if (action === "resolve-brain-exception") {
    state.brain.resolutions[target.dataset.id] = target.dataset.resolution;
    setToast("Decision saved");
  }
  if (action === "review-canon-promotion") navigate("brain-canon");
  if (action === "back-to-brain") navigate("brain");
  if (action === "promote-canon" && !state.brain.canonPromoted) {
    state.brain.canonPromoted = true;
    setToast("The 4pm Reset was added to core brand guidance");
  }
  if (action === "choose-deliverable") {
    state.selectedDeliverable = deliverables.find((item) => item.id === target.dataset.id) ?? deliverables[0];
    navigate("brief");
  }
  if (action === "save-draft") setToast("Draft saved in this prototype session");
  if (action === "continue-preflight") navigate("preflight");
  if (action === "back-to-brief") navigate("brief");
  if (action === "back-to-preflight") navigate("preflight");
  if (action === "generate") navigate("result");
  if (action === "start-new") navigate("chooser");
  if (action === "copy-prompt") copyPrompt();
  if (action === "download-package") downloadPackage();
  if (action === "toggle-source-picker") {
    state.sourcePickerOpen = !state.sourcePickerOpen;
    render();
  }
  if (action === "attach-source") {
    const next = referenceLibrary.find((item) => item.id === target.dataset.id);
    if (next && !state.references.some((reference) => reference.id === next.id)) {
      state.references.push({ ...next });
      state.sourcePickerOpen = false;
      render();
    }
  }
  if (action === "remove-reference") {
    state.references.splice(Number(target.dataset.index), 1);
    render();
  }
});

render();
