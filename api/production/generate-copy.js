import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { assembleClaimsSet, listSegments } from "../../src/claims/assembly.js";
import { buildJobScope } from "../../src/scope/resolver.js";
import { auditCopyAgainstClaims, checkDisclosurePresence } from "../../src/claims/copy-audit.js";
import { produceCopy, auditProducedCopy } from "../../src/copy/generate.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";
import { resolveLook, SCENE_NO_PEOPLE_DEFAULT_LOOK } from "../../src/production/looks.js";
import { selectWorldArtifacts } from "../../src/brand-brain/world.js";
import crypto from "node:crypto";

export default async function handler(request, response) {
  if (!requireBrandWorldAccess(request, response)) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "This route only generates post copy." });
    return;
  }
  try {
    const clientId = resolveClientId(request);
    const body = await readJsonBody(request);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI API key is not configured.");

    // Load the approved brain
    const brainStore = createVercelBlobBrandBrainStore({ clientId });
    const brainState = await brainStore.read();
    if (!brainState?.approvedResult) throw new Error("No approved Brand Brain is available.");
    const brain = brainState.approvedResult;

    // Resolve product record when provided.
    let product = null;
    if (body.productId) {
      const productStore = createVercelBlobProductStore({ clientId });
      product = await productStore.readProduct(body.productId);
      if (!product) throw new Error(`Product "${body.productId}" was not found.`);
      if (!product.approved_at) {
        const error = new Error(`Product "${product.product_name}" has not been approved. Approve it before generating copy from it.`);
        error.status = 409;
        throw error;
      }
    }

    // Scene brief suggestions. Same loaded context as copy generation, so this
    // branch sits here rather than in a new serverless function. The output is
    // job direction for a single image, never brand knowledge: nothing written
    // here is stored, and the user edits or discards it freely.
    if (String(body.action || "") === "scene_brief") {
      await handleSceneBrief({ body, brain, product, apiKey, response });
      return;
    }

    // Copy-type generation (ADR 0014 step 1). The catalog entry supplies the
    // prompt shape; generation and audit are shared code. This dispatches
    // through the existing handler rather than a new serverless function,
    // because the function count sits at the Vercel Hobby ceiling.
    // The segments this client uses, derived from their claims entries. A
    // read, dispatched through this handler because the function count sits
    // at the Vercel Hobby ceiling.
    if (String(body.action || "") === "segments") {
      const store = createVercelBlobClaimsStore({ clientId });
      const document = await store.read();
      sendJson(response, 200, { segments: listSegments(document, store.activeEntries) });
      return;
    }

    // Re-audit copy the user has edited. ADR 0014 part two requires that
    // in-image copy come from a produced-and-audited source; an edited string
    // is only that if it is checked again. This is an audit without a
    // generation call, so an edit costs a claims check and nothing more.
    if (String(body.action || "") === "audit_copy") {
      const claimsStore = createVercelBlobClaimsStore({ clientId });
      const claimsDocument = await claimsStore.read();
      const claimsSet = assembleClaimsSet({
        claimsDocument,
        product,
        activeEntries: claimsStore.activeEntries,
        jobScope: buildJobScope({
          placement: body.placement,
          productId: body.productId,
          campaignId: body.campaignId,
          segment: body.segment,
        }),
      });
      const fields = Array.isArray(body.fields) ? body.fields : [];
      const text = fields.map((field) => field.text).filter(Boolean).join("\n");
      if (!text.trim()) {
        sendJson(response, 400, { error: "There is no copy here to check." });
        return;
      }
      const audit = await auditProducedCopy({ text, claimsSet, apiKey });
      for (const finding of audit.findings || []) {
        if (!finding.sentence) continue;
        const owner = fields.find((field) => field.text && (finding.sentence.includes(field.text) || field.text.includes(finding.sentence)));
        if (owner) finding.field = owner.label;
      }
      sendJson(response, 200, { audit });
      return;
    }

    if (String(body.action || "") === "copy_type") {
      const claimsStore = createVercelBlobClaimsStore({ clientId });
      const claimsDocument = await claimsStore.read();
      const claimsSet = assembleClaimsSet({
        claimsDocument,
        product,
        activeEntries: claimsStore.activeEntries,
        jobScope: buildJobScope({
          placement: body.placement,
          productId: body.productId,
          campaignId: body.campaignId,
          segment: body.segment,
        }),
      });
      const block = await produceCopy({
        copyTypeId: body.copyTypeId,
        brain,
        product,
        claimsSet,
        context: {
          placement: body.placement || "",
          copyDirection: body.copyDirection || "",
          scene: body.scene || "",
          postType: body.postType || "",
          postTopic: body.postTopic || "",
          postClaims: body.postClaims || "",
          postCta: body.postCta || "",
          exclusions: body.exclusions || "",
        },
        apiKey,
      });
      sendJson(response, 200, {
        copy: block,
        governingClaims: {
          approved: claimsSet.approved.map((claim) => ({ text: claim.text, source: claim.source, scope: claim.scope })),
          prohibited: claimsSet.prohibited.map((claim) => ({ text: claim.text, source: claim.source, scope: claim.scope })),
          disclosures: claimsSet.disclosures.map((claim) => ({ text: claim.text, source: claim.source })),
        },
        brainVersion: brainState.brain?.artifactVersion || 1,
      });
      return;
    }

    // Extract guidance sections
    const voice = brain.guidanceSections?.find((s) => s.id === "voice");
    const foundation = brain.guidanceSections?.find((s) => s.id === "foundation");
    const world = brain.guidanceSections?.find((s) => s.id === "world");
    const rules = brain.guidanceSections?.find((s) => s.id === "rules");
    const dossier = selectWorldArtifacts(brain).artifacts.dossier || {};

    // Assemble the governed claims set (ADR 0013 derived model).
    // Uses the claims store and assembly function instead of inline assembly.
    const claimsStore = createVercelBlobClaimsStore({ clientId });
    const claimsDocument = await claimsStore.read();
    const jobScope = buildJobScope({
      placement: body.placement,
      productId: body.productId,
      campaignId: body.campaignId,
      segment: body.segment,
    });

    const claimsSet = assembleClaimsSet({
      claimsDocument,
      product,
      activeEntries: claimsStore.activeEntries,
      jobScope,
    });

    // Brain guardrails steer generation through the BOUNDARIES prompt section
    // below but are not injected into the audited prohibited-claims list.
    // Prose rules like "Never clinical" are not claims, and asking the claim
    // auditor to match them adds noise. Guardrail migration into the claims
    // document is future work; until then guardrails steer generation but are
    // not audited as claims.

    // Build the copy-generation prompt
    const systemPromptParts = [
      `You are writing a LinkedIn post for ${brain.brandName} (${brain.brandDescription}).`,
      ``,
      `VOICE AND MESSAGING:`,
      voice ? `${voice.summary}. ${(voice.principles || []).join(". ")}` : "No voice guidance available.",
      ``,
      `BRAND FOUNDATION:`,
      foundation ? `${foundation.summary}. ${(foundation.principles || []).join(". ")}` : "No foundation guidance available.",
      ``,
      world ? `WORLD AND STORY:\n${world.summary}. ${(world.principles || []).join(". ")}` : "",
      ``,
      `BOUNDARIES:`,
      rules ? `${rules.summary}. ${(rules.principles || []).join(". ")}` : "No specific rules.",
      ...(dossier.guardrails || []).map((g) => `- ${g.title}: ${g.body}`),
    ];

    // Inject product knowledge into the generation prompt.
    if (product) {
      systemPromptParts.push(``);
      systemPromptParts.push(`PRODUCT KNOWLEDGE (${product.product_name}):`);
      systemPromptParts.push(product.one_true_thing || "");
      for (const feature of product.features || []) {
        const claim = feature.approved_claim_language
          ? ` Approved claim language: "${feature.approved_claim_language}"`
          : "";
        systemPromptParts.push(`- ${feature.name}: ${feature.benefit}.${claim}`);
      }
    }

    // Prompt-level steering from the assembled claims set.
    if (claimsSet.approved.length > 0) {
      systemPromptParts.push(``);
      systemPromptParts.push(`APPROVED CLAIMS (use these when relevant, do not invent new benefit or capability claims):`);
      for (const claim of claimsSet.approved) {
        systemPromptParts.push(`- "${claim.text}" (${claim.source})`);
      }
    }

    if (claimsSet.prohibited.length > 0) {
      systemPromptParts.push(``);
      systemPromptParts.push(`PROHIBITED CLAIMS AND EXCLUSIONS (never state or imply these):`);
      for (const claim of claimsSet.prohibited) {
        systemPromptParts.push(`- ${claim.text}`);
      }
    }

    if (claimsSet.disclosures.length > 0) {
      systemPromptParts.push(``);
      systemPromptParts.push(`REQUIRED DISCLOSURES (include these when their trigger conditions apply):`);
      for (const disclosure of claimsSet.disclosures) {
        systemPromptParts.push(`- ${disclosure.text}`);
      }
    }

    systemPromptParts.push(
      ``,
      `STRUCTURAL RULES (non-negotiable):`,
      `- No em dashes anywhere. Use commas, periods, or semicolons instead.`,
      `- No fragment stacks ("Simple. Effective. Easy."). Convert to a complete sentence.`,
      `- No "It's not X. It's Y." constructions. Convert first sentence to a dependent clause.`,
      `- No filler intensifiers: "really," "genuinely," "honestly," "straightforward."`,
      `- No hedging verbs. "We bring," not "We try to bring."`,
      `- Peer-to-peer register. Not promotional. Not instructional. The reader should finish with a useful idea.`,
      `- Short sentences need active verbs and a claim that could be disagreed with. No decorative fragments.`,
      ``,
      `OUTPUT FORMAT:`,
      `Return ONLY the post text. No preamble, no explanation, no subject line, no hashtag suggestions unless explicitly asked.`,
      `Keep the post between 150 and 300 words unless the topic demands otherwise.`,
    );

    const systemPrompt = systemPromptParts.filter(Boolean).join("\n");

    const userPrompt = [
      `Post type: ${body.postType || "Thought leadership"}`,
      `Topic: ${body.postTopic || "Write about the brand's perspective on its category."}`,
      body.postClaims ? `Include these approved claims or facts: ${body.postClaims}` : "",
      body.postCta ? `End with this call to action: ${body.postCta}` : "",
      body.exclusions ? `Avoid: ${body.exclusions}` : "",
    ].filter(Boolean).join("\n");

    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      const errorBody = await chatResponse.text();
      throw new Error(`OpenAI returned status ${chatResponse.status}: ${errorBody.slice(0, 200)}`);
    }

    const chatData = await chatResponse.json();
    const postCopy = chatData.choices?.[0]?.message?.content?.trim();
    if (!postCopy) throw new Error("OpenAI returned an empty response.");

    // Post-hoc claim audit. Runs when there are governed claims to check
    // against. Without claims, the endpoint returns the copy alone.
    let claimAudit = null;
    if (claimsSet.approved.length > 0 || claimsSet.prohibited.length > 0) {
      claimAudit = await auditCopyAgainstClaims({
        copy: postCopy,
        approvedClaims: claimsSet.approved,
        prohibitedClaims: claimsSet.prohibited,
        apiKey,
      });
    }

    // Check disclosure presence.
    let disclosureFindings = null;
    if (claimsSet.disclosures.length > 0) {
      disclosureFindings = checkDisclosurePresence(postCopy, claimsSet.disclosures);
    }

    sendJson(response, 200, {
      postCopy,
      model: "gpt-4o",
      brainVersion: brainState.brain?.artifactVersion || 1,
      voiceApplied: !!voice,
      foundationApplied: !!foundation,
      rulesApplied: !!rules,
      productApplied: product ? { product_id: product.product_id, product_name: product.product_name, version: product.version } : null,
      claimsSetSize: { approved: claimsSet.approved.length, prohibited: claimsSet.prohibited.length, disclosures: claimsSet.disclosures.length },
      claimAudit,
      disclosureFindings,
    });
  } catch (error) {
    sendPublicError(response, error);
  }
}

