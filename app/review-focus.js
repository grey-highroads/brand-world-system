/*
 * Focused Needs Review prototype.
 *
 * The live Brand Brain owns all data, persistence, and decision handlers.
 * This module only reshapes the rendered review screen so the new interaction
 * can be tested against real synthesis results without duplicating state.
 */

const appRoot = document.querySelector("#app");
const resolvedSignals = new Set([
  "Deferred",
  "Evidence only",
  "Discarded",
  "Saved for later",
  "In use",
  "Resolved",
]);

let pendingAdvance = null;
let applying = false;

function reviewWorkspace() {
  const workspace = document.querySelector(".brain-workspace");
  if (!workspace) return null;
  const activeTab = workspace.querySelector(".brain-section-tab.active");
  return activeTab?.textContent?.includes("Needs review") ? workspace : null;
}

function queueItems(workspace) {
  return [...workspace.querySelectorAll(".brain-review-grid > .brain-queue .brain-queue-item")];
}

function signalFor(item) {
  return item.querySelector(".brain-signal")?.textContent?.trim() || "";
}

function isResolved(item) {
  return resolvedSignals.has(signalFor(item));
}

function activeQueueIndex(items) {
  const index = items.findIndex((item) => item.classList.contains("active") || item.getAttribute("aria-current") === "true");
  return index >= 0 ? index : 0;
}

function nextUnresolved(items, fromId) {
  if (!items.length) return null;
  const start = Math.max(0, items.findIndex((item) => item.dataset.id === fromId));
  for (let offset = 1; offset <= items.length; offset += 1) {
    const candidate = items[(start + offset) % items.length];
    if (!isResolved(candidate)) return candidate;
  }
  return null;
}

function cleanShell() {
  document.querySelector(".app-shell")?.classList.remove("review-focus-shell");
  document.querySelector(".review-focus-exit")?.remove();
  document.querySelector(".review-focus-drawer-scrim")?.remove();
}

function prepareShell(workspace) {
  const shell = workspace.closest(".app-shell");
  shell?.classList.add("review-focus-shell");

  const topbar = shell?.querySelector(".topbar");
  if (topbar && !topbar.querySelector(".review-focus-exit")) {
    const exit = document.createElement("button");
    exit.type = "button";
    exit.className = "review-focus-exit";
    exit.dataset.action = "navigate-brain";
    exit.dataset.screen = "brain-overview";
    exit.textContent = "Exit review";
    topbar.append(exit);
  }

  workspace.classList.add("review-focus-active");
  const description = workspace.querySelector(":scope > .page-header .page-description");
  if (description) description.textContent = "Make the few decisions where your judgment changes the brand.";
}

function markPassiveProtections(workspace) {
  [...workspace.children].forEach((child) => {
    if (!(child instanceof HTMLElement)) return;
    const heading = child.querySelector(":scope > .card-header h2, :scope > h2")?.textContent?.trim();
    if (heading !== "Protections") return;
    const text = child.textContent || "";
    if (text.includes("Nothing pending") || text.includes("Nothing new is waiting on you")) {
      child.classList.add("review-focus-passive");
    }
  });
}

function markRequiredStep(workspace) {
  const approval = workspace.querySelector('[data-action="approve-clean-assets"]');
  const section = approval?.closest("section");
  if (section && !section.classList.contains("brain-review-empty")) section.classList.add("review-focus-required-step");
}

function buildProgress(workspace, items) {
  if (!items.length || workspace.querySelector(":scope > .review-focus-progress")) return;
  const active = activeQueueIndex(items);
  const progress = document.createElement("div");
  progress.className = "review-focus-progress";
  progress.style.setProperty("--review-count", String(items.length));
  progress.innerHTML = `
    <div class="review-focus-progress-head">
      <span>Decision ${active + 1} of ${items.length}</span>
      <button type="button" data-review-all>View all decisions</button>
    </div>
    <div class="review-focus-segments" aria-label="Review progress">
      ${items.map((item, index) => `<i class="${isResolved(item) ? "done" : index === active ? "current" : ""}"></i>`).join("")}
    </div>
  `;
  const grid = workspace.querySelector(".brain-review-grid");
  grid?.before(progress);
}

function foldEvidence(detail) {
  if (!detail || detail.querySelector(":scope > .review-focus-evidence")) return;
  const header = detail.querySelector(":scope > .brain-detail-header");
  if (!header) return;

  const disclosure = document.createElement("details");
  disclosure.className = "review-focus-evidence";
  const summary = document.createElement("summary");
  summary.textContent = "Why am I seeing this?";
  const body = document.createElement("div");
  body.className = "review-focus-evidence-body";

  const confidence = header.querySelector(".brain-confidence-note");
  if (confidence) body.append(confidence);

  [...detail.children].forEach((child) => {
    if (child !== header && child !== disclosure) body.append(child);
  });

  disclosure.append(summary, body);
  detail.append(disclosure);
}

function buildSlide(workspace) {
  const grid = workspace.querySelector(".brain-review-grid");
  if (!grid || grid.querySelector(":scope > .review-focus-slide")) return;
  const detail = grid.querySelector(":scope > .brain-detail");
  const decision = grid.querySelector(":scope > .brain-decision");
  if (!detail || !decision) return;

  foldEvidence(detail);
  const slide = document.createElement("div");
  slide.className = "review-focus-slide";
  grid.insertBefore(slide, detail);
  slide.append(detail, decision);
}

