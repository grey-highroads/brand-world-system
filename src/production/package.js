const guidanceOrder = ["foundation", "identity", "world", "creative", "rules"];

const formatSizes = {
  "4:5 portrait": "1024x1280",
  "1:1 square": "1024x1024",
  "9:16 portrait": "1024x1824",
  "1.91:1 landscape": "1536x800",
  "16:9 landscape": "1536x864",
  "4:3 landscape": "1536x1152",
};

function cleanText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function requiredText(value, label, maximumLength) {
  const text = cleanText(value);
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }
  if (text.length > maximumLength) {
    const error = new Error(`${label} is too long. Keep it under ${maximumLength.toLocaleString()} characters.`);
    error.status = 400;
    throw error;
  }
  return text;
}

function optionalText(value, label, maximumLength) {
  const text = cleanText(value);
  if (text.length > maximumLength) {
    const error = new Error(`${label} is too long. Keep it under ${maximumLength.toLocaleString()} characters.`);
    error.status = 400;
    throw error;
  }
  return text;
}

function sectionDirection(section) {
  const pieces = [
    section.summary,
    ...(section.prose || []),
    ...(section.principles || []).map((principle) => `Principle: ${principle}.`),
    section.productionUse,
  ];
  return pieces.map((piece) => cleanText(piece)).filter(Boolean).join(" ");
}

function referenceDirection(reference) {
  const instruction = cleanText(reference.usageInstruction || reference.source.usage, "Use only as visual inspiration where it supports the approved Brand Brain.");
  const exclusions = cleanText(reference.source.exclusions);
  return `${reference.source.name}. ${reference.influence} influence for ${reference.role}. ${instruction}${exclusions ? ` Do not carry over: ${exclusions}` : ""}`;
}

export function imageSizeForFormat(format) {
  return formatSizes[format] || "1024x1024";
}

export function compileBrandWorldImagePackage({ approvedBrain, brainVersion, brief, references = [] }) {
  if (!approvedBrain?.brandName || !Array.isArray(approvedBrain.guidanceSections)) {
    const error = new Error("Approve a Brand Brain before generating production work.");
    error.status = 409;
    throw error;
  }

  const scene = requiredText(brief?.scene, "Describe the image", 4000);
  const exclusions = optionalText(brief?.exclusions, "The list of things to avoid", 2000);
  const placement = requiredText(brief?.placement, "Placement", 120);
  const format = requiredText(brief?.format, "Format", 120);
  const selected = new Map(approvedBrain.guidanceSections.map((section) => [section.id, section]));
  const guidance = guidanceOrder.map((id) => selected.get(id)).filter(Boolean);
  const dossier = approvedBrain.artifacts?.dossier || {};

  const sections = [
    {
      title: "Assignment",
      body: `Create one ${format} brand world image for ${placement}. ${scene}`,
    },
    {
      title: "Brand foundation",
      body: `${cleanText(approvedBrain.brandName)} is ${cleanText(approvedBrain.brandDescription, "the approved brand")}. ${cleanText(dossier.readBody, approvedBrain.synthesisSummary)}`,
    },
    ...guidance.map((section) => ({ title: section.name, body: sectionDirection(section) })),
    {
      title: "Audience and feeling",
      body: `${cleanText(dossier.audience)} ${cleanText(dossier.desiredFeeling)}`,
    },
    {
      title: "Visual materials",
      body: [
        dossier.palette?.length ? `Palette: ${dossier.palette.map((color) => `${color.name} (${color.role}, ${color.color})`).join(", ")}.` : "",
        dossier.materials?.length ? `Materials and light: ${dossier.materials.join(", ")}.` : "",
      ].filter(Boolean).join(" "),
    },
    {
      title: "Creative references",
      body: references.length
        ? `${references.map(referenceDirection).join(" ")} These sources guide only the named qualities and do not replace the approved Brand Brain.`
        : "No creative source image is attached. Resolve open visual choices from the approved Brand Brain.",
    },
    {
      title: "Boundaries",
      body: [
        dossier.guardrails?.length ? dossier.guardrails.map((rule) => `${rule.title}: ${rule.body}`).join(" ") : "",
        exclusions ? `Also avoid: ${exclusions}` : "",
        "Add no logos, labels, packaging, headlines, captions, watermarks, or other readable text unless they are explicitly present in an attached source and requested in the assignment.",
      ].filter(Boolean).join(" "),
    },
    {
      title: "Output",
      body: `Return one finished image only. Compose for ${format} in ${placement}. Keep the result visually specific, believable, and native to ${cleanText(approvedBrain.brandName)} rather than a generic category image.`,
    },
  ].filter((section) => section.body);

  const prompt = sections.map((section) => `${section.title.toUpperCase()}\n${section.body}`).join("\n\n");
  return {
    version: "brand-world-image-v1",
    deliverable: "brand-world-image",
    brandName: approvedBrain.brandName,
    brandDescription: approvedBrain.brandDescription,
    brainVersion: Number(brainVersion || 1),
    output: { placement, format, size: imageSizeForFormat(format), quantity: 1 },
    brief: { scene, exclusions },
    prompt,
    sections,
    compiledComponents: guidance.map((section) => `${section.name} / ${section.summary}`),
    references: references.map((reference) => ({
      id: reference.source.id,
      name: reference.source.name,
      role: reference.role,
      influence: reference.influence,
      usageInstruction: reference.usageInstruction || reference.source.usage,
      fileName: reference.file.name,
      fileType: reference.file.type,
    })),
    policy: {
      groundedIn: `Approved Brand Brain v${Number(brainVersion || 1)}`,
      flexible: ["scene", "composition", "casting", "lighting", "materials"],
      excluded: ["unapproved readable text", "invented logos or packaging", ...(exclusions ? [exclusions] : [])],
    },
  };
}