// Claim audit and disclosure presence check imported from src/claims/copy-audit.js.


// Three short scene briefs assembled from the approved brain, the campaign
// context, and the product record. Three rather than one, because a marketer
// who cannot yet describe what they want can still recognize it, and choosing
// between options is a faster way to arrive than editing a single guess.
// Cut on 2026-09-07 by the ruling that the writer authors the prompt and the
// compiler attaches facts. Everything below used to sit in this function's
// system prompt: the scene kind's rules, the world rules, and the third look
// rule. Each was written after a bad render and each carries the dated comment
// that records which render caused it, so the comments are kept with them. They
// are here rather than deleted because a rule that returns should return with
// the render that asked for it, and this is where to find the wording.
// See docs/findings-2026-09-07-writer-authors-the-prompt.md.
//
// The scene kind's task line before the cut:
//
//   "You art direct brand image production. For each direction you write four
//   separate fields: the world, the composition, the lighting, and the props.
//   This is direction for a photographer on set, not marketing copy. Write it
//   the way a director of photography would be briefed."
//
// The scene kind's rules before the cut:
//
//   Describe only what a camera could see. No slogans, no statistics, no claims
//   about the product's performance.
//   Stay inside the brand's earned environments and guardrails. Do not invent a
//   setting the brand has no reason to be in. When a look above requires a
//   specific condition, choose among the earned environments that can provide
//   it rather than treating the most familiar one as fixed.
//   The world field carries the place, the person, the moment, and what is
//   happening. Name the hour and the specific physical evidence that the place
//   is used by real people.
//   When anyone appears behind the subject, give an exact number and make each
//   one different: a different distance from camera, a different direction of
//   travel or facing, and at least one partly hidden behind something. Three
//   people at the same scale walking the same way is a procession, and it is
//   the clearest sign that nobody was actually there.
//   Each person performs one action, and that action is already underway or
//   just finished. Two simultaneous actions cannot be photographed in one
//   frame: a person cannot stretch and drink at the same time.
//   Every person in the frame gets a stated mouth and a stated eye direction.
//   Not an adjective, a position: lips closed and relaxed, jaw slack mid
//   exhale, eyes down and left at the screen, eyes on the far end of the
//   hallway. Leaving expression unstated returns a soft pleasant half smile
//   aimed at whatever the person is holding, every time.
//   A person alone with a task is not enjoying it. Most of the time the correct
//   mouth is closed and unsmiling and the correct eyes are somewhere specific
//   in the room. Reserve a smile for a frame where another person caused it.
//   Words like natural, candid, effortless, joyful, serene, or unposed describe
//   a feeling you want and give the camera nothing to do.
//   The composition field carries camera behavior and spatial structure: where
//   the subject sits in frame, camera height, focal length, and what runs from
//   foreground to background.
//   Depth is an optical fact, not a narrative one. Name the one thing held in
//   sharp focus, then name what loses edge detail and contrast with distance.
//   Do not write that the eye moves through the scene or that focus expands
//   outward; that describes a viewer, not a lens, and it produces a frame that
//   is equally sharp everywhere.
//   Every composition names one thing the frame cuts and which edge cuts it.
//   This is required, not optional. A crop is a concrete event: the bench runs
//   out of the bottom left corner, the doorway is halved by the right edge.
//   Saying the composition feels unbalanced or observational is not one.
//   The subject is placed off the center line, horizontally or vertically. A
//   subject centered with matched space on both sides is the single most
//   reliable way to make a photograph look arranged.
//   The shape guidance you are given describes what survives cropping and where
//   text will sit. It is not an instruction to center the subject or to balance
//   the frame. Where the subject sits inside the shape is yours to decide, and
//   the answer is off center.
//   In that ranking the person and what they are doing come first and the place
//   they are in comes second. The product is not the first thing the eye lands
//   on and it is not centered on a surface facing the camera. It sits where
//   someone actually set it down or is holding it, inside the moment rather
//   than on top of it.
//   The product appears once. One unit, in one place, held or set down. Do not
//   populate the scene with several of them.
//   Compose off center. Give the frame an unbalanced weight, crop something at
//   an edge, and let the camera read as an observation of a moment already
//   happening rather than a setup arranged for it.
//   The lighting field names one dominant source and its position relative to
//   the camera, in plain terms: behind and to the left, high and in front,
//   through the window at frame right.
//   Light is selective. Name the specific surfaces that catch the source, and
//   name what is turned away from it and stays in shadow. A frame where
//   everything is lit is a frame with no light in it.
//   State whether anything returns light into the shadow side, and if nothing
//   does, say so. Do not soften a face because it is the subject.
//   Never light the whole scene consistently and never give every subject the
//   same edge. A warm glow across the frame, matching tones on everyone
//   present, and a rim on every outline are the same failure: light applied as
//   a finish rather than arriving from somewhere.
//   The props field is a short list of specific objects present in the scene.
//   Give each one a state and the cause of that state: paint dulled by weather,
//   a seam softened by washing, dust settled in a joint. A state without a
//   cause invites the camera to invent one, which is where unexplained wet and
//   glossy surfaces come from.
//   Only name surfaces that are in this frame. The brand's material vocabulary
//   is a description of the brand, not a shopping list for every scene.
//   The three directions must differ in world, not merely in wording.
//   The brand's creative direction and declared ambitions are direction to
//   follow, not background reading. If the brand has named an aesthetic it is
//   reaching for, one of the three directions should pursue it.
//
// The world rules before the cut, with the dated comment that produced them:
//
//   ADR 0018. The grammar reached the writer as context and the writer treated
//   it as background reading, so across more than twenty renders the brand's
//   world arrived thinly or not at all. Context describes; rules oblige. These
//   put the world's content in the RULES block and say plainly that the world
//   is what is in the frame, which is the same precedence fix that repaired
//   looks whose medium required a specific setting.
//
//   The sections above headed PEOPLE ON CAMERA, OBJECTS AND ERA, and PLACES AND
//   MATERIALS describe the world this brand's photographs take place in. That
//   world is required content, not background reading. A direction that could
//   have been written for any brand in this category has failed even if it is a
//   good photograph.
//   Build the setting out of the surfaces, rooms, and landscapes named under
//   PLACES AND MATERIALS. Name those materials in the world field. Do not
//   substitute a more familiar room that the brand has no particular claim on.
//   Name at least two specific objects from OBJECTS AND ERA in the props field
//   and put at least one of them in the world field where it is doing something
//   in the scene. These are physical objects present in the room, not
//   decoration and not a style applied afterward.
//   Carry the wardrobe, posture, and era cues from PEOPLE ON CAMERA into how
//   you describe the person.
//   The sources named under LIGHT are the sources in this scene: name them and
//   their color in the lighting field. Where the look and this world disagree
//   about color, the world decides which sources are present and what color
//   they emit, and the look decides how the film or sensor renders them.
//   An entry marked as a declared ambition is a direction the brand is reaching
//   for and it belongs in the frame at full strength. Do not soften it, do not
//   reduce it to a single small prop, and do not leave it out because the scene
//   reads fine without it.
//   The world decides what is in the frame. The look decides how it was
//   photographed. Neither replaces the other, and a direction that satisfies
//   the look while dropping the world has answered half the brief.
//
// The third look rule before the cut. The first two are kept, and the dated
// ADR 0018 comment that produced all three stays on them below:
//
//   Do not describe the medium itself in your fields. Capture character
//   compiles separately and repeating it would send the same instruction twice.
//   Write the world, the composition, the lighting, and the props so they
//   belong to that medium: light it renders well, surfaces it resolves, and a
//   moment it can hold.
//
// The per-field length rule for the scene kind before the cut:
//
//   Two to four sentences per field. Concrete nouns over adjectives. Specific
//   over evocative.

