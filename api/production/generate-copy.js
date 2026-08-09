import { createVercelBlobBrandBrainStore } from "../../src/brand-brain/store.js";
import { createVercelBlobProductStore } from "../../src/products/store.js";
import { createVercelBlobClaimsStore } from "../../src/claims/store.js";
import { assembleClaimsSet } from "../../src/claims/assembly.js";
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
    const jobScope = {
      channel: body.channel || null,
      placement: body.placement || null,
      product_id: body.productId || null,
      campaign_id: body.campaignId || null,
    };

    const claimsSet = assembleClaimsSet({
      claimsDocument,
      product,
      activeEntries: claimsStore.activeEntries,
      jobScope,
    });

    // Brain guardrails also contribute to the prohibited list (interim,
    // until guardrails are migrated into the claims document proper).
    for (const guardrail of dossier.guardrails || []) {
      claimsSet.prohibited.push({
        text: `${guardrail.title}: ${guardrail.body}`,
        source: "Brand Brain guardrail",
        scope: "brand",
      });
    }

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

// ---------------------------------------------------------------------------
// Claim audit (ADR 0013)
// ---------------------------------------------------------------------------

async function auditCopyAgainstClaims({ copy, approvedClaims, prohibitedClaims, apiKey }) {
  const approvedList = approvedClaims.map((c, i) => `  A${i + 1}. "${c.text}" (${c.source})`).join("\n");
  const prohibitedList = prohibitedClaims.map((c, i) => `  P${i + 1}. "${c.text}"`).join("\n");

  const auditSystemPrompt = [
    `You are a copy compliance auditor for a regulated brand. Your job is to identify claim-like sentences in marketing copy and classify each against approved and prohibited claims lists.`,
    ``,
    `DEFINITIONS:`,
    `A "claim" is any sentence that asserts a benefit, a capability, a statistic, a comparative advantage, or a regulatory property of the product or brand. Examples: "Our messages achieve 3x engagement," "FDA-cleared device," "The only platform with read receipts."`,
    `A "description" is a sentence that describes what something is, how it works, or sets context without asserting a benefit or advantage. Examples: "Healthcare organizations send thousands of messages daily," "The platform launched in 2019."`,
    ``,
    `APPROVED CLAIMS (safe harbor, these pass cleanly):`,
    approvedList || "  (none)",
    ``,
    `PROHIBITED CLAIMS AND EXCLUSIONS (hard stop, these are violations):`,
    prohibitedList || "  (none)",
    ``,
    `CLASSIFICATION RULES:`,
    `- If a sentence is a description, classify it as "description". No finding.`,
    `- If a sentence makes a claim that closely matches an approved claim (same meaning, even if reworded), classify it as "approved". Note which approved claim it matches (e.g., A1).`,
    `- If a sentence makes a claim that matches or violates a prohibited claim or exclusion, classify it as "prohibited". Note which prohibition it matches (e.g., P1).`,
    `- If a sentence makes a claim that matches neither list, classify it as "unapproved". This is advisory, not a violation.`,
    ``,
    `Be conservative about what counts as a claim. A sentence that describes a feature without asserting superiority, quantified benefit, or regulatory status is a description, not a claim. Err toward "description" over "unapproved" when the sentence is neutral and factual.`,
    ``,
    `Return ONLY a JSON array. Each element: {"sentence": "...", "classification": "description|approved|unapproved|prohibited", "match": "A1|P2|null", "reason": "brief explanation"}. No preamble, no markdown fences.`,
  ].join("\n");

  const auditResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: auditSystemPrompt },
        { role: "user", content: `Audit this copy:\n\n${copy}` },
      ],
      max_tokens: 2000,
      temperature: 0,
    }),
  });

  if (!auditResponse.ok) {
    return { error: "Claim audit call failed.", sentences: [] };
  }

  const auditData = await auditResponse.json();
  const auditText = (auditData.choices?.[0]?.message?.content || "").trim();

  let sentences = [];
  try {
    const cleaned = auditText.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
    sentences = JSON.parse(cleaned);
  } catch {
    return { error: "Claim audit returned unparseable output.", raw: auditText, sentences: [] };
  }

  const findings = [];
  let claimCount = 0;
  let descriptionCount = 0;

  for (const s of sentences) {
    if (s.classification === "description") {
      descriptionCount++;
      continue;
    }
    claimCount++;
    if (s.classification === "prohibited") {
      findings.push({ severity: "violation", sentence: s.sentence, match: s.match, reason: s.reason });
    } else if (s.classification === "unapproved") {
      findings.push({ severity: "review", sentence: s.sentence, reason: s.reason });
    }
  }

  return {
    totalSentences: sentences.length,
    descriptions: descriptionCount,
    claims: claimCount,
    approvedClaims: sentences.filter((s) => s.classification === "approved").length,
    unapprovedClaims: sentences.filter((s) => s.classification === "unapproved").length,
    prohibitedClaims: sentences.filter((s) => s.classification === "prohibited").length,
    findings,
    sentences,
  };
}

// ---------------------------------------------------------------------------
// Disclosure presence check (ADR 0013)
// ---------------------------------------------------------------------------

function checkDisclosurePresence(copy, disclosures) {
  const copyLower = copy.toLowerCase();
  return disclosures.map((d) => ({
    text: d.text,
    trigger_scope: d.trigger_scope,
    present: copyLower.includes(d.text.toLowerCase()),
  }));
}
