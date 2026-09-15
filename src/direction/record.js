import { REACH_LEVELS } from "../brand-brain/schema.js";

// The direction record, ADR 0021. A brand's visual aspirational direction,
// authored in a session between the two worlds: passes 1 through 4 write the
// brand today, the session produces this record, and the evolved passes read
// it as an ordinary source once it is approved. One record per brand, stored
// beside the brain in the same store.
//
// This module holds the shape and the two translations: the record rendered
// as prose, and the record wrapped as a source. Nothing in the synthesis
// instructions knows this record exists. That is deliberate and it is the
// test of the shape: the evolved passes read it through the same authority
// rules every other source answers to, because it arrives with provenance
// "ours" and aspiration "aspiration" like any direction material a client
// could have uploaded.

// This brief builds the world kind only. A craft direction, for a brand whose
// audience is settled, is a separate session with its own sections and is out
// of scope here.
export const DIRECTION_KINDS = ["world"];

// The sections a world direction fills: the four Lived World fields the
// session can decide, and the six Visual Grammar sections. Ids are the
// architecture's words, because the record is read by synthesis; labels are
// the user's words, because the screen shows them. The two grammar section
// ids "places" and the Lived World field "environments" are distinct on
// purpose: environments are journey moments, places are rooms and surfaces,
// and the schema keeps them apart for the same reason.
export const WORLD_DIRECTION_SECTIONS = [
  { id: "cast", artifact: "livedWorld", label: "Who these people are" },
  { id: "patterns", artifact: "livedWorld", label: "How their days run" },
  { id: "environments", artifact: "livedWorld", label: "Where they spend time" },
  { id: "social", artifact: "livedWorld", label: "Who they are with" },
  { id: "people", artifact: "visualGrammar", label: "People in frame" },
  { id: "objects", artifact: "visualGrammar", label: "Objects" },
  { id: "places", artifact: "visualGrammar", label: "Places and surfaces" },
  { id: "light", artifact: "visualGrammar", label: "Light" },
  { id: "camera", artifact: "visualGrammar", label: "Camera" },
  { id: "rejects", artifact: "visualGrammar", label: "What the pictures refuse" },
];

const SECTION_IDS = WORLD_DIRECTION_SECTIONS.map((section) => section.id);

// How an entry was arrived at. Stated means the person typed it. Chosen means
// they picked it from options the session offered. Rejected means they ruled
// one out. Rejected entries are kept rather than deleted: they stop a later
// session re-proposing what an earlier one killed, and what a brand rules out
// is often more particular to it than what it asks for.
export const DIRECTION_ENTRY_ORIGINS = ["stated", "chosen", "rejected"];

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
  const origin = DIRECTION_ENTRY_ORIGINS.includes(entry?.origin) ? entry.origin : "stated";
  const at = typeof entry?.at === "string" ? entry.at : new Date().toISOString();
  return { text, origin, at };
}

// The record as the store holds it. Anything outside the shape is dropped
// rather than stored, so a round trip through the store returns what this
// returns and nothing else.
export function normalizeDirectionRecord(record) {
  if (!record || typeof record !== "object") return null;
  const base = emptyDirectionRecord({ brandName: String(record.brandName || "").slice(0, 120), model: String(record.model || "").slice(0, 120) });
  for (const id of SECTION_IDS) {
    const entries = Array.isArray(record.sections?.[id]) ? record.sections[id] : [];
    base.sections[id] = entries.map(cleanEntry).filter(Boolean).slice(0, 40);
  }
  base.status = record.status === "approved" ? "approved" : "proposed";
  base.version = Number.isInteger(record.version) && record.version > 0 ? record.version : 1;
  const reach = record.reach;
  base.reach = reach && REACH_LEVELS.includes(reach.level)
    ? { level: reach.level, because: String(reach.because || "").slice(0, 600), tradeoff: String(reach.tradeoff || "").slice(0, 600) }
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

// Which reach levels a session may recommend for this brand. Derived from the
// levels the schema declares rather than written out again, so a new level
// reaches here by being added once. For an audience that is not established
// there are no people, places or moments to keep, so the two keeping levels
// are unavailable and a new world is the only one on the list. For a settled
// audience the direction lands in how the pictures are made, so a new world
// is off the table.
export function availableReachLevels(livedWorld) {
  const established = livedWorld?.audienceEvidence !== "not established";
  return REACH_LEVELS.filter((level) => (established ? level !== "a new world" : level === "a new world"));
}

const ARTIFACT_HEADINGS = { livedWorld: "Lived World", visualGrammar: "Visual Grammar" };

// The record rendered as prose, which is what synthesis reads. Written for a
// model that already knows the authority rules: kept entries are the
// direction, ruled-out entries are territory that must not return. Nothing
// here instructs the model; the source's usage instructions carry that.
export function directionRecordProse(record) {
  const lines = [];
  const brand = record.brandName || "this brand";
  lines.push(`Direction record for ${brand}, version ${record.version}. Authored with the brand's owner in a direction session.`);
  lines.push(
    "Each entry says how it was arrived at. Stated means the owner said it in their own words. Chosen means the owner picked it from offered options. The ruled-out lists are territory the owner rejected in the session; it must not appear in the evolved world in any form.",
  );
  for (const section of WORLD_DIRECTION_SECTIONS) {
    const entries = record.sections?.[section.id] || [];
    if (!entries.length) continue;
    const kept = entries.filter((entry) => entry.origin !== "rejected");
    const rejected = entries.filter((entry) => entry.origin === "rejected");
    lines.push("");
    lines.push(`${ARTIFACT_HEADINGS[section.artifact]}, ${section.id}:`);
    for (const entry of kept) lines.push(`- ${entry.text} (${entry.origin})`);
    if (rejected.length) {
      lines.push("Ruled out:");
      for (const entry of rejected) lines.push(`- ${entry.text}`);
    }
  }
  return lines.join("\n");
}

// The record as a source, which is how it reaches the evolved passes on
// approval. Provenance ours, aspiration aspiration, lead influence: the
// brand's own declared direction, and the strongest voice among direction
// material. The id is stable so a re-approved record replaces itself in any
// merged set rather than accumulating.
export function directionRecordAsSource(record) {
  return {
    id: "direction-record",
    name: `${record.brandName || "Brand"} direction record v${record.version}`,
    type: "Direction record",
    declaredType: "Direction record",
    detail: "The brand's visual direction, authored in a direction session and approved by the owner.",
    authority: "brand-evidence",
    role: "Creative direction",
    influence: "Lead",
    usage:
      "This is the brand's declared direction, approved by its owner. Build the evolved world in the direction it states. Entries under a ruled-out heading were rejected by the owner and must not return in any form.",
    exclusions: "No additional exclusions supplied.",
    provenance: "ours",
    aspiration: "aspiration",
    verification: "Approved by the owner",
    content: directionRecordProse(record),
    files: [],
  };
}
