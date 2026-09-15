import { DEFAULT_BRAND_BRAIN_MODEL, collectChatCompletionStream } from "../brand-brain/chat-completions-provider.js";
import { REACH_LEVELS } from "../brand-brain/schema.js";
import { worldArtifacts } from "../brand-brain/world.js";
import { selectApprovedBaseline } from "../brand-brain/service.js";
import {
  DIRECTION_ENTRY_ORIGINS,
  WORLD_DIRECTION_SECTIONS,
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

const SECTION_IDS = WORLD_DIRECTION_SECTIONS.map((section) => section.id);

function strictObject(properties) {
  return { type: "object", properties, required: Object.keys(properties), additionalProperties: false };
}

// What a turn returns, enforced as a strict schema so the route never parses
// prose. The section and origin enums keep the model inside the record's
// shape; the reach level is validated after the call against the levels this
// brand actually has, because the schema is shared and the list is not.
export const directionTurnSchema = strictObject({
  reply: { type: "string", description: "What the session says next, as plain text." },
  options: {
    type: "array",
    description: "Short concrete options for the person to pick from or rule out. Empty when a menu would not help.",
    items: { type: "string" },
    maxItems: 4,
  },
  entries: {
    type: "array",
    description: "Entries earned by the message being answered. Appended to the record, never a rewrite of it.",
    items: strictObject({
      section: { type: "string", enum: SECTION_IDS },
      text: { type: "string", description: "One short physical sentence." },
      origin: { type: "string", enum: DIRECTION_ENTRY_ORIGINS },
    }),
    maxItems: 8,
  },
  reach: {
    description: "Null until the record has real material in most sections, then the recommendation, which stays.",
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
export function buildDirectionSessionInstruction({ foundation, reviewQuestions, record, arrival, reachLevels }) {
  const sectionLines = WORLD_DIRECTION_SECTIONS.map((section) => `- "${section.id}": ${section.label}`).join("\n");
  const questions = reviewQuestions || { unanswered: [], answered: [] };
  return `You are running a direction session for a brand inside Brand World System. You are talking with the brand's owner or their creative lead, someone who knows the system and will reject a weak answer, so be terse and assume a lot.

The approved foundation, already reviewed and settled. Do not re-ask anything answered here:
${JSON.stringify(foundation, null, 2)}

Questions the foundation build raised. The open ones are where the system was unsure, and they are the best list of what this session should ask about. The ruled ones carry the owner's answer and are settled; never reopen one:
OPEN: ${JSON.stringify(questions.unanswered, null, 2)}
RULED: ${JSON.stringify(questions.answered, null, 2)}

The direction record so far. Each entry is tagged with how it was arrived at:
${JSON.stringify(record.sections, null, 2)}

Reach recommendation so far: ${record.reach ? JSON.stringify(record.reach) : "not made yet"}

HOW THE LAST MESSAGE ARRIVED: ${ARRIVAL_TEXT[arrival] || ARRIVAL_TEXT.stated}

YOUR JOB
Fill the direction record well enough that synthesis can author this brand's evolved world. The sections and what each holds:
${sectionLines}
This is a WORLD direction. The foundation records no audience evidence, and the people in its Lived World were reasoned from the brand's own material; nobody has met them. That is why this session exists. Do not treat them as settled, and do not treat the product facts as the audience.

HOW TO WORK
- Extract, do not supply. You have a large vocabulary for this and the person may not. Offer that vocabulary as options for them to choose or reject. Never write something into the record that the person did not state, pick, or clearly confirm.
- A direction is authored positively. When the person says what they do not want, log the rejection, then ask what should be there instead, and record that. The rejection stays in the record as how the direction was arrived at.
- Ask one thing at a time. Short questions. Offer two to four concrete options when a menu would be easier to answer than a blank.
- Push back when an answer is generic. Ask what it looks like.
- Get physical. The record has to be things a photographer could act on.
- What they rule out is the most brand-specific thing in this session. Chase it.
- Known failure modes to brief against: a look described optically rather than behaviorally, so ask what changes about how people act in frame; the product ending up in someone's hand in every picture, so ask where it actually sits; a world that converges across a set, so push for range across settings.
- A session past roughly forty turns is failing to converge rather than producing a better record. Say so plainly and suggest closing with what is there.

TONE
Plain, peer to peer, curious. No marketing language. Short sentences. Never use an em dash. Never write a line built to be quotable.

REACH
Available levels for this brand: ${reachLevels.map((level) => `"${level}"`).join(", ")}. Do not recommend a level outside that list. ${REACH_MEANINGS}
Once the record has real material in most sections, recommend one. State plainly why, and state what it costs.

OUTPUT
Reply with the JSON object the schema describes and nothing else. "entries" holds only entries earned by the message you are responding to; it is appended, never a rewrite. "reach" is null until you are ready to recommend one, then it stays.`;
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
  if (lived.audienceEvidence !== "not established") {
    throw sessionError(
      "This brand's audience is established, so its direction is about how the pictures are made. That kind of session is not built yet, and running the world interview against a settled audience would be the wrong conversation. Nothing was changed.",
      409,
    );
  }

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
        content: buildDirectionSessionInstruction({ foundation, reviewQuestions, record, arrival, reachLevels }),
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
    options: (Array.isArray(parsed.options) ? parsed.options : []).map((option) => String(option).trim()).filter(Boolean).slice(0, 4),
    entries,
    reach,
    reachLevels,
    model: completion.model || model,
  };
}
