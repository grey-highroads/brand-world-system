import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { assembleClaimsSet } from "../../src/claims/assembly.js";
import { buildJobScope } from "../../src/scope/resolver.js";
import { auditCopyAgainstClaims, checkDisclosurePresence } from "../../src/claims/copy-audit.js";
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
