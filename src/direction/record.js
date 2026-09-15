import { REACH_LEVELS } from "../brand-brain/schema.js";

// The direction record, ADR 0021, reshaped 2026-09-15 after the first real
// sessions. See docs/findings-2026-09-15-the-session-proposes.md.
//
// The first shape had one section per artifact field, so an answer landed in
// the slot the evolved pass was about to fill and got copied across. A scene
// the owner described in detail became the world. This shape holds the world
// at the level that generates pictures rather than at the level of one
// picture: a territory, the rules that hold across every frame in it, and
// examples that are marked as examples and are never reproduced literally.

export const DIRECTION_KINDS = ["world"];

// What the record holds. These are the decisions the session makes, not the
// fields synthesis fills, which is deliberate: a section named after a schema
// slot invites the model to copy into it.
export const DIRECTION_SECTIONS = [
  {
    id: "territory",
    label: "The world",
    hint: "The visual territory this brand lives in. Who these people are, where they spend time, what the place feels like to be in.",
  },
  {
    id: "register",
    label: "The register",
    hint: "What is always true about how people appear. What they are doing and not doing, how aware of the camera they are, what state the product is in.",
  },
  {
    id: "people",
    label: "Who is in frame",
    hint: "The range of people this world casts from, as a kind of presence rather than a roster.",
  },
  {
    id: "places",
    label: "Where it happens",
    hint: "The spread of rooms and settings this world covers. A range, never one room.",
  },
  {
    id: "objects",
    label: "What is in the room",
    hint: "The era and condition of things in frame, and the prop territory the brand owns.",
  },
  {
    id: "light",
    label: "How it is lit",
    hint: "Sources, direction, contrast, and color condition.",
  },
  {
    id: "camera",
    label: "How it is shot",
    hint: "Distance, format, stock character, and what is allowed to be imperfect.",
  },
  {
    id: "fixed",
    label: "What must not change",
    hint: "What the brand already has that this direction keeps. Empty for a brand with nothing settled yet.",
  },
];

const SECTION_IDS = DIRECTION_SECTIONS.map((section) => section.id);

// How an entry was arrived at. Stated means the person said it. Chosen means
// they took it from a world the session proposed. Rejected means they killed
// it, and rejections are kept: they stop a later session re-proposing what an
// earlier one killed.
export const DIRECTION_ENTRY_ORIGINS = ["stated", "chosen", "rejected"];

// What an entry is. A rule holds across every picture in this world and is
// what synthesis builds from. An example is one illustration of a rule, kept
// so a reader can see what was meant, and never reproduced as a scene. The
// first shape had no such distinction, which is how one described scene
// became the whole world.
export const DIRECTION_ENTRY_KINDS = ["rule", "example"];

