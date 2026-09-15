import { DEFAULT_BRAND_BRAIN_MODEL, collectChatCompletionStream } from "../brand-brain/chat-completions-provider.js";
import { REACH_LEVELS } from "../brand-brain/schema.js";
import { worldArtifacts } from "../brand-brain/world.js";
import { selectApprovedBaseline } from "../brand-brain/service.js";
import {
  DIRECTION_ENTRY_KINDS,
  DIRECTION_ENTRY_ORIGINS,
  DIRECTION_SECTIONS,
  availableReachLevels,
  emptyDirectionRecord,
  normalizeDirectionRecord,
} from "./record.js";

// The direction session, ADR 0021. One turn per HTTP request: the body
// carries the record so far, the new message, and how it arrived; the reply
// carries what the session says next, any options to offer, the entries the
// message earned, and the reach recommendation once there is one. The client
// holds the running record and persists it between turns.
//
// This module builds the world kind of session only. A brand whose today
// Lived World reads "established" takes a craft session, which is not built,
// and the turn runner refuses it plainly rather than running the wrong
// interview.

// The session runs on the synthesis model rather than the writer model,
// because its job is holding a long instruction and exercising judgment
// (owner ruling 6, ADR 0021). The environment carries an override following
// the writer's precedent, and every direction record says which model wrote
// it so worlds can be compared.
export function directionSessionModel(env = process.env) {
  const configured = String(env?.OPENAI_DIRECTION_MODEL || "").trim();
  return configured || String(env?.OPENAI_MODEL || "").trim() || DEFAULT_BRAND_BRAIN_MODEL;
}

const SECTION_IDS = DIRECTION_SECTIONS.map((section) => section.id);

