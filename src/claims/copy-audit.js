// Copy audit (ADR 0013).
//
// Extracted from generate-copy.js so the mechanism test can call it
// independently. The audit function detects claim-like sentences in
// marketing copy and classifies each against approved and prohibited
// claims lists.
//
// Safe-harbor semantics:
//   approved  -> passes cleanly
//   prohibited -> violation, hard stop
//   unapproved -> advisory, review recommended
//   description -> no finding

/**
 * Run the claim audit against a piece of copy.
 *
 * @param {object} options
 * @param {string} options.copy - The copy to audit.
 * @param {Array} options.approvedClaims - Assembled approved claims.
 * @param {Array} options.prohibitedClaims - Assembled prohibited claims.
 * @param {string} options.apiKey - OpenAI API key.
 * @param {string} [options.model="gpt-4o"] - Model to use for detection.
 * @returns {Promise<object>} Audit result with sentences, findings, and counts.
 */
export async function auditCopyAgainstClaims({ copy, approvedClaims, prohibitedClaims, apiKey, model }) {
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
    `Return ONLY a JSON array. Each element: {"sentence": "...", "classification": "description|approved|unapproved|prohibited", "match": "A1|P2|null", "reason": "brief explanation"}. No preamble, no markdown fences.`,
  ].join("\n");

  const auditResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o",
      messages: [
        { role: "system", content: auditSystemPrompt },
        { role: "user", content: `Audit this copy:\n\n${copy}` },
      ],
      max_tokens: 2000,
      temperature: 0,
    }),
  });

  if (!auditResponse.ok) {
    return { error: `Claim audit call failed with status ${auditResponse.status}.`, sentences: [] };
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

/**
 * Check whether required disclosures are present in copy.
 * Normalizes whitespace on both sides before comparing.
 */
export function checkDisclosurePresence(copy, disclosures) {
  const copyNorm = copy.replace(/\s+/g, " ").toLowerCase();
  return disclosures.map((d) => ({
    text: d.text,
    trigger_scope: d.trigger_scope,
    present: copyNorm.includes(d.text.replace(/\s+/g, " ").toLowerCase()),
  }));
}
