// Copy type catalog (ADR 0014, sequencing step 1).
//
// A copy type is a data entry. It declares what the copy is, how the prompt
// is shaped, and what structure the output should have. Generation and audit
// are shared code in generate.js and are identical for every type.
//
// This follows the ADR 0011 line that prevents per-client and per-channel
// forks: the catalog entry is configuration, the capability is code. Adding
// headline_set or one_sheet_prose is a data change here, not a new endpoint
// and not new generation logic.
//
// Entry shape:
//   id                  stable identifier stored in the package
//   label               marketer-legible name shown in the interface
//   description         one line explaining what the user gets
//   roleLine            the opening instruction, brand name interpolated
//   lengthGuidance      function of the job context, returns a length rule
//   structuralRules     array of non-negotiable prose rules for this type
//   outputFormat        array of lines describing the expected return shape
//   topicFallbackOrder  which brief fields supply the topic, in order
//   auditPosture        "claims" runs the ADR 0013 audit, "none" skips it

const sharedProseRules = [
  "No em dashes anywhere. Use commas, periods, or semicolons instead.",
  'No fragment stacks ("Simple. Effective. Easy."). Convert to a complete sentence.',
  'No "It\'s not X. It\'s Y." constructions. Convert the first sentence to a dependent clause.',
  'No filler intensifiers: "really," "genuinely," "honestly," "straightforward."',
  'No hedging verbs. "We bring," not "We try to bring."',
  "Peer-to-peer register. Not promotional. Not instructional. The reader should finish with a useful idea.",
  "Short sentences need active verbs and a claim that could be disagreed with. No decorative fragments.",
];

// Caption length varies by where the post lands. This is a property of the
// placement, read from the job, rather than a separate catalog entry per
// channel. A new platform is a line in this map.
const captionLengthByChannel = {
  LinkedIn: { min: 150, max: 300, note: "LinkedIn rewards a developed thought." },
  Instagram: { min: 40, max: 120, note: "Instagram captions stay short and read fast." },
  Facebook: { min: 40, max: 150, note: "Facebook captions stay short and read fast." },
  X: { min: 20, max: 50, note: "The post must fit a strict character budget." },
  TikTok: { min: 15, max: 40, note: "TikTok captions are a single line or two." },
  Pinterest: { min: 30, max: 100, note: "Pinterest captions describe and invite." },
};

const DEFAULT_CAPTION_LENGTH = { min: 40, max: 150, note: "Keep the caption tight enough to read in a feed." };

function channelFromPlacement(placement) {
  const first = String(placement || "").trim().split(/\s+/)[0];
  return first || "";
}

export const copyTypes = {
  social_caption: {
    id: "social_caption",
    label: "Post caption",
    description: "Text that accompanies the image in the feed. Written from your Brand Brain and checked against your claims.",
    roleLine: (context) =>
      `You are writing the caption for a social post from ${context.brandName}${context.brandDescription ? ` (${context.brandDescription})` : ""}.`,
    lengthGuidance: (context) => {
      const length = captionLengthByChannel[channelFromPlacement(context.placement)] || DEFAULT_CAPTION_LENGTH;
      return `Keep the caption between ${length.min} and ${length.max} words. ${length.note}`;
    },
    structuralRules: [
      ...sharedProseRules,
      "The caption carries the message. Do not describe the image; the reader can see it.",
      "No hashtag block unless the direction asks for one.",
    ],
    outputFormat: [
      "Return ONLY the caption text. No preamble, no explanation, no label, no quotation marks around the whole thing.",
    ],
    topicFallbackOrder: ["copyDirection", "postTopic", "scene"],
    auditPosture: "claims",
  },
};

export function getCopyType(id) {
  return copyTypes[String(id || "")] || null;
}

export function listCopyTypes() {
  return Object.values(copyTypes).map((type) => ({
    id: type.id,
    label: type.label,
    description: type.description,
  }));
}

// Which copy types a placement offers, and which are on by default. Social
// placements produce a caption unless the user turns it off; every other
// placement offers nothing yet. Extending this is a data change.
export function defaultCopyOutputsForPlacement(placement) {
  const channel = channelFromPlacement(placement);
  const socialChannels = ["LinkedIn", "Instagram", "Facebook", "X", "TikTok", "Pinterest"];
  if (socialChannels.includes(channel)) return ["social_caption"];
  return [];
}
