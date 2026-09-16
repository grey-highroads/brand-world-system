// The brand world document.
//
// One long piece of prose that says what this brand's pictures are: who these
// people are, where they spend their time, what is in those places, how the
// light behaves, what they are doing when nobody is performing. It is written
// at the end of a direction session, from a foundation read and a few rounds
// of the owner reacting to proposed worlds.
//
// It is the creative source. The Lived World, Story Architecture and Visual
// Grammar are made from it for people who need them, and production reads
// this document rather than reading them back. That is the whole change.

export const WORLD_STATUS = ["proposed", "approved"];

// The sections the authoring pass writes. They are headings inside one
// document rather than separate records, so the reasoning that connects them
// survives. A reader can jump to Light; nothing reads Light on its own.
export const WORLD_SECTIONS = [
  { id: "thesis", label: "What this world is", hint: "The world in a paragraph. What it feels like to be in, and why it belongs to this brand and no other." },
  { id: "people", label: "The people", hint: "Who this world casts from. What they are into, what they belong to, how they dress and carry themselves, what they are like to be around. A range, wide enough that twenty pictures cast twenty different people who all belong." },
  { id: "life", label: "How their days run", hint: "What a week looks like. What they do alone, with one other person, and with a crowd. What they are doing when nobody is performing." },
  { id: "places", label: "Where it happens", hint: "The settings this world covers, at every scale: a room, a street, a field, a crowd of thousands. Named and particular." },
  { id: "objects", label: "What is around them", hint: "The era and condition of things in these places. What the brand owns visually and what would look wrong." },
  { id: "light", label: "How it is lit", hint: "Sources, direction, contrast, time of day, how light behaves on skin and surfaces across the range of places." },
  { id: "camera", label: "How it is shot", hint: "Distance, format, stock character, what is allowed to be imperfect, how aware of the camera people are." },
  { id: "range", label: "The range", hint: "Eight to twelve situations this world produces, each a different kind of day. Written as possibilities a writer can depart from, never as a list to work through." },
  { id: "edges", label: "Where this world ends", hint: "What would break it, in positive terms where possible. What a picture from a neighbouring brand would have that this one never does." },
];

const SECTION_IDS = WORLD_SECTIONS.map((section) => section.id);

export function emptyWorld({ brandName = "", model = "" } = {}) {
  const now = new Date().toISOString();
  const sections = {};
  for (const id of SECTION_IDS) sections[id] = "";
  return {
    kind: "brand-world",
    brandName,
    status: "proposed",
    version: 1,
    title: "",
    sections,
    decisions: [],
    model,
    createdAt: now,
    updatedAt: now,
  };
}

// A decision the owner made in the session. Scoped and reversible: what was
// rejected, why, how far it reaches, and whether it still applies. Rejection
// history is permanent; the restriction derived from it is not.
function cleanDecision(decision) {
  const text = String(decision?.text || "").trim().slice(0, 600);
  if (!text) return null;
  return {
    text,
    because: String(decision?.because || "").trim().slice(0, 600),
    scope: ["this picture", "this job", "this brand"].includes(decision?.scope) ? decision.scope : "this brand",
    active: decision?.active !== false,
    at: typeof decision?.at === "string" ? decision.at : new Date().toISOString(),
  };
}

export function normalizeWorld(world) {
  if (!world || typeof world !== "object") return null;
  const base = emptyWorld({
    brandName: String(world.brandName || "").slice(0, 120),
    model: String(world.model || "").slice(0, 120),
  });
  base.title = String(world.title || "").trim().slice(0, 160);
  for (const id of SECTION_IDS) base.sections[id] = String(world.sections?.[id] || "").trim().slice(0, 12000);
  base.decisions = (Array.isArray(world.decisions) ? world.decisions : []).map(cleanDecision).filter(Boolean).slice(0, 80);
  base.status = world.status === "approved" ? "approved" : "proposed";
  base.version = Number.isInteger(world.version) && world.version > 0 ? world.version : 1;
  if (typeof world.createdAt === "string") base.createdAt = world.createdAt;
  if (typeof world.updatedAt === "string") base.updatedAt = world.updatedAt;
  if (typeof world.approvedAt === "string" && base.status === "approved") base.approvedAt = world.approvedAt;
  return base;
}

export function worldWordCount(world) {
  return SECTION_IDS.reduce((total, id) => total + String(world?.sections?.[id] || "").split(/\s+/).filter(Boolean).length, 0);
}

export function worldIsWritten(world) {
  return Boolean(world && SECTION_IDS.some((id) => String(world.sections?.[id] || "").trim()));
}

// The document as one piece of prose. This is what production reads and what
// a photographer reads. Same text, no derived summary in between.
export function worldProse(world) {
  const lines = [];
  lines.push(`${world.title || world.brandName || "Brand"}: the world, version ${world.version}.`);
  for (const section of WORLD_SECTIONS) {
    const body = String(world.sections?.[section.id] || "").trim();
    if (!body) continue;
    lines.push("");
    lines.push(`## ${section.label}`);
    lines.push(body);
  }
  const active = (world.decisions || []).filter((decision) => decision.active && decision.scope === "this brand");
  if (active.length) {
    lines.push("");
    lines.push("## Decisions the owner made about this world");
    for (const decision of active) {
      lines.push(`- ${decision.text}${decision.because ? ` Reason: ${decision.because}` : ""}`);
    }
  }
  return lines.join("\n");
}

// The world as a source, for the synthesis passes that still make the
// user-facing artifacts. Production does not go through this: it reads the
// prose directly. This exists so the artifacts a photographer or an agency
// reads are derived from the approved world rather than authored beside it.
export function worldAsSource(world) {
  return {
    id: "brand-world",
    name: `${world.brandName || "Brand"} world v${world.version}`,
    type: "Brand world",
    declaredType: "Brand world",
    detail: "The brand's approved visual world, authored in a direction session with its owner.",
    authority: "brand-evidence",
    role: "Creative direction",
    influence: "Lead",
    usage:
      "This is the brand's approved world and it governs everything visual. Its people are a casting range rather than a cast list: cast someone new for every picture and never carry a named person between pictures. The situations under The range are possibilities to depart from, not a list to work through.",
    exclusions: "No additional exclusions supplied.",
    provenance: "ours",
    aspiration: "aspiration",
    verification: "Approved by the owner",
    content: worldProse(world),
    files: [],
  };
}