function strictObject(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

// What a turn returns, enforced as a strict schema so the route never parses
// prose. The section and origin enums keep the model inside the record's
// shape; the reach level is validated after the call against the levels this
// brand actually has, because the schema is shared and the list is not.
export const directionTurnSchema = strictObject({
  reply: { type: "string", description: "What you say next, as plain text. Short." },
  worlds: {
    type: "array",
    description:
      "Complete visual worlds to react to, two or three at a time early in the session, empty once the session has landed on one. Each is a world this brand could live in, written so the person can picture it and say yes or no.",
    items: strictObject({
      name: { type: "string", description: "A short handle of two to four words." },
      sketch: {
        type: "string",
        description:
          "The world, written full. Lead with the people at real depth: roughly what age, what they are into, what they are part of, what era or scene they belong to, how they dress and carry themselves, what they are like to be around. Then where they spend their time, what is in those rooms, how the light behaves, and what they are doing when nobody is performing. Physical and particular throughout. A territory that a hundred different pictures could come out of, not a scene.",
      },
    }),
    maxItems: 3,
  },
  options: {
    type: "array",
    description: "Short options when a menu is easier than a blank. Empty when you are proposing worlds.",
    items: { type: "string" },
    maxItems: 4,
  },
  entries: {
    type: "array",
    description: "What the last message settled. Appended to the record, never a rewrite of it.",
    items: strictObject({
      section: { type: "string", enum: SECTION_IDS },
      text: { type: "string", description: "One plain sentence." },
      origin: { type: "string", enum: DIRECTION_ENTRY_ORIGINS },
      entryKind: {
        type: "string",
        enum: DIRECTION_ENTRY_KINDS,
        description:
          "\"rule\" when it holds across every picture in this world. \"example\" when it is one illustration of a rule. Write rules. Reach for an example only when the rule is hard to state without one.",
      },
    }),
    maxItems: 10,
  },
  reach: {
    description: "Null until the world has landed, then the recommendation, which stays.",
    anyOf: [
      { type: "null" },
      strictObject({
        level: { type: "string", enum: REACH_LEVELS },
        because: { type: "string" },
        tradeoff: { type: "string" },
      }),
    ],
  },
});

function passageList(values) {
  return (Array.isArray(values) ? values : []).map((value) => String(value)).filter(Boolean);
}

// The approved foundation, reduced to what the session needs: the brand
// facts, the refusals, and the honest statement that the audience portrait is
// a placeholder. The session must never re-ask a settled question, and it
// must never treat the placeholder people as settled.
export function directionSessionFoundation(saved) {
  const root = selectApprovedBaseline(saved);
  if (!root) return null;
  const today = worldArtifacts(root, "today");
  const dossier = today?.dossier || {};
  const lived = today?.livedWorld || {};
  return {
    brand: root.brandName || "",
    description: root.brandDescription || "",
    productTruth: dossier.productTruth || "",
    proof: passageList(dossier.proof),
    materials: passageList(dossier.materials),
    culturalCodes: dossier.culturalCodes || "",
    palette: (dossier.palette || []).map((entry) => ({ name: entry.name, role: entry.role })),
    guardrails: (dossier.guardrails || []).map((entry) => ({ title: entry.title, body: entry.body })),
    audience: dossier.audience || "",
    desiredFeeling: dossier.desiredFeeling || "",
    audienceEvidence: lived.audienceEvidence || "",
    placeholderCastNote: lived.cast?.description || "",
  };
}

// The review questions the today passes raised, split into the ones still
// open and the ones the owner has ruled on. A ruling is a settled answer the
// session must not reopen; an open question is the system saying where it was
// unsure, which is the closest thing the foundation has to a list of what the
// session should ask about.
export function directionSessionReviewQuestions(saved) {
  const root = selectApprovedBaseline(saved);
  const resolutions = saved?.brain?.resolutions || {};
  const unanswered = [];
  const answered = [];
  for (const question of root?.reviewQuestions || []) {
    const base = {
      title: question.title || "",
      summary: question.summary || "",
      rationale: question.rationale || "",
    };
    const resolutionId = resolutions[question.id];
    if (resolutionId) {
      const action = (question.actions || []).find((entry) => entry.id === resolutionId);
      answered.push({ ...base, ruling: action ? [action.label, action.detail].filter(Boolean).join(". ") : String(resolutionId) });
    } else {
      unanswered.push(base);
    }
  }
  return { unanswered, answered };
}

const ARRIVAL_TEXT = {
  stated: "the person typed it themselves. Record what they actually said as stated.",
  chosen: "the person picked one of the options you offered. Record it as chosen.",
  rejected: "the person ruled out one of the options you offered. Record it as rejected, and never offer it or anything close to it again.",
};

const REACH_MEANINGS =
  "A few touches keeps the people, places and moments the foundation established and moves only objects, clothes, light and detail. A clear direction recasts and rewrites while keeping what the foundation got right. A new world lets the direction write everything and reads the foundation only for brand facts and refusals.";

// The session instruction. Adapted from the prototype the owner ran real
// sessions against (docs/prototypes/direction-session-prototype.html), world
// branch only, with two additions: the review questions travel as data, and
// the positive-authoring rule is stated as its own job. It was written for a
// different provider, so expect the language here to be tuned against real
// OpenAI turns.
export function buildDirectionSessionInstruction({ foundation, reviewQuestions, record, arrival, reachLevels, settled }) {
  const sectionLines = DIRECTION_SECTIONS.map((section) => `- "${section.id}", ${section.label}: ${section.hint}`).join("\n");
  const questions = reviewQuestions || { unanswered: [], answered: [] };
  const settledBlock = settled
    ? `This brand's audience is settled. Its people, their days and their moments are approved and are not in question, and you never reopen them. The worlds you propose change how the pictures are made around those people: the rooms, the light, the distance, the state of things, what people are doing with their hands. Ask early what the current photography gets right that must survive, and record it under "fixed". Watch for the word sophisticated and its relatives. To a camera, sophisticated reads as clean: even light, tidy surfaces, nobody caught mid-anything. That is the house style they already have and dislike, so never record "elevated", "polished", "premium" or "clean" as a direction. Convert the feeling into decisions a camera makes.`
    : `This brand's audience is not established. The people in its approved Lived World were reasoned from its own packaging and nobody has met them, so do not carry them forward and do not treat product facts as the audience. Who these people are is one of the things the worlds you propose decide.`;

  return `You are running a direction session for a brand inside Brand World System. You are talking with the brand's owner or their creative lead. They know the system and will kill a weak idea fast, so be terse and assume a lot.

The approved foundation, already reviewed and settled. Never re-ask anything answered here:
${JSON.stringify(foundation, null, 2)}

Questions the foundation build raised. The open ones are where the system was unsure. The ruled ones carry the owner's answer and are settled:
OPEN: ${JSON.stringify(questions.unanswered, null, 2)}
RULED: ${JSON.stringify(questions.answered, null, 2)}

The direction record so far:
${JSON.stringify(record.sections, null, 2)}

Reach recommendation so far: ${record.reach ? JSON.stringify(record.reach) : "not made yet"}

HOW THE LAST MESSAGE ARRIVED: ${ARRIVAL_TEXT[arrival] || ARRIVAL_TEXT.stated}

HOW THIS SESSION WORKS
You propose, they react. That is the whole shape. You know this category, this culture, and the aesthetic territory this brand is reaching toward, in detail, from millions of pictures. Use that. Do not interview them into telling you what you already know.

Open by proposing two or three complete worlds, whole and specific, from whatever the foundation and their first message give you. Commit to them. A hedged sketch is useless to react to, and a wrong one they can kill in a second is worth more than a safe one they have to fix. Make the worlds genuinely different from each other rather than three shades of one idea. They will kill one, take pieces of another, and redirect. Propose again against what survived. Land it in three or four rounds. A session that runs past eight rounds has failed, and you should say so and recommend approving what is there.

Never ask a question you could answer yourself and offer for confirmation. "What kind of light?" is an interview question. Two worlds, one lit by one window with the far side of the room going dark and one lit by a shop fluorescent at midday, is a question they can answer in a second.

WHAT A WORLD IS
A territory that a hundred different pictures could come out of. Write it physical and particular: a specific era, specific objects, a specific kind of room.

The people carry it, so go deep on them and do not hedge. You know this culture in more detail than anyone can describe to you, so write what you know: what they are into, what scene or era they belong to, what they wear and how they wear it, what they do on a weekend, what they are like to be around. Reach past occupation. What someone does for work is one handle and usually the least particular one, and inventing a trade to make a person feel real is the reflex to resist.

Write the people as a casting range, never as a character. One description wide enough that twenty pictures cast twenty different people who all belong, and particular enough that someone outside this world plainly would not. If you want to name someone to make the description concrete, mark it as an example and write it so a reader knows it is one of many: nobody recurs across this brand's pictures, and a named person in a denim jacket turning up in every frame is the failure on the other side of a vague description.

A world is not a scene. If your sketch reads as one photograph, it is too narrow. The test: could twenty different pictures come out of this, in different rooms, with different people, on different days. If not, widen it before you send it.
${settledBlock}

WHAT YOU RECORD
${sectionLines}

Write rules, not scenes. A rule holds across every picture in this world: "nobody is working, they are off the clock", "the product sits on a surface and nobody holds it up", "one hard source, midday, no fill". A rule generates a hundred pictures. "Two friends fixing a bike at a curb" generates one, and recording it that way makes the whole world collapse onto it. That collapse is the specific failure this session exists to avoid.
Reach for an example only when a rule is hard to state without one, and mark it as an example.

Record what they settle. When they take a world, or part of one, record the rules that world runs on as chosen. When they say something themselves, record it as stated. When they kill something, record it as rejected, then ask what belongs there instead and record that too, because a direction is authored positively and what they kill is the most brand-specific thing in the session.

Never record a thing they did not say, take, or clearly confirm. Proposing is yours. Deciding is theirs.

Push for range on purpose. Before you land, make sure the record names more than one kind of place and more than one kind of day, because a world that converges across a set is the way this fails while looking fine.

TONE
Plain, peer to peer. Short sentences. No marketing language. Never use an em dash. Never write a line built to be quotable.

REACH
Available levels for this brand: ${reachLevels.map((level) => `"${level}"`).join(", ")}. Do not recommend a level outside that list. ${REACH_MEANINGS}
Once the world has landed, recommend one. Say plainly why, and what it costs.

OUTPUT
Reply with the JSON object the schema describes and nothing else. Put the worlds in "worlds", not in "reply": the reply is what you say around them. Send worlds while you are still proposing, and none once the session has landed. "entries" holds only what the last message settled; it is appended, never a rewrite.`;
}

function cleanTurns(turns) {
  return (Array.isArray(turns) ? turns : [])
    .map((turn) => ({
      role: turn?.role === "session" ? "session" : "person",
      text: String(turn?.text || "").trim().slice(0, 4000),
    }))
    .filter((turn) => turn.text)
    .slice(-16);
}

async function completeWithChatCompletions({ apiKey, request, fetchImpl }) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const body = await response.json();
    const error = new Error(body?.error?.message || `OpenAI request failed with status ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return collectChatCompletionStream(response.body);
}

function sessionError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// One session turn. Reads the stored brain for the foundation and the review
// questions, refuses the kinds of session this build does not cover, calls
// the model, and validates what came back against the record's shape and this
// brand's reach list before returning it. The record itself is not written
// here; the client holds it and persists it through the save action.
export async function runDirectionSessionTurn(body, options) {
  const store = options.store;
  const fetchImpl = options.fetchImpl || fetch;
  const complete = options.complete || completeWithChatCompletions;

  const saved = await store.read();
  const root = selectApprovedBaseline(saved);
  const lived = worldArtifacts(root, "today")?.livedWorld;
  if (!root || !lived) {
    throw sessionError("Approve the brand today before holding a direction session.", 409);
  }
  // One session for every brand (finding, 2026-09-15). A settled audience
  // changes what the session holds fixed and which reach levels it may
  // recommend, not whether it runs. ADR 0021 split this into two kinds; the
  // split was a distinction in the instruction rather than in the product.
  const settled = lived.audienceEvidence !== "not established";

  const message = String(body?.message || "").trim().slice(0, 4000);
  if (!message) throw sessionError("Send a message to continue the session.", 400);
  const arrival = DIRECTION_ENTRY_ORIGINS.includes(body?.arrival) ? body.arrival : "stated";
  const record =
    normalizeDirectionRecord(body?.record) || emptyDirectionRecord({ brandName: root.brandName || "", model: "" });
  const reachLevels = availableReachLevels(lived);
  const foundation = directionSessionFoundation(saved);
  const reviewQuestions = directionSessionReviewQuestions(saved);

  const transcript = cleanTurns(body?.turns)
    .map((turn) => `${turn.role === "session" ? "YOU" : "PERSON"}: ${turn.text}`)
    .join("\n\n");

  const model = directionSessionModel(options.env);
  const request = {
    model,
    store: false,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      {
        role: "developer",
        content: buildDirectionSessionInstruction({ foundation, reviewQuestions, record, arrival, reachLevels, settled }),
      },
      {
        role: "user",
        content: `THE SESSION SO FAR\n${transcript || "(nothing yet)"}\n\nPERSON: ${message}\n\nReply now with the JSON object and nothing else.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "direction_session_turn", strict: true, schema: directionTurnSchema },
    },
  };

  const completion = await complete({ apiKey: options.env?.OPENAI_API_KEY, request, fetchImpl });
  const raw = completion?.choices?.[0]?.message;
  if (raw?.refusal) throw new Error(raw.refusal);
  let parsed;
  try {
    parsed = JSON.parse(raw?.content || "");
  } catch {
    throw new Error("The session turn did not come back as usable JSON. Send it again.");
  }

  const entries = (Array.isArray(parsed.entries) ? parsed.entries : [])
    .map((entry) => ({
      section: entry?.section,
      text: String(entry?.text || "").trim().slice(0, 600),
      origin: DIRECTION_ENTRY_ORIGINS.includes(entry?.origin) ? entry.origin : arrival,
      entryKind: DIRECTION_ENTRY_KINDS.includes(entry?.entryKind) ? entry.entryKind : "rule",
    }))
    .filter((entry) => SECTION_IDS.includes(entry.section) && entry.text)
    .slice(0, 8);
  const reach =
    parsed.reach && reachLevels.includes(parsed.reach.level)
      ? {
          level: parsed.reach.level,
          because: String(parsed.reach.because || "").slice(0, 600),
          tradeoff: String(parsed.reach.tradeoff || "").slice(0, 600),
        }
      : null;

  return {
    reply: String(parsed.reply || "").trim(),
    worlds: (Array.isArray(parsed.worlds) ? parsed.worlds : [])
      .map((world) => ({ name: String(world?.name || "").trim().slice(0, 80), sketch: String(world?.sketch || "").trim().slice(0, 2000) }))
      .filter((world) => world.name && world.sketch)
      .slice(0, 3),
    settled,
    options: (Array.isArray(parsed.options) ? parsed.options : []).map((option) => String(option).trim()).filter(Boolean).slice(0, 4),
    entries,
    reach,
    reachLevels,
    model: completion.model || model,
  };
}
