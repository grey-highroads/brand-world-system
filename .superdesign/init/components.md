# Shared UI Components

## Implementation model

The prototype uses browser-native HTML, CSS, and JavaScript. There is no framework or component library. Reusable UI is implemented as template functions in `app/app.js`, with appearance defined by reusable CSS classes in `app/styles.css`.

## Navigation item

- Source: `app/app.js`
- Function: `navItem(label, active, action)`
- Description: Shared sidebar navigation button with optional active state and action.

```js
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
```

## Page header

- Source: `app/app.js`
- Function: `pageHeader(title, description)`
- Description: Consistent title and supporting copy at the top of every workspace view.

```js
function pageHeader(title, description) {
  return `
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(title)}</h1>
      <p class="page-description">${escapeHtml(description)}</p>
    </header>
  `;
}
```

## Reference editor card

- Source: `app/app.js`
- Function: `referenceEditor(item, index)`
- Description: Dense evidence/source card with thumbnail, provenance, role, influence, and usage instruction controls.

```js
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
```

## Option helper

- Source: `app/app.js`
- Function: `option(value, selected)`
- Description: Shared native select option template.

```js
function option(value, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`;
}
```

## Resolution row

- Source: `app/app.js`
- Function: `referenceResolution(item)`
- Description: Evidence-backed resolution trace used in Preflight.

```js
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
```

## CSS primitives

The reusable primitive classes are `.button`, `.button.primary`, `.button.secondary`, `.button.ghost`, `.card`, `.mini-pill`, `.status-pill`, `.source-chip`, `.field`, `.input-like`, `.thumb`, and `.actions`. Their canonical implementations are in `app/styles.css`.
