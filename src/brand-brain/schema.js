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
      "Who appears in the frame, what they look like, what they wear, how they carry themselves on camera. This is the range of who appears, not one entry per named person: an entry describes a kind of presence in frame that many different people could fill. Casting logic, never audience strategy: no personas, no segments, no customer descriptions.",
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
  // ADR 0019 part three. A cast rather than a roster of characters: one
  // description wide enough that twenty pictures cast twenty different people
  // who all belong, plus examples a writer can reach for and never reuse by
  // name. Nobody recurs across a brand's pictures, so the examples carry no
  // ids: nothing downstream refers to one of them.
  cast: strictObject({
    description: {
      type: "string",
      description:
        "Who belongs in this world, as one description a photographer could cast from. Wide enough that twenty pictures could cast twenty different people who all fit, and particular enough that a person outside this world would not. Roughly how old they tend to be, what they do with their days, how they carry themselves, and what they are like to be around. An audience description is not a cast.",
    },
    examples: {
      type: "array",
      description:
        "Example people to cast from, not a roster. Each one is a particular person who fits the description, written so a writer has something concrete to reach for. A writer casts someone new for every picture and never reuses an example by name. At least one.",
      items: strictObject({
        name: {
          type: "string",
          description: "A first name, so the example reads as a person rather than a bracket.",
        },
        who: {
          type: "string",
          description: "Two or three sentences that make this a particular person: roughly how old they are, what they do with their days, how they carry themselves, and what they are like to be around. Physical enough to cast from. An audience description is not a person.",
        },
        basis,
      }),
      minItems: 1,
    },
  }),
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
        type: "string",
        description: "Who is there, as a description of the people present rather than a list of names or ids. The kind of person from the Lived World cast, how many, and what they are to each other. Never a role, a segment, or a reference to a specific named person.",
      },
      situation: {
        type: "string",
        description: "One thing underway, written as something a camera could see and already in progress. It is a situation and not a sequence: a photographer arriving at any minute of it finds a different picture, and a person in it is in the middle of one thing rather than several in a row. Two or three plain sentences.",
      },
      feeling: {
        type: "string",
        description: "What the moment means to the people in it, in one sentence. Not what the brand wants a viewer to feel.",
      },
      basis,
    }),
    // Six is an honesty floor. There is no ceiling: a counted list of moments
    // is the compiled rulebook moved into the schema (ADR 0019, owner ruling 2).
    minItems: 6,
  },
  why: { type: "string" },
  continuity: stringArray(3, 6),
});

const guidanceSections = {
  type: "array",
  items: guidanceSection,
  minItems: 6,
  maxItems: 6,
};

const reviewQuestions = {
  type: "array",
  items: reviewQuestion,
  minItems: 0,
  maxItems: 8,
};

// Since 2026-09-07 no model call answers to this schema. It describes the
// assembled brain, which the service builds from four pass results, and it is
// the validation target for that assembly. The four passes each cap review
// questions at eight, and the assembly keeps all of them, so the cap here is
// four times the pass cap rather than eight. Nothing is dropped on merge.
const assembledReviewQuestions = {
  type: "array",
  items: reviewQuestion,
  minItems: 0,
  maxItems: 32,
};

// One world: the dossier and the three world artifacts. Since ADR 0019 a brain
// carries two of these, the brand today and the brand evolved. The guidance
// sections and the brand fields stay at the root, written once from today's
// sources, because their job is resolving conflicts between sources and that
// job does not change with direction.
const worldArtifacts = strictObject({
  dossier,
  livedWorld,
  storyArchitecture,
  visualGrammar,
});

export const brandBrainSchema = strictObject({
  brandName: { type: "string" },
  brandDescription: { type: "string" },
  synthesisSummary: { type: "string" },
  cleanAssetCount: { type: "integer", minimum: 0 },
  guidanceSections,
  reviewQuestions: assembledReviewQuestions,
  artifacts: strictObject({
    today: worldArtifacts,
    evolved: worldArtifacts,
  }),
});

// Synthesis runs in eight ordered passes, one model call each. The first four
// write the brand today and were added 2026-09-07; the second four write the
// brand evolved and were added under ADR 0019 on 2026-09-09. Each pass answers
// to a slice of the schema above, and the service assembles the slices back
// into one brain with exactly the shape brandBrainSchema describes. The slices
// are cut from the same field definitions rather than written out again, so a
// change to an artifact reaches both of its passes by being made once.
// See docs/findings-2026-09-07-four-pass-synthesis.md.
//
// Every pass carries reviewQuestions, because any pass can find something worth
// asking about. The service appends passes 2 through 8 to the pass 1 list.
//
// Pass 5, the evolved dossier, writes the dossier and review questions and
// nothing else. The brand fields and guidance sections are pass 1's alone.
export const passSchemas = {
  1: strictObject({
    brandName: { type: "string" },
    brandDescription: { type: "string" },
    synthesisSummary: { type: "string" },
    cleanAssetCount: { type: "integer", minimum: 0 },
    guidanceSections,
    reviewQuestions,
    dossier,
  }),
  2: strictObject({ livedWorld, reviewQuestions }),
  3: strictObject({ storyArchitecture, reviewQuestions }),
  4: strictObject({ visualGrammar, reviewQuestions }),
  5: strictObject({ dossier, reviewQuestions }),
  6: strictObject({ livedWorld, reviewQuestions }),
  7: strictObject({ storyArchitecture, reviewQuestions }),
  8: strictObject({ visualGrammar, reviewQuestions }),
};

// The order is the point of the split, so it is stated once here and read
// everywhere else rather than being written out per caller.
export const PASS_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

// Which world a pass writes, and which of the four steps it is within that
// world. Pass 6 is the evolved Lived World: world "evolved", step 2.
export const PASS_WORLDS = {
  1: "today", 2: "today", 3: "today", 4: "today",
  5: "evolved", 6: "evolved", 7: "evolved", 8: "evolved",
};

export function passWorld(passId) {
  return PASS_WORLDS[passId];
}

export function passStep(passId) {
  return ((Number(passId) - 1) % 4) + 1;
}

export const WORLD_LABELS = {
  today: "the brand today",
  evolved: "the brand world, evolved",
};

export const PASS_LABELS = {
  1: "the brand as it presents itself",
  2: "the people and their days",
  3: "moments in their world",
  4: "the physical world of the pictures",
  5: "the brand as it wants to be seen",
  6: "the people it is reaching for",
  7: "moments in that world",
  8: "the pictures in that world",
};

// How far the aspiration sources may change the evolved world. Three levels in
// the user's words (ADR 0019, owner ruling 1). Until the control exists on
// screen the app sends DEFAULT_REACH, and the server falls back to it when a
// request carries none.
export const REACH_LEVELS = ["a few touches", "a clear direction", "a new world"];
export const DEFAULT_REACH = "a new world";
