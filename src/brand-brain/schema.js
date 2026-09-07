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
  origin: { type: "string", enum: ["evidence", "inference", "ambition"] },
  derivedFrom: { type: "string" },
  confidence: { type: "string", enum: ["High", "Medium", "Low"] },
});

function grammarSection(description, minItems, maxItems) {
  return {
    type: "array",
    description,
    items: strictObject({
      id: {
        type: "string",
        description: "A stable identifier for this entry, unique within the artifact, such as light-2. Evaluation findings cite it, so it must survive edits to the list and must never be a position.",
      },
      label: {
        type: "string",
        description: "A short handle of two to five words for the review screen to scan by, such as Practical screen light. Display only: the statement carries the direction, and no consumer of this schema reads meaning from the label.",
      },
      statement: {
        type: "string",
        description: "The direction itself, written as something a camera could record. One or two plain sentences.",
      },
      basis,
    }),
    minItems,
    maxItems,
  };
}

const visualGrammar = strictObject({
  description: { type: "string" },
  sourceCount: { type: "integer", minimum: 1 },
  categories: stringArray(2, 6),
  sections: strictObject({
    people: grammarSection(
      "Who appears in the frame, what they look like, what they wear, how they carry themselves on camera. Casting logic, never audience strategy: no personas, no segments, no customer descriptions.",
      1,
      8,
    ),
    objects: grammarSection(
      "The era and condition of things in frame: technology period, wear state, and the prop territory the brand owns. Physical objects, never graphic treatments applied afterward.",
      1,
      8,
    ),
    places: grammarSection(
      "Rooms, surfaces, and materials in physical space. Not content categories and not a copy of the Lived World environments, which are journey moments rather than rooms. An environment is an input to a place entry; the room it happens in has to be written.",
      1,
      8,
    ),
    light: grammarSection(
      "Sources, direction, behavior, color condition, and contrast character. Where the brand documents no lighting direction, write fewer entries rather than inventing them.",
      1,
      6,
    ),
    camera: grammarSection(
      "Objective settings, never adjectives: camera and format type, lens focal length, aperture and depth of field, exposure character, film stock or its emulation, and composition construction including framing distance, height, and symmetry discipline. A register word such as documentary or editorial may appear only as shorthand that resolves to stated settings in the same entry, and never stands alone.",
      3,
      8,
    ),
    rejects: grammarSection(
      "Visual territory the brand refuses, stated in terms a camera can see. A refusal that names a claim, a tone, or a promise rather than something visible belongs elsewhere.",
      1,
      8,
    ),
  }),
});

const guidanceArtifactArray = objectArray(
  {
    name: { type: "string" },
    type: { type: "string" },
    description: { type: "string" },
    readerId: { type: "string", enum: ["dossier", "lived", "story", "grammar", "none"] },
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
  people: {
    type: "array",
    description:
      "The people this brand serves, written as particular people rather than as an audience. Each entry is someone a photographer could cast and a scene writer could put in a room. Two entries must not be describable as the same person.",
    items: strictObject({
      id: {
        type: "string",
        description: "A stable identifier for this person, unique within the artifact, such as person-2. Story Architecture moments cite it, so it must survive edits to the list and must never be a position.",
      },
      name: {
        type: "string",
        description: "A first name, so moments and scenes can refer to this person by name rather than by role.",
      },
      who: {
        type: "string",
        description: "Two or three sentences that make this a particular person: roughly how old they are, what they do with their days, how they carry themselves, and what they are like to be around. Physical enough to cast from and specific enough that no other entry could be the same person. An audience description is not a person.",
      },
      basis,
    }),
    minItems: 2,
    maxItems: 5,
  },
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
  moments: {
    type: "array",
    description:
      "Moments in the world of the people the Lived World describes. Each one is something they are doing, somewhere specific, at a particular time, that a photographer could walk into. A moment does not exist to show the product, and the product may be absent from it.",
    items: strictObject({
      id: {
        type: "string",
        description: "A stable identifier for this moment, unique within the artifact, such as moment-4. It must survive edits to the list and must never be a position.",
      },
      title: {
        type: "string",
        description: "A short handle of two to five words for scanning by, such as The last hour of light. Display only: the other fields carry the moment.",
      },
      when: {
        type: "string",
        description: "A time of day or a point in a routine. Not a content calendar category and not a campaign beat.",
      },
      where: {
        type: "string",
        description: "The place, named as a physical setting someone could stand in. A room, a stretch of street, a patch of ground. Not an environment category and not a channel.",
      },
      who: {
        type: "array",
        description: "Which of the Lived World people are present, by their ids. At least one. Never a role, a segment, or a name that is not in the people list.",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
      },
      doing: {
        type: "string",
        description: "What is happening, written as something a camera could see, already underway rather than about to begin. Two or three plain sentences.",
      },
      feeling: {
        type: "string",
        description: "What the moment means to the people in it, in one sentence. Not what the brand wants a viewer to feel.",
      },
      basis,
    }),
    minItems: 6,
    maxItems: 12,
  },
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
    visualGrammar,
  }),
});
