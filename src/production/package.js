import {
  protectionBlock,
  inferPackageFormat,
  selectAestheticMode,
  openingLine,
  neutralizeStateLanguage,
  auditConstraints,
} from "./prompt-craft.js";

const guidanceOrder = ["foundation", "identity", "world", "creative", "rules"];

// Template compilation uses a subset of guidance. World and creative storytelling
// push the model toward narrative scenes with focal subjects. Templates need
// abstract branded surfaces, so those sections are replaced with template-specific
// production instructions.
const templateGuidanceOrder = ["foundation", "identity", "rules"];

const templateProductionInstructions = {
  title: "Template production instructions",
  body: [
    "This image is a reusable background surface, not a finished piece.",
    "Compose for reuse: this template will have product images, text blocks, and other elements placed on top of it in a layout tool.",
    "Leave clear, intentional open zones where content will be placed. The brief describes where those zones should be.",
    "Keep the surface abstract, environmental, or textural. Do not include people, products, devices, or narrative scenes.",
    "Do not render any text, lettering, pseudo-text, or letter-like marks anywhere in the image.",
    "Design elements (gradients, geometric shapes, subtle patterns, light effects) should support the brand palette and feel without competing with content that will be layered on top.",
    "The surface should crop well across different aspect ratios if multiple formats are being produced.",
    "Evaluate this template as a foundation: does it make everything placed on top of it look better and more branded?",
  ].join(" "),
};

// ---------------------------------------------------------------------------
// Deliverable requirements (roadmap item 2)
// ---------------------------------------------------------------------------

const deliverableRequirements = {
  "brand-world-image": [
    { id: "approved-brain", label: "Approved Brand Brain", condition: "always", required: true },
    { id: "creative-direction", label: "Creative direction guidance", condition: "always", required: true, sectionId: "creative" },
    { id: "foundation", label: "Brand foundation guidance", condition: "always", required: true, sectionId: "foundation" },
    { id: "locked-asset", label: "Protected product asset", condition: "when product is visible", required: false },
    { id: "voice-guidance", label: "Voice and messaging guidance", condition: "when text appears", required: false, sectionId: "voice" },
    { id: "identity-guidance", label: "Identity guidance", condition: "always", required: true, sectionId: "identity" },
  ],
  "product-showcase": [
    { id: "approved-brain", label: "Approved Brand Brain", condition: "always", required: true },
    { id: "locked-asset", label: "Protected product asset", condition: "always", required: true },
    { id: "identity-guidance", label: "Identity guidance", condition: "always", required: true, sectionId: "identity" },
    { id: "creative-direction", label: "Creative direction guidance", condition: "always", required: true, sectionId: "creative" },
  ],
};

export function checkRequirements(deliverableId, { approvedBrain, lockedAsset, hasText = false }) {
  const requirements = deliverableRequirements[deliverableId] || deliverableRequirements["brand-world-image"];
  const sectionIds = new Set((approvedBrain?.guidanceSections || []).map((s) => s.id));
  return requirements.map((req) => {
    const active = req.required || (req.condition === "when product is visible" && !!lockedAsset) || (req.condition === "when text appears" && hasText);
    let met = true;
    if (req.id === "approved-brain") met = !!approvedBrain;
    else if (req.id === "locked-asset") met = !!lockedAsset;
    else if (req.sectionId) met = sectionIds.has(req.sectionId);
    return { ...req, active, met: active ? met : true };
  });
}

// ---------------------------------------------------------------------------
// Applicability resolution (roadmap item 3)
// ---------------------------------------------------------------------------

const placementScopes = {
  "Instagram feed": { channel: "social", platform: "instagram" },
  "Instagram story": { channel: "social", platform: "instagram" },
  "LinkedIn feed": { channel: "social", platform: "linkedin" },
  "Website feature": { channel: "web", platform: "website" },
};