// Three moments, chosen at random, and the writer never sees the rest.
//
// The writer was handed every moment in the Story Architecture and told to
// build a direction from one of them. Nothing said which, so it took the first
// three, every time: two rounds running returned Nia at her dining table, Priya
// at the fitness studio counter and Marco at the trailhead, and the Nia
// direction came back nearly word for word. That is what a language model does
// with a list. Selecting here means the writer cannot favor the top of one,
// because it is not given one.
//
// The source is real randomness rather than a hash of the request, so two runs
// against the same brain pick differently. A test hands in its own source.
// See docs/findings-2026-09-07-moment-selection.md.
export const SCENE_MOMENT_COUNT = 3;

// The model that writes directions. Synthesis runs on gpt-5.6 and the writer
// ran on gpt-4o, and nobody decided that on record. The environment now
// carries the choice, defaulting to what ran before so nothing changes until
// the owner sets it, and every direction records the model that wrote it so
// the two can be compared in the corpus.
export const DEFAULT_WRITER_MODEL = "gpt-4o";
export function writerModel(env = process.env) {
  const configured = String(env?.OPENAI_WRITER_MODEL || "").trim();
  return configured || DEFAULT_WRITER_MODEL;
}

// The heading the look's behavior sentence arrives under, in context.
export const LOOK_BEHAVIOR_HEADING = "HOW THIS BRAND'S PICTURES ARE TAKEN";

