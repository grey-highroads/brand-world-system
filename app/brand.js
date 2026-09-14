/*
 * Add your logo.
 *
 * A finished output becomes the image. The brand mark record supplies the
 * versions of the logo. The person picks a corner and a size, and the server
 * places the real file's pixels onto the image and reports the check. No
 * shadow, no model, no realism machinery: branding is a top layer, the way a
 * designer finishes an ad.
 *
 * This page follows the place.js pattern: separate from app.js, shares the
 * stylesheets and the server, shares no code and no state. Deleting this
 * file, brand.html, and one line of vite.config.js removes the whole surface.
 */

const root = document.getElementById("brand");

const state = {
  loading: true,
  loadError: "",
  backgrounds: [],
  record: null,
  needsConversion: false,
  converting: false,
  chosenBackgroundId: "",
  chosenVariationId: "",
  corner: "bottom-right",
  sizePreset: "standard",
  message: "",
  busy: false,
  resultUrl: "",
  resultVerification: null,
};

let backgroundImage = null;
let markImage = null;
let nudge = { x: 0, y: 0 };

const CORNERS = [
  { id: "top-left", label: "Top left" },
  { id: "top-right", label: "Top right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom-center", label: "Bottom center" },
  { id: "bottom-right", label: "Bottom right" },
];

// Fractions of image width. The margin keeps the mark off the edge the way a
// designer would.
const SIZES = [
  { id: "small", label: "Small", fraction: 0.12 },
  { id: "standard", label: "Standard", fraction: 0.18 },
  { id: "prominent", label: "Prominent", fraction: 0.28 },
];
const MARGIN_FRACTION = 0.04;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "That request did not go through.");
  return payload;
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That picture could not be opened."));
    image.src = dataUrl;
  });
}

/* Loading */

async function loadEverything() {
  try {
    const [outputsPayload, assetsPayload] = await Promise.all([
      fetch("/api/production/outputs", { headers: { Accept: "application/json" } }).then(readJson),
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "identity_list" }),
      }).then(readJson),
    ]);
    state.backgrounds = (outputsPayload.outputs || [])
      .filter((output) => output.id && output.hadImage)
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));

    const entry = (assetsPayload.assets || [])[0];
    if (entry) {
      const recordPayload = await readJson(await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "identity_read", assetId: entry.asset_id }),
      }));
      state.record = recordPayload.record;
    } else {
      state.needsConversion = true;
    }
  } catch (error) {
    state.loadError = error.message || "Your finished work could not be loaded.";
  } finally {
    state.loading = false;
    render();
  }
}

// Builds the brand mark record from the logo files already registered as
// sources. One click, server side, nothing re-uploaded.
async function convertRecords() {
  state.converting = true;
  state.message = "";
  render();
  try {
    const result = await readJson(await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "identity_convert" }),
    }));
    if (!result.converted) {
      state.message = result.reason || "The logo records could not be built.";
      return;
    }
    state.record = result.record;
    state.needsConversion = false;
  } catch (error) {
    state.message = error.message || "The logo records could not be built.";
  } finally {
    state.converting = false;
    render();
  }
}

async function chooseBackground(outputId) {
  state.message = "";
  state.busy = true;
  render();
  try {
    const payload = await readJson(await fetch(`/api/production/outputs?action=imageData&outputId=${encodeURIComponent(outputId)}`, {
      headers: { Accept: "application/json" },
    }));
    backgroundImage = await loadImage(payload.dataUrl);
    state.chosenBackgroundId = outputId;
    state.resultUrl = "";
    state.resultVerification = null;
    nudge = { x: 0, y: 0 };
  } catch (error) {
    state.message = error.message || "That image could not be opened.";
  } finally {
    state.busy = false;
    render();
  }
}

async function chooseVariation(variationId) {
  const variation = (state.record?.variations || []).find((entry) => entry.variation_id === variationId);
  const file = variation?.files?.[0];
  if (!file) return;
  state.message = "";
  state.busy = true;
  render();
  try {
    const payload = await readJson(await fetch("/api/blob/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname: file.blob_pathname, mode: "data" }),
    }));
    markImage = await loadImage(payload.dataUrl);
    state.chosenVariationId = variationId;
    state.resultUrl = "";
    state.resultVerification = null;
    nudge = { x: 0, y: 0 };
  } catch (error) {
    state.message = error.message || "That version of the mark could not be opened.";
  } finally {
    state.busy = false;
    render();
  }
}

/* The box, computed from the presets */