function scopeAppliesToPlacement(ruleScope, placement) {
  if (!ruleScope || !ruleScope.length) return true;
  const target = placementScopes[placement];
  if (!target) return true;
  for (const entry of ruleScope) {
    const label = (Array.isArray(entry) ? entry[0] : entry.label || "").toLowerCase();
    const value = (Array.isArray(entry) ? entry[1] : entry.value || "").toLowerCase();
    if (label === "channel" || label === "channels") {
      if (value !== "all channels" && !value.includes(target.channel)) return false;
    }
    if (label === "placements") {
      if (!value.startsWith("all") && !value.includes(target.platform || "")) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Job-specific treatments (roadmap item 1)
// ---------------------------------------------------------------------------

export function resolveTreatments({ approvedBrain, lockedAsset, brief, references = [] }) {
  const treatments = [];
  const placement = brief?.placement || "";
  const dossier = approvedBrain?.artifacts?.dossier || {};
  const rulesSection = (approvedBrain?.guidanceSections || []).find((s) => s.id === "rules");

  // Locked assets
  if (lockedAsset) {
    treatments.push({
      element: lockedAsset.name || "Protected asset",
      category: "Identity",
      treatment: "locked",
      reason: "Exact file placed without change. Logo, label, proportions, and state are preserved.",
    });
  }

  // Approved claims and guardrails
  for (const guardrail of dossier.guardrails || []) {
    treatments.push({
      element: guardrail.title,
      category: "Creative rules",
      treatment: "locked",
      reason: guardrail.body,
    });
  }

  // Scoped prohibitions from review decisions
  const reviewQuestions = approvedBrain?.reviewQuestions || [];
  for (const question of reviewQuestions) {
    if (question.type !== "brand-rule" || !question.scope?.length) continue;
    const scoped = question.scope.map ? question.scope : [];
    const applies = scopeAppliesToPlacement(scoped, placement);
    if (applies) {
      treatments.push({
        element: question.title || question.statement || "Scoped rule",
        category: "Creative rules",
        treatment: "locked",
        reason: `${question.rationale || question.summary}. Applies to this ${placement || "placement"}.`,
      });
    } else {
      treatments.push({
        element: question.title || question.statement || "Scoped rule",
        category: "Creative rules",
        treatment: "not_needed",
        reason: `This rule is scoped to ${scoped.map((e) => `${Array.isArray(e) ? e[0] : e.label}: ${Array.isArray(e) ? e[1] : e.value}`).join(", ")}. It does not apply to ${placement}.`,
      });
    }
  }

  // Guidance sections: suggested or not needed
  const imageOnlySections = new Set(["voice"]);
  for (const section of approvedBrain?.guidanceSections || []) {
    if (imageOnlySections.has(section.id)) {
      treatments.push({
        element: section.name,
        category: "Brand guidance",
        treatment: "not_needed",
        reason: "This image-only deliverable does not include text. Voice guidance is available if text is added.",
      });
    } else {
      treatments.push({
        element: section.name,
        category: "Brand guidance",
        treatment: "suggested",
        reason: `${section.summary}. The system applies this guidance to shape the result.`,
      });
    }
  }

  // Creative references
  for (const ref of references) {
    treatments.push({
      element: ref.source?.name || ref.name || "Creative source",
      category: "Creative input",
      treatment: "suggested",
      reason: `${ref.influence || "Supporting"} influence for ${ref.role || "style"}. Does not override approved guidance.`,
    });
  }

  // Palette and materials
  if (dossier.palette?.length) {
    treatments.push({
      element: `${approvedBrain.brandName} palette`,
      category: "Identity",
      treatment: "suggested",
      reason: `${dossier.palette.map((c) => `${c.name} (${c.role})`).join(", ")}. Used as the color system for the result.`,
    });
  }
  if (dossier.materials?.length) {
    treatments.push({
      element: "Materials and light",
      category: "Creative direction",
      treatment: "suggested",
      reason: `${dossier.materials.join(", ")}. Shapes the physical feel of the scene.`,
    });
  }

  return treatments;
}

const formatSizes = {
  "4:5 portrait": "1024x1280",
  "1:1 square": "1024x1024",
  "9:16 portrait": "1024x1824",
  "1.91:1 landscape": "1536x800",
  "16:9 landscape": "1536x864",
  "4:3 landscape": "1536x1152",
  // Template formats (target-use driven)
  "1080x1080": "1024x1024",
  "1080x1350": "1024x1280",
  "1920x1080": "1536x864",
  "1440x1080": "1536x1152",
  "1700x2200": "1024x1312",
  "1920x800": "1536x640",
  "1200x800": "1536x1024",
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

export function compileBrandWorldImagePackage({ approvedBrain, brainVersion, brief, references = [], lockedAsset = null, campaign = null }) {
  if (!approvedBrain?.brandName || !Array.isArray(approvedBrain.guidanceSections)) {
    const error = new Error("Approve a Brand Brain before generating production work.");
    error.status = 409;
    throw error;
  }

  let scene = requiredText(brief?.scene, "Describe the image", 4000);
  const exclusions = optionalText(brief?.exclusions, "The list of things to avoid", 2000);
  const placement = requiredText(brief?.placement, "Placement", 120);
  const format = requiredText(brief?.format, "Format", 120);
  const assetType = cleanText(brief?.assetType) || "scene";
  const bannerHeadline = optionalText(brief?.bannerHeadline, "The headline", 300);
  const bannerTextSide = cleanText(brief?.bannerTextSide);
  const selected = new Map(approvedBrain.guidanceSections.map((section) => [section.id, section]));
  const isTemplate = placement === "Brand template";
  const activeGuidanceOrder = isTemplate ? templateGuidanceOrder : guidanceOrder;
  const guidance = activeGuidanceOrder.map((id) => selected.get(id)).filter(Boolean);
  const dossier = approvedBrain.artifacts?.dossier || {};

  // Aesthetic mode from creative direction evidence
  const creativeSection = selected.get("creative");
  const creativeText = creativeSection ? sectionDirection(creativeSection) : "";
  const mode = selectAestheticMode(creativeText);
  const hasProduct = !!lockedAsset;
  const modeOpeningLine = openingLine(mode, hasProduct);

  // Package format inference and state-lock neutralization
  const packageFormat = lockedAsset ? inferPackageFormat(lockedAsset) : null;
  let stateNeutralizations = [];
  if (lockedAsset) {
    const result = neutralizeStateLanguage(scene);
    scene = result.text;
    stateNeutralizations = result.changed;
  }

  // Protection block
  const protection = protectionBlock({
    lockedAsset,
    format: packageFormat,
    peopleExcluded: false,
  });

  const sourceCount = approvedBrain.sourceCount || null;

  const roleInstructions = {
    "continue-direction": "Continue the visual direction of this prior output. Match the overall feeling, light quality, and palette choices while creating a distinct new image.",
    "match-composition": "Match the composition and layout approach of this prior output. The new image should feel structurally similar but with different content.",
    "create-variation": "Create a variation of this prior output. Same essential concept, different execution. The two should feel like siblings.",
    "use-treatment": "Use the same product treatment as this prior output. Match how the product was lit, angled, and placed in the scene.",
    "reference-only": "Use this as a loose reference for mood and atmosphere. The new image does not need to match it directly.",
  };

  // Campaign direction section (compiled when campaign context is provided)
  const campaignSection = campaign?.campaignIdea ? {
    title: "Campaign direction",
    body: [
      `This image is part of the "${cleanText(campaign.name || campaign.campaignIdea)}" campaign.`,
      campaign.campaignIdea ? `Campaign idea: ${cleanText(campaign.campaignIdea)}.` : "",
      campaign.messageTerritory ? `Message territory: ${cleanText(campaign.messageTerritory)}.` : "",
      campaign.objective ? `Objective: ${cleanText(campaign.objective)}.` : "",
      campaign.audience ? `Audience: ${cleanText(campaign.audience)}.` : "",
      campaign.desiredBelief ? `The image should move the viewer toward believing: ${cleanText(campaign.desiredBelief)}.` : "",
      campaign.explore ? `Explore for this campaign: ${cleanText(campaign.explore)}.` : "",
      campaign.preserve ? `Preserve from the brand: ${cleanText(campaign.preserve)}.` : "",
      campaign.paletteShift ? `Palette shift: ${cleanText(campaign.paletteShift)}.` : "",
    ].filter(Boolean).join(" "),
  } : null;

  // Campaign continuity section (compiled when prior outputs are referenced)
  const priorOutputs = campaign?.priorOutputs?.length ? {
    title: "Campaign continuity",
    body: [
      `This campaign has ${campaign.priorOutputs.length} existing ${campaign.priorOutputs.length === 1 ? "output" : "outputs"}. The new image should feel like it belongs in the same campaign without repeating what already exists.`,
      ...campaign.priorOutputs.map((prior) =>
        `Prior output "${cleanText(prior.label)}" (${cleanText(prior.channel)} ${cleanText(prior.format)}): ${cleanText(prior.scene)}. ${roleInstructions[prior.role] || roleInstructions["reference-only"]}`
      ),
    ].join(" "),
  } : null;

  const textSideCopy = {
    "Left third": "Keep the left third of the frame visually quiet. Place the subject and any focal detail in the centre or right so overlaid text stays readable.",
    "Right third": "Keep the right third of the frame visually quiet. Place the subject and any focal detail in the centre or left so overlaid text stays readable.",
    "Lower third": "Keep the lower third of the frame visually quiet. Place the subject in the upper two thirds so overlaid text stays readable.",
    "No text area": "No text will be overlaid. Compose the full frame freely.",
  };

  const compositionSection = assetType === "banner" ? {
    title: "Banner composition",
    body: [
      `This image is a banner. It will be viewed wide and may be cropped tighter on smaller screens, so keep the subject away from the outer edges.`,
      textSideCopy[bannerTextSide] || textSideCopy["No text area"],
      bannerHeadline ? `A headline reading "${bannerHeadline}" will be placed over this image by the layout, so do not render any text into the image itself.` : "",
      `The image should read clearly at a glance rather than rewarding close inspection.`,
    ].filter(Boolean).join(" "),
  } : assetType === "product" ? {
    title: "Product placement",
    body: `The supplied product image is the subject of this frame. Build the surrounding scene so the product sits naturally within it at a believable scale, lit by the same light as the rest of the environment. Do not crop, rotate, restyle, or reinterpret the product itself.`,
  } : null;

  const sections = [
    {
      title: "Assignment",
      body: isTemplate
        ? `Create one ${format} reusable brand template surface for ${cleanText(approvedBrain.brandName)}. ${scene}`
        : `${modeOpeningLine} Create one ${format} brand world image for ${placement}. ${scene}`,
    },
    {
      title: "Brand foundation",
      body: `${cleanText(approvedBrain.brandName)} is ${cleanText(approvedBrain.brandDescription, "the approved brand")}. ${cleanText(dossier.readBody, approvedBrain.synthesisSummary)}`,
    },
    ...guidance.map((section) => ({ title: section.name, body: sectionDirection(section) })),
    isTemplate ? templateProductionInstructions : null,
    campaignSection,
    priorOutputs,
    compositionSection,
    isTemplate ? null : {
      title: "Audience and feeling",
      body: `${cleanText(dossier.audience)} ${cleanText(dossier.desiredFeeling)}`,
    },
    {
      title: "Visual materials",
      body: [
        dossier.palette?.length ? `Palette: ${dossier.palette.map((color) => `${color.name} (${color.role}, ${color.color})`).join(", ")}.` : "",
        isTemplate ? "" : (dossier.materials?.length ? `Materials and light: ${dossier.materials.join(", ")}.` : ""),
      ].filter(Boolean).join(" "),
    },
    {
      title: "Creative references",
      body: references.length
        ? `${references.map(referenceDirection).join(" ")} These sources guide only the named qualities and do not replace the approved Brand Brain.`
        : "No creative source image is attached. Resolve open visual choices from the approved Brand Brain.",
    },
    {
      title: "Protection",
      body: [
        protection,
        isTemplate ? "Do not include any people, faces, hands, devices, screens, product packaging, or identifiable objects. The surface must work as a background layer." : "",
        dossier.guardrails?.length ? dossier.guardrails.map((rule) => `${rule.title}: ${rule.body}`).join(" ") : "",
        exclusions ? `Also avoid: ${exclusions}` : "",
      ].filter(Boolean).join(" "),
    },
    {
      title: "Output",
      body: isTemplate
        ? `Return one finished background surface only. Compose for ${format}. The result must work as a foundation for placing product images, text, and brand elements on top. It should feel distinctly ${cleanText(approvedBrain.brandName)} rather than generic.`
        : `Return one finished image only. Compose for ${format} in ${placement}. Keep the result visually specific, believable, and native to ${cleanText(approvedBrain.brandName)} rather than a generic category image.`,
    },
  ].filter((section) => section && section.body);

  const prompt = sections.map((section) => `${section.title.toUpperCase()}\n${section.body}`).join("\n\n");

  // Constraint audit
  const constraintAudit = auditConstraints({
    guardrails: dossier.guardrails || [],
    exclusions,
    prompt,
  });

  // Job-specific treatments (roadmap items 1-3)
  const treatments = resolveTreatments({ approvedBrain, lockedAsset, brief: { scene, exclusions, placement, format }, references });
  const requirementCheck = checkRequirements("brand-world-image", { approvedBrain, lockedAsset, hasText: false });
  const unmetRequirements = requirementCheck.filter((r) => r.active && !r.met);
  const ready = unmetRequirements.length === 0;

  return {
    version: "brand-world-image-v2",
    deliverable: "brand-world-image",
    brandName: approvedBrain.brandName,
    brandDescription: approvedBrain.brandDescription,
    brainVersion: Number(brainVersion || 1),
    sourceCount,
    output: { placement, format, size: imageSizeForFormat(format), quantity: 1 },
    brief: { scene, exclusions },
    aestheticMode: { id: mode.id, name: mode.name },
    lockedAsset: lockedAsset ? { name: lockedAsset.name, format: packageFormat } : null,
    stateNeutralizations,
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
    constraintAudit,
    treatments,
    requirementCheck,
    ready,
    policy: {
      groundedIn: sourceCount
        ? `Approved Brand Brain v${Number(brainVersion || 1)}, built from ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`
        : `Approved Brand Brain v${Number(brainVersion || 1)}`,
      flexible: ["scene", "composition", "casting", "lighting", "materials"],
      excluded: ["unapproved readable text", ...(lockedAsset ? [] : ["invented logos or packaging"]), ...(exclusions ? [exclusions] : [])],
    },
  };
}

// ---------------------------------------------------------------------------
// Consumption record and change-impact classification (roadmap item 11)
// ---------------------------------------------------------------------------

export function buildConsumptionRecord(job) {
  if (!job?.generationPackage) return null;
  const pkg = job.generationPackage;
  return {
    jobId: job.jobId,
    completedAt: new Date().toISOString(),
    brandName: pkg.brandName,
    brainVersion: pkg.brainVersion,
    sourceCount: pkg.sourceCount || 0,
    guidanceSections: (pkg.compiledComponents || []).map((c) => c),
    aestheticMode: pkg.aestheticMode?.id || null,
    output: { placement: pkg.output?.placement, format: pkg.output?.format },
    lockedAsset: pkg.lockedAsset ? { name: pkg.lockedAsset.name, format: pkg.lockedAsset.format } : null,
    references: (pkg.references || []).map((r) => ({ name: r.name, role: r.role, influence: r.influence })),
    palette: pkg.treatments?.filter((t) => t.element?.includes("palette")).map((t) => t.element) || [],
    appliedRules: pkg.treatments?.filter((t) => t.treatment === "locked" && t.category === "Creative rules").map((t) => t.element) || [],
  };
}

export function classifyChangeImpact(record, currentBrainVersion, changedElements = []) {
  if (!record) return null;
  if (record.brainVersion === currentBrainVersion) {
    return { level: "current", label: "Current", description: `Uses active Brand Brain v${currentBrainVersion}.` };
  }
  // Brain version changed: classify the impact
  if (!changedElements.length) {
    return { level: "review", label: "Review recommended", description: `Made with Brand Brain v${record.brainVersion}. The brain has been updated to v${currentBrainVersion}.` };
  }
  // Check whether the changed elements overlap with what this output consumed
  const consumed = new Set([
    ...(record.guidanceSections || []),
    ...(record.palette || []),
    ...(record.appliedRules || []),
    record.lockedAsset?.name,
  ].filter(Boolean).map((s) => s.toLowerCase()));
  const overlapping = changedElements.filter((el) => {
    const lower = el.toLowerCase();
    for (const c of consumed) {
      if (c.includes(lower) || lower.includes(c)) return true;
    }
    return false;
  });
  if (!overlapping.length) {
    return { level: "unaffected", label: "No impact", description: `Made with Brand Brain v${record.brainVersion}. The v${currentBrainVersion} changes do not affect the elements this output used.` };
  }
  // Determine severity
  const lockedAffected = record.lockedAsset && overlapping.some((el) => el.toLowerCase().includes("asset") || el.toLowerCase().includes("logo") || el.toLowerCase().includes("packag"));
  if (lockedAffected) {
    return { level: "reproduction", label: "Reproduction required", description: `The protected asset has changed since v${record.brainVersion}. This output should be re-produced.`, affected: overlapping };
  }
  const paletteOrIdentity = overlapping.some((el) => el.toLowerCase().includes("palette") || el.toLowerCase().includes("identity") || el.toLowerCase().includes("color"));
  if (paletteOrIdentity) {
    return { level: "update", label: "Update available", description: `${overlapping.join(", ")} changed. A deterministic fix may bring this output current.`, affected: overlapping };
  }
  return { level: "review", label: "Review recommended", description: `${overlapping.join(", ")} changed between v${record.brainVersion} and v${currentBrainVersion}. The visual difference may or may not matter.`, affected: overlapping };
}
