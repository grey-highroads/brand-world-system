function strictObject(properties) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

function stringArray(minItems = 1, maxItems = 8) {
  return {
    type: "array",
    items: { type: "string" },
    minItems,
    maxItems,
  };
}

function objectArray(properties, minItems = 1, maxItems = 8) {
  return {
    type: "array",
    items: strictObject(properties),
    minItems,
    maxItems,
  };
}

const evidenceArray = objectArray(
  {
    source: { type: "string" },
    ref: { type: "string" },
    insight: { type: "string" },
    use: { type: "string" },
  },
  1,
  5,
);

const basis = strictObject({
  origin: { type: "string", enum: ["evidence", "inference"] },
  derivedFrom: { type: "string" },
  confidence: { type: "string", enum: ["High", "Medium", "Low"] },
});

const guidanceArtifactArray = objectArray(
  {
    name: { type: "string" },
    type: { type: "string" },
    description: { type: "string" },
    readerId: { type: "string", enum: ["dossier", "lived", "story", "none"] },
  },
  2,
  4,
);

const guidanceSection = strictObject({
  id: { type: "string", enum: ["foundation", "identity", "world", "voice", "creative", "rules"] },
  name: { type: "string" },
  summary: { type: "string" },
  prose: stringArray(3, 5),
  principles: stringArray(3, 6),
  evidence: evidenceArray,
  artifacts: guidanceArtifactArray,
  productionUse: { type: "string" },
  sourceCount: { type: "integer", minimum: 1 },
});

const questionEvidence = objectArray(
  {
    label: { type: "string" },
    ref: { type: "string" },
    quote: { type: "string" },
  },
  1,
  4,
);

const questionActions = objectArray(
  {
    id: { type: "string" },
    label: { type: "string" },
    detail: { type: "string" },
  },
  2,
  5,
);

const reviewQuestion = strictObject({
  id: { type: "string" },
  type: { type: "string", enum: ["contradiction", "duplicate", "suggested-principle", "brand-rule", "other"] },
  typeLabel: { type: "string" },
  signal: { type: "string" },
  title: { type: "string" },
  summary: { type: "string" },
  origin: { type: "string" },
  confidence: { type: "string", enum: ["High", "Medium", "Low"] },
  method: { type: "string" },
  rationale: { type: "string" },
  statement: { type: "string" },
  scope: objectArray(
    {
      label: { type: "string" },
      value: { type: "string" },
    },
    0,
    8,
  ),
  relationships: stringArray(1, 6),
  evidence: questionEvidence,
  actions: questionActions,
});

const dossier = strictObject({
  description: { type: "string" },
  sourceCount: { type: "integer", minimum: 1 },
  categories: stringArray(2, 6),
  read: stringArray(3, 5),
  readBody: { type: "string" },
  audience: { type: "string" },
  desiredFeeling: { type: "string" },
  productTruth: { type: "string" },
  proof: stringArray(2, 6),
  palette: objectArray(
    {
      name: { type: "string" },
      role: { type: "string" },
      color: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    },
    3,
    6,
  ),
  materials: stringArray(3, 8),
  culturalCodes: { type: "string" },
  guardrails: objectArray(
    {
      title: { type: "string" },
      body: { type: "string" },
    },
    3,
    6,
  ),
});

const livedWorld = strictObject({
  description: { type: "string" },
  sourceCount: { type: "integer", minimum: 1 },
  categories: stringArray(2, 6),
  person: { type: "string" },
  wants: stringArray(3, 6),
  rejects: stringArray(3, 6),
  tensions: stringArray(3, 6),
  patterns: objectArray(
    {
      time: { type: "string" },
      title: { type: "string" },
      body: { type: "string" },
      basis,
    },
    3,
    6,
  ),
  emotions: stringArray(4, 8),
  social: objectArray(
    {
      mode: { type: "string" },
      body: { type: "string" },
      basis,
    },
    2,
    4,
  ),
  environments: objectArray(
    {
      name: { type: "string" },
      earned: { type: "string" },
      detail: { type: "string" },
      basis,
    },
    3,
    6,
  ),
  belongs: { type: "string" },
  opens: { type: "string" },
});

const storyArchitecture = strictObject({
  description: { type: "string" },
  sourceCount: { type: "integer", minimum: 1 },
  categories: stringArray(2, 6),
  rhythm: { type: "string" },
  moments: objectArray(
    {
      index: { type: "string" },
      time: { type: "string" },
      scale: { type: "string" },
      title: { type: "string" },
      action: { type: "string" },
      feeling: { type: "string" },
      role: { type: "string" },
      product: { type: "string" },
    },
    4,
    4,
  ),
  why: { type: "string" },
  continuity: stringArray(3, 6),
});

export const brandBrainSchema = strictObject({
  brandName: { type: "string" },
  brandDescription: { type: "string" },
  synthesisSummary: { type: "string" },
  cleanAssetCount: { type: "integer", minimum: 0 },
  guidanceSections: {
    type: "array",
    items: guidanceSection,
    minItems: 6,
    maxItems: 6,
  },
  reviewQuestions: {
    type: "array",
    items: reviewQuestion,
    minItems: 0,
    maxItems: 8,
  },
  artifacts: strictObject({
    dossier,
    livedWorld,
    storyArchitecture,
  }),
});