function currentBox() {
  if (!backgroundImage || !markImage) return null;
  const W = backgroundImage.naturalWidth;
  const H = backgroundImage.naturalHeight;
  const size = SIZES.find((entry) => entry.id === state.sizePreset) || SIZES[1];
  const aspect = markImage.naturalHeight / markImage.naturalWidth;
  let width = Math.round(W * size.fraction);
  let height = Math.round(width * aspect);
  // A tall mark at a wide fraction can outgrow the image. Cap the height at a
  // third of the image and rescale.
  if (height > H / 3) {
    height = Math.round(H / 3);
    width = Math.round(height / aspect);
  }
  const margin = Math.round(W * MARGIN_FRACTION);
  let x = margin;
  let y = margin;
  if (state.corner.includes("right")) x = W - margin - width;
  if (state.corner === "bottom-center") x = Math.round((W - width) / 2);
  if (state.corner.startsWith("bottom")) y = H - margin - height;
  x += nudge.x;
  y += nudge.y;
  // Keep the whole mark inside the image whatever the nudging did.
  x = Math.min(Math.max(x, 0), W - width);
  y = Math.min(Math.max(y, 0), H - height);
  return { x, y, width, height };
}

function paintPreview() {
  const stage = document.getElementById("brand-stage");
  if (!stage || !backgroundImage) return;
  const available = Math.min(stage.parentElement.clientWidth || 720, 720);
  const viewScale = available / backgroundImage.naturalWidth;
  stage.width = Math.round(backgroundImage.naturalWidth * viewScale);
  stage.height = Math.round(backgroundImage.naturalHeight * viewScale);
  const context = stage.getContext("2d");
  context.clearRect(0, 0, stage.width, stage.height);
  context.drawImage(backgroundImage, 0, 0, stage.width, stage.height);
  const box = currentBox();
  if (markImage && box) {
    context.drawImage(markImage, box.x * viewScale, box.y * viewScale, box.width * viewScale, box.height * viewScale);
  }
}

/* Placing */

async function place() {
  const box = currentBox();
  if (!state.chosenBackgroundId || !state.chosenVariationId || !box) return;
  state.busy = true;
  state.message = "Placing.";
  render();
  try {
    const payload = await readJson(await fetch("/api/production/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "place-asset",
        backgroundOutputId: state.chosenBackgroundId,
        identityAssetId: state.record.asset_id,
        variationId: state.chosenVariationId,
        grounding: false,
        box,
      }),
    }));
    state.resultUrl = `/api/production/outputs?action=image&outputId=${encodeURIComponent(payload.job.jobId)}`;
    state.resultVerification = payload.job.verification || null;
    state.message = "";
    render();
    await addToRecentWork(payload.job.jobId);
  } catch (error) {
    state.message = error.message || "The placement did not finish.";
  } finally {
    state.busy = false;
    render();
  }
}

async function addToRecentWork(jobId) {
  try {
    const payload = await readJson(await fetch("/api/production/outputs", { headers: { Accept: "application/json" } }));
    if (!Array.isArray(payload.outputs)) return;
    const background = state.backgrounds.find((output) => output.id === state.chosenBackgroundId);
    const variation = (state.record?.variations || []).find((entry) => entry.variation_id === state.chosenVariationId);
    const entry = {
      id: jobId,
      label: `${variation?.variation || "Logo"} on ${background?.label || "an image"}`,
      status: "draft",
      format: background?.format || null,
      hadImage: true,
      createdAt: new Date().toISOString(),
    };
    await fetch("/api/production/outputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputs: [entry, ...payload.outputs] }),
    });
  } catch {
    state.message = "The image is saved. It could not be added to your recent work list.";
    render();
  }
}

/* Rendering */

function pickerMarkup(items, chosenId) {
  return items.map((item) => `
    <button class="place-option ${item.id === chosenId ? "is-chosen" : ""}" type="button" data-action="${escapeHtml(item.action)}" data-id="${escapeHtml(item.id)}">
      ${item.thumb ? `<img src="${escapeHtml(item.thumb)}" alt="" onerror="this.remove();">` : ""}
      <span>${escapeHtml(item.label)}</span>
    </button>
  `).join("");
}

