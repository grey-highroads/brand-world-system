# Shared Layouts

## App shell

- Source: `app/app.js`
- Description: Persistent SLAKE sidebar, sticky top bar, main workspace slot, and transient toast region. Every prototype screen renders inside this shell.

```js
function currentCrumb() {
  if (state.screen === "brain") return "Brand brain / Batch intake / Triage";
  if (state.screen === "brain-canon") return "Brand brain / Canon promotion";
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
```

## Workspace wrapper

- Source: screen render functions in `app/app.js`
- Description: Each view uses `<section class="workspace">`, a maximum-width content area with the shared `pageHeader()` followed by screen-specific grids and actions.

```html
<section class="workspace">
  <header class="page-header">
    <h1 class="page-title">Screen title</h1>
    <p class="page-description">Screen-specific guidance.</p>
  </header>
  <!-- screen-specific content -->
</section>
```
