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
    role: "Lighting + mood",
    influence: "Strong",
    thumb: "light",
  },
  {
    id: "lifestyle-composition",
    name: "Lifestyle composition",
    detail: "Product-forward framing with human context",
    role: "Composition",
    influence: "Moderate",
    thumb: "composition",
  },
  {
    id: "surface-study",
    name: "Surface and material study",
    detail: "Pale stone, tactile linen, and honest domestic wear",
    role: "Materials",
    influence: "Moderate",
    thumb: "light",
  },
];

const state = {
  screen: "chooser",
  selectedDeliverable: deliverables[0],
  brief: {
    scene:
      "Lifestyle image for Yuzu Ginger. Warm interior, late-afternoon light, the 4pm reset moment. One person, unhurried, mid-task.",
    placement: "Instagram feed",
    format: "4:5 portrait",
  },
  references: referenceLibrary.slice(0, 2).map((item) => ({ ...item })),
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
  if (state.screen === "chooser") return "Production";
  if (state.screen === "brief") return "Production / Product lifestyle image";
  if (state.screen === "preflight") return "Production / Product lifestyle image / Preflight";
  return "Production / Product lifestyle image / Result";
}

function shell(content) {
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
          ${navItem("Production", true, "chooser")}
          ${navItem("Brand brain", false)}
          ${navItem("Library", false)}
          ${navItem("Activity", false)}
        </nav>

        <div class="sidebar-footer">
          <p class="eyebrow">Steward</p>
          ${navItem("Workflow settings", false)}
          <div class="profile">
            <span class="avatar">AL</span>
            <span>
              <strong>Alex Lin</strong>
              <span>Strategist</span>
            </span>
          </div>
        </div>
      </aside>

      <main class="main-column">
        <header class="topbar">
          <div class="breadcrumb"><strong>SLAKE</strong> &nbsp;/&nbsp; ${escapeHtml(currentCrumb())}</div>
          <div class="search">Search knowledge, jobs, and assets</div>
          <div class="attention-pill">Needs you <span>3</span></div>
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
                <span class="section-label">Creative references (optional)</span>
                <p>Add an image only when you want it to guide a specific part of production.</p>
              </div>
              <button class="button ghost" type="button" data-action="add-reference">+ Add reference</button>
            </div>
            <div class="reference-list">
              ${referenceRows || '<p class="page-description">No creative references added. Brand guidance still applies.</p>'}
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
      </span>
      <select data-action="reference-role" data-index="${index}" aria-label="Role for ${escapeHtml(item.name)}">
        ${["Lighting + mood", "Composition", "Materials", "Style", "Casting"]
          .map((role) => option(role, item.role))
          .join("")}
      </select>
      <select class="influence-select" data-action="reference-influence" data-index="${index}" aria-label="Influence for ${escapeHtml(item.name)}">
        ${["Strong", "Moderate", "Subtle"].map((level) => option(level, item.influence)).join("")}
      </select>
      <button class="icon-button" type="button" data-action="remove-reference" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
    </article>
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
    ? `Use the attached creative references only for ${state.references
        .map((item) => `${item.role.toLowerCase()} (${item.influence.toLowerCase()})`)
        .join(" and ")}. They may not alter exact product handling or claims.`
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
      body: "Generate one image. Add no copy, health symbols, ingredients, extra products, altered claims, or redesigned packaging.",
    },
  ];
}

function renderPreflight() {
  const sources = compiledComponents()
    .map((source) => `<span class="source-chip">${escapeHtml(source)}</span>`)
    .join("");
  const prompt = promptSections()
    .map(
      (section) => `<p><strong>${escapeHtml(section.title.toUpperCase())}</strong> — ${escapeHtml(section.body)}</p>`,
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
      <span><strong>${escapeHtml(item.name)}</strong><span>Added in brief · ${escapeHtml(item.role.toLowerCase())} · ${escapeHtml(item.influence.toLowerCase())}</span></span>
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
  if (state.screen === "brief") root.innerHTML = renderBrief();
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
    .map((section) => `${section.title.toUpperCase()} — ${section.body}`)
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
    version: "prototype-1",
    deliverable: state.selectedDeliverable.id,
    output: { ...state.brief, quantity: 1 },
    compiled_components: compiledComponents(),
    prompt: plainPrompt(),
    generation_inputs: [
      { id: "slake-yuzu-ginger-can-v3", source: "selected_product", role: "exact_subject" },
      ...state.references.map((item) => ({
        id: item.id,
        source: "brief",
        role: item.role,
        influence: item.influence,
      })),
    ],
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
  if (event.target.matches('[data-action="scene-input"]')) {
    state.brief.scene = event.target.value;
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
  if (action === "add-reference") {
    const next = referenceLibrary.find((item) => !state.references.some((reference) => reference.id === item.id));
    if (next) {
      state.references.push({ ...next });
      render();
    } else setToast("All prototype references are already attached");
  }
  if (action === "remove-reference") {
    state.references.splice(Number(target.dataset.index), 1);
    render();
  }
});

render();
