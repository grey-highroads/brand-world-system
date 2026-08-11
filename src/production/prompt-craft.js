/**
 * Production prompt craft layer.
 *
 * Ported from the Product World Preview render-prompt-writer (v13) into
 * Brand World System. These functions shape how approved Brand Brain
 * knowledge becomes a render-ready prompt. The goal: the few rules that
 * exist should be precise enough that everything else stays open.
 *
 * The protection block, integration sentence, and state-lock neutralization
 * went through thirteen PWP iterations. They are carried forward as proven
 * craft, not new invention.
 */

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function clean(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Format inference
// ---------------------------------------------------------------------------

const FORMAT_NOUN = {
  can: "can",
  pouch: "pouch",
  tub: "tub",
  jar: "jar",
  bottle: "bottle",
  box: "carton",
  cooler: "cooler",
  package: "package",
};

/**
 * Infer the physical package format from a locked asset's name and metadata.
 * Falls back to "package" when no signal is found.
 */
export function inferPackageFormat(lockedAsset) {
  if (!lockedAsset) return "package";
  const hay = [
    lockedAsset.name,
    lockedAsset.assetType,
    lockedAsset.declaredType,
    lockedAsset.fileName,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (/\b(jar|gummy|gummies|edible|edibles|softgel|capsule|honey|jam|salve|balm)\b/.test(hay)) return "jar";
  if (/\b(pouch|bag|packet|sachet|wrapper|jerky|granola|chips)\b/.test(hay)) return "pouch";
  if (/\b(can|soda|spritz|seltzer|rtd)\b/.test(hay)) return "can";
  if (/\b(tub|canister|pre[- ]?workout|powder container|protein tub)\b/.test(hay)) return "tub";
  if (/\b(bottle|shooter|squeeze|dropper|tincture|drops|vial|flask)\b/.test(hay)) return "bottle";
  if (/\b(cooler|hard[- ]?cooler|soft[- ]?cooler|ice[- ]?chest)\b/.test(hay)) return "cooler";
  if (/\b(box|carton|case)\b/.test(hay)) return "box";
  return "package";
}

/**
 * Detect whether a locked asset is screen-bearing: a device whose value is
 * its display (phone, tablet, laptop, app mockup, kiosk, TV). Screen-bearing
 * assets carry an orientation contradiction risk: briefs that describe a
 * person using the device imply the screen faces the user, while asset
 * fidelity requires the screen to face the camera.
 */
export function inferScreenBearing(lockedAsset) {
  if (!lockedAsset) return false;
  const hay = [
    lockedAsset.name,
    lockedAsset.assetType,
    lockedAsset.declaredType,
    lockedAsset.fileName,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();
  return /\b(phone|smartphone|iphone|android|mobile|tablet|ipad|laptop|macbook|computer|monitor|screen|display|device|kiosk|tv|television|watch face|smartwatch|app|ui|interface|mockup|screenshot)\b/.test(hay);
}

// ---------------------------------------------------------------------------
// Integration sentence
// ---------------------------------------------------------------------------

/**
 * One sentence describing how a locked product asset should sit physically
 * in the scene. Format-specific behaviors (condensation on a can, crinkle
 * on a pouch) keep the instruction precise without constraining the world.
 */
export function integrationSentence(format) {
  const base = "natural contact shadow, scene-matched reflected light and color spill, and soft depth of field";
  const formatExtra =
    format === "can" ? " and physically motivated condensation or rim highlights where the scene supports them"
    : format === "pouch" ? " and minor natural pouch crinkle at contact points"
    : format === "bottle" ? " and physically motivated condensation or edge reflection where the scene supports them"
    : "";
  return `Integrate it physically with ${base}${formatExtra}, so it feels photographed in the scene, never pasted on.`;
}

// ---------------------------------------------------------------------------
// Protection block
// ---------------------------------------------------------------------------

const STATEFUL_FORMATS = new Set(["can", "jar", "tub", "bottle", "box", "pouch", "cooler"]);
const TEXT_SAFETY = "Any environmental surface that would carry writing (signs, screens, menus, posters, or displays) is blank, abstract, cropped, or defocused beyond reading, with no pseudo-text or letter-like marks anywhere.";

// When authored display copy is rendered into the image, the blanket rule
// above would forbid the very thing being asked for. It is narrowed rather
// than dropped: environmental surfaces stay blank, and exactly one authored
// block is permitted. Recorded as an amendment to ADR 0014 part two, since
// the original position was that no text is rendered at any time.
const TEXT_SAFETY_WITH_DISPLAY_COPY = "Apart from the authored display copy specified below, any environmental surface that would carry writing (signs, screens, menus, posters, or displays) is blank, abstract, cropped, or defocused beyond reading, with no pseudo-text or letter-like marks anywhere. Invent no other words, labels, captions, watermarks, or letter-like marks.";

/**
 * Build the protection block for a production prompt.
 *
 * Three cases:
 * 1. No locked asset: prevent the renderer from inventing products or text.
 * 2. Locked non-product asset (logo, character, photo): preserve identity.
 * 3. Locked product/packaging asset: format-aware preservation with state lock.
 *
 * In all cases the block is compact (three to five sentences) so the world
 * carries the majority of the prompt budget.
 */
const SCREEN_ORIENTATION_LINES = [
  "The device's screen faces the camera directly and remains fully visible and readable in the final frame.",
  "If a person appears with the device, position them so that orientation is physically natural: beside or behind it presenting the screen outward, or viewed over the shoulder so the camera sees the screen as they do.",
  "Never render the device held in a viewing grip with the screen rotated toward the camera, and never show the back of the device to the camera.",
];

export function protectionBlock({ lockedAsset, format, peopleExcluded = false, screenBearing = false, displayCopy = null }) {
  const textSafety = displayCopy ? TEXT_SAFETY_WITH_DISPLAY_COPY : TEXT_SAFETY;
  // Case 1: world-only, no locked asset
  if (!lockedAsset) {
    const lines = [
      "Render only the authored environment and its explicitly approved unbranded environmental objects; introduce no additional focal object or readable identity mark.",
      textSafety,
    ];
    if (peopleExcluded) lines.push("No people or hands appear in the frame.");
    return lines.join(" ");
  }

  const assetName = clean(lockedAsset.name) || clean(lockedAsset.assetType) || "protected asset";
  const isProduct = /^(packaging|product|product_photo|product_render|package|can|bottle|jar|pouch|tub|box|cooler)$/i.test(
    clean(lockedAsset.assetType || lockedAsset.declaredType || format),
  );

  // Case 2: non-product locked asset (logo, character, portrait)
  if (!isProduct) {
    const lines = [
      `Use the supplied ${assetName} as the identity source of truth; preserve its protected subject, marks, proportions, and visible structure unchanged.`,
      "Do not redraw, replace, or reinterpret the protected identity.",
      "Integrate it only through non-destructive environmental light, contact shadow, reflected color, atmosphere, occlusion, and depth effects that do not alter protected identity.",
      textSafety,
    ];
    if (screenBearing) lines.splice(2, 0, ...SCREEN_ORIENTATION_LINES);
    if (peopleExcluded) lines.push("No additional people or hands appear in the frame.");
    return lines.join(" ");
  }

  // Case 3: locked product/packaging asset
  const noun = FORMAT_NOUN[format] || "package";
  const lines = [
    `Preserve the supplied ${noun} exactly as pictured: logo, label hierarchy, typography, colors, proportions, silhouette, and open or closed state unchanged, fully readable.`,
  ];
  if (STATEFUL_FORMATS.has(format)) {
    lines.push(
      `The ${noun} is closed and sealed exactly as supplied: lid on, cap on, wrapper intact, contents not exposed. Do not render the ${noun} as opened, tipped, or with contents visible.`,
    );
  }
  if (screenBearing) lines.push(...SCREEN_ORIENTATION_LINES);
  lines.push(integrationSentence(format));
  lines.push(textSafety);
  if (peopleExcluded) lines.push("No people or hands appear in the frame.");
  return lines.join(" ");
}

// ---------------------------------------------------------------------------
// Aesthetic mode library
// ---------------------------------------------------------------------------

export const AESTHETIC_MODES = {
  cinematic_film_still: {
    id: "cinematic_film_still",
    name: "Cinematic film still",
    openingLine: "A wide cinematic campaign-film still in landscape framing, a real environment with depth and atmosphere.",
    bestWhen: "premium, ritual, cinematic, heritage, design-led, or elevated ceremony",
  },
  documentary_lifestyle: {
    id: "documentary_lifestyle",
    name: "Documentary lifestyle",
    openingLine: "An eye-level documentary photograph in the tradition of outdoor and lifestyle editorial, real and observed rather than staged.",
    bestWhen: "documentary, vernacular, casual, observed, people-centric, outdoor, or activity-driven",
  },
  editorial_commercial: {
    id: "editorial_commercial",
    name: "Editorial commercial",
    openingLine: "A composed editorial photograph in the tradition of magazine-cover lifestyle work, considered light and considered framing without cinematic drama.",
    bestWhen: "fashion, beauty, considered, magazine, studio, or product-forward without being a packshot",
  },
  vernacular_ugc: {
    id: "vernacular_ugc",
    name: "Vernacular",
    openingLine: "A vernacular photograph in the register of a phone camera in daily life, incidental and immediate, not a commercial frame.",
    bestWhen: "casual, social, phone-camera, daily life, unpolished, or community-driven",
  },
};

const MODE_SIGNAL_PATTERNS = [
  { mode: "documentary_lifestyle", patterns: [/\bdocumentary\b/i, /\bobserved\b/i, /\blifestyle editorial\b/i, /\beye[- ]level\b/i] },
  { mode: "editorial_commercial", patterns: [/\beditorial\b/i, /\bmagazine\b/i, /\bfashion\b/i, /\bconsidered\b/i] },
  { mode: "vernacular_ugc", patterns: [/\bvernacular\b/i, /\bugc\b/i, /\bphone[- ]camera\b/i, /\bincidental\b/i, /\bcasual\b/i] },
];

// ---------------------------------------------------------------------------
// Authored display copy
// ---------------------------------------------------------------------------

/**
 * The block that asks the renderer to draw a specific string.
 *
 * Three things it must communicate, in this order of importance: the exact
 * characters, that they are not to be altered, and where they go. The zone
 * is a composition instruction as much as a placement one, because the
 * render has to leave the space before anything can sit in it.
 *
 * Fidelity is asserted here and not verified here. Read-back verification is
 * specified in ADR 0014 part two and is not built. Until it is, an output
 * carrying rendered copy is unverified and the interface says so.
 */
export function displayCopyBlock({ lines, zone, format }) {
  const rendered = (lines || []).filter((line) => line.text);
  if (!rendered.length) return "";

  const parts = [
    `Render the following authored copy into the image, ${zone.description}, composed as part of the photograph rather than pasted over it.`,
    `Leave clean, uncluttered space in that area when composing the scene so the copy sits legibly without covering the subject.`,
  ];

  for (const line of rendered) {
    parts.push(`${line.label}, set exactly as written with no changes to wording, spelling, capitalization, or punctuation: "${line.text}"`);
  }

  // Proportional instruction rather than absolute measurements. The first
  // real render showed the model choosing display-size type and composing
  // for the zone when told to, so it follows relationships. It does not
  // follow arithmetic, which is why nothing here is stated in pixels.
  const primary = rendered[0];
  parts.push(`Size the type to fill the space it is given rather than sitting small inside it. The ${lowerLabel(primary)} occupies roughly ${Math.round((primary.fillShare ?? 0.7) * 100)} percent of the copy area's height and is the dominant element in the frame's typography.`);

  if (rendered.length > 1) {
    const hierarchy = rendered.slice(1).map((line) =>
      `the ${lowerLabel(line)} sets at about ${Math.round((line.relativeSize ?? 0.45) * 100)} percent of the ${lowerLabel(primary)}'s size, ${line.note || "clearly secondary to it"}`,
    );
    parts.push(`Hold a clear hierarchy: ${hierarchy.join("; ")}. The sizes are relative to each other, so the relationship holds whatever the absolute scale.`);
    parts.push(`Stack the lines as a single typographic group with consistent alignment and even spacing between them, not scattered across the frame.`);
  }

  parts.push(
    `Break lines at phrase boundaries so each line reads as a unit. Never break in the middle of a phrase, and never leave a single word stranded on its own line unless the copy is one word.`,
    `Set the copy in a clean, contemporary sans-serif, aligned consistently, with enough contrast against what sits behind it to stay legible. Keep an even optical margin around the copy so it does not crowd the frame edge or the subject.`,
    `Reproduce every character exactly. Do not paraphrase, translate, abbreviate, re-order, correct, or add to the copy above, and do not repeat it anywhere else in the frame.`,
  );
  if (format) parts.push(`The composition is ${format}; keep the copy clear of the outer edges.`);

  return parts.join(" ");
}

function lowerLabel(line) {
  return String(line?.label || "copy").toLowerCase();
}

/**
 * Select an aesthetic mode from creative direction text in the approved brain.
 * Returns cinematic as the fallback, matching PWP's evidence-first default.
 */
export function selectAestheticMode(creativeDirectionText) {
  const text = clean(creativeDirectionText);
  if (!text) return AESTHETIC_MODES.cinematic_film_still;

  for (const { mode, patterns } of MODE_SIGNAL_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return AESTHETIC_MODES[mode];
    }
  }
  return AESTHETIC_MODES.cinematic_film_still;
}

/**
 * Return the opening framing line for the selected mode.
 * For world-only images (no product), strips the "not a tabletop" clause.
 */
export function openingLine(mode, hasProduct = false) {
  const line = (mode && mode.openingLine) || AESTHETIC_MODES.cinematic_film_still.openingLine;
  if (hasProduct) return line;
  return line.replace(/,\s*not a tabletop product photo\.?$/i, ".");
}

// ---------------------------------------------------------------------------
// State-lock neutralization
// ---------------------------------------------------------------------------

const OPEN_WORD = "(?:open|opened)";
const STATE_LOCK_PATTERNS = [
  [new RegExp("\\b(jar|bottle|can|pouch|tub|box|package|container)s?\\s+" + OPEN_WORD + "\\b", "gi"), "$1 closed and sealed"],
  [new RegExp("\\bsits?\\s+" + OPEN_WORD + "\\b", "gi"), "sits"],
  [new RegExp("\\bstands?\\s+" + OPEN_WORD + "\\b", "gi"), "stands"],
  [new RegExp("\\brests?\\s+" + OPEN_WORD + "\\b", "gi"), "rests"],
  [new RegExp("\\bsitting\\s+" + OPEN_WORD + "\\b", "gi"), "sitting"],
  [new RegExp("\\bstanding\\s+" + OPEN_WORD + "\\b", "gi"), "standing"],
  [/\b(the\s+)?lid\s+(?:is\s+)?(?:off|removed|open)\b/gi, "the lid on"],
  [/\b(the\s+)?cap\s+(?:is\s+)?(?:off|removed|open)\b/gi, "the cap on"],
  [/\bwith\s+(the\s+)?(lid|cap)\s+(?:off|removed)\b/gi, "with the $2 on"],
  [/\buncapped\b/gi, "capped"],
  [/\bunsealed\b/gi, "sealed"],
  [/\bunwrapped\b/gi, "wrapped"],
  [/\bpoured\s+out\b/gi, "held ready"],
  [/\bspilled\b/gi, "settled"],
  [/\btipped\s+over\b/gi, "upright"],
  [/\bcontents\s+visible\b/gi, "contents held inside"],
  [/\bcontents\s+spilling\b/gi, "contents held inside"],
];

/**
 * Rewrite scene prose that contradicts a locked asset's physical state.
 * Returns the cleaned text and an array of phrases that were changed.
 * When no locked asset is present, this function should not be called.
 */
export function neutralizeStateLanguage(text) {
  let out = clean(text);
  const changed = [];
  for (const [pattern, replacement] of STATE_LOCK_PATTERNS) {
    const found = out.match(pattern);
    if (found) {
      changed.push(...found);
      out = out.replace(pattern, replacement);
    }
  }
  return { text: out, changed };
}

// ---------------------------------------------------------------------------
// Screen orientation neutralization
// ---------------------------------------------------------------------------

const DEVICE_REF = "(?:the\\s+|a\\s+|her\\s+|his\\s+|their\\s+)?(?:phone|smartphone|iphone|device|tablet|ipad|laptop|screen)";
const SCREEN_ORIENTATION_PATTERNS = [
  // Participle forms keep participle replacements; finite forms keep finite ones,
  // so the rewritten sentence stays grammatical either way.
  [new RegExp("\\b(?:scrolling|swiping)\\s+(?:through|on)\\s+" + DEVICE_REF, "gi"), "presenting the screen toward the camera"],
  [new RegExp("\\b(?:scrolls?|swipes?)\\s+(?:through|on)\\s+" + DEVICE_REF, "gi"), "presents the screen toward the camera"],
  [new RegExp("\\b(?:typing|texting|tapping)\\s+on\\s+" + DEVICE_REF, "gi"), "presenting the screen toward the camera"],
  [new RegExp("\\b(?:types?|texts?|taps?)\\s+on\\s+" + DEVICE_REF, "gi"), "presents the screen toward the camera"],
  [new RegExp("\\b(?:looking|glancing|gazing|staring)\\s+(?:down\\s+)?at\\s+" + DEVICE_REF, "gi"), "holding the screen toward the camera"],
  [new RegExp("\\b(?:looks?|glances?|gazes?|stares?)\\s+(?:down\\s+)?at\\s+" + DEVICE_REF, "gi"), "holds the screen toward the camera"],
  [new RegExp("\\b(?:reading|checking)\\s+" + DEVICE_REF, "gi"), "holding the screen toward the camera"],
  [new RegExp("\\b(?:reads?|checks?)\\s+" + DEVICE_REF, "gi"), "holds the screen toward the camera"],
  [new RegExp("\\busing\\s+" + DEVICE_REF, "gi"), "presenting the screen toward the camera"],
  [new RegExp("\\buses?\\s+" + DEVICE_REF, "gi"), "presents the screen toward the camera"],
];

/**
 * Rewrite brief prose that implies a person is mid-use with a screen-bearing
 * asset. Using-it poses force the screen away from the camera, which
 * contradicts asset fidelity, and the renderer resolves the contradiction
 * by drawing the device backward. Rewrites steer toward presentation poses
 * where a visible screen and a person are simultaneously honest.
 * Returns the cleaned text and an array of phrases that were changed.
 * Only call when the locked asset is screen-bearing.
 */
export function neutralizeScreenOrientation(text) {
  let out = clean(text);
  const changed = [];
  for (const [pattern, replacement] of SCREEN_ORIENTATION_PATTERNS) {
    const found = out.match(pattern);
    if (found) {
      changed.push(...found);
      out = out.replace(pattern, replacement);
    }
  }
  return { text: out, changed };
}

// ---------------------------------------------------------------------------
// Constraint audit
// ---------------------------------------------------------------------------

/**
 * Check every guardrail and user exclusion against the compiled prompt.
 * Returns an array of { rule, source, status } entries.
 *
 * This is a deterministic text check, not a semantic evaluation. It catches
 * explicit contradictions. The human reviewer and any future model-based
 * evaluation handle subtler violations.
 */
export function auditConstraints({ guardrails = [], exclusions = "", prompt = "" }) {
  const audit = [];
  const promptLower = prompt.toLowerCase();

  for (const rule of guardrails) {
    const title = clean(rule.title);
    const body = clean(rule.body);
    if (!title && !body) continue;
    // A guardrail is "carried" if its key terms appear in the prompt.
    // Simple presence check: the guardrail text was compiled into the prompt.
    const carried = promptLower.includes(title.toLowerCase()) || promptLower.includes(body.toLowerCase());
    audit.push({
      rule: title ? `${title}: ${body}` : body,
      source: "Brand Brain guardrail",
      status: carried ? "carried" : "review",
    });
  }

  const exclusionText = clean(exclusions);
  if (exclusionText) {
    const carried = promptLower.includes(exclusionText.toLowerCase());
    audit.push({
      rule: exclusionText,
      source: "Brief exclusion",
      status: carried ? "carried" : "review",
    });
  }

  return audit;
}
