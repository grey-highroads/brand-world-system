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
let reviewingCompleted = false;
let applying = false;
let advanceTimer = null;
const advanceDelay = 420;

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
  if (advanceTimer) window.clearTimeout(advanceTimer);
  advanceTimer = null;
  document.querySelector(".app-shell")?.classList.remove("review-focus-shell");
  document.querySelector(".review-focus-exit")?.remove();
  document.querySelector(".review-focus-drawer-scrim")?.remove();
  reviewingCompleted = false;
  pendingAdvance = null;
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
  const focusedDescription = "Make the few decisions where your judgment changes the brand.";
  if (description && description.textContent !== focusedDescription) description.textContent = focusedDescription;
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
  const reviewReady = Boolean(workspace.querySelector(".brain-review-finish.ready"));
  const underbar = document.createElement("div");
  underbar.className = "review-focus-underbar";
  underbar.innerHTML = `
    <div class="review-focus-underbar-nav">
      <button class="review-focus-nav-button" type="button" data-review-back ${active === 0 ? "disabled" : ""}><span aria-hidden="true">‹</span> Previous</button>
      <button class="review-focus-nav-button" type="button" data-review-next ${active === items.length - 1 && !reviewReady ? "disabled" : ""}>Next <span aria-hidden="true">›</span></button>
    </div>
    ${reviewingCompleted && reviewReady
      ? '<span class="review-focus-save-note">All decisions are saved. Next returns to completion.</span>'
      : '<span class="review-focus-save-note">Choices save immediately. You can return and change one.</span>'}
  `;
  workspace.querySelector(".review-focus-slide")?.append(underbar);
}

function buildCompletion(workspace, items) {
  if (reviewingCompleted) return false;
  const finish = workspace.querySelector(".brain-review-finish.ready");
  const slide = workspace.querySelector(".review-focus-slide");
  if (!finish || !slide || workspace.querySelector(".review-focus-complete")) return false;

  const finalAction = finish.querySelector("button");
  const complete = document.createElement("div");
  complete.className = "review-focus-complete";
  complete.innerHTML = `
    <span class="review-focus-complete-mark" aria-hidden="true">✓</span>
    <h2>Review complete</h2>
    <p>${items.length} ${items.length === 1 ? "decision" : "decisions"} saved.</p>
    <div class="review-focus-complete-actions"></div>
  `;
  const actions = complete.querySelector(".review-focus-complete-actions");
  if (finalAction) {
    finalAction.className = "button primary";
    // The finish button creates the stored draft on the first pass. Once the
    // draft exists the same button only returns to Brand guidance, so it is
    // labelled as an exit rather than as the step that creates the draft.
    if (finalAction.dataset.createsDraft !== "true") finalAction.textContent = "Close review";
    actions.append(finalAction);
  }

  const progress = workspace.querySelector(".review-focus-progress");
  const progressLabel = progress?.querySelector(".review-focus-progress-head span");
  if (progressLabel) progressLabel.textContent = "Review complete";

  const footer = document.createElement("div");
  footer.className = "review-focus-underbar review-focus-complete-footer";
  footer.innerHTML = '<button class="review-focus-nav-button" type="button" data-review-last><span aria-hidden="true">‹</span> Review last decision</button>';

  slide.classList.add("review-focus-complete-slide");
  slide.replaceChildren(complete, footer);
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
      // Hold the next item's id, not its node. The app re-renders the whole
      // screen (a clearing toast is enough), and a node captured here is
      // detached by the time the timer fires.
      const nextId = nextUnresolved(items, pendingAdvance.id)?.dataset.id || "";
      pendingAdvance = null;
      if (advanceTimer) window.clearTimeout(advanceTimer);

      buildProgress(workspace, items);
      buildSlide(workspace);
      buildUnderbar(workspace, items);

      advanceTimer = window.setTimeout(() => {
        advanceTimer = null;
        const target = nextId ? reviewWorkspace()?.querySelector(`.brain-review-grid > .brain-queue .brain-queue-item[data-id="${CSS.escape(nextId)}"]`) : null;
        if (target) target.click();
        else applyReviewFocus();
      }, advanceDelay);
      return;
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
  if (advanceTimer) window.clearTimeout(advanceTimer);
  advanceTimer = null;
  pendingAdvance = null;
  const active = activeQueueIndex(items);
  const nextIndex = active + direction;
  if (nextIndex >= items.length && workspace.querySelector(".brain-review-finish.ready")) {
    reviewingCompleted = false;
    applyReviewFocus();
    return;
  }
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
    if (advanceTimer) window.clearTimeout(advanceTimer);
    advanceTimer = null;
    pendingAdvance = null;
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

  if (target.closest("[data-review-last]")) {
    event.preventDefault();
    event.stopPropagation();
    const workspace = reviewWorkspace();
    const items = workspace ? queueItems(workspace) : [];
    reviewingCompleted = true;
    items.at(-1)?.click();
    return;
  }

  if (target.closest(".review-focus-drawer .brain-queue-item")) {
    // Picking from the drawer only counts as revisiting a finished review when
    // the review is finished. Mid-review it must not block the completion
    // slide from appearing after the last decision.
    if (advanceTimer) window.clearTimeout(advanceTimer);
    advanceTimer = null;
    pendingAdvance = null;
    reviewingCompleted = Boolean(reviewWorkspace()?.querySelector(".brain-review-finish.ready"));
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