export function emptyDirectionRecord({ brandName = "", model = "" } = {}) {
  const now = new Date().toISOString();
  const sections = {};
  for (const id of SECTION_IDS) sections[id] = [];
  return {
    kind: "direction-record",
    directionKind: "world",
    brandName,
    status: "proposed",
    version: 1,
    sections,
    reach: null,
    model,
    turns: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function cleanEntry(entry) {
  const text = String(entry?.text || "").trim().slice(0, 600);
  if (!text) return null;
  return {
    text,
    origin: DIRECTION_ENTRY_ORIGINS.includes(entry?.origin) ? entry.origin : "stated",
    entryKind: DIRECTION_ENTRY_KINDS.includes(entry?.entryKind) ? entry.entryKind : "rule",
    at: typeof entry?.at === "string" ? entry.at : new Date().toISOString(),
  };
}

export function normalizeDirectionRecord(record) {
  if (!record || typeof record !== "object") return null;
  const base = emptyDirectionRecord({
    brandName: String(record.brandName || "").slice(0, 120),
    model: String(record.model || "").slice(0, 120),
  });
  for (const id of SECTION_IDS) {
    const entries = Array.isArray(record.sections?.[id]) ? record.sections[id] : [];
    base.sections[id] = entries.map(cleanEntry).filter(Boolean).slice(0, 40);
  }
  base.status = record.status === "approved" ? "approved" : "proposed";
  base.version = Number.isInteger(record.version) && record.version > 0 ? record.version : 1;
  base.reach =
    record.reach && REACH_LEVELS.includes(record.reach.level)
      ? {
          level: record.reach.level,
          because: String(record.reach.because || "").slice(0, 600),
          tradeoff: String(record.reach.tradeoff || "").slice(0, 600),
        }
      : null;
  base.turns = Number.isInteger(record.turns) && record.turns >= 0 ? record.turns : 0;
  if (typeof record.createdAt === "string") base.createdAt = record.createdAt;
  if (typeof record.updatedAt === "string") base.updatedAt = record.updatedAt;
  if (typeof record.approvedAt === "string" && base.status === "approved") base.approvedAt = record.approvedAt;
  return base;
}

export function directionEntryCount(record) {
  return SECTION_IDS.reduce((total, id) => total + (record?.sections?.[id]?.length || 0), 0);
}

export function directionKeptEntryCount(record) {
  return SECTION_IDS.reduce(
    (total, id) => total + (record?.sections?.[id] || []).filter((entry) => entry.origin !== "rejected").length,
    0,
  );
}

// Which reach levels a session may recommend. A brand with no audience
// evidence has no people or places to keep, so a new world is the only level
// available. A brand with a settled audience keeps them, so a new world is
// off the table and the direction lands in how the pictures are made.
export function availableReachLevels(livedWorld) {
  const established = livedWorld?.audienceEvidence !== "not established";
  return REACH_LEVELS.filter((level) => (established ? level !== "a new world" : level === "a new world"));
}

// The record rendered as prose, which is what synthesis reads. Rules are
// stated as rules. Examples are labelled as examples and carry the
// instruction not to reproduce them, because the failure this shape exists to
// prevent is a described scene arriving in the artifact as a moment.
export function directionRecordProse(record) {
  const lines = [];
  lines.push(
    `Direction record for ${record.brandName || "this brand"}, version ${record.version}. The brand's visual direction, decided with its owner in a direction session.`,
  );
  lines.push(
    "Rules hold across every picture in this world and are what to build from. Examples illustrate a rule and are not scenes to reproduce: write different situations that obey the same rules. Ruled-out lines are territory the owner killed and must not appear in any form.",
  );
  for (const section of DIRECTION_SECTIONS) {
    const entries = record.sections?.[section.id] || [];
    if (!entries.length) continue;
    const rules = entries.filter((entry) => entry.origin !== "rejected" && entry.entryKind === "rule");
    const examples = entries.filter((entry) => entry.origin !== "rejected" && entry.entryKind === "example");
    const rejected = entries.filter((entry) => entry.origin === "rejected");
    lines.push("");
    lines.push(`${section.label}:`);
    for (const entry of rules) lines.push(`- ${entry.text}`);
    for (const entry of examples) lines.push(`- For example, and not to be reproduced: ${entry.text}`);
    if (rejected.length) {
      lines.push("Ruled out:");
      for (const entry of rejected) lines.push(`- ${entry.text}`);
    }
  }
  return lines.join("\n");
}

export function directionRecordAsSource(record) {
  return {
    id: "direction-record",
    name: `${record.brandName || "Brand"} direction record v${record.version}`,
    type: "Direction record",
    declaredType: "Direction record",
    detail: "The brand's visual direction, decided in a direction session and approved by the owner.",
    authority: "brand-evidence",
    role: "Creative direction",
    influence: "Lead",
    usage:
      "This is the brand's declared direction, approved by its owner. Build the world it describes. Its rules hold across every picture. Its examples illustrate those rules and are not scenes to reproduce: write different situations that obey the same rules, across the range of places the record names. Ruled-out lines were killed by the owner and must not return in any form.",
    exclusions: "No additional exclusions supplied.",
    provenance: "ours",
    aspiration: "aspiration",
    verification: "Approved by the owner",
    content: directionRecordProse(record),
    files: [],
  };
}