function render() {
  if (state.loading) {
    root.innerHTML = `<header class="page-header"><h1>Add your logo</h1></header><p class="page-description">Loading your finished work.</p>`;
    return;
  }

  const ready = Boolean(state.chosenBackgroundId && state.chosenVariationId && backgroundImage && markImage);

  root.innerHTML = `
    <header class="page-header">
      <h1>Add your logo</h1>
      <p class="page-description">Put your logo on an image you have already made. The file's own pixels are placed, and the result reports how many were checked.</p>
    </header>
    ${state.loadError ? `<div class="card"><p class="page-description">${escapeHtml(state.loadError)}</p></div>` : ""}
    <div class="place-layout">
      <div class="place-column">
        <section class="card">
          <div class="card-header"><h2>Image</h2></div>
          ${state.backgrounds.length
            ? `<div class="place-picker">${pickerMarkup(state.backgrounds.map((output) => ({
                id: output.id,
                label: output.label || "Untitled",
                action: "background",
                thumb: `/api/production/outputs?action=image&outputId=${encodeURIComponent(output.id)}`,
              })), state.chosenBackgroundId)}</div>`
            : `<p class="page-description">You have no finished images yet.</p>`}
        </section>

        <section class="card">
          <div class="card-header"><h2>Your logo</h2></div>
          ${state.needsConversion
            ? `<p class="page-description">Your registered logo files have not been gathered into a mark record yet. Build it once and it stays.</p>
               <div class="actions"><button class="button" type="button" data-action="convert" ${state.converting ? "disabled" : ""}>${state.converting ? "Building" : "Build from my logo files"}</button></div>`
            : state.record
              ? `<p class="field-note place-note">Which version</p>
                 <div class="place-picker">${pickerMarkup(state.record.variations.map((variation) => ({
                   id: variation.variation_id,
                   label: variation.variation,
                   action: "variation",
                   thumb: "",
                 })), state.chosenVariationId)}</div>`
              : `<p class="page-description">No mark record was found for this brand.</p>`}
        </section>
      </div>

      <div class="place-column">
        <section class="card">
          <div class="card-header"><h2>Where and how large</h2></div>
          ${ready || (backgroundImage && markImage) ? `<canvas class="place-stage" id="brand-stage"></canvas>` : `<p class="place-empty page-description">Choose an image and a logo version to see the preview.</p>`}
          <p class="field-note place-note">Corner</p>
          <div class="place-direction">
            ${CORNERS.map((corner) => `
              <button class="button small ${state.corner === corner.id ? "" : "ghost"}" type="button" data-action="corner" data-id="${corner.id}">${escapeHtml(corner.label)}</button>
            `).join("")}
          </div>
          <p class="field-note place-note">Size</p>
          <div class="place-direction">
            ${SIZES.map((size) => `
              <button class="button small ${state.sizePreset === size.id ? "" : "ghost"}" type="button" data-action="size" data-id="${size.id}">${escapeHtml(size.label)}</button>
            `).join("")}
          </div>
          <p class="field-note place-note">Fine placement</p>
          <div class="place-direction">
            <button class="button small ghost" type="button" data-action="nudge" data-id="left">Left</button>
            <button class="button small ghost" type="button" data-action="nudge" data-id="up">Up</button>
            <button class="button small ghost" type="button" data-action="nudge" data-id="down">Down</button>
            <button class="button small ghost" type="button" data-action="nudge" data-id="right">Right</button>
          </div>
          ${state.message ? `<p class="page-description place-note">${escapeHtml(state.message)}</p>` : ""}
          <div class="actions">
            <button class="button" type="button" data-action="place" ${ready && !state.busy ? "" : "disabled"}>${state.busy ? "Working" : "Add the logo"}</button>
          </div>
        </section>

        ${state.resultUrl
          ? `<section class="card place-result">
               <div class="card-header"><h2>Result</h2></div>
               <img src="${escapeHtml(state.resultUrl)}" alt="The image with the logo placed">
               ${state.resultVerification
                 ? `<p class="field-note place-note">${Number(state.resultVerification.checkedPixels).toLocaleString()} pixels checked, ${Number(state.resultVerification.mismatchedPixels).toLocaleString()} changed.</p>`
                 : ""}
               <p class="field-note place-note">Saved to your recent work.</p>
             </section>`
          : ""}
      </div>
    </div>
  `;

  paintPreview();
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || state.busy) return;
  const id = target.dataset.id || "";
  if (target.dataset.action === "background") chooseBackground(id);
  if (target.dataset.action === "variation") chooseVariation(id);
  if (target.dataset.action === "convert") convertRecords();
  if (target.dataset.action === "corner") {
    state.corner = id;
    nudge = { x: 0, y: 0 };
    render();
  }
  if (target.dataset.action === "size") {
    state.sizePreset = id;
    render();
  }
  if (target.dataset.action === "nudge") {
    if (!backgroundImage) return;
    const step = Math.max(4, Math.round(backgroundImage.naturalWidth * 0.01));
    if (id === "left") nudge.x -= step;
    if (id === "right") nudge.x += step;
    if (id === "up") nudge.y -= step;
    if (id === "down") nudge.y += step;
    paintPreview();
  }
  if (target.dataset.action === "place") place();
});

render();
loadEverything();