function buildUnderbar(workspace, items) {
  if (!items.length || workspace.querySelector(".review-focus-underbar")) return;
  const active = activeQueueIndex(items);
  const underbar = document.createElement("div");
  underbar.className = "review-focus-underbar";
  underbar.innerHTML = `
    <div class="review-focus-underbar-nav">
      <button class="review-focus-nav-button" type="button" data-review-back ${active === 0 ? "disabled" : ""}>‹ Previous</button>
      <button class="review-focus-nav-button" type="button" data-review-next ${active === items.length - 1 ? "disabled" : ""}>Next ›</button>
    </div>
    <span class="review-focus-save-note">Choices save immediately. You can return and change one.</span>
  `;
  workspace.querySelector(".brain-review-grid")?.after(underbar);
}

function buildCompletion(workspace, items) {
  const finish = workspace.querySelector(".brain-review-finish.ready");
  if (!finish || workspace.querySelector(".review-focus-complete")) return false;

  const finalAction = finish.querySelector("button");
  const complete = document.createElement("section");
  complete.className = "review-focus-complete";
  complete.innerHTML = `
    <span class="review-focus-complete-mark" aria-hidden="true">✓</span>
    <h2>Review complete</h2>
    <p>${items.length} ${items.length === 1 ? "decision" : "decisions"} saved.</p>
    <div class="review-focus-complete-actions"></div>
  `;
  const actions = complete.querySelector(".review-focus-complete-actions");
  if (finalAction) actions.append(finalAction);
  const review = document.createElement("button");
  review.type = "button";
  review.className = "button";
  review.dataset.reviewAll = "";
  review.textContent = "Review decisions";
  actions.append(review);

  const progress = workspace.querySelector(".review-focus-progress");
  const grid = workspace.querySelector(".brain-review-grid");
  const underbar = workspace.querySelector(".review-focus-underbar");
  if (progress) progress.hidden = true;
  if (grid) grid.hidden = true;
  if (underbar) underbar.hidden = true;
  finish.before(complete);
  return true;
}

function buildDrawer(workspace) {
  document.querySelector(".review-focus-drawer-scrim")?.remove();
  const items = queueItems(workspace);
  if (!items.length) return;

  const scrim = document.createElement("div");
  scrim.className = "review-focus-drawer-scrim";
  scrim.innerHTML = `
    <aside class="review-focus-drawer" role="dialog" aria-modal="true" aria-label="Review decisions">
      <div class="review-focus-drawer-head">
        <h2>Review decisions</h2>
        <button class="review-focus-drawer-close" type="button" data-review-drawer-close aria-label="Close">×</button>
      </div>
      <div class="review-focus-drawer-list"></div>
    </aside>
  `;
  const list = scrim.querySelector(".review-focus-drawer-list");
  items.forEach((item) => list.append(item.cloneNode(true)));
  document.querySelector("#app")?.append(scrim);
  scrim.querySelector("[data-review-drawer-close]")?.focus();
}

function applyReviewFocus() {
  if (applying) return;
  applying = true;
  try {
    const workspace = reviewWorkspace();
    if (!workspace) {
      cleanShell();
      return;
    }

    prepareShell(workspace);
    markPassiveProtections(workspace);
    markRequiredStep(workspace);

    const items = queueItems(workspace);
    if (!items.length) return;

    if (pendingAdvance) {
      const next = nextUnresolved(items, pendingAdvance.id);
      pendingAdvance = null;
      if (next) {
        next.click();
        return;
      }
    }

    buildProgress(workspace, items);
    buildSlide(workspace);
    buildUnderbar(workspace, items);
    buildCompletion(workspace, items);
  } finally {
    applying = false;
  }
}

function navigateRelative(direction) {
  const workspace = reviewWorkspace();
  if (!workspace) return;
  const items = queueItems(workspace);
  if (!items.length) return;
  const active = activeQueueIndex(items);
  const nextIndex = active + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return;
  items[nextIndex].click();
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const decision = target.closest(".brain-decision-action");
  if (decision && reviewWorkspace()) {
    pendingAdvance = { id: decision.dataset.id || "" };
    return;
  }

  if (target.closest("[data-review-all]")) {
    event.preventDefault();
    event.stopPropagation();
    const workspace = reviewWorkspace();
    if (workspace) buildDrawer(workspace);
    return;
  }

  if (target.closest("[data-review-drawer-close]") || target.classList.contains("review-focus-drawer-scrim")) {
    event.preventDefault();
    event.stopPropagation();
    document.querySelector(".review-focus-drawer-scrim")?.remove();
    return;
  }

  if (target.closest("[data-review-back]")) {
    event.preventDefault();
    event.stopPropagation();
    navigateRelative(-1);
    return;
  }

  if (target.closest("[data-review-next]")) {
    event.preventDefault();
    event.stopPropagation();
    navigateRelative(1);
    return;
  }

  if (target.closest(".review-focus-drawer .brain-queue-item")) {
    document.querySelector(".review-focus-drawer-scrim")?.remove();
  }
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector(".review-focus-drawer-scrim")) {
    document.querySelector(".review-focus-drawer-scrim")?.remove();
  }
});

if (appRoot) {
  const observer = new MutationObserver(() => queueMicrotask(applyReviewFocus));
  observer.observe(appRoot, { childList: true, subtree: true });
  queueMicrotask(applyReviewFocus);
}
