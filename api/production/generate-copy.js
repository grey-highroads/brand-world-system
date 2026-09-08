import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { assembleClaimsSet, listSegments } from "../../src/claims/assembly.js";
import { buildJobScope } from "../../src/scope/resolver.js";
import { auditCopyAgainstClaims, checkDisclosurePresence } from "../../src/claims/copy-audit.js";
import { produceCopy, auditProducedCopy } from "../../src/copy/generate.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";
import { resolveLook } from "../../src/production/looks.js";

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
    const dossier = brain.artifacts?.dossier || {};

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

export async function handleSceneBrief({ body, brain, product, apiKey, response, random = Math.random }) {
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
  const artifacts = brain.artifacts || {};
  const lived = artifacts.livedWorld || artifacts.lived_world || {};
  const story = artifacts.storyArchitecture || artifacts.story_architecture || {};
  const grammar = artifacts.visualGrammar || artifacts.visual_grammar || {};
  const campaign = body.campaign || null;

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
  // The people, by name. A brain synthesized before 2026-09-07 carries a single
  // `person` string instead, and that still reads: it is the shape that
  // produced "a late 20s professional" and then Mark, so a writer given it will
  // invent someone, but a saved brain must still work until it is re-synthesized.
  const people = Array.isArray(lived.people) ? lived.people : [];
  const peopleById = new Map(people.map((entry) => [text(entry?.id), entry]).filter(([id]) => id));
  const personLabel = (id) => {
    const entry = peopleById.get(text(id));
    return entry ? text(entry.name) || text(id) : text(id);
  };
  if (block("THE LIVED WORLD", [
    text(lived.description),
    people.length
      ? `The people this is about. Write these people, by name. Do not invent others:\n${people.map((entry) => `${text(entry?.name)}. ${text(entry?.who)}`.trim()).filter(Boolean).join("\n")}`
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
  // A moment is somewhere these people already are. The old shape carried an
  // index, a scale, a narrative role and a product beat per moment, and it is
  // read here so a brain synthesized before 2026-09-07 still briefs a writer.
  const momentLine = (moment) => {
    const present = list(moment?.who).map(personLabel).filter(Boolean);
    const who = present.join(" and ");
    if (moment?.doing || moment?.where || who) {
      return [
        `${text(moment?.title)}.`,
        moment?.when || moment?.where ? `${text(moment?.when)}${moment?.when && moment?.where ? ", " : ""}${text(moment?.where)}.` : "",
        who ? `${who} ${present.length === 1 ? "is" : "are"} there.` : "",
        text(moment?.doing),
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
      ["people", "Who appears on camera"],
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
      task: [
        "You write the direction for one photograph. Below are three moments from this brand's world, and you write one direction from each. A direction is one photograph taken inside a moment. The moment says who is there, where, when and what is going on. Yours is what a camera saw at one instant of that, and the same moment an hour later, on another day, or a few minutes either side is a different photograph. Write the photograph, not the moment.",
        "",
        "Take the moment's people, its place, and its time, and write what a camera in that room would see. The people are the ones named in THE LIVED WORLD. Use their names and write them as themselves. Do not invent a person and do not describe anyone by their job or their age bracket.",
        "",
        "A good direction puts those people in that place doing separate concrete things. A direction is one instant, so every person is in the middle of one thing rather than several in a row. It names a few objects that belong there. It describes light by where it comes from and how it behaves on what it hits. Every sentence is something the camera can record, so a sentence about what the picture means or how it should feel is a sentence to cut. A direction is what was in front of the lens rather than how the film rendered it, so the color cast, the grain, the contrast, the focus and the lens are all set elsewhere in this prompt and do not belong in the prose.",
        "",
        "Where a product is named below, it is present in the scene as one object among several, mentioned once, and it is never the subject. It is not what the moment is about. The product sits where someone set it down and left it, on a surface in the room, and no one in the frame is holding or touching it.",
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
  const kind = kinds[String(body.kind || "scene")] || kinds.scene;

  // The look is chosen before the scene is written, so the scene is authored
  // for the medium rather than handed to it afterward. The look owns capture
  // character; the scene owns content.
  const lookBrief = resolveLook(body.look);

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
  const lookRules = lookBrief
    ? [
        `This image is made with a specific photographic medium and the direction has to be something that medium can actually produce: ${lookBrief.line}`,
        lookBrief.environment === "binding"
          ? `That medium requires ${lookBrief.requires}. Set the scene somewhere that condition holds. Choose the brand's earned environment that can be photographed this way, or the moment in an earned environment when that condition is true, and if no earned environment can carry it, say so in the label rather than setting the scene somewhere the medium would not work. This requirement outranks the preference for a familiar setting.`
          : "That medium works in any setting, so the environment stays governed by the brand's earned environments.",
      ]
    : [];

  const systemPrompt = [
    kind.task,
    "",
    context.join("\n\n"),
    "",
    "RULES:",
    ...lookRules.map((rule) => `- ${rule}`),
    ...(kind.rules || []).map((rule) => `- ${rule}`),
    "- No em dashes. No fragment stacks. Plain declarative sentences.",
    "- Write physical facts, not perceptual targets. A camera can be told where a light sits, which surfaces it strikes, how many people are present and which way they face, what is cropped, and what is dry or worn and why. It cannot be told to make something feel authentic, cinematic, elevated, atmospheric, or unposed. Every sentence that does not change what is in front of the lens is a sentence the frame will ignore.",
    ...(String(body.kind || "scene") === "scene"
      ? []
      : ["- Two or three sentences per brief. Concrete nouns over adjectives."]),
    "",
    "OUTPUT FORMAT:",
    String(body.kind || "scene") === "scene"
      ? 'Return only JSON: {"options":[{"label":"three or four words","brief":"the whole direction written as one piece of prose, between 120 and 220 words"}]} with exactly three options. There are no other keys. No markdown fences, no preamble.'
      : 'Return only JSON: {"options":[{"label":"three or four words","brief":"the description"}]} with exactly three options. No markdown fences, no preamble.',
  ].join("\n");

  const userPrompt = [
    body.placementLabel ? `The output is a ${body.placementLabel}${body.placementRatio ? ` at ${body.placementRatio}` : ""}.` : "",
    body.placementCraft ? `Composition for this shape: ${body.placementCraft}` : "",
    body.hint ? `The user has started describing it: ${body.hint}` : "Propose three directions the brand could credibly take.",
  ].filter(Boolean).join("\n");

  const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: String(body.kind || "scene") === "scene" ? 2200 : 800,
      temperature: 0.9,
    }),
  });
  if (!chatResponse.ok) {
    const errorBody = await chatResponse.text();
    throw new Error(`OpenAI returned status ${chatResponse.status}: ${errorBody.slice(0, 200)}`);
  }
  const chatData = await chatResponse.json();
  const raw = chatData.choices?.[0]?.message?.content?.trim() || "";
  let options = [];
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
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
    model: "gpt-4o",
    grammarEntries: grammarEntries.length ? grammarEntries : undefined,
    momentIds: momentIds.length ? momentIds : undefined,
  });
}
