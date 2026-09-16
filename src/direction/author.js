import { DEFAULT_BRAND_BRAIN_MODEL } from "../brand-brain/chat-completions-provider.js";
import { WORLD_SECTIONS, emptyWorld, normalizeWorld } from "./world.js";

// Authoring the world. One call at the end of a session, after the owner has
// reacted to a few proposed worlds and landed on one. The model writes the
// whole document in a single pass so its parts stay connected, which is the
// thing decomposition kept destroying.
//
// The session is deliberately short and broad. The foundation read is thin on
// purpose, the proposals are large strokes, and the depth arrives here, once,
// when there is a direction to be deep about.

function strictObject(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

// The document is written in three passes rather than one. A single call
// writing all nine sections leaves the browser waiting several minutes with
// nothing coming back, and the connection is dropped before the function
// answers. Each stage reads everything written before it, so the parts are
// still written against each other.
export const WORLD_STAGES = [
  { id: "ground", sections: ["thesis", "people", "life"] },
  { id: "pictures", sections: ["places", "objects", "light", "camera"] },
  { id: "reach", sections: ["range", "edges"] },
];

export function worldStageSections(stageId) {
  const stage = WORLD_STAGES.find((entry) => entry.id === stageId) || WORLD_STAGES[0];
  return WORLD_SECTIONS.filter((section) => stage.sections.includes(section.id));
}

export function worldAuthoringSchemaFor(stageId) {
  const sections = worldStageSections(stageId);
  const properties = { sections: strictObject(Object.fromEntries(sections.map((section) => [section.id, { type: "string", description: section.hint }]))) };
  if (stageId === WORLD_STAGES[0].id) {
    properties.title = { type: "string", description: "A short name for this world, three to six words, in the owner's register rather than a marketing line." };
  }
  return strictObject(properties);
}

export function buildWorldAuthoringInstruction({ foundation, transcript, landed, decisions, stageId, written }) {
  const sectionLines = worldStageSections(stageId).map((section) => `### ${section.label} ("${section.id}")\n${section.hint}`).join("\n\n");
  const already = written && Object.keys(written).length
    ? `\nWHAT IS ALREADY WRITTEN\nThese sections of this same document are done. Write against them: do not restate them, do not contradict them, and let them decide what belongs in the sections below.\n${Object.entries(written)
        .map(([id, body]) => `## ${(WORLD_SECTIONS.find((section) => section.id === id) || {}).label || id}\n${body}`)
        .join("\n\n")}\n`
    : "";
  return `You are writing the brand world document for ${foundation?.brand || "this brand"}. It is the creative source for everything this brand makes visually. A photographer briefed on a real shoot reads this. An agency writing a campaign reads this. The system writes every picture from this. There is nothing behind it to fall back on, so write it complete.

The brand facts, read from its own material. These are true and you do not contradict them:
${JSON.stringify(foundation, null, 2)}

The session that got here. The owner reacted to worlds you proposed, killed some, and took others:
${transcript || "(no transcript)"}

The direction the owner landed on:
${landed || "(see the transcript)"}

What the owner decided along the way, including what he killed and why:
${JSON.stringify(decisions || [], null, 2)}

${already}
WRITE THIS PART OF IT
Write it long. This is the document everything else comes from, so depth is the point and there is no brevity target. Several hundred words in the larger sections is normal and more is fine where you have something to say.

You know this culture, this category, and this aesthetic territory in more detail than anyone could describe to you. Use it. Write what you actually know about how these people live, what they wear, what they listen to, what their rooms look like, what a Saturday costs them. Be particular and commit. A world that could belong to any brand in this category has failed, and hedging is how that happens.

Write the parts so they hold together. The people explain the places. The places explain the light. What someone is doing explains why the camera is where it is. A reader should finish understanding why these pictures look like this, not just what is in them.

Never write a scene as the world. Under The range, write situations as possibilities a writer departs from. Everywhere else, write what is true across every picture.

The people are a casting range, never a cast. One description wide enough that twenty pictures cast twenty different people who all belong, and particular enough that someone outside this world plainly would not. Nobody recurs between pictures.

Give the world its scale. It runs from one person alone to a crowd of thousands, and the same territory holds at every size. A world written entirely in small interiors produces twenty pictures of tables.

SECTIONS TO WRITE NOW
Write only these. Other parts of the document are handled separately.

${sectionLines}

TONE
Plain and direct. Write for a person, not a model. No marketing language, no em dashes, no line built to be quotable. Say things the way someone would say them out loud.

OUTPUT
Reply with the JSON object the schema describes and nothing else.`;
}

export function worldAuthoringModel(env = process.env) {
  const configured = String(env?.OPENAI_DIRECTION_MODEL || "").trim();
  return configured || String(env?.OPENAI_MODEL || "").trim() || DEFAULT_BRAND_BRAIN_MODEL;
}

export function worldFromAuthoringResult({ parsed, brandName, model, decisions, previous }) {
  const world = emptyWorld({ brandName, model });
  world.title = String(parsed?.title || previous?.title || "").trim();
  for (const section of WORLD_SECTIONS) {
    const written = String(parsed?.sections?.[section.id] || "").trim();
    world.sections[section.id] = written || String(previous?.sections?.[section.id] || "").trim();
  }
  world.decisions = Array.isArray(decisions) ? decisions : previous?.decisions || [];
  return normalizeWorld(world);
}