// The one sentence about the look that stays in RULES. Written 2026-09-08 into
// the task's third paragraph; moved here 2026-09-10 when the look's optical
// description left the rules. This is the rule. The look is data.
export const LENS_RULE = "A direction is what was in front of the lens rather than how the film rendered it, so the color cast, the grain, the contrast, the focus and the lens are all set elsewhere in this prompt and do not belong in the prose.";

// The meaning rule, 2026-09-10. It replaces the sentence that said a sentence
// about what the picture means is a sentence to cut. The writer had that
// sentence since 2026-09-07 and ended every direction on a meaning sentence
// anyway. This version says what every sentence is instead of what one kind
// of sentence is not, and says what happens to a sentence that fails.
export const MEANING_RULE = "A direction is what a camera recorded and nothing else. Every sentence names something visible: a person, an object, a surface, a light source, a gesture, a distance. A sentence about what the moment feels like, what it means, what it says, what it evokes, or what atmosphere it creates is deleted, not softened. The last sentence of a direction is a thing in the frame, not a summary.";

// Two sentences the writer produced on 2026-09-09, each with its fix, so the
// model has the shape and not only the rule. Verbatim from the job that
// produced them; the brand name in the first pair is the brand they were
// written against.
export const MEANING_EXAMPLE_PAIRS = [
  {
    fails: "A MycoPop sits on the edge of the counter, condensation pooling at its base, a quiet nod to the end of a busy service.",
    passes: "A MycoPop sits on the edge of the counter, condensation pooling at its base.",
  },
  {
    fails: "Hanging parts and tools sway gently as the air stirs, creating a dynamic yet calm atmosphere.",
    passes: "Hanging parts and tools sway on their hooks.",
  },
];
export const MEANING_EXAMPLES = [
  "Two sentences that fail that rule, each followed by the sentence that replaces it.",
  ...MEANING_EXAMPLE_PAIRS.map((pair) => `Fails: "${pair.fails}" Passes: "${pair.passes}"`),
].join(" ");

// The wardrobe and surfaces line, 2026-09-10. The evolved world writes clothes
// down to the socks and rooms down to the laminate, and the writer reads the
// cast description and the examples. The line says to match that specificity
// and no more. Nothing here says which decade; the world carries it or it
// does not.
export const WARDROBE_LINE = "Write what the people are wearing and what is on the surfaces to the specificity the world gives, and no more.";
export const SURFACES_LINE = "Write what is on the surfaces, and any clothing left in the room, to the specificity the world gives, and no more.";

// The meaning check. A direction that comes back from the model is split into
// sentences, and a sentence containing any of these is stripped before the
// direction reaches the browser. The list is the tells from the directions of
// 2026-09-08 and 2026-09-09, and it grows from the corpus. Deliberately not
// clever: a list and a splitter. It will miss some, and the ones it misses
// show up in docs/writer-corpus.md; the ones it catches never reach a render.
export const MEANING_TELLS = [
  "atmosphere",
  "atmospheric",
  "a nod to",
  "nod to",
  "captures",
  "captured",
  "engrossed",
  "seamlessly",
  "hive of",
  "sense of",
  "speaks to",
  "evokes",
  "evoking",
  "marking the",
  "symbolizing",
  "embodying",
  "a testament",
  "a reminder",
];

// A direction cut to fewer sentences than this by the check is written again,
// once. Three is the floor a 120-word direction cannot sensibly sit under.
export const MEANING_CHECK_MIN_SENTENCES = 3;

