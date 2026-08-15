import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { assembleClaimsSet, listSegments } from "../../src/claims/assembly.js";
import { buildJobScope } from "../../src/scope/resolver.js";
import { auditCopyAgainstClaims, checkDisclosurePresence } from "../../src/claims/copy-audit.js";
import { produceCopy, auditProducedCopy } from "../../src/copy/generate.js";
import { readJsonBody, requireBrandWorldAccess, resolveClientId, sendJson, sendPublicError } from "../../src/server/http.js";

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
async function handleSceneBrief({ body, brain, product, apiKey, response }) {
  const dossier = brain.artifacts?.dossier || {};
  const lived = brain.artifacts?.livedWorld || brain.artifacts?.lived_world || {};
  const section = (id) => brain.guidanceSections?.find((s) => s.id === id);
  const world = section("world");
  const identity = section("identity");
  const creative = section("creative");
  const rules = section("rules");
  const campaign = body.campaign || null;

  const drewOn = [];
  const context = [];

  context.push(`BRAND: ${brain.brandName}. ${brain.brandDescription || ""}`);
  if (world) {
    context.push(`WORLD: ${world.summary}. ${(world.principles || []).join(". ")}`);
    drewOn.push("Brand world guidance");
  }
  if (identity) {
    context.push(`IDENTITY: ${identity.summary}`);
    drewOn.push("Identity guidance");
  }
  if (creative) {
    context.push(`CREATIVE DIRECTION: ${creative.summary}. ${(creative.principles || []).join(". ")}`);
    drewOn.push("Creative direction");
  }
  const environments = Array.isArray(lived.environments) ? lived.environments : [];
  if (environments.length) {
    context.push(`EARNED ENVIRONMENTS: ${environments.map((e) => `${e.name || e.title || ""}${e.earned ? ` (why the brand belongs: ${e.earned})` : ""}`).filter(Boolean).join("; ")}`);
    drewOn.push("Lived World environments");
  }
  if (lived.person) {
    context.push(`PERSON AT THE CENTER: ${typeof lived.person === "string" ? lived.person : JSON.stringify(lived.person).slice(0, 600)}`);
    drewOn.push("Lived World person");
  }
  if (dossier.desiredFeeling) context.push(`DESIRED FEELING: ${dossier.desiredFeeling}`);
  if (dossier.materials?.length) context.push(`MATERIALS AND LIGHT: ${dossier.materials.join(", ")}`);
  if (dossier.palette?.length) context.push(`PALETTE: ${dossier.palette.map((c) => `${c.name} (${c.role})`).join(", ")}`);
  if (rules) {
    context.push(`RULES AND GUARDRAILS: ${rules.summary}. ${(dossier.guardrails || []).map((g) => `${g.title}: ${g.body}`).join(" ")}`);
    drewOn.push("Creative rules and guardrails");
  }
  if (campaign) {
    context.push(`CAMPAIGN: ${campaign.name}. Idea: ${campaign.campaignIdea || ""}. Message territory: ${campaign.messageTerritory || ""}. Audience: ${campaign.audience || ""}. Objective: ${campaign.objective || ""}`);
    drewOn.push(`Campaign: ${campaign.name}`);
  }
  if (product) {
    context.push(`PRODUCT: ${product.product_name}. ${product.one_true_thing || ""} Visual direction: ${product.visual_direction || ""}`);
    if (product.exclusions?.length) context.push(`PRODUCT EXCLUSIONS: ${product.exclusions.join("; ")}`);
    drewOn.push(`Product record: ${product.product_name}`);
    const images = Array.isArray(product.images) ? product.images : [];
    if (images.some((i) => i.kind === "isolated")) drewOn.push("Product image on the record");
  }

  // Each studio category asks for a different kind of artifact, so the task
  // line and the rules change with it. Everything else is shared.
  const kinds = {
    scene: {
      task: "You art direct brand image production. For each direction you write four separate fields: the world, the composition, the lighting, and the props. This is direction for a photographer on set, not marketing copy. Write it the way a director of photography would be briefed.",
      rules: [
        "Describe only what a camera could see. No slogans, no statistics, no claims about the product's performance.",
        "Stay inside the brand's earned environments and guardrails. Do not invent a setting the brand has no reason to be in.",
        "The world field carries the place, the person, the moment, and what is happening. Name the hour and the specific physical evidence that the place is used by real people.",
        "The composition field carries camera behavior and spatial structure: where the subject sits in frame, camera height, focal length, depth of field, what runs from foreground to background, what is cropped by which frame edge, and an explicit ranking of what the eye should hit first, second, and third.",
        "In that ranking the person and what they are doing come first and the place they are in comes second. The product is not the first thing the eye lands on and it is not centered on a surface facing the camera. It sits where someone actually set it down or is holding it, inside the moment rather than on top of it.",
        "The product appears once. One unit, in one place, held or set down. Do not populate the scene with several of them.",
        "Compose off center. Give the frame an unbalanced weight, crop something at an edge, and let the camera read as an observation of a moment already happening rather than a setup arranged for it.",
        "The lighting field carries light behavior: the dominant source and its direction and color, any secondary source, how the two interact, contrast level, and where shadows fall.",
        "The props field is a short list of specific objects present in the scene. Objects with wear and use, not category defaults.",
        "The three directions must differ in world, not merely in wording.",
        "The brand's creative direction and declared ambitions are direction to follow, not background reading. If the brand has named an aesthetic it is reaching for, one of the three directions should pursue it.",
      ],
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

  const systemPrompt = [
    kind.task,
    "",
    context.join("\n"),
    "",
    "RULES:",
    ...kind.rules.map((rule) => `- ${rule}`),
    "- No em dashes. No fragment stacks. Plain declarative sentences.",
    String(body.kind || "scene") === "scene"
      ? "- Two to four sentences per field. Concrete nouns over adjectives. Specific over evocative."
      : "- Two or three sentences per brief. Concrete nouns over adjectives.",
    "",
    "OUTPUT FORMAT:",
    String(body.kind || "scene") === "scene"
      ? 'Return only JSON: {"options":[{"label":"three or four words","brief":"the world","composition":"the composition","lighting":"the lighting","props":"comma separated objects"}]} with exactly three options. No markdown fences, no preamble.'
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
  } catch {
    throw new Error("The suggestions came back in an unexpected shape. Try again.");
  }
  if (!options.length) throw new Error("No suggestions came back. Try again.");

  sendJson(response, 200, { options, drewOn, model: "gpt-4o" });
}
