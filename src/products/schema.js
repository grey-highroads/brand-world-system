// Draft product record schema for the ADR 0012 prototype. Not committed as a
// public contract. Graduates to schemas/v1 only if the synthesis prototype
// passes the evidence-fidelity evaluation against a real product brief.

function strictObject(properties) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function stringArray(minItems, maxItems) {
  return { type: "array", items: { type: "string" }, minItems, maxItems };
}

const featureEvidence = {
  type: "array",
  items: strictObject({
    quote: { type: "string" },
    location: { type: "string" },
  }),
  minItems: 1,
  maxItems: 3,
};

const feature = strictObject({
  name: { type: "string" },
  benefit: { type: "string" },
  // Verbatim from the source when the source supplies claim language.
  // Empty string when the source does not supply approved language.
  approvedClaimLanguage: { type: "string" },
  // Accuracy or labeling constraint, e.g. conditional availability.
  // Empty string when none applies.
  accuracyNote: { type: "string" },
  origin: { type: "string", enum: ["stated", "inferred"] },
  evidence: featureEvidence,
});

const reviewQuestion = strictObject({
  title: { type: "string" },
  summary: { type: "string" },
  evidenceQuote: { type: "string" },
  confidence: { type: "string", enum: ["High", "Medium", "Low"] },
});

export const productRecordSchema = strictObject({
  productName: { type: "string" },
  category: { type: "string" },
  oneTrueThing: { type: "string" },
  audienceNote: { type: "string" },
  features: { type: "array", items: feature, minItems: 1, maxItems: 10 },
  proofPoints: stringArray(1, 8),
  visualDirection: { type: "string" },
  exclusions: stringArray(0, 6),
  reviewQuestions: { type: "array", items: reviewQuestion, minItems: 0, maxItems: 6 },
  sourceSummary: { type: "string" },
});