export function splitSentences(prose) {
  return String(prose == null ? "" : prose)
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?]["')\]]?)\s+(?=[A-Z0-9"'(\[])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function sentenceHasTell(sentence) {
  const lower = String(sentence || "").toLowerCase();
  return MEANING_TELLS.some((tell) => new RegExp(`(^|[^a-z])${tell.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(lower));
}

// Strips every sentence carrying a tell. Returns the kept prose and the
// sentences that were removed, in order, so the job record can carry them.
export function stripMeaningSentences(prose) {
  const sentences = splitSentences(prose);
  const kept = [];
  const stripped = [];
  for (const sentence of sentences) {
    if (sentenceHasTell(sentence)) stripped.push(sentence);
    else kept.push(sentence);
  }
  return { text: kept.join(" "), stripped, sentenceCount: kept.length };
}

export function selectMoments(moments, random = Math.random) {
  const pool = Array.isArray(moments) ? moments.filter(Boolean) : [];
  if (pool.length <= SCENE_MOMENT_COUNT) return pool.slice();
  // Partial Fisher-Yates over a copy. Shuffling rather than picking indexes
  // also drops the order the artifact happened to be written in, which is the
  // other thing a model reads position from.
  const shuffled = pool.slice();
  for (let index = 0; index < SCENE_MOMENT_COUNT; index += 1) {
    const swap = index + Math.floor(random() * (shuffled.length - index));
    const held = shuffled[index];
    shuffled[index] = shuffled[swap];
    shuffled[swap] = held;
  }
  return shuffled.slice(0, SCENE_MOMENT_COUNT);
}

// Which world the writer reads: the evolved world once approved, the today
// world before that, and the legacy root for a brain saved before ADR 0019.
// selectWorldArtifacts in src/brand-brain/world.js is the one function that
// decides, here and in the compiler; nothing else asks which world.
export { selectWorldArtifacts };

export async function handleSceneBrief({ body, brain, product, apiKey, response, random = Math.random, env = process.env }) {
  // Three artifacts are the whole of what the writer reads, as of 2026-09-07.
  // The guidance sections went first: they are prose summaries of the same
  // material, and sending both gave the writer two answers to every question.
  // The dossier followed on the same day. It is the brand explaining itself to
  // a person reviewing it, and desiredFeeling, productTruth, culturalCodes and
  // the rest are the reason two writer outputs came back with sentences a
  // camera cannot use. Nothing physical is lost with it: the palette, the
  // materials and the cultural codes all flow into the Visual Grammar at
  // synthesis time, as visible facts rather than as brand language.
  //
  // The grammar's rejects section stays out, because ADR 0017 made the governed
  // refusals document the only refusal source for the image path.
  // See docs/findings-2026-09-07-world-artifacts.md.
  const { world, artifacts } = selectWorldArtifacts(brain);
  const lived = artifacts.livedWorld || artifacts.lived_world || {};
  const story = artifacts.storyArchitecture || artifacts.story_architecture || {};
  const grammar = artifacts.visualGrammar || artifacts.visual_grammar || {};
  const campaign = body.campaign || null;

  // Two kinds write a scene. One puts the moment's people in the frame and one
  // arrives at a point when nobody is in it, and both take the same output
  // shape and the same word budget. The shape test is a predicate here rather
  // than the same string comparison repeated at each of the sites below.
  const requestedKind = String(body.kind || "scene");
  const peopleless = requestedKind === "scene_no_people";
  const writesAScene = requestedKind === "scene" || peopleless;

  const drewOn = [];
  const context = [];
  const grammarEntries = [];

  const text = (value) => String(value == null ? "" : value).trim();
  const list = (value) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);
  const joined = (value, separator = " ") => list(value).join(separator);
  // An empty field sends nothing. A labelled heading with nothing under it
  // reads as an absence the writer has to account for, and there is nothing to
  // account for: the brand simply has not written that part yet.
  const block = (label, entries) => {
    const kept = entries.filter(Boolean);
    if (!kept.length) return false;
    context.push(`${label}\n${kept.join("\n")}`);
    return true;
  };

  context.push(`BRAND: ${brain.brandName}. ${brain.brandDescription || ""}`.trim());

  // The patterns, emotions, tensions, and social modes are the reason the
  // writer has anything to say, so they arrive as what these people do and
  // feel rather than as a list of field names.
  const patterns = Array.isArray(lived.patterns) ? lived.patterns : [];
  const social = Array.isArray(lived.social) ? lived.social : [];
  const environments = Array.isArray(lived.environments) ? lived.environments : [];
  // The cast. Since ADR 0019 the Lived World carries one description of who
  // belongs in this world plus example people, and the writer casts someone
  // new for every picture. Nobody recurs across a brand's pictures, so an
  // example's name never appears in a direction. Two older shapes still read:
  // a `people` list from 2026-09-07, treated as examples with no description,
  // and a single `person` string from before that. A saved brain must still
  // work until it is re-synthesized.
  const cast = lived.cast && typeof lived.cast === "object" ? lived.cast : null;
  const castExamples = Array.isArray(cast?.examples) ? cast.examples : Array.isArray(lived.people) ? lived.people : [];
  const castDescription = text(cast?.description);
  const peopleById = new Map(castExamples.map((entry) => [text(entry?.id), entry]).filter(([id]) => id));
  const personLabel = (id) => {
    const entry = peopleById.get(text(id));
    return entry ? text(entry.name) || text(id) : text(id);
  };
  const exampleLines = castExamples.map((entry) => `${text(entry?.name)}. ${text(entry?.who)}`.trim()).filter(Boolean);
  if (block("THE LIVED WORLD", [
    text(lived.description),
    castDescription || exampleLines.length
      // On the peopleless kind the lead line says whose place this is, because
      // the task is a photograph taken when nobody is in the frame and their
      // activity is what put the room in the state the camera finds it in.
      // The single-`person` path below is a brain synthesized before
      // 2026-09-07 and is unchanged on both kinds.
      ? [
          peopleless
            ? "The people whose place this is. Their activity is the reason the room is in the state it is in:"
            : "These are the kind of people who belong here. Cast someone new for this picture from this description, and never reuse an example's name:",
          castDescription,
          exampleLines.length ? `${peopleless ? "For example:" : "Examples to cast from, not to reuse:"}\n${exampleLines.join("\n")}` : "",
        ].filter(Boolean).join("\n")
      : (lived.person ? `The person at the center of this: ${text(lived.person)}` : ""),
    list(lived.wants).length ? `What they want: ${joined(lived.wants, " ")}` : "",
    list(lived.rejects).length ? `What they will not have: ${joined(lived.rejects, " ")}` : "",
    list(lived.tensions).length ? `What pulls against itself in their life: ${joined(lived.tensions, " ")}` : "",
    patterns.length
      ? `How their days actually run:\n${patterns.map((entry) => `${text(entry?.time)}. ${text(entry?.title)}. ${text(entry?.body)}`.trim()).filter(Boolean).join("\n")}`
      : "",
    list(lived.emotions).length ? `What they feel: ${joined(lived.emotions, ", ")}` : "",
    social.length
      ? `How they are around other people:\n${social.map((entry) => `${text(entry?.mode)}. ${text(entry?.body)}`.trim()).filter(Boolean).join("\n")}`
      : "",
    environments.length
      ? `Where the brand has earned a place:\n${environments.map((entry) => `${text(entry?.name)}. Why the brand belongs there: ${text(entry?.earned)} ${text(entry?.detail)}`.trim()).filter(Boolean).join("\n")}`
      : "",
    lived.belongs ? `Where the brand belongs in this: ${text(lived.belongs)}` : "",
    lived.opens ? `What it opens up: ${text(lived.opens)}` : "",
  ])) drewOn.push("Lived World");

  // Only these three reach the writer. A brand with twelve moments still has
  // twelve moments; this call sees three of them.
  const moments = selectMoments(story.moments, random);
  // A moment is somewhere these people already are. Since ADR 0019 `who` is
  // prose describing who is there and `situation` is the one thing underway.
  // The 2026-09-07 shape carried `who` as a list of person ids and `doing`,
  // and the older shape an index, a scale, a narrative role and a product
  // beat. Both are read here so a saved brain still briefs a writer; the id
  // list resolves through the legacy people list only, because a cast example
  // has no id to resolve.
  const momentLine = (moment) => {
    const who = typeof moment?.who === "string"
      ? text(moment.who)
      : list(moment?.who).map(personLabel).filter(Boolean).join(" and ");
    const situation = text(moment?.situation) || text(moment?.doing);
    if (situation || moment?.where || who) {
      return [
        `${text(moment?.title)}.`,
        moment?.when || moment?.where ? `${text(moment?.when)}${moment?.when && moment?.where ? ", " : ""}${text(moment?.where)}.` : "",
        who ? (typeof moment?.who === "string" ? `Who is there: ${who}${/[.!?]$/.test(who) ? "" : "."}` : `${who} ${list(moment?.who).length === 1 ? "is" : "are"} there.`) : "",
        situation,
        text(moment?.feeling),
      ].filter(Boolean).join(" ");
    }
    return [
      `${text(moment?.title)}. ${text(moment?.time)}.`.replace(/\s+/g, " ").trim(),
      text(moment?.action),
      text(moment?.feeling),
    ].filter(Boolean).join(" ");
  };
  if (block("THE STORY", [
    text(story.description),
    story.rhythm ? `The rhythm this brand's story runs on: ${text(story.rhythm)}` : "",
    moments.length
      ? `${moments.length === 1 ? "A moment" : `${moments.length} moments`} from this world. ${moments.length === 1 ? "It is" : "Each is"} somewhere these people already are, and a camera could walk into ${moments.length === 1 ? "it" : "any of them"}:\n${moments.map(momentLine).filter(Boolean).join("\n")}`
      : "",
    story.why ? `Why the story is built this way: ${text(story.why)}` : "",
    list(story.continuity).length ? `What carries across every moment: ${joined(story.continuity, " ")}` : "",
  ])) drewOn.push("Story Architecture");

  // The grammar's five descriptive sections. Rejects is deliberately absent:
  // ADR 0017 made the governed refusals document the only refusal source, and
  // a second ungoverned refusal channel in the prompt is what that decision
  // removed. The ambition label travels, per ADR 0016, because an entry the
  // brand is reaching for belongs in the frame at full strength and the result
  // screen has to be able to say so.
  const grammarSections = grammar.sections && typeof grammar.sections === "object" ? grammar.sections : null;
  if (grammarSections) {
    const labelled = [
      // The peopleless kind gets the same entries under a label that fits what
      // it is doing with them. Withholding the section would cost the wardrobe
      // and era detail that a jacket over a chair or a knit cap on a counter
      // comes from.
      ["people", peopleless ? "Whose place this is" : "Who appears on camera"],
      ["objects", "The objects and the era they belong to"],
      ["places", "The places and what they are made of"],
      ["light", "The light"],
      ["camera", "The camera"],
    ];
    const grammarLines = [text(grammar.description)];
    for (const [key, label] of labelled) {
      const entries = Array.isArray(grammarSections[key]) ? grammarSections[key] : [];
      if (!entries.length) continue;
      const body = entries
        .map((entry) => {
          const statement = typeof entry === "string" ? entry : text(entry?.statement);
          if (!statement) return "";
          const origin = typeof entry === "string" ? null : entry?.basis?.origin || null;
          grammarEntries.push({ id: (typeof entry === "string" ? null : entry?.id) || null, section: key, statement, origin });
          return origin === "ambition" ? `${statement} (declared ambition for this brand)` : statement;
        })
        .filter(Boolean)
        .join(" ");
      if (body) grammarLines.push(`${label}: ${body}`);
    }
    if (block("THE VISUAL GRAMMAR", grammarLines)) drewOn.push("Visual grammar");
  }

  if (campaign) {
    context.push(`CAMPAIGN: ${campaign.name}. Idea: ${campaign.campaignIdea || ""}. Message territory: ${campaign.messageTerritory || ""}. Audience: ${campaign.audience || ""}. Objective: ${campaign.objective || ""}`);
    drewOn.push(`Campaign: ${campaign.name}`);
  }
  // The product line names the product and says it is in the scene. Visual
  // direction and exclusions used to travel here and no longer do: one is a
  // second art director and the other is a rule.
  if (product) {
    context.push(`PRODUCT: ${product.product_name} is present in the scene.`);
    drewOn.push(`Product record: ${product.product_name}`);
    const images = Array.isArray(product.images) ? product.images : [];
    if (images.some((i) => i.kind === "isolated")) drewOn.push("Product image on the record");
  }

  // The look is chosen before the scene is written, so the scene is authored
  // for the medium rather than handed to it afterward. The look owns capture
  // character; the scene owns content.
  //
  // A peopleless scene with no look chosen resolves the default here rather
  // than at compile time. Resolving it only in the compiler meant the direction
  // was written with no medium in the prompt at all and then compiled against
  // one, which is the conflict shape ADR 0018 exists to remove. A look that
  // reaches the writer decides the setting before the prose is written, and a
  // look that arrives afterward can only contradict it.
  const lookBrief = resolveLook(body.look)
    || (peopleless ? resolveLook(SCENE_NO_PEOPLE_DEFAULT_LOOK) : null);

  // What the writer receives of the look, as of 2026-09-10: one sentence about
  // the people and the room, and nothing about the film. The look's optical
  // description used to arrive whole in the RULES block below, and from
  // 2026-09-08 every direction paraphrased it back into the scene prose while
  // ignoring the one thing that should have changed the frame, which is that
  // drugstore flash means subjects face the camera. Rules outrank tasks in the
  // same prompt, so the instruction not to transcribe the look, one clause in
  // the task, lost to the look itself sitting in the rules. The optical
  // description compiles into the Capture section after the writer is done,
  // so the writer restating it was pure loss. It now sits in context, after
  // the world, as data rather than as a rule. See
  // docs/findings-2026-09-10-writer-behavior-and-meaning.md.
  if (writesAScene && lookBrief && text(lookBrief.behavior)) {
    context.push(`${LOOK_BEHAVIOR_HEADING}\n${text(lookBrief.behavior)}`);
  }

  // Each studio category asks for a different kind of artifact, so the task
  // line and the rules change with it. Everything else is shared.
  const kinds = {
    scene: {
      // The opening paragraph was rewritten 2026-09-07, second revision the
      // same day. It used to say a direction was built from a moment, and the
      // writer read that as an instruction to transcribe one: the moment naming
      // Nia's dining table, her headphones and her printed questions came back
      // as a direction naming exactly those, twice. A moment is a situation to
      // photograph, and the same situation an hour later is a different
      // picture. That is now what the first paragraph says.
      //
      // The other three paragraphs are unchanged apart from one sentence added
      // to the third, which says a direction is one instant. A person doing
      // three things in sequence is the transcription failure in miniature.
      //
      // The second paragraph changed on 2026-09-09 under ADR 0019. It used to
      // say the people are the ones named in THE LIVED WORLD and to use their
      // names. The Lived World is now a cast rather than a roster, nobody
      // recurs across a brand's pictures, and the paragraph says so.
      //
      // Two more sentences added 2026-09-08, one to the third paragraph and one
      // to the fourth, from three directions written the same day against
      // MycoPop with the drugstore_flash look.
      //
      // The third paragraph now says a direction is what was in front of the
      // lens rather than how the film rendered it. All three directions
      // paraphrased the look's own line back into the scene prose: orange skin
      // against magenta whites, a narrow contrast range, flattened faces, a
      // wide lens distorting the edges, background falling off into
      // underexposed murk, grain softening the photo. The medium then gets
      // specified twice in one render, loosely in Assignment and in the
      // governed version in Capture, and the two can disagree. The third
      // lookRules entry prevented exactly this until c8664ba3 cut it; its
      // wording is in the comment block above handleSceneBrief. It is not
      // restored there, because it was addressed to a four-field output shape
      // that no longer exists, and the constraint belongs in the statement of
      // what a direction is. The look still travels to the writer, because the
      // writer needs to know what the medium implies about behavior in frame.
      // That is the part it dropped: drugstore_flash says subjects face the
      // camera and know they are being photographed, and nobody in any of the
      // three directions faced the camera.
      //
      // The fourth paragraph now says where the product sits. All three
      // directions put the can in someone's hand, because the paragraph said
      // the product was one object among several and never said where it was,
      // so the writer picked the most obvious thing a person does with a can.
      // The reason this matters is not composition. The render models do not
      // judge the scale of a can against a body, and that failed in 100 percent
      // of owner testing, while scale without direct interaction has been
      // holding. The wording is positive placement rather than a prohibition,
      // because a negative leaves the writer nowhere to put the can.
      //
      // Three changes on 2026-09-10, from four sentences the writer produced
      // on 2026-09-09. The lens sentence left the third paragraph for the
      // RULES block, where it is a rule beside the look's data. The meaning
      // sentence in the third paragraph became MEANING_RULE, and the pairs in
      // MEANING_EXAMPLES became a paragraph of their own after it, so the task
      // is five paragraphs. The second paragraph gained WARDROBE_LINE. See
      // docs/findings-2026-09-10-writer-behavior-and-meaning.md.
      task: [
        "You write the direction for one photograph. Below are three moments from this brand's world, and you write one direction from each. A direction is one photograph taken inside a moment. The moment says who is there, where, when and what is going on. Yours is what a camera saw at one instant of that, and the same moment an hour later, on another day, or a few minutes either side is a different photograph. Write the photograph, not the moment.",
        "",
        `Take the moment's people, its place, and its time, and write what a camera in that room would see. The people are cast from the description in THE LIVED WORLD: write particular people who belong there, with what they are doing and how they carry themselves, and do not describe anyone by their job or their age bracket. Nobody in this frame has appeared in another picture of this brand, so do not use an example's name and do not write an example as themselves. ${WARDROBE_LINE}`,
        "",
        `A good direction puts those people in that place doing separate concrete things. A direction is one instant, so every person is in the middle of one thing rather than several in a row. It names a few objects that belong there. It describes light by where it comes from and how it behaves on what it hits. ${MEANING_RULE}`,
        "",
        MEANING_EXAMPLES,
        "",
        "Where a product is named below, it is present in the scene as one object among several, mentioned once, and it is never the subject. It is not what the moment is about. The product sits where someone set it down and left it, on a surface in the room, and no one in the frame is holding or touching it.",
      ].join("\n"),
    },
    // The second scene kind, added 2026-09-08. Same three brain artifacts, same
    // moments, same world and visual grammar, and the camera arrives when
    // nobody is in the frame. The task text is the owner's, approved as
    // written, and test/scene-brief.test.js matches it against the string, so
    // an edit here fails the suite. The 2026-09-10 changes to the scene kind
    // above were applied here in the same places: the lens sentence out to
    // RULES, the meaning sentence replaced by MEANING_RULE, the examples as a
    // paragraph after it, and SURFACES_LINE on the second paragraph, because
    // nobody in this frame is wearing anything.
    //
    // The prose never says the room is empty. Two hand pulls on 2026-09-08
    // returned empty frames from complete description with no prohibition and
    // no absence sentence, so the description carries it.
    //
    // The paragraph beginning "Name one thing in the frame" answers a finding
    // from those same pulls: the can is the only saturated warm object in these
    // frames, so it becomes the subject by color unless something else in the
    // room has real visual weight. On the people kind a person doing something
    // holds that rule up. Here nothing does, so the writer names the subject.
    scene_no_people: {
      task: [
        "You write the direction for one photograph. Below are three moments from this brand's world, and you write one direction from each. A direction is one photograph taken inside a moment, at a point when nobody is in the frame. The moment says who is there, where, when and what is going on. Yours is what a camera saw in that place a few minutes before they arrived, a few minutes after they left, or at an hour when the room is theirs but empty.",
        "",
        `The people are still the reason the room looks the way it does. They are the kind of people THE LIVED WORLD describes, and nobody in particular: the room belongs to someone cast from that description who has appeared in no other picture of this brand. Write what their activity left behind: a chair at the angle someone pushed it to, tools laid out in the order they were being used, a cup with something still in it, a surface worn where hands go. Use the moment's place and its time. Do not write a person into the frame, do not write a hand or part of a body, and do not say that the room is empty. Describe what is there completely enough that there is nothing left to add. ${SURFACES_LINE}`,
        "",
        `Name one thing in the frame that is not the product and give it size and position, so the eye has somewhere to land first. Without a person the frame has no natural subject, and whatever is largest and most contrasted becomes one. A direction is one instant, so the room is in one state rather than several. It names a few objects that belong there and gives each one a state and the reason it is in that state. It describes light by where it comes from and how it behaves on what it hits. ${MEANING_RULE}`,
        "",
        MEANING_EXAMPLES,
        "",
        "Where a product is named below, it appears once. It sits where someone set it down on a surface in the room, and it is never the subject and never centered.",
        "",
        "The three directions are not all at the same distance from the people. One is a place someone left minutes ago. One is a place at rest. In one the product is the closest thing the frame has to a subject.",
      ].join("\n"),
    },
    template_surface: {
      task: "You write short briefs for reusable branded background surfaces. A surface is a backdrop that other work sits on top of: a gradient, a texture, a lit environment with open space. It is not a finished image and it has no subject of its own.",
      rules: [
        "Describe the surface, its color behavior, its light, and where the open space sits for elements and text.",
        "No people, no products, no focal subject. Anything placed later needs room.",
        "Use the brand's palette and materials rather than inventing new ones.",
        "The three surfaces must differ in structure or where the open space falls, not merely in wording.",
      ],
    },
    sales_element: {
      task: "You write short briefs for a single generated element that will sit on top of a branded template in sales collateral. The element is one object rendered cleanly: a device mockup, a product shot, a demonstration visual.",
      rules: [
        "Describe the object, its angle, its finish, and its lighting. One object, not a scene.",
        "No text on the object beyond what a real screen or package would carry, and no invented interface copy.",
        "No slogans, no statistics, no claims about the product's performance.",
        "The three briefs must differ in the object or its treatment, not merely in wording.",
      ],
    },
  };
  const kind = kinds[requestedKind] || kinds.scene;

  // ADR 0018. A look that requires a condition to exist has to decide the
  // setting, and it was losing to the earned-environments rule that used to sit
  // below because that rule sat in the system prompt and the look was only in
  // the user prompt. Three looks failed exactly this way on 2026-08-18: studio
  // seamless returned a living room, overcast editorial returned a dark
  // interior, and daylight street documentary returned a night campfire.
  // Precedence is stated rather than implied.
  //
  // The world rules that sat here were cut on 2026-09-07. See the comment block
  // above this function for their wording and the record of what produced them.
  //
  // The medium's own line left this block on 2026-09-10; the comment above the
  // behavior block in context says why. What remains here is the environment
  // precedence, which is a rule, and the peopleless suspension.
  const lookRules = lookBrief
    ? [
        lookBrief.environment === "binding"
          ? `This photograph is made in a medium that requires ${lookBrief.requires}. Set the scene somewhere that condition holds. Choose the brand's earned environment that can be photographed this way, or the moment in an earned environment when that condition is true, and if no earned environment can carry it, say so in the label rather than setting the scene somewhere the medium would not work. This requirement outranks the preference for a familiar setting.`
          : "This photograph is made in a medium that works in any setting, so the environment stays governed by the brand's earned environments.",
        // The behavior sentence describes how people face and hold the camera,
        // and on this kind those clauses describe nothing. Precedence is stated
        // rather than left for the writer to work out, which is the same shape
        // as the fix that made a binding look decide the setting.
        //
        // Untested as of 2026-09-08 in its earlier wording. If a person
        // appears in a render on a face-heavy look, this sentence is not
        // enough and the fallback is filtering the look list for this kind.
        peopleless
          ? `Nobody is in the frame, so anything under ${LOOK_BEHAVIOR_HEADING} about how a person faces, holds, or knows about the camera does not apply here. The distance it keeps and the hour it implies apply in full.`
          : "",
      ].filter(Boolean)
    : [];

  const systemPrompt = [
    kind.task,
    "",
    context.join("\n\n"),
    "",
    "RULES:",
    ...lookRules.map((rule) => `- ${rule}`),
    ...(kind.rules || []).map((rule) => `- ${rule}`),
    // The sentence from 2026-09-08, moved from the third task paragraph into
    // the rules on 2026-09-10. The rule is that a direction describes what
    // was in front of the lens; the look is data, and now arrives as data.
    ...(writesAScene ? [`- ${LENS_RULE}`] : []),
    "- No em dashes. No fragment stacks. Plain declarative sentences.",
    "- Write physical facts, not perceptual targets. A camera can be told where a light sits, which surfaces it strikes, how many people are present and which way they face, what is cropped, and what is dry or worn and why. It cannot be told to make something feel authentic, cinematic, elevated, atmospheric, or unposed. Every sentence that does not change what is in front of the lens is a sentence the frame will ignore.",
    ...(writesAScene
      ? []
      : ["- Two or three sentences per brief. Concrete nouns over adjectives."]),
    "",
    "OUTPUT FORMAT:",
    writesAScene
      ? 'Return only JSON: {"options":[{"label":"three or four words","brief":"the whole direction written as one piece of prose, between 120 and 220 words"}]} with exactly three options. There are no other keys. No markdown fences, no preamble.'
      : 'Return only JSON: {"options":[{"label":"three or four words","brief":"the description"}]} with exactly three options. No markdown fences, no preamble.',
  ].join("\n");

  const userPrompt = [
    body.placementLabel ? `The output is a ${body.placementLabel}${body.placementRatio ? ` at ${body.placementRatio}` : ""}.` : "",
    body.placementCraft ? `Composition for this shape: ${body.placementCraft}` : "",
    body.hint ? `The user has started describing it: ${body.hint}` : "Propose three directions the brand could credibly take.",
  ].filter(Boolean).join("\n");

  const model = writerModel(env);
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const ask = async (conversation, maxTokens) => {
    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: conversation,
        max_tokens: maxTokens,
        temperature: 0.9,
      }),
    });
    if (!chatResponse.ok) {
      const errorBody = await chatResponse.text();
      throw new Error(`OpenAI returned status ${chatResponse.status}: ${errorBody.slice(0, 200)}`);
    }
    const chatData = await chatResponse.json();
    return chatData.choices?.[0]?.message?.content?.trim() || "";
  };
  const parseJson = (raw) => JSON.parse(raw.replace(/```json|```/g, "").trim());

  const raw = await ask(messages, writesAScene ? 2200 : 800);
  let options = [];
  try {
    const parsed = parseJson(raw);
    options = Array.isArray(parsed.options) ? parsed.options.slice(0, 3) : [];
    // Kept from the four-field shape. A model that emits world instead of
    // brief used to produce a card with a heading and no body, and accepting
    // either costs nothing. The rules that made world a likely key are gone as
    // of 2026-09-07, so this should stop firing.
    options = options.map((option) => (
      option && !option.brief && option.world ? { ...option, brief: option.world } : option
    ));
  } catch {
    throw new Error("The suggestions came back in an unexpected shape. Try again.");
  }
  // An option with no body cannot be selected: the card would show a heading
  // only, and choosing it would write an empty brief, clear the panel, and
  // leave the person back at the generate button with no explanation.
  options = options.filter((option) => option && String(option.brief || "").trim());
  if (!options.length) throw new Error("No suggestions came back. Try again.");

  // Every direction gets an id here, so the job record can say which of the
  // three was chosen and which sentences were stripped from which.
  const batch = crypto.randomBytes(3).toString("hex");
  options = options.map((option, index) => ({
    id: `direction-${batch}-${index + 1}`,
    label: text(option.label),
    brief: text(option.brief),
  }));

  // The meaning check, on scene kinds only. The template and sales kinds write
  // two or three sentences about a surface or an object, and a check that
  // strips a sentence from those leaves nothing worth rendering.
  //
  // A direction the check cuts below the floor is written again once, in the
  // same conversation, naming what was cut. If the second attempt also lands
  // under the floor it is returned stripped and flagged rather than looped.
  const stripped = [];
  let regenerated = 0;
  if (writesAScene) {
    const checked = [];
    for (const option of options) {
      let result = stripMeaningSentences(option.brief);
      let current = { ...option, brief: result.text };
      let flagged = false;
      for (const sentence of result.stripped) stripped.push({ directionId: option.id, sentence, attempt: 1 });
      if (result.stripped.length && result.sentenceCount < MEANING_CHECK_MIN_SENTENCES) {
        regenerated += 1;
        try {
          const retryRaw = await ask([
            ...messages,
            { role: "assistant", content: raw },
            {
              role: "user",
              content: [
                `The direction labelled "${option.label}" lost these sentences because each one told the reader what the picture means rather than what the camera recorded:`,
                ...result.stripped.map((sentence) => `- ${sentence}`),
                "Write that direction again, for the same moment, as one piece of prose between 120 and 220 words in which every sentence names something visible and the last sentence is a thing in the frame.",
                'Return only JSON: {"label":"three or four words","brief":"the direction"}. No markdown fences, no preamble.',
              ].join("\n"),
            },
          ], 1200);
          const retry = parseJson(retryRaw);
          const retryBrief = text(retry?.brief || retry?.option?.brief);
          if (retryBrief) {
            result = stripMeaningSentences(retryBrief);
            for (const sentence of result.stripped) stripped.push({ directionId: option.id, sentence, attempt: 2 });
            current = { ...option, label: text(retry?.label || retry?.option?.label) || option.label, brief: result.text };
          }
        } catch {
          // The first attempt, stripped, is what goes back. A failed retry is
          // not worth failing the whole set over.
        }
        flagged = result.sentenceCount < MEANING_CHECK_MIN_SENTENCES;
      }
      if (String(current.brief).trim()) checked.push(flagged ? { ...current, flagged: true } : current);
    }
    options = checked;
    if (!options.length) throw new Error("Every direction was cut by the meaning check. Try again.");
  }

  // The grammar entries that fed the writer travel back with the suggestions, so
  // the job can record which statements shaped the scene and an ambition entry
  // keeps its label all the way to the result screen.
  // Which moments this call was given. The job carries them so a direction can
  // be traced back to the situation it was photographing, and so a repeat can
  // be told from a re-pick of the same three.
  const momentIds = moments.map((moment) => text(moment?.id)).filter(Boolean);
  sendJson(response, 200, {
    options,
    drewOn,
    model,
    // Which world briefed the writer, so a result can say whether it came
    // from the brand today or the brand evolved.
    world,
    grammarEntries: grammarEntries.length ? grammarEntries : undefined,
    momentIds: momentIds.length ? momentIds : undefined,
    // What the meaning check removed, by direction, and how many directions
    // were written a second time. Both ride the job record if a direction is
    // chosen, and the corpus is built from them.
    stripped,
    regenerated,
  });
}
