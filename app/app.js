const creativeModes = [
  {
    id: "explore",
    name: "Explore the brand",
    description: "Generate world images to expand the visual language.",
    detail: "No campaign context. The Brand Brain shapes every choice.",
  },
  {
    id: "campaign",
    name: "Create for a campaign",
    description: "Produce assets inside a strategic campaign.",
    detail: "Brand Brain + Campaign Brain shape every choice.",
  },
  {
    id: "standalone",
    name: "Create something specific",
    description: "Generate a standalone asset for a specific need.",
    detail: "Brand Brain + request-specific direction.",
  },
];

const assetConfig = {
  dimensions: ["4:5 portrait", "1:1 square", "9:16 portrait", "16:9 landscape", "1.91:1 landscape", "4:3 landscape"],
  composition: ["Environment only", "Product included", "Human included", "Multiple products"],
  textMode: ["No text", "User supplied text", "Generated copy"],
  channels: ["Instagram", "LinkedIn", "Website", "Email", "Presentation"],
};

const deliverables = [
  {
    id: "brand-world-image",
    name: "Brand world image",
    description: "Create a brand-grounded image from an approved Brand Brain.",
    contract: "One finished image. The approved brand guidance shapes every open choice.",
    available: true,
    requirements: [
      { id: "approved-brain", label: "Approved Brand Brain", condition: "always" },
      { id: "creative-direction", label: "Creative direction guidance", condition: "always" },
      { id: "foundation", label: "Brand foundation guidance", condition: "always" },
      { id: "locked-asset", label: "Protected product asset", condition: "when product is visible" },
      { id: "voice-guidance", label: "Voice and messaging", condition: "when text appears" },
    ],
  },
  {
    id: "linkedin-post",
    name: "LinkedIn post",
    description: "Write a brand-grounded post with an optional supporting image.",
    contract: "Post copy shaped by approved voice and claims. Optional image shaped by creative direction.",
    available: true,
    requirements: [
      { id: "approved-brain", label: "Approved Brand Brain", condition: "always" },
      { id: "foundation", label: "Brand foundation guidance", condition: "always" },
      { id: "voice-guidance", label: "Voice and messaging", condition: "always" },
      { id: "creative-direction", label: "Creative direction guidance", condition: "when image is included" },
    ],
  },
];

const placementFormats = {
  "Instagram feed": ["4:5 portrait", "1:1 square"],
  "Instagram story": ["9:16 portrait"],
  "LinkedIn feed": ["1:1 square", "1.91:1 landscape"],
  "Website feature": ["16:9 landscape", "4:3 landscape"],
};

const studioCategories = [
  { id: "social", name: "Social image", description: "Feed posts, stories, and carousels for any platform.", icon: "image" },
  { id: "ad", name: "Ad image", description: "Paid social and display ads with copy governance.", icon: "ad" },
  { id: "website", name: "Website image", description: "Heroes, features, cards, and share images.", icon: "web" },
  { id: "showcase", name: "Product showcase", description: "Product photography, device mockups, and lifestyle scenes.", icon: "product" },
  { id: "sales", name: "Sales enablement", description: "Elements and backgrounds for slides, one-pagers, and pitch materials.", icon: "sales" },
  { id: "template", name: "Brand template", description: "Reusable surfaces, environments, and composition foundations.", icon: "template" },
];

const studioPlatformFormats = {
  instagram: {
    label: "Instagram",
    formats: [
      { id: "ig-portrait", name: "Feed portrait", ratio: "4:5", dim: "1080 x 1350", default: true },
      { id: "ig-square", name: "Feed square", ratio: "1:1", dim: "1080 x 1080", default: false },
      { id: "ig-story", name: "Story", ratio: "9:16", dim: "1080 x 1920", default: false },
      { id: "ig-carousel", name: "Carousel card", ratio: "4:5", dim: "1080 x 1350", default: false },
    ],
  },
  linkedin: {
    label: "LinkedIn",
    formats: [
      { id: "li-square", name: "Feed square", ratio: "1:1", dim: "1200 x 1200", default: true },
      { id: "li-landscape", name: "Feed landscape", ratio: "1.91:1", dim: "1200 x 627", default: false },
      { id: "li-portrait", name: "Feed portrait", ratio: "4:5", dim: "1080 x 1350", default: false },
    ],
  },
  facebook: {
    label: "Facebook",
    formats: [
      { id: "fb-feed", name: "Feed", ratio: "1.91:1", dim: "1200 x 630", default: true },
      { id: "fb-portrait", name: "Feed portrait", ratio: "4:5", dim: "1080 x 1350", default: false },
      { id: "fb-square", name: "Feed square", ratio: "1:1", dim: "1080 x 1080", default: false },
      { id: "fb-story", name: "Story", ratio: "9:16", dim: "1080 x 1920", default: false },
    ],
  },
  x: {
    label: "X",
    formats: [
      { id: "x-landscape", name: "Feed", ratio: "16:9", dim: "1600 x 900", default: true },
      { id: "x-square", name: "Feed square", ratio: "1:1", dim: "1080 x 1080", default: false },
    ],
  },
  threads: {
    label: "Threads",
    formats: [
      { id: "th-portrait", name: "Feed", ratio: "4:5", dim: "1080 x 1350", default: true },
    ],
  },
  pinterest: {
    label: "Pinterest",
    formats: [
      { id: "pin-standard", name: "Standard pin", ratio: "2:3", dim: "1000 x 1500", default: true },
      { id: "pin-long", name: "Long pin", ratio: "1:2.1", dim: "1000 x 2100", default: false },
    ],
  },
  tiktok: {
    label: "TikTok",
    formats: [
      { id: "tt-cover", name: "Cover", ratio: "9:16", dim: "1080 x 1920", default: true },
    ],
  },
};

const studioTemplateFormats = {
  social: {
    label: "Social posts",
    formats: [
      { id: "tpl-social-square", name: "Square", ratio: "1:1", dim: "1080 x 1080", default: true },
      { id: "tpl-social-portrait", name: "Portrait", ratio: "4:5", dim: "1080 x 1350", default: true },
    ],
  },
  sales: {
    label: "Sales and presentations",
    formats: [
      { id: "tpl-sales-16x9", name: "Slide (widescreen)", ratio: "16:9", dim: "1920 x 1080", default: true },
      { id: "tpl-sales-4x3", name: "Slide (standard)", ratio: "4:3", dim: "1440 x 1080", default: false },
      { id: "tpl-sales-letter", name: "One-pager (8.5 x 11)", ratio: "17:22", dim: "1700 x 2200", default: false },
    ],
  },
  website: {
    label: "Website",
    formats: [
      { id: "tpl-web-hero", name: "Hero", ratio: "16:9", dim: "1920 x 1080", default: true },
      { id: "tpl-web-hero-short", name: "Short hero", ratio: "2.4:1", dim: "1920 x 800", default: false },
      { id: "tpl-web-feature", name: "Feature", ratio: "3:2", dim: "1200 x 800", default: false },
    ],
  },
};

const salesOutputFormats = {
  "slide-16x9": { label: "Slide (16:9 widescreen)", ratio: "16:9", dim: "1920 x 1080", size: "1536x864" },
  "slide-4x3": { label: "Slide (4:3 standard)", ratio: "4:3", dim: "1440 x 1080", size: "1536x1152" },
  "one-pager": { label: "One-pager (8.5 x 11)", ratio: "17:22", dim: "1700 x 2200", size: "1024x1312" },
};

function studioCategoryLabel(id) {
  return studioCategories.find((c) => c.id === id)?.name || "Setup";
}

let brainBatch = {
  id: "slake-foundational-library-001",
  name: "SLAKE foundational library",
  assetCount: 50,
  cleanCount: 47,
  sources: ["Approved brand assets", "Website export", "Strategy deck", "Campaign archive", "Stakeholder notes"],
  rights: "Ownership checked · Cleared for internal use",
};

const sampleSourceGroups = [
  {
    id: "approved-brand-assets",
    name: "Approved brand assets",
    type: "Logos, packaging, and claim artwork",
    detail: "Primary logo files, Yuzu Ginger packaging, typefaces, and approved claim lockups",
    count: 6,
    status: "Ready",
    authority: "exact-asset",
    role: "Identity",
    influence: "Not weighted",
    usage: "Use these files exactly as supplied whenever the matching asset is needed.",
    exclusions: "Do not redraw, restyle, crop, or replace the artwork.",
  },
  {
    id: "website-export",
    name: "SLAKE website",
    type: "Web pages",
    detail: "Home, About, products, ingredients, and Yuzu Ginger",
    count: 5,
    status: "Ready",
    authority: "brand-evidence",
    role: "Multiple areas",
    influence: "Supporting",
    usage: "Use current product language and the everyday-reset story as evidence of how the brand presents itself publicly.",
    exclusions: "Do not treat page layout or temporary promotional copy as a permanent rule.",
  },
  {
    id: "strategy-decks",
    name: "Brand strategy decks",
    type: "Documents",
    detail: "Positioning, audience, world principles, claims, and channel plan",
    count: 7,
    status: "Ready",
    authority: "approved-guidance",
    role: "Multiple areas",
    influence: "Not weighted",
    usage: "Treat signed-off positioning, audience, and claims guidance as current unless a newer approved source replaces it.",
    exclusions: "Ignore workshop alternatives and pages clearly marked as exploratory.",
  },
  {
    id: "campaign-archive",
    name: "Campaign archive",
    type: "Images and copy",
    detail: "Approved campaigns, pack renders, photography, materials, and copy",
    count: 22,
    status: "Ready",
    authority: "brand-evidence",
    role: "Creative direction",
    influence: "Strong",
    usage: "Look for durable patterns in lighting, composition, casting, materials, and pacing across approved work.",
    exclusions: "Do not assume a single campaign device should become a permanent brand rule.",
  },
  {
    id: "stakeholder-notes",
    name: "Stakeholder notes",
    type: "Notes and references",
    detail: "Product handoff, approvals, interviews, cultural references, and working notes",
    count: 10,
    status: "Ready",
    authority: "brand-evidence",
    role: "Multiple areas",
    influence: "Supporting",
    usage: "Use repeated observations to explain intent, and keep unconfirmed ideas visibly provisional.",
    exclusions: "Do not treat an individual opinion or brainstorm as approved guidance.",
  },
];

const MAX_SOURCE_FILE_BYTES = 20 * 1024 * 1024;
const MAX_SYNTHESIS_FILE_BYTES = 40 * 1024 * 1024;
const supportedRasterExtensions = ["png", "jpg", "jpeg", "webp"];
const readableDocumentExtensions = ["pdf", "docx", "pptx", "txt", "md", "rtf", "csv", "html", "htm", "json", "xml"];

function acceptedExtensions(extensions) {
  return extensions.map((extension) => `.${extension}`).join(",");
}

const sourceMaterialTypes = [
  {
    id: "protected-asset",
    label: "Protected brand asset",
    shortLabel: "Protected asset",
    description: "A logo, package, typeface, claim lockup, or other approved file that must stay exact.",
    examples: "PNG, JPG, SVG, PDF, AI, EPS, OTF, TTF, WOFF",
    authority: "exact-asset",
    handling: "Keep exact",
    forms: ["files"],
    accept: ".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.ai,.eps,.otf,.ttf,.woff,.woff2",
    extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg", "pdf", "ai", "eps", "otf", "ttf", "woff", "woff2"],
  },
  {
    id: "approved-guidance",
    label: "Approved brand guidance",
    shortLabel: "Approved guidance",
    description: "A signed-off brand book, guideline, strategy, messaging decision, or other direction that should govern its area.",
    examples: "PDF, DOCX, PPTX, text files, PNG, JPG, WEBP, and more",
    formatAdvice: "For a multi-page brand book, PDF works best. PNG, JPG, and WebP work for a single page or image-only guide. Convert older DOC or PPT files, SVG, HEIC, TIFF, Keynote, and native design files first.",
    authority: "approved-guidance",
    handling: "Follow when relevant",
    forms: ["files", "url", "text"],
    accept: acceptedExtensions([...readableDocumentExtensions, ...supportedRasterExtensions]),
    extensions: [...readableDocumentExtensions, ...supportedRasterExtensions],
  },
  {
    id: "past-work-research",
    label: "Past brand work or research",
    shortLabel: "Past work or research",
    description: "A campaign, case study, audit, interview, or research source that shows how the brand has behaved without becoming a rule by itself.",
    examples: "Documents or supported images",
    authority: "brand-evidence",
    handling: "Interpret with context",
    forms: ["files", "url", "text"],
    accept: ".pdf,.docx,.pptx,.txt,.md,.rtf,.csv,.png,.jpg,.jpeg,.webp,.gif",
    extensions: ["pdf", "docx", "pptx", "txt", "md", "rtf", "csv", "png", "jpg", "jpeg", "webp", "gif"],
  },
  {
    id: "single-image",
    label: "Single creative image",
    shortLabel: "Single image",
    description: "One reference photo, mockup, key visual, or approved piece of brand work used for visual learning.",
    examples: "PNG, JPG, WEBP, GIF",
    authority: "creative-reference",
    handling: "Use for inspiration",
    forms: ["files"],
    accept: ".png,.jpg,.jpeg,.webp,.gif",
    extensions: ["png", "jpg", "jpeg", "webp", "gif"],
  },
  {
    id: "brand-template",
    label: "Background template",
    shortLabel: "Template",
    description: "A branded background surface for slides, one-pagers, or other collateral. Used as a locked background layer in the Sales enablement workflow.",
    examples: "PNG, JPG, WEBP",
    authority: "exact-asset",
    handling: "Keep exact",
    forms: ["files"],
    accept: ".png,.jpg,.jpeg,.webp",
    extensions: ["png", "jpg", "jpeg", "webp"],
    isTemplate: true,
  },
  {
    id: "image-grid",
    label: "Image grid or moodboard",
    shortLabel: "Image grid",
    description: "One combined grid or moodboard file. Individual images should be added as separate sources when they need separate instructions.",
    examples: "One PNG, JPG, WEBP, or GIF",
    authority: "creative-reference",
    handling: "Use for inspiration",
    forms: ["files"],
    accept: ".png,.jpg,.jpeg,.webp,.gif",
    extensions: ["png", "jpg", "jpeg", "webp", "gif"],
  },
  {
    id: "cultural-reference",
    label: "Named cultural reference",
    shortLabel: "Cultural reference",
    description: "An outside case study, article, place, movement, or creative reference that provides context rather than brand truth.",
    examples: "Documents, pages, notes, or supported images",
    authority: "creative-reference",
    handling: "Use for inspiration",
    forms: ["files", "url", "text"],
    accept: ".pdf,.docx,.pptx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp,.gif",
    extensions: ["pdf", "docx", "pptx", "txt", "md", "rtf", "png", "jpg", "jpeg", "webp", "gif"],
  },
  {
    id: "product-brief",
    label: "Product brief or spec",
    shortLabel: "Product brief",
    description: "A product deck, spec sheet, feature page, or data sheet. Excluded from Brand Brain synthesis and routed to per-product synthesis instead.",
    examples: "PDF, DOCX, PPTX, TXT, MD, RTF",
    authority: "brand-evidence",
    handling: "Per-product synthesis",
    forms: ["files", "url", "text"],
    accept: ".pdf,.docx,.pptx,.txt,.md,.rtf,.csv,.png,.jpg,.jpeg,.webp,.gif",
    extensions: ["pdf", "docx", "pptx", "txt", "md", "rtf", "csv", "png", "jpg", "jpeg", "webp", "gif"],
    isProductBrief: true,
  },
  {
    id: "business-document",
    label: "Other business document",
    shortLabel: "Business context",
    description: "A company deck, memo, brief, transcript, or operating context that may inform the brand but is not approved brand guidance.",
    examples: "PDF, DOCX, PPTX, TXT, MD, RTF, CSV",
    authority: "brand-evidence",
    handling: "Use as background",
    forms: ["files", "url", "text"],
    accept: ".pdf,.docx,.pptx,.txt,.md,.rtf,.csv",
    extensions: ["pdf", "docx", "pptx", "txt", "md", "rtf", "csv"],
  },
];

const sourceRoleOptions = ["Multiple areas", "Brand foundation", "Identity", "World and story", "Voice and messaging", "Creative direction", "Creative rules"];
const sourceInfluenceOptions = ["Lead", "Strong", "Supporting", "Light"];

const synthesisSteps = [
  {
    title: "Reading your sources",
    detail: "Capturing files, pages, notes, source details, and reusable assets.",
  },
  {
    title: "Connecting the brand story",
    detail: "Grouping related ideas across strategy, identity, audience, world, and creative work.",
  },
  {
    title: "Checking for questions",
    detail: "Finding conflicts, likely duplicates, repeated patterns, and suggested brand rules.",
  },
  {
    title: "Preparing your Brand Brain draft",
    detail: "Organizing the guidance and assets that can inform future production work.",
  },
];

let guidanceSections = [
  {
    id: "foundation",
    name: "Brand foundation",
    summary: "A restorative everyday drink that creates a quiet pause without making a health promise.",
    prose: [
      "SLAKE makes room for a small, restorative pause in an otherwise busy day. Its role is not to optimize the person drinking it. It offers an easy ritual that makes an ordinary moment feel considered, calm, and worth noticing.",
      "The strongest audience signal is someone who wants relief from the pressure to perform wellness. They care about taste, atmosphere, and credible ingredients, but they do not want another product telling them to become a better version of themselves.",
      "Product truth should stay specific. SLAKE is sparkling water with a distinctive flavor and an intentional point of view. The brand can speak about the experience it creates, but it should not imply treatment, recovery, or a guaranteed physical outcome.",
    ],
    principles: ["Create relief, not another task", "Make ordinary rituals feel intentional", "Use specific product truth instead of wellness promises"],
    evidence: [
      { source: "Brand strategy decks", ref: "Positioning, pages 6 to 9", insight: "Defines the brand as an alternative to optimization culture.", use: "Sets the central tension and positioning." },
      { source: "SLAKE website", ref: "About and Yuzu Ginger pages", insight: "Repeatedly frames the product around an unhurried everyday reset.", use: "Confirms the public-facing promise and product truth." },
      { source: "Stakeholder notes", ref: "Founder interview 02", insight: "Describes the desired feeling as permission to pause without earning it.", use: "Adds emotional intent while remaining supporting evidence." },
    ],
    artifacts: [
      { name: "Brand foundation dossier", type: "Core reference", description: "Purpose, positioning, audience tensions, product truths, and proof points in one working document.", readerId: "dossier" },
      { name: "Primary audience profile", type: "Persona", description: "A grounded portrait of the person SLAKE is for, including motivations, pressures, habits, and language to avoid.", readerId: "lived" },
      { name: "Positioning and proof summary", type: "Production reference", description: "A short reference for checking whether a concept supports the brand promise without overclaiming." },
    ],
    productionUse: "Use this section to set the purpose, audience, and promise behind a brief before choosing visual or verbal expression.",
    sourceCount: 12,
  },
  {
    id: "identity",
    name: "Identity",
    summary: "The recognizable assets and expressions that must stay consistent wherever SLAKE appears.",
    prose: [
      "SLAKE's identity is anchored by the supplied wordmark, packaging, typefaces, and approved claim artwork. These are approved originals, not visual suggestions. When the exact asset is needed, production should place the supplied file rather than asking a render engine to recreate it.",
      "The wider identity feels restrained and tactile. Warm neutrals create the base, while small moments of brighter product color carry recognition. Typography should feel editorial and clear, with enough breathing room to preserve the unhurried character of the brand.",
      "New expressions can extend the system, but they should remain visibly related to the approved core. Novelty should come from context, composition, material, or story rather than altering the logo, package, or claim language.",
    ],
    principles: ["Use approved originals exactly", "Let product color carry recognition", "Create novelty around the identity, not by changing it"],
    evidence: [
      { source: "Approved brand assets", ref: "Asset register, 6 files", insight: "Contains the logo, package, type, and claim artwork that must remain exact.", use: "Creates the locked asset set for production." },
      { source: "Campaign archive", ref: "Approved campaigns 01 to 07", insight: "Shows a consistent warm-neutral base with restrained color and generous spacing.", use: "Supports the flexible expression around exact assets." },
    ],
    artifacts: [
      { name: "Identity system dossier", type: "Core reference", description: "A richer explanation of how the approved identity behaves across contexts." },
      { name: "Approved asset register", type: "Exact asset set", description: "The original approved files, ownership notes, current status, and handling instructions for each asset." },
      { name: "Claims and terminology library", type: "Language asset", description: "Approved claims, product names, spellings, and the contexts in which each may be used." },
    ],
    productionUse: "Use this section to determine what must be placed exactly and what can flex around those assets.",
    sourceCount: 16,
  },
  {
    id: "world",
    name: "World and story",
    summary: "Warm, domestic, unhurried moments built around the late-afternoon reset.",
    prose: [
      "The SLAKE world lives in the transition between effort and ease. The clearest recurring story is the late-afternoon reset: a person pauses mid-task, opens a drink, and returns to the day with a little more room around them. It is a lived moment, not a branded ceremony.",
      "Environments should feel inhabited rather than staged. Soft window light, honest materials, unfinished tasks, and small signs of daily life make the world credible. The person belongs there; they are never posed as evidence of an ideal lifestyle.",
      "Cultural references are useful when they help explain pace, intimacy, or material feeling. They should remain references, not shortcuts to a borrowed subculture. SLAKE should feel culturally aware while still building a world of its own.",
    ],
    principles: ["Show the transition from effort to ease", "Build inhabited scenes, not lifestyle theater", "Use culture as context, not borrowed identity"],
    evidence: [
      { source: "Campaign archive", ref: "Photography sets 03, 05, and 08", insight: "Repeats warm domestic scenes, mid-task gestures, and soft natural light.", use: "Establishes the visual grammar of the lived world." },
      { source: "Stakeholder notes", ref: "Ritual workshop", insight: "Names the late-afternoon pause as the 4pm Reset, with medium confidence.", use: "Supports a world ritual while preserving its inferred status." },
      { source: "Creative references", ref: "Material and rhythm board", insight: "Provides cues for intimacy and pace without depicting the brand itself.", use: "Calibrates feeling only." },
    ],
    artifacts: [
      { name: "Brand world dossier", type: "Core reference", description: "The settings, rituals, materials, tensions, and narrative patterns that make SLAKE's world recognizable.", readerId: "dossier" },
      { name: "Lived experience map", type: "Experience", description: "A set of believable moments before, during, and after the reset, including emotional and environmental cues.", readerId: "lived" },
      { name: "Story architecture", type: "Narrative system", description: "Four connected moments that turn the brand world into an intentional production story.", readerId: "story" },
    ],
    productionUse: "Use this section to shape scenes, stories, environments, moments, and experiences that feel native to SLAKE.",
    sourceCount: 18,
  },
  {
    id: "voice",
    name: "Voice and messaging",
    summary: "Quietly confident, useful, and human. Never clinical, optimized, or overpromising.",
    prose: [
      "SLAKE speaks like a thoughtful person who has nothing to prove. The voice is concise, observant, and specific. It can be warm or lightly witty, but it should not perform intimacy or turn every line into a lifestyle declaration.",
      "Messaging works best when it names an ordinary pressure and offers a gentler alternative. The product can create a pause, mark a transition, or bring flavor to a moment. It should never claim to cure stress, improve performance, or produce a medical result.",
      "Approved claims and product names should be used exactly. New copy may vary by channel, but it should preserve the same human scale and avoid clinical language, productivity language, and generic wellness uplift.",
    ],
    principles: ["Sound confident without performing authority", "Name real moments in plain language", "Keep experience claims separate from health claims"],
    evidence: [
      { source: "SLAKE website", ref: "Current product and About copy", insight: "Shows the clearest current public voice and approved product naming.", use: "Provides the baseline voice and terminology." },
      { source: "Campaign archive", ref: "Approved copy sets 01 to 05", insight: "Demonstrates short, human-scale messages across channels.", use: "Shows how the voice flexes in production." },
      { source: "Brand strategy decks", ref: "Claims guidance", insight: "Separates product facts from unsupported wellness outcomes.", use: "Sets messaging boundaries." },
    ],
    artifacts: [
      { name: "Voice and language dossier", type: "Core reference", description: "Voice principles, sentence patterns, examples, message themes, and language to avoid." },
      { name: "Message framework", type: "Production reference", description: "A hierarchy of brand, product, occasion, and channel messages with supporting proof." },
      { name: "Claims boundary guide", type: "Rule set", description: "Approved claims, risky phrases, and plain-language explanations of where each boundary applies." },
    ],
    productionUse: "Use this section to write briefs, prompts, headlines, captions, scripts, and product copy in a consistent voice.",
    sourceCount: 9,
  },
  {
    id: "creative",
    name: "Creative direction",
    summary: "Warm editorial naturalism with honest materials, human-scale composition, and soft window light.",
    prose: [
      "Creative work should feel observed rather than arranged. The camera notices a person inside a real moment, often just before or after they reach for the product. Compositions can be editorial, but they should retain the slight asymmetry and incidental detail of everyday life.",
      "Light is soft, directional, and believable. Materials should show texture and use: linen can crease, wood can carry marks, and condensation can feel imperfect. Highly polished wellness imagery, sterile surfaces, and glowing-product spectacle pull the work outside the brand world.",
      "Casting should express a range of real relationships to rest, work, and daily ritual. Personas are creative tools for building believable situations, not demographic stereotypes or fixed customer segments.",
    ],
    principles: ["Observe rather than stage", "Let materials show use and texture", "Cast for believable lives, not idealized wellness"],
    evidence: [
      { source: "Campaign archive", ref: "Approved image sets 01 to 09", insight: "Consistently favors soft daylight, human-scale framing, and tactile domestic material.", use: "Sets the strongest visual precedent." },
      { source: "Creative references", ref: "Editorial naturalism board", insight: "Adds pacing and composition references outside the brand archive.", use: "Inspires direction without becoming brand truth." },
    ],
    artifacts: [
      { name: "Creative direction dossier", type: "Core reference", description: "Photography, lighting, composition, casting, materials, motion, and channel expression in one detailed guide." },
      { name: "Experience and persona set", type: "Creative tool", description: "Believable people, pressures, rituals, and settings for generating richer scenes without reducing the audience to a segment.", readerId: "lived" },
      { name: "Visual calibration board", type: "Reference set", description: "Approved examples and outside references with explicit notes on what each one should influence." },
    ],
    productionUse: "Use this section to define visual direction, casting, setting, light, materials, motion, and scene behavior.",
    sourceCount: 21,
  },
  {
    id: "rules",
    name: "Creative rules",
    summary: "The practical boundaries that protect the brand when work moves into production.",
    prose: [
      "Rules protect specific parts of the brand without freezing everything else. Approved logos, packaging, typefaces, and claim artwork should be placed exactly. Scene, casting, composition, and lighting can flex inside the relevant creative direction.",
      "The medical-cues prohibition applies when a concept could imply treatment, clinical efficacy, or a guaranteed wellness outcome. It does not mean the brand can never mention ingredients or show an active person. The reason and scope should travel with the rule.",
      "Every rule should say where it applies, why it exists, and what remains open. That makes it useful in production and prevents a local decision from quietly becoming a global restriction.",
    ],
    principles: ["State what is fixed and what can flex", "Keep every prohibition scoped", "Carry the reason with the rule"],
    evidence: [
      { source: "Approved brand assets", ref: "Asset handling instructions", insight: "Identifies files that must be placed exactly.", use: "Marks which files must be used as supplied." },
      { source: "Brand strategy decks", ref: "Claims and compliance guidance", insight: "Documents the rationale and scope of the medical-cues rule.", use: "Prevents unsupported wellness implications." },
      { source: "Review decisions", ref: "Onboarding review, 3 decisions", insight: "Records which conflicts and suggestions were accepted or limited.", use: "Preserves user judgment as part of the rule trail." },
    ],
    artifacts: [
      { name: "Production guardrails", type: "Rule set", description: "Scoped rules, exclusions, rationale, and examples for consistent downstream work." },
      { name: "Exact asset handling map", type: "Production reference", description: "Which assets stay exact, where they apply, and how they should enter a generation package." },
      { name: "Channel expression guide", type: "Application guide", description: "What remains consistent and what can adapt across social, retail, editorial, and experiential work." },
    ],
    productionUse: "Use this section to compile clear production boundaries without turning the whole brand into a rigid template.",
    sourceCount: 8,
  },
];

let brainArtifacts = [
  {
    id: "dossier",
    number: "01",
    name: "Brand Dossier",
    short: "The strategic read",
    description: "A concise, evidence-backed point of view on what SLAKE is, who it is for, and what must remain true.",
    sourceCount: 44,
    categories: ["Brand foundation", "Identity", "Voice and messaging", "Creative rules"],
    read: ["Restorative", "Everyday", "Quietly specific"],
    readBody: "SLAKE turns an ordinary sparkling drink into permission to pause. It is confident about taste and atmosphere without turning the moment into a performance of wellness.",
    audience: "People who care about how a day feels, but are tired of products that frame every choice as self-improvement. They value flavor, good design, and credible ingredients without needing a new identity to buy into.",
    desiredFeeling: "Understood, unhurried, and pleasantly surprised that something this simple can feel considered.",
    productTruth: "A distinctive sparkling water made to mark a small transition in the day.",
    proof: ["Yuzu Ginger flavor with recognizable package artwork", "Current product and ingredient language from approved sources", "A repeated late-afternoon use occasion across approved work"],
    palette: [
      { name: "Oat", role: "Ground", color: "#d9d0bd" },
      { name: "Yuzu", role: "Recognition", color: "#e6845a" },
      { name: "Sage", role: "Rest", color: "#8fa99b" },
      { name: "Slate", role: "Contrast", color: "#3a4655" },
    ],
    materials: ["Cold aluminum", "Washed linen", "Pale stone", "Soft window light"],
    culturalCodes: "The after-work exhale, a drink opened before the next task, the kitchen counter as a place to reset, and quality expressed without ceremony.",
    guardrails: [
      { title: "Never clinical", body: "Medical settings, efficacy cues, and treatment language turn a human pause into a health claim." },
      { title: "Never optimized", body: "Performance language and productivity rituals contradict the permission at the center of the brand." },
      { title: "Never over-styled", body: "Glossy wellness perfection removes the ordinary credibility that makes the world believable." },
    ],
  },
  {
    id: "lived",
    number: "02",
    name: "Lived World",
    short: "The person and their life",
    description: "A human portrait built from pressures, habits, social rhythms, and environments the audience has actually earned.",
    sourceCount: 35,
    categories: ["Brand foundation", "World and story", "Creative direction"],
    person: "A thoughtful, visually aware person who moves through a full day without wanting every habit to become a system. They use small sensory rituals to create room between responsibilities.",
    wants: ["A pause that does not need to be earned", "Products with taste and character but no performance lecture", "A home that feels lived in, not staged", "Time with people that can remain pleasantly informal"],
    rejects: ["Wellness as a competitive identity", "Forced positivity", "Sterile perfection", "Rituals that create more work"],
    tensions: [
      "Wants to slow down, but the day rarely offers a clean stopping point.",
      "Cares about ingredients, but resists clinical or corrective language.",
      "Enjoys beautiful things, but distrusts anything that feels overly curated.",
    ],
    patterns: [
      { time: "Morning", title: "Gets moving without ceremony", body: "The day starts practically. Taste and atmosphere matter, but there is no elaborate routine." },
      { time: "Midday", title: "Moves between demands", body: "Work, errands, and messages overlap. Breaks happen in fragments rather than blocks." },
      { time: "4pm", title: "Creates a small reset", body: "A cold drink and a change of light mark the transition before the day continues." },
      { time: "Evening", title: "Returns to other people", body: "A loose meal, a shared room, or parallel tasks feel more restorative than a planned event." },
    ],
    emotions: ["Focused", "Compressed", "Relieved", "Present", "Restored"],
    social: [
      { mode: "Alone", body: "The pause is private and undemonstrative. Phone down, one task unfinished, enough room to notice taste and light." },
      { mode: "Together", body: "SLAKE belongs beside conversation and unfinished food, not at the center of a hosted performance." },
    ],
    environments: [
      { name: "A worked kitchen at 4pm", earned: "Daily life is already happening here", detail: "Receipts, a folded towel, open mail, and low window light make the reset credible." },
      { name: "A desk near the end of the day", earned: "The pause interrupts real effort", detail: "The scene holds the trace of work without celebrating overwork." },
      { name: "A shaded stoop or balcony", earned: "A small change of air is enough", detail: "The outside world enters through temperature, sound, and late light rather than spectacle." },
    ],
    belongs: "SLAKE belongs in the transition itself: after effort, before the next obligation, when a person can make a little room without leaving their life.",
    opens: "A world of ordinary restoration: warm domestic light, honest materials, unfinished tasks, and people who look present rather than posed.",
  },
  {
    id: "story",
    number: "03",
    name: "Story Architecture",
    short: "The moments production can build",
    description: "A connected sequence of scenes that turns the brand world into a deliberate narrative rather than a collection of attractive images.",
    sourceCount: 31,
    categories: ["World and story", "Creative direction", "Identity", "Creative rules"],
    rhythm: "Pressure gathers, a pause becomes possible, the senses return, and the person re-enters the day with more room around them. Four moments from one believable life carry that arc without making the product a miracle.",
    moments: [
      { index: "01", time: "Tuesday · 3:42pm", scale: "Room scale", title: "The day is still in motion", action: "A person crosses a worked kitchen with a laptop still open on the table.", feeling: "Compressed, familiar", role: "Establish pressure without dramatizing it.", product: "Not yet visible" },
      { index: "02", time: "Tuesday · 4:03pm", scale: "Human scale", title: "The reset begins", action: "They open a cold Yuzu Ginger can beside an unfinished task and turn toward the window.", feeling: "Release, attention", role: "Place the product inside an earned behavior.", product: "Exact package visible" },
      { index: "03", time: "Tuesday · 4:08pm", scale: "Detail", title: "The room comes back", action: "Condensation, linen, a hand at rest, and low light make the sensory shift visible.", feeling: "Present, tactile", role: "Express the brand through material and pace.", product: "Partial exact package" },
      { index: "04", time: "Tuesday · 6:21pm", scale: "Shared room", title: "The day opens outward", action: "Two people prepare something simple in the same kitchen, moving around each other without performance.", feeling: "Warm, restored", role: "Show the reset returning value to ordinary life.", product: "Background presence" },
    ],
    why: "The sequence gives production one emotional arc across multiple outputs. The product appears only when the behavior earns it, exact artwork stays protected, and the final moment proves the brand is about returning to life rather than escaping it.",
    continuity: ["One late-afternoon light direction", "Warm neutral materials with Yuzu color as recognition", "The same lived-in kitchen across the sequence", "A gradual move from wide pressure to tactile detail and shared warmth"],
  },
];

let brainExceptions = [
  {
    id: "audience-alignment-conflict",
    type: "contradiction",
    typeLabel: "Conflicting guidance",
    signal: "Strong match",
    title: "Audience alignment conflict",
    summary: "Two trusted-looking sources describe very different audiences for SLAKE.",
    origin: "Found by comparing sources",
    confidence: "High",
    method: "We compared how each source describes the audience and found a meaningful mismatch.",
    rationale: "The two sources imply different casting, pacing, environments, and narrative priorities.",
    relationships: ["Audience", "Visual style", "Casting"],
    evidence: [
      {
        label: "Strategy deck",
        ref: "Source 017 · slide 12",
        quote: "The SLAKE consumer is the ambitious optimizer, seeking peak performance and metabolic efficiency.",
      },
      {
        label: "Website export",
        ref: "Source 042 · About",
        quote: "The SLAKE consumer seeks an unhurried domestic reset and a quiet moment of recovery.",
      },
    ],
    actions: [
      {
        id: "keep-source-a",
        label: "Keep strategy deck guidance",
        detail: "Use the optimizer definition. Keep the website excerpt attached as background only.",
      },
      {
        id: "keep-source-b",
        label: "Keep website guidance",
        detail: "Use the unhurried-reset definition. Keep the strategy excerpt attached as background only.",
      },
      {
        id: "keep-both",
        label: "Keep both as valid guidance",
        detail: "Keep both for different situations. Neither one automatically takes priority over the other.",
      },
      {
        id: "leave-unresolved",
        label: "Leave unresolved",
        detail: "Keep both sources for reference, but do not use this audience guidance in future work yet.",
      },
    ],
  },
  {
    id: "yuzu-pack-duplicate",
    type: "duplicate",
    typeLabel: "Possible duplicate",
    signal: "Exact file match",
    title: "Yuzu Ginger pack renders",
    summary: "Two differently named files appear to contain the same pack render.",
    origin: "Found by comparing files",
    confidence: "High",
    method: "The file contents and every pixel match, even though the filenames are different.",
    rationale: "Keeping both without a clear reason could hide where each file came from and make the wrong one easier to choose.",
    relationships: ["Yuzu Ginger", "Approved product image", "Packaging"],
    evidence: [
      {
        label: "Campaign archive",
        ref: "slake_yg_v3.png",
        quote: "SHA-256 61ca…92f1 · 4000 × 4000 · approved campaign export",
      },
      {
        label: "Stakeholder notes",
        ref: "Pack_Master_FINAL.png",
        quote: "SHA-256 61ca…92f1 · 4000 × 4000 · attached to product handoff",
      },
    ],
    actions: [
      {
        id: "keep-file-a",
        label: "Keep slake_yg_v3.png",
        detail: "Use the campaign archive file. Keep the second filename in the record for reference.",
      },
      {
        id: "keep-file-b",
        label: "Keep Pack_Master_FINAL.png",
        detail: "Use the stakeholder handoff file. Keep the campaign filename in the record for reference.",
      },
      {
        id: "keep-both",
        label: "Keep both as distinct records",
        detail: "Keep both available with their own source history. Similar files may serve different valid purposes.",
      },
      {
        id: "leave-unresolved",
        label: "Leave unresolved",
        detail: "Keep both files in the library, but do not offer either one for future work yet.",
      },
    ],
  },
  {
    id: "four-pm-reset",
    type: "suspected-canon",
    typeLabel: "Possible brand principle",
    signal: "Found in 11 assets",
    title: "The 4pm Reset ritual",
    summary: "A repeated brand idea appears across past work, but no guideline formally defines it.",
    origin: "Suggested by the system",
    confidence: "Medium",
    method: "We found the same visual and storytelling pattern across 11 separate pieces of past work.",
    rationale: "The pattern is useful and consistent, but repetition alone does not make it core brand guidance.",
    relationships: ["Brand story", "Audience", "Photography", "Creative guidance"],
    evidence: [
      {
        label: "Campaign archive",
        ref: "7 supporting assets",
        quote: "Late-afternoon domestic pauses recur with warm side light, a single can, and unfinished everyday activity.",
      },
      {
        label: "Strategy and notes",
        ref: "4 supporting assets",
        quote: "The phrase 4pm Reset appears repeatedly, but no source declares it an approved identity principle.",
      },
    ],
    actions: [
      {
        id: "contextual",
        label: "Use as helpful guidance",
        detail: "Make the ritual available for future work while keeping it clearly marked as a system suggestion.",
      },
      {
        id: "evidence-only",
        label: "Keep as reference only",
        detail: "Keep the pattern and its source material, but do not use it to guide future work.",
      },
      {
        id: "dismiss-proposal",
        label: "Discard this suggestion",
        detail: "Remove the suggestion from review while keeping the original source material in the library.",
      },
    ],
  },
  {
    id: "no-medical-health-claims",
    type: "brand-rule",
    typeLabel: "Brand rule",
    signal: "Needs a decision",
    title: "Avoid medical or health claims",
    summary: "A proposed rule would keep medical claims and clinical styling out of SLAKE paid social.",
    origin: "Suggested by the system",
    confidence: "High",
    statement: "Do not add medicinal cues, health claims, treatment language, or clinical styling.",
    rationale: "SLAKE should feel restorative without making a health promise or appearing clinical.",
    scope: [
      ["Brand", "SLAKE"],
      ["Products", "All products"],
      ["Channel", "Paid social"],
      ["Placements", "All paid-social placements"],
      ["Formats", "All paid-social formats"],
      ["Campaigns", "All campaigns"],
    ],
    evidence: [
      {
        label: "Strategy deck",
        ref: "Claims boundaries",
        quote: "The approved positioning is restorative and everyday, without medical, treatment, or clinical promises.",
      },
      {
        label: "Campaign review notes",
        ref: "Repeated correction",
        quote: "Medical symbols, treatment language, and clinical-white styling were repeatedly removed from paid-social work.",
      },
    ],
    actions: [
      {
        id: "use-rule",
        label: "Use this rule",
        detail: "Apply it to future paid-social work for SLAKE. This adds the rule to core brand guidance.",
      },
      {
        id: "keep-for-later",
        label: "Keep for later",
        detail: "Save the suggestion and its evidence, but do not apply it to future work yet.",
      },
      {
        id: "discard-suggestion",
        label: "Discard this suggestion",
        detail: "Remove the suggestion from review. The original sources remain available in the library.",
      },
    ],
  },
];

const sampleBrainBatch = JSON.parse(JSON.stringify(brainBatch));
const sampleGuidanceSections = JSON.parse(JSON.stringify(guidanceSections));
const sampleBrainArtifacts = JSON.parse(JSON.stringify(brainArtifacts));
const sampleBrainExceptions = JSON.parse(JSON.stringify(brainExceptions));

function sampleResultSnapshot() {
  const [dossier, livedWorld, storyArchitecture] = sampleBrainArtifacts.map(({ id: _id, number: _number, name: _name, short: _short, ...artifact }) => artifact);
  return {
    brandName: "SLAKE",
    brandDescription: "Adaptogen sparkling water",
    synthesisSummary: "A governed sample Brand Brain built from the sanitized SLAKE source batch.",
    cleanAssetCount: sampleBrainBatch.cleanCount,
    guidanceSections: JSON.parse(JSON.stringify(sampleGuidanceSections)),
    reviewQuestions: sampleBrainExceptions.map((question) => ({
      ...JSON.parse(JSON.stringify(question)),
      scope: (question.scope ?? []).map(([label, value]) => ({ label, value })),
    })),
    artifacts: { dossier, livedWorld, storyArchitecture },
  };
}

const state = {
  screen: "workspace",
  clients: [],
  activeClientId: "default",
  products: {
    list: [],
    detail: null,
    loading: false,
    approving: false,
    activeId: "",
    error: "",
    loadedForClient: "",
    // Add-a-product flow (owned by the Products screen).
    addOpen: false,
    addName: "",
    addTab: "file",
    addFile: null,
    addFileReading: false,
    addText: "",
    addUrl: "",
    creating: false,
    questionDrafts: {},
    resolvingQuestionIndex: null,
  },
  clientSwitcherOpen: false,
  brandName: "SLAKE",
  brandDescription: "Adaptogen sparkling water",
  selectedDeliverable: deliverables[0],
  creativeMode: null,
  campaigns: [
    {
      id: "sample-campaign",
      name: "Summer Reset",
      description: "Position adaptogens as the afternoon alternative to caffeine. Target the 2-4pm energy dip with a ritual-based message.",
      objective: "Awareness and trial among wellness-curious professionals",
      audience: "Working professionals 28-42 who are looking for an afternoon energy solution that is not another coffee",
      currentBelief: "Afternoon slumps require caffeine or pushing through",
      desiredBelief: "There is a calmer, more intentional way to reset in the afternoon",
      desiredAction: "Try SLAKE as a 4pm ritual",
      campaignIdea: "The 4pm Reset",
      messageTerritory: "The moment between push-through and wind-down belongs to you",
      proofPoints: "Adaptogens support calm focus without caffeine crash. The ritual of pausing matters as much as the ingredients.",
      preserve: "Warm domestic palette, editorial naturalism, quiet confidence",
      explore: "Workplace and co-working environments, outdoor transition moments, late-afternoon light",
      paletteShift: "Warmer. Push the oat and clay tones. Less green.",
      productFocus: "Yuzu Ginger",
      channels: ["LinkedIn", "Instagram", "Email"],
      learnings: [],
      createdAt: "2026-08-01T10:00:00Z",
    },
  ],
  activeCampaignId: null,
  campaignReferences: [],
  campaignDraft: null,
  campaignEditing: false,
  campaignEditField: null,
  campaignEditDraft: null,
  previewOutputId: null,
  // Single store for every generated output, draft or approved. Views filter it;
  // nothing is filed into folders. Every record carries the compiled package so
  // the brand language that produced it survives later brain revisions.
  outputs: [],
  productAssetUploading: false,
  brief: {
    scene: "Show a believable moment that could only belong in this brand world. Include a person mid-action, an inhabited setting, and enough environmental detail to make the story feel lived rather than staged.",
    exclusions: "Generic stock-photo polish, staged smiles, visual clutter, or added copy.",
    placement: "Instagram feed",
    format: "4:5 portrait",
    assetType: "scene",
    bannerHeadline: "",
    bannerTextSide: "Left third",
    postType: "Thought leadership",
    postTopic: "",
    postClaims: "",
    postCta: "",
    includeImage: true,
  },
  references: [],
  lockedAssetId: "",
  sourcePickerOpen: false,
  // Cache of presigned GET URLs for private source-file thumbnails, keyed by blobPathname.
  thumbnailUrls: {},
  production: {
    status: "idle",
    package: null,
    job: null,
    error: "",
    recovered: false,
    approved: false,
    candidateRules: [],
    feedbackOpen: false,
    feedbackDraft: "",
    feedbackScope: "this-output",
    bannerDismissed: false,
    // Consumption records for change-impact classification (roadmap 11).
    // Display now reads from the unified state.outputs store; this remains the
    // audit trail. Consolidating the two is a deliberate follow-up.
    completedOutputs: [],
  },
  studio: {
    category: null,
    brief: "",
    platforms: [],
    activeFormats: [],
    textOverlay: false,
    campaignId: "",
    caption: "",
    captionOpen: false,
    referenceOpen: false,
    directionOpen: false,
    direction: "",
    // Template-specific fields
    targetUses: [],
    templateFormats: [],
    // Sales enablement fields
    salesFormat: "slide-16x9",
    salesTemplateId: "",
    salesElement: "",
    salesFeature: "",
    salesProductId: "",
  },
  brain: {
    stage: "empty",
    sources: [],
    sourceForm: "files",
    sourceUrl: "",
    sourceTitle: "",
    sourceText: "",
    sourceTextType: "Notes",
    sourceMaterialType: "",
    sourceAuthority: "brand-evidence",
    // Which source id is currently running product synthesis (empty when idle).
    productSynthesizingId: "",
    sourceRole: "Multiple areas",
    sourceInfluence: "Supporting",
    sourceUsage: "",
    sourceExclusions: "",
    sourceTemplateRatio: "",
    sourceProductName: "",
    pendingFiles: [],
    sourceFileReading: false,
    selectedSourceId: "",
    processingStep: -1,
    processingComplete: false,
    processingError: "",
    synthesisKind: "sample",
    synthesisModel: "",
    synthesisResponseId: "",
    synthesisRequestId: "",
    savedAt: "",
    selectedExceptionId: brainExceptions[0].id,
    cleanApproved: false,
    resolutions: {},
    promotionRationale: "Make the 4pm Reset part of SLAKE's core brand guidance while keeping its supporting sources attached.",
    canonPromoted: false,
    artifactVersion: 1,
    artifactStatus: "not-created",
    revisionPending: false,
    approvedVersion: 0,
    approvedResult: null,
    pendingSourceIds: [],
    affectedGuidanceIds: [],
    candidateBaseVersion: 0,
    selectedGuidanceId: "foundation",
    guidanceView: "guidance",
    selectedBrainArtifactId: "dossier",
    selectedArtifactId: "",
    commentTarget: "",
    commentDraft: "",
    guidanceComments: [],
    feedbackOpen: false,
    feedbackDraft: "",
    history: [],
  },
  toast: "",
};

let currentSynthesisResult = null;

const root = document.querySelector("#app");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentCrumb() {
  if (state.screen === "workspace") return "Workspace";
  if (state.screen === "brain-overview") return "Brand brain / Overview";
  if (state.screen === "brain-sources") return "Brand brain / Sources";
  if (state.screen === "brain-processing") return "Brand brain / Building";
  if (state.screen === "brain") return "Brand brain / Needs review";
  if (state.screen === "brain-guidance") return "Brand brain / Brand guidance";
  if (state.screen === "brain-history") return "Brand brain / History";
  if (state.screen === "brain-canon") return "Brand brain / Core guidance";
  if (state.screen === "chooser") return "Design Studio";
  if (state.screen === "studio-setup") return `Design Studio / ${escapeHtml(studioCategoryLabel(state.studio.category))}`;
  if (state.screen === "campaigns") return "Campaigns";
  if (state.screen === "campaign-creation") return "Campaigns / New campaign";
  if (state.screen === "products") return "Products";
  if (state.screen === "product-detail") return state.products.detail?.product_name ? `Products / ${state.products.detail.product_name}` : "Products / Loading";
  if (state.screen === "campaign-workspace") {
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    return `Campaigns / ${escapeHtml(campaign?.name || "Campaign")}`;
  }
  if (state.screen === "brief") return "Design Studio / Brand world image";
  if (state.screen === "preflight") return "Design Studio / Brand world image / Preflight";
  return "Design Studio / Brand world image / Result";
}

function shell(content) {
  const inBrain = state.screen.startsWith("brain");
  const attentionCount = inBrain
    ? state.brain.processingComplete
      ? brainExceptions.filter((item) => !state.brain.resolutions[item.id]).length
      : 0
    : 0;
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-switcher-wrap">
          <button class="brand-switcher" type="button" aria-label="Switch client" aria-haspopup="menu" aria-expanded="${state.clientSwitcherOpen ? "true" : "false"}" data-action="toggle-client-switcher">
            <span class="brand-mark">${escapeHtml(activeClientInitial())}</span>
            <span>
              <span class="brand-name">${escapeHtml(activeClientName())}</span>
              ${activeClientSecondary() ? `<span class="brand-description">${escapeHtml(activeClientSecondary())}</span>` : ""}
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
          ${state.clientSwitcherOpen ? clientSwitcherMenu() : ""}
        </div>

        <nav class="sidebar-nav" aria-label="Primary navigation">
          ${navItem("Workspace", state.screen === "workspace", "workspace")}
          ${navItem("Brand brain", inBrain, "brand-brain")}
          ${navItem("Design Studio", state.screen === "chooser" || state.screen === "studio-setup" || state.screen === "brief" || state.screen === "preflight" || state.screen === "result", "chooser")}
          ${navItem("Campaigns", state.screen === "campaigns" || state.screen === "campaign-creation" || state.screen === "campaign-workspace", "campaigns")}
          ${navItem("Products", state.screen === "products" || state.screen === "product-detail", "products")}
          ${navItem("Library", false)}
        </nav>

        <div class="sidebar-footer">
          <p class="eyebrow">Workspace</p>
          ${navItem("Workflow settings", false)}
          <div class="profile">
            <span class="avatar">AL</span>
            <span>
              <strong>Alex Lin</strong>
              <span>SLAKE project</span>
            </span>
          </div>
        </div>
      </aside>

      <main class="main-column">
        <header class="topbar">
          <div class="breadcrumb"><strong>${escapeHtml(state.brandName)}</strong> &nbsp;/&nbsp; ${escapeHtml(currentCrumb())}</div>
          <div class="search">Search knowledge, jobs, and assets</div>
          <div class="attention-pill">Needs you <span>${attentionCount}</span></div>
        </header>
        ${renderGenerationBanner()}
        ${content}
      </main>
      ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ""}
      ${renderOutputPreview()}
    </div>
  `;
}

function renderGenerationBanner() {
  const generating = state.production.status === "generating";
  const completedElsewhere = state.production.status === "complete"
    && state.screen !== "result"
    && state.production.job?.status === "complete"
    && !state.production.bannerDismissed
    && !state.production.approved;
  const failedElsewhere = state.production.status === "error"
    && state.screen !== "result"
    && !state.production.bannerDismissed;

  if (generating && state.screen !== "result") {
    const isLinkedIn = state.production.job?.deliverable === "linkedin-post";
    return `
      <div class="gen-banner gen-banner-working" role="status">
        <div class="gen-banner-spinner" aria-hidden="true"></div>
        <span class="gen-banner-text">
          <strong>${isLinkedIn ? "Generating post and image" : "Rendering your image"}</strong>
          <span>You can keep working. We will let you know when it is ready.</span>
        </span>
      </div>
    `;
  }

  if (completedElsewhere) {
    const job = state.production.job;
    const label = job?.generationPackage?.output?.format || "Image";
    return `
      <div class="gen-banner gen-banner-complete" role="status">
        <span class="gen-banner-icon" aria-hidden="true">✓</span>
        <span class="gen-banner-text">
          <strong>Your ${escapeHtml(label)} is ready</strong>
        </span>
        <button class="button small" type="button" data-action="view-latest-result">View result</button>
        <button class="gen-banner-dismiss" type="button" data-action="dismiss-gen-banner" aria-label="Dismiss">✕</button>
      </div>
    `;
  }

  if (failedElsewhere) {
    return `
      <div class="gen-banner gen-banner-error" role="status">
        <span class="gen-banner-icon" aria-hidden="true">!</span>
        <span class="gen-banner-text">
          <strong>Generation needs attention</strong>
        </span>
        <button class="button small" type="button" data-action="view-latest-result">View details</button>
        <button class="gen-banner-dismiss" type="button" data-action="dismiss-gen-banner" aria-label="Dismiss">✕</button>
      </div>
    `;
  }

  return "";
}

function renderOutputPreview() {
  const output = state.outputs.find((o) => o.id === state.previewOutputId);
  if (!output) return "";
  return `
    <div class="preview-overlay" data-action="close-preview" role="dialog" aria-modal="true" aria-label="${escapeHtml(output.label)}">
      <div class="preview-panel">
        <div class="preview-header">
          <span>
            <strong>${escapeHtml(output.label)}</strong>
            <span class="output-meta">${escapeHtml(output.format || "")}${output.campaignName ? ` · ${escapeHtml(output.campaignName)}` : ""}${output.brainVersion ? ` · Brain v${output.brainVersion}` : ""}</span>
          </span>
          <button class="button ghost compact" type="button" data-action="close-preview">Close</button>
        </div>
        <div class="preview-media">
          ${output.imageUrl
            ? `<img src="${escapeHtml(output.imageUrl)}" alt="${escapeHtml(output.label)}" onerror="this.closest('.preview-media').classList.add('preview-media-missing'); this.remove();">`
            : ""}
        </div>
        ${output.scene ? `<p class="preview-scene">${escapeHtml(output.scene)}</p>` : ""}
        <div class="preview-actions">
          <span class="mini-pill ${output.status === "approved" ? "pill-success" : "pill-neutral"}">${output.status === "approved" ? "Approved" : "Draft"}</span>
          ${output.package ? `<button class="button ghost compact" type="button" data-action="reuse-output" data-id="${output.id}">Make another like this</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function navItem(label, active, action = "") {
  return `
    <button
      class="nav-item ${active ? "active" : ""}"
      type="button"
      ${action ? `data-action="${action}"` : ""}
      ${active ? 'aria-current="page"' : ""}
    >
      <span class="nav-glyph" aria-hidden="true"></span>
      <span>${label}</span>
    </button>
  `;
}

function pageHeader(title, description) {
  return `
    <header class="page-header">
      <h1 class="page-title">${escapeHtml(title)}</h1>
      <p class="page-description">${escapeHtml(description)}</p>
    </header>
  `;
}

function brainSourceCount() {
  return state.brain.sources.reduce((total, source) => total + source.count, 0);
}

function brainResolvedCount() {
  return brainExceptions.filter((item) => state.brain.resolutions[item.id]).length;
}

function brainCreatedLabel() {
  if (!state.brain.savedAt) return "This session";
  const date = new Date(state.brain.savedAt);
  return Number.isNaN(date.getTime()) ? "This session" : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function sourceMaterialType(value = state.brain.sourceMaterialType) {
  if (typeof value === "object" && value) {
    if (value.materialType) return sourceMaterialType(value.materialType);
    if (value.authority === "exact-asset") return sourceMaterialType("protected-asset");
    if (value.authority === "approved-guidance") return sourceMaterialType("approved-guidance");
    if (value.authority === "creative-reference") return sourceMaterialType("cultural-reference");
    return sourceMaterialType("past-work-research");
  }
  return sourceMaterialTypes.find((item) => item.id === value) ?? null;
}

function sourceMaterialOptions(form = state.brain.sourceForm) {
  return sourceMaterialTypes.filter((item) => item.forms.includes(form));
}

function sourceHasApprovedBaseline() {
  return Boolean(state.brain.approvedResult || (state.brain.artifactStatus === "ready" && currentSynthesisResult));
}

function pendingSourceCount() {
  return state.brain.pendingSourceIds.length;
}

function sourceFileBytes(sourceIds = null) {
  const selectedIds = sourceIds ? new Set(sourceIds) : null;
  return state.brain.sources.reduce((total, source) => {
    if (selectedIds && !selectedIds.has(source.id)) return total;
    return total + (source.files ?? []).reduce((sum, file) => sum + Number(file.size || 0), 0);
  }, 0);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(Number(bytes))) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(file) {
  return String(file?.name || "").split(".").pop()?.toLowerCase() || "";
}

function validateSourceFile(file, material = sourceMaterialType()) {
  if (!material) return "Choose what kind of material this is first.";
  if (!file) return "Choose one file.";
  if (file.size > MAX_SOURCE_FILE_BYTES) return "Choose a file smaller than 20 MB.";
  if (!material.extensions.includes(fileExtension(file))) return `${material.label} accepts ${material.examples}.`;
  const currentBytes = sourceHasApprovedBaseline() ? sourceFileBytes(state.brain.pendingSourceIds) : sourceFileBytes();
  if (currentBytes + file.size > MAX_SYNTHESIS_FILE_BYTES) return "This build can read up to 40 MB of uploaded files at once. Remove a large file or prepare a smaller update.";
  return "";
}

function sourceUsesInfluence(authority = state.brain.sourceAuthority) {
  return authority === "brand-evidence" || authority === "creative-reference";
}

function sourceContract(materialTypeId = state.brain.sourceMaterialType) {
  const material = sourceMaterialType(materialTypeId);
  const authority = material?.authority || "brand-evidence";
  return {
    materialType: material?.id || "business-document",
    declaredType: material?.label || "Other business document",
    intakeVersion: "single-source-v1",
    authority,
    role: state.brain.sourceRole,
    influence: sourceUsesInfluence(authority) ? state.brain.sourceInfluence : "Not weighted",
    usage: state.brain.sourceUsage.trim(),
    exclusions: state.brain.sourceExclusions.trim() || "No additional exclusions supplied.",
    verification: "Pending content check",
  };
}

function markSourceAdded(sourceId) {
  if (sourceHasApprovedBaseline()) {
    state.brain.approvedResult ||= JSON.parse(JSON.stringify(currentSynthesisResult));
    state.brain.approvedVersion ||= state.brain.artifactVersion;
    if (!state.brain.pendingSourceIds.includes(sourceId)) state.brain.pendingSourceIds.push(sourceId);
    state.brain.revisionPending = true;
    state.brain.candidateBaseVersion = state.brain.approvedVersion;
    state.brain.stage = "ready";
  } else {
    state.brain.stage = "intake";
    state.brain.processingComplete = false;
  }
}

function resetSourceComposer() {
  state.brain.sourceUrl = "";
  state.brain.sourceTitle = "";
  state.brain.sourceText = "";
  state.brain.sourceUsage = "";
  state.brain.sourceExclusions = "";
  state.brain.sourceMaterialType = "";
  state.brain.sourceTemplateRatio = "";
  state.brain.sourceProductName = "";
  state.brain.pendingFiles = [];
  state.brain.sourceFileReading = false;
}

function commentsForTarget(target) {
  return state.brain.guidanceComments.filter((comment) => comment.target === target);
}

function brainSectionNav() {
  const items = [
    { label: "Overview", screen: "brain-overview" },
    { label: "Sources", screen: "brain-sources", count: brainSourceCount() },
    {
      label: "Needs review",
      screen: "brain",
      count: state.brain.processingComplete ? brainExceptions.length - brainResolvedCount() : 0,
    },
    {
      label: "Brand guidance",
      screen: "brain-guidance",
      count: state.brain.artifactStatus === "not-created" ? 0 : `v${state.brain.artifactVersion}`,
    },
    { label: "History", screen: "brain-history", count: state.brain.history.length },
  ];

  return `
    <nav class="brain-section-nav" aria-label="Brand Brain sections">
      ${items
        .map(
          (item) => `
            <button
              class="brain-section-tab ${state.screen === item.screen ? "active" : ""}"
              type="button"
              data-action="navigate-brain"
              data-screen="${item.screen}"
              ${state.screen === item.screen ? 'aria-current="page"' : ""}
            >
              <span>${item.label}</span>
              ${item.count ? `<span class="brain-section-count">${item.count}</span>` : ""}
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function brainWorkspace(title, description, content, className = "") {
  return shell(`
    <section class="workspace brain-workspace ${className}">
      ${pageHeader(title, description)}
      ${brainSectionNav()}
      ${content}
    </section>
  `);
}

function brainOverviewAction() {
  if (state.brain.stage === "intake") {
    return {
      label: "Review your sources",
      detail: `${brainSourceCount()} source items are ready to build from.`,
      action: "brain-sources",
    };
  }
  if (state.brain.stage === "processing") {
    return {
      label: "View synthesis progress",
      detail: "Your sources are being read, connected, and prepared for review.",
      action: "brain-processing",
    };
  }
  if (state.brain.stage === "review") {
    const remaining = brainExceptions.length - brainResolvedCount();
    return {
      label: "Continue review",
      detail: `${remaining} ${remaining === 1 ? "item needs" : "items need"} your decision.`,
      action: "brain",
    };
  }
  if (state.brain.stage === "draft") {
    return {
      label: `Review Brand Brain v${state.brain.artifactVersion}`,
      detail: "Your draft is stored and ready for feedback or approval.",
      action: "brain-guidance",
    };
  }
  return {
    label: "Go to Design Studio",
    detail: `Brand Brain v${state.brain.artifactVersion} is ready to guide production work.`,
    action: "chooser",
  };
}

function renderBrainOverview() {
  if (state.brain.stage === "empty") {
    return brainWorkspace(
      "Brand Brain",
      "Build a dependable source of brand guidance from the material you already have.",
      `
        <div class="brain-empty-layout">
          <section class="card brain-empty-hero">
            <span class="brain-empty-mark" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="eyebrow">Start here</span>
            <h2>Turn what you know into reusable brand guidance</h2>
            <p>Add the files, links, notes, briefs, prior work, and cultural references that help explain the brand. The system will organize them, show you the few questions that need judgment, and prepare a stored Brand Brain draft for your review.</p>
            <div class="brain-empty-actions">
              <button class="button primary" type="button" data-action="begin-brain-onboarding">Build your Brand Brain</button>
              <button class="button" type="button" data-action="load-sample-sources">Use SLAKE sample material</button>
            </div>
          </section>

          <aside class="card brain-source-preview">
            <span class="section-label">Bring what you already have</span>
            <ul>
              <li><span class="source-kind-icon">F</span><span><strong>Individual files</strong><small>One clearly described asset, document, image, or grid at a time</small></span></li>
              <li><span class="source-kind-icon">U</span><span><strong>URLs</strong><small>Websites, articles, social pages, and reference links</small></span></li>
              <li><span class="source-kind-icon">N</span><span><strong>Notes and interviews</strong><small>Research, stakeholder input, transcripts, and working knowledge</small></span></li>
              <li><span class="source-kind-icon">B</span><span><strong>Briefs and references</strong><small>Past briefs, cultural signals, visual references, and inspiration</small></span></li>
            </ul>
          </aside>
        </div>

        <section class="brain-onboarding-steps" aria-label="How Brand Brain onboarding works">
          <article><span>1</span><strong>Add sources</strong><p>Collect the material that carries useful brand knowledge.</p></article>
          <article><span>2</span><strong>Let the system connect it</strong><p>Repeated ideas, assets, rules, and disagreements are organized.</p></article>
          <article><span>3</span><strong>Review what matters</strong><p>You resolve only the questions the system cannot answer honestly.</p></article>
          <article><span>4</span><strong>Approve a stored version</strong><p>Production uses the exact guidance and assets you reviewed.</p></article>
        </section>
      `,
      "brain-empty-workspace",
    );
  }

  const next = brainOverviewAction();
  const unresolved = state.brain.processingComplete ? brainExceptions.length - brainResolvedCount() : 0;
  const ready = state.brain.artifactStatus === "ready";

  return brainWorkspace(
    "Brand Brain overview",
    "See what the brain knows, what still needs attention, and what production can use.",
    `
      <section class="card brain-status-hero ${ready ? "ready" : ""}">
        <div>
          <span class="brain-status ${ready ? "success" : "governed"}">${ready ? "Ready for production" : "In progress"}</span>
          <h2>${escapeHtml(next.label)}</h2>
          <p>${escapeHtml(next.detail)}</p>
        </div>
        <button class="button ${ready ? "secondary" : "primary"}" type="button" data-action="navigate-brain" data-screen="${next.action}">${escapeHtml(next.label)}</button>
      </section>

      <div class="brain-overview-grid">
        <button class="card brain-overview-card" type="button" data-action="navigate-brain" data-screen="brain-sources">
          <span class="section-label">Sources</span>
          <strong>${brainSourceCount()}</strong>
          <span>${state.brain.sources.length} source groups collected</span>
          <small>View files, links, notes, briefs, and references</small>
        </button>
        <button class="card brain-overview-card" type="button" data-action="navigate-brain" data-screen="brain">
          <span class="section-label">Needs review</span>
          <strong>${unresolved}</strong>
          <span>${state.brain.processingComplete ? `${brainResolvedCount()} decisions saved` : "Available after synthesis"}</span>
          <small>Resolve conflicts, duplicates, suggestions, and rules</small>
        </button>
        <button class="card brain-overview-card" type="button" data-action="navigate-brain" data-screen="brain-guidance">
          <span class="section-label">Brand guidance</span>
          <strong>${state.brain.artifactStatus === "not-created" ? "Not ready" : `v${state.brain.artifactVersion}`}</strong>
          <span>${ready ? "Approved for production" : state.brain.artifactStatus === "draft" ? "Draft ready for review" : "Created after review"}</span>
          <small>Explore the current stored understanding of the brand</small>
        </button>
        <button class="card brain-overview-card" type="button" data-action="navigate-brain" data-screen="brain-history">
          <span class="section-label">History</span>
          <strong>${state.brain.history.length}</strong>
          <span>Recorded onboarding changes</span>
          <small>See source batches, decisions, feedback, and versions</small>
        </button>
      </div>

      <section class="card brain-overview-detail">
        <div class="card-header">
          <span><span class="section-label">Current version</span><h2>${state.brain.artifactStatus === "not-created" ? "Brand guidance is still being built" : `${escapeHtml(state.brandName)} Brand Brain v${state.brain.artifactVersion}`}</h2></span>
          <span class="mini-pill">${state.brain.artifactStatus === "ready" ? "Production ready" : "Onboarding"}</span>
        </div>
        <div class="brain-overview-readiness">
          <span class="complete"><i></i><strong>Sources collected</strong><small>${brainSourceCount()} items</small></span>
          <span class="${state.brain.processingComplete ? "complete" : ""}"><i></i><strong>Synthesis complete</strong><small>${state.brain.processingComplete ? "Draft prepared" : "Not finished"}</small></span>
          <span class="${unresolved === 0 && state.brain.processingComplete ? "complete" : ""}"><i></i><strong>Questions reviewed</strong><small>${state.brain.processingComplete ? `${unresolved} remaining` : "Not started"}</small></span>
          <span class="${ready ? "complete" : ""}"><i></i><strong>Approved for production</strong><small>${ready ? `Version ${state.brain.artifactVersion}` : "Not yet"}</small></span>
        </div>
      </section>
    `,
  );
}

function sourceComposer() {
  const mode = state.brain.sourceForm;
  const material = sourceMaterialType();
  const pendingFile = state.brain.pendingFiles[0];
  const contentReady = mode === "files" ? Boolean(pendingFile) : true;
  const canAdd = Boolean(material && contentReady && !state.brain.sourceFileReading);
  return `
    <section class="card brain-source-composer">
      <div class="card-header">
        <span><span class="section-label">Add one source</span><h2>Start with what the material is</h2></span>
      </div>
      <div class="source-method-tabs" role="tablist" aria-label="Source type">
        ${[
          ["files", "File"],
          ["url", "URL"],
          ["text", "Written material"],
        ]
          .map(
            ([id, label]) => `<button class="${mode === id ? "active" : ""}" type="button" data-action="set-source-form" data-kind="${id}">${label}</button>`,
          )
          .join("")}
      </div>

      <div class="source-type-step">
        <span class="source-step-label">Step 1</span>
        <div class="source-type-heading">
          <span><strong>What kind of material are you adding?</strong><small>Choose the closest real-world type. This sets safe handling before the system reads anything.</small></span>
        </div>
        <div class="source-material-grid">
          ${sourceMaterialOptions(mode)
            .map(
              (item) => `
                <button class="source-material-option ${material?.id === item.id ? "active" : ""}" type="button" data-action="select-source-material-type" data-id="${item.id}">
                  <span class="source-material-mark" aria-hidden="true">${escapeHtml(item.label.slice(0, 1))}</span>
                  <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.description)}</small></span>
                  <i aria-hidden="true">${material?.id === item.id ? "✓" : ""}</i>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>

      ${
        mode === "files"
          ? `
            <div class="source-upload-step ${material ? "" : "disabled"}">
              <span class="source-step-label">Step 2</span>
              <label class="source-drop-zone ${material ? "" : "disabled"}">
              <input type="file" data-action="source-file-input" accept="${escapeHtml(material?.accept || "")}" ${material ? "" : "disabled"}>
              <span class="source-drop-icon">+</span>
              <strong>${state.brain.sourceFileReading ? "Reading the selected file" : pendingFile ? escapeHtml(pendingFile.name) : material ? "Choose one file" : "Choose a material type first"}</strong>
              <span>${pendingFile ? `${escapeHtml(fileExtension(pendingFile).toUpperCase())} · ${escapeHtml(formatFileSize(pendingFile.size))}` : material ? `${escapeHtml(material.examples)} · 20 MB maximum` : "Folders and multi-file batches are not accepted in this step."}</span>
              </label>
              ${material?.formatAdvice ? `<small class="source-content-note">${escapeHtml(material.formatAdvice)}</small>` : ""}
              ${
                material
                  ? `<div class="source-verification-note"><span aria-hidden="true">!</span><p>The system will compare the file with <strong>${escapeHtml(material.label)}</strong>. If the contents do not line up, it will ask you to review the mismatch instead of silently trusting the label.</p></div>`
                  : ""
              }
            </div>
          `
          : ""
      }

      ${
        mode === "url"
          ? `
            <div class="source-entry-form source-content-form">
              <span class="source-step-label">Step 2</span>
              <label><span>Web address</span><input class="input-like" type="url" data-action="brain-source-url" value="${escapeHtml(state.brain.sourceUrl)}" placeholder="https://example.com/about"></label>
              <label><span>Name this source</span><input class="input-like" data-action="brain-source-title" value="${escapeHtml(state.brain.sourceTitle)}" placeholder="About page"></label>
              <small class="source-content-note">The page contents will be checked against the material type you selected.</small>
            </div>
          `
          : ""
      }

      ${
        mode === "text"
          ? `
            <div class="source-entry-form source-content-form">
              <span class="source-step-label">Step 2</span>
              <label><span>Title</span><input class="input-like" data-action="brain-source-title" value="${escapeHtml(state.brain.sourceTitle)}" placeholder="What should we call this?"></label>
              <label><span>Paste the material</span><textarea data-action="brain-source-text" placeholder="Paste notes, a brief, transcript, observation, or reference context here.">${escapeHtml(state.brain.sourceText)}</textarea></label>
            </div>
          `
          : ""
      }

      <div class="source-contract ${material ? "" : "disabled"}">
        <span class="source-step-label">Step 3</span>
        <div class="source-contract-heading">
          <span><strong>How should we use this source?</strong><small>Your instructions travel with this one source into synthesis and future updates.</small></span>
          <span class="source-handling-pill">${escapeHtml(material?.handling || "Choose a type first")}</span>
        </div>

        <div class="source-entry-row source-contract-row">
          <label>
            <span>What should it inform?</span>
            <select data-action="brain-source-role">${sourceRoleOptions.map((value) => option(value, state.brain.sourceRole)).join("")}</select>
          </label>
          ${
            sourceUsesInfluence(material?.authority)
              ? `<label>
                  <span>Influence</span>
                  <select data-action="brain-source-influence">${sourceInfluenceOptions.map((value) => option(value, state.brain.sourceInfluence)).join("")}</select>
                  <small>Creative priority, not a blend percentage.</small>
                </label>`
              : `<div class="source-fixed-handling"><span>How it is weighted</span><strong>It is not weighted</strong><small>${material?.authority === "exact-asset" ? "The supplied file stays exact." : material ? "Approved guidance applies wherever it is relevant." : "Choose the material type first."}</small></div>`
          }
        </div>

        <label>
          <span>Usage instruction <b>Required</b></span>
          <textarea data-action="brain-source-usage" placeholder="Example: use only the color temperature and material contrast; ignore the subject matter.">${escapeHtml(state.brain.sourceUsage)}</textarea>
        </label>
        <label>
          <span>What should we leave out? <small>Optional</small></span>
          <textarea data-action="brain-source-exclusions" placeholder="Example: do not carry forward the seasonal tagline or page layout.">${escapeHtml(state.brain.sourceExclusions)}</textarea>
        </label>
        ${material?.isTemplate ? `
        <label>
          <span>Template format</span>
          <select data-action="brain-source-template-ratio">
            <option value="" ${!state.brain.sourceTemplateRatio ? "selected" : ""}>Choose a format</option>
            <option value="16:9" ${state.brain.sourceTemplateRatio === "16:9" ? "selected" : ""}>Slide (16:9 widescreen)</option>
            <option value="4:3" ${state.brain.sourceTemplateRatio === "4:3" ? "selected" : ""}>Slide (4:3 standard)</option>
            <option value="17:22" ${state.brain.sourceTemplateRatio === "17:22" ? "selected" : ""}>One-pager (8.5 x 11)</option>
          </select>
          <small>Determines where this template appears in the Sales enablement workflow.</small>
        </label>
        ` : ""}
        <button class="button primary source-add-button" type="button" data-action="${mode === "files" ? "add-file-source" : mode === "url" ? "add-url-source" : "add-text-source"}" ${canAdd ? "" : "disabled"}>${state.brain.sourceFileReading ? "Reading file" : sourceHasApprovedBaseline() ? "Add source to proposed update" : "Add source"}</button>
      </div>

      <div class="source-sample-callout">
        <span><strong>Want to walk through the full prototype?</strong><span>Load the sanitized 50-item SLAKE source batch.</span></span>
        <button class="button" type="button" data-action="load-sample-sources">Use SLAKE sample material</button>
      </div>
    </section>
  `;
}

function sourceGroupRow(source) {
  const material = sourceMaterialType(source);
  const expanded = state.brain.selectedSourceId === source.id;
  const pending = state.brain.pendingSourceIds.includes(source.id);
  const locked = sourceHasApprovedBaseline() && !pending;
  const weighted = sourceUsesInfluence(source.authority);
  return `
    <article class="brain-source-item ${expanded ? "expanded" : ""} ${pending ? "pending" : ""} ${locked ? "locked" : ""}">
      <div class="brain-source-row">
        <span class="source-kind-icon">${escapeHtml(source.type.slice(0, 1))}</span>
        <span class="brain-source-copy">
          <strong>${escapeHtml(source.name)}</strong>
          <span>${escapeHtml(source.type)} · ${escapeHtml(source.detail)}</span>
          <span class="source-row-meta"><i>${escapeHtml(material?.shortLabel || "Past work or research")}</i><i>${escapeHtml(source.role)}</i><i>${escapeHtml(weighted ? source.influence : material?.handling || "Not weighted")}</i>${source.productMeta ? `<i>${escapeHtml(source.productMeta.productName)}</i>` : ""}${pending ? "<i>Proposed update</i>" : locked ? `<i>Active v${state.brain.approvedVersion || state.brain.artifactVersion}</i>` : ""}</span>
        </span>
        <span class="brain-source-count"><strong>${source.count}</strong><span>${source.count === 1 ? "item" : "items"}</span></span>
        <button class="text-button" type="button" data-action="toggle-source-details" data-id="${escapeHtml(source.id)}">${expanded ? "Close" : "Review details"}</button>
        <button class="icon-button" type="button" data-action="remove-brain-source" data-id="${escapeHtml(source.id)}" aria-label="Remove ${escapeHtml(source.name)}" ${locked ? "disabled" : ""}>×</button>
      </div>
      ${
        expanded
          ? `<div class="brain-source-details">
              ${locked ? `<div class="source-lock-note"><strong>Part of active Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion}</strong><span>Existing approved sources stay unchanged while additions are reviewed. Source retirement will be handled as a separate governed change later.</span></div>` : ""}
              <div class="source-entry-row">
                <label><span>Material type</span><select data-action="brain-source-item-material-type" data-id="${escapeHtml(source.id)}" ${locked ? "disabled" : ""}>${sourceMaterialTypes.map((item) => `<option value="${item.id}" ${item.id === material?.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select><small>${escapeHtml(material?.description || "This source will be checked before synthesis.")}</small></label>
                <label><span>What should it inform?</span><select data-action="brain-source-item-role" data-id="${escapeHtml(source.id)}" ${locked ? "disabled" : ""}>${sourceRoleOptions.map((value) => option(value, source.role)).join("")}</select></label>
              </div>
              ${
                weighted
                  ? `<label><span>Influence</span><select data-action="brain-source-item-influence" data-id="${escapeHtml(source.id)}" ${locked ? "disabled" : ""}>${sourceInfluenceOptions.map((value) => option(value, source.influence)).join("")}</select><small>Creative priority, not a blend percentage.</small></label>`
                  : `<div class="source-fixed-handling compact"><span>How it is weighted</span><strong>It is not weighted</strong><small>${escapeHtml(material?.handling || "Use safely")} whenever this source is relevant.</small></div>`
              }
              <label><span>Usage instruction</span><textarea data-action="brain-source-item-usage" data-id="${escapeHtml(source.id)}" ${locked ? "disabled" : ""}>${escapeHtml(source.usage)}</textarea></label>
              <label><span>What should we leave out?</span><textarea data-action="brain-source-item-exclusions" data-id="${escapeHtml(source.id)}" ${locked ? "disabled" : ""}>${escapeHtml(source.exclusions)}</textarea></label>
              ${source.productMeta ? `
                <div class="source-product-synthesis">
                  <div class="rule">
                    <span class="mini-pill ${source.productMeta.synthesizedProductId ? "pill-success" : "pill-neutral"}">${source.productMeta.synthesizedProductId ? "Synthesized" : "Product brief"}</span>
                    <span>
                      <strong>${escapeHtml(source.productMeta.productName)}</strong>
                      <span>${source.productMeta.synthesizedProductId ? "A candidate product record was built from this brief. Review and approve it on the Products screen." : "Build a governed product record from this brief. Every claim will trace back to the source and remain a candidate until you approve it."}</span>
                    </span>
                    <button class="button ${source.productMeta.synthesizedProductId ? "" : "primary"}" type="button" data-action="synthesize-product-from-source" data-id="${escapeHtml(source.id)}" ${state.brain.productSynthesizingId === source.id ? "disabled" : ""}>${state.brain.productSynthesizingId === source.id ? "Working..." : source.productMeta.synthesizedProductId ? "Re-synthesize" : "Synthesize product record"}</button>
                    ${source.productMeta.synthesizedProductId ? `<button class="button" type="button" data-action="view-product" data-id="${escapeHtml(source.productMeta.synthesizedProductId)}">Review</button>` : ""}
                  </div>
                </div>
              ` : ""}
            </div>`
          : ""
      }
    </article>
  `;
}

function renderBrainSources() {
  const hasSources = state.brain.sources.length > 0;
  const hasApproved = sourceHasApprovedBaseline();
  const pending = pendingSourceCount();
  const canSynthesize = hasApproved ? pending > 0 : hasSources;
  return brainWorkspace(
    "Sources",
    "Add one clearly described source at a time so its meaning, handling, and instructions stay attached.",
    `
      ${
        hasApproved
          ? `<section class="brain-source-update-callout"><span class="brain-status governed">Active v${state.brain.approvedVersion || state.brain.artifactVersion}</span><span><strong>Your approved Brand Brain stays active</strong><p>New sources create a proposed update. Only guidance touched by the new material is reconsidered, and nothing changes for production until you review and approve the next version.</p></span></section>`
          : ""
      }
      <div class="brain-sources-layout ${hasSources ? "has-sources" : ""}">
        ${sourceComposer()}

        <section class="card brain-source-batch">
          <div class="card-header">
            <span><span class="section-label">${hasApproved ? "Source library and proposed update" : "Current batch"}</span><h2>${hasApproved ? `${pending} new ${pending === 1 ? "source" : "sources"} pending` : hasSources ? `${brainSourceCount()} items ready` : "Nothing added yet"}</h2></span>
            ${hasSources ? `<span class="mini-pill">${state.brain.sources.length} ${state.brain.sources.length === 1 ? "source" : "sources"}</span>` : ""}
          </div>
          ${
            hasSources
              ? `<div class="brain-source-list">${state.brain.sources.map(sourceGroupRow).join("")}</div>`
              : `<div class="brain-source-empty"><strong>Your source batch will appear here</strong><span>Add individual materials or use the SLAKE sample batch to continue through the prototype.</span></div>`
          }
          <div class="brain-source-footer">
            <span>
              <strong>${hasApproved ? (pending ? `Ready to check ${pending} proposed ${pending === 1 ? "addition" : "additions"}` : "Your approved source library is unchanged") : hasSources ? "Ready to build from these sources" : "Add at least one source to continue"}</strong>
              <span>${hasApproved ? (pending ? `Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion} remains active while the system prepares the smallest supported update.` : "Add a source above when new material should be considered. The active version will not be reset.") : hasSources ? "The system will read the supplied material, check the declared types, and prepare guidance and artifacts for review." : "Nothing is processed or approved until you start."}</span>
            </span>
            <button class="button primary" type="button" data-action="start-brain-synthesis" ${canSynthesize ? "" : "disabled"}>${hasApproved ? "Prepare proposed update" : "Build Brand Brain draft"}</button>
          </div>
        </section>
      </div>
    `,
  );
}

function renderBrainProcessing() {
  const complete = state.brain.processingComplete;
  const error = state.brain.processingError;
  const incremental = state.brain.revisionPending && state.brain.approvedVersion > 0;
  const activeStep = complete ? synthesisSteps.length : Math.max(state.brain.processingStep, 0);
  const progress = complete ? 100 : Math.round(((activeStep + 1) / synthesisSteps.length) * 100);
  return brainWorkspace(
    complete ? (incremental ? "Your proposed update is ready for review" : "Your sources are ready for review") : error ? "We could not finish this draft" : incremental ? `Checking new sources against Brand Brain v${state.brain.approvedVersion}` : "Building your Brand Brain",
    complete
      ? incremental
        ? `Brand Brain v${state.brain.approvedVersion} remains active. Review the candidate changes before a new version can replace it.`
        : "The first draft is prepared. Review the few questions that need your judgment before production can use it."
      : error
        ? "Your source batch is still here. Review the issue below and try again when you are ready."
      : incremental
        ? `The approved version stays available to production while ${pendingSourceCount()} new ${pendingSourceCount() === 1 ? "source is" : "sources are"} checked.`
        : "You can leave this page. Your source batch and progress stay together in this prototype session.",
    `
      <div class="brain-processing-layout">
        <section class="card brain-processing-card">
          <div class="brain-processing-heading">
            <span class="brain-processing-orbit ${complete ? "complete" : error ? "error" : ""}" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>
              <span class="brain-status ${complete ? "success" : error ? "danger" : "governed"}">${complete ? "Ready" : error ? "Needs attention" : "In progress"}</span>
              <h2>${complete ? (incremental ? "Candidate update prepared" : "Synthesis complete") : error ? "The source batch was not changed" : synthesisSteps[activeStep]?.title ?? synthesisSteps[0].title}</h2>
              <p>${complete ? incremental ? `${state.brain.affectedGuidanceIds.length || "No"} guidance ${state.brain.affectedGuidanceIds.length === 1 ? "area has" : "areas have"} a proposed change. ${brainExceptions.length ? `${brainExceptions.length} ${brainExceptions.length === 1 ? "question needs" : "questions need"} your judgment.` : "No additional questions need a decision."}` : `OpenAI prepared six guidance sections and three working artifacts. ${brainExceptions.length ? `It also found ${brainExceptions.length} ${brainExceptions.length === 1 ? "question" : "questions"} that need your judgment.` : "It found no questions that require a decision."}` : error ? escapeHtml(error) : synthesisSteps[activeStep]?.detail ?? synthesisSteps[0].detail}</p>
            </span>
          </div>
          <div class="brain-progress-track" aria-label="Synthesis progress"><span style="width: ${progress}%"></span></div>
          <div class="brain-processing-steps">
            ${synthesisSteps
              .map((step, index) => {
                const status = complete || index < activeStep ? "complete" : index === activeStep ? "active" : "pending";
                return `<article class="${status}"><span class="processing-step-marker">${status === "complete" ? "✓" : index + 1}</span><span><strong>${escapeHtml(step.title)}</strong><small>${escapeHtml(step.detail)}</small></span><span class="processing-step-status">${status === "complete" ? "Done" : status === "active" ? "Working" : "Waiting"}</span></article>`;
              })
              .join("")}
          </div>
          ${complete ? `<button class="button primary" type="button" data-action="navigate-brain" data-screen="brain">${brainExceptions.length ? "Review what needs you" : "Review the Brand Brain draft"}</button>` : error ? `<div class="actions"><button class="button primary" type="button" data-action="retry-brain-synthesis">Try again</button><button class="button" type="button" data-action="navigate-brain" data-screen="brain-sources">Review sources</button></div>` : ""}
        </section>

        <aside class="card brain-processing-summary">
          <span class="section-label">${incremental ? "Proposed update" : "Source batch"}</span>
          <strong>${incremental ? pendingSourceCount() : brainSourceCount()} ${incremental ? "new" : ""} ${incremental && pendingSourceCount() === 1 ? "source" : "items"}</strong>
          <span>${incremental ? `Compared with active v${state.brain.approvedVersion}` : `${state.brain.sources.length} source groups`}</span>
          <dl>
            <div><dt>Files and pages</dt><dd>${complete ? "Read" : error ? "Still saved" : "Captured"}</dd></div>
            <div><dt>Source details</dt><dd>Attached</dd></div>
            <div><dt>Original material</dt><dd>Preserved</dd></div>
            <div><dt>Approval</dt><dd>Still yours</dd></div>
          </dl>
          <p>${incremental ? `The approved version stays active. Stable guidance is copied forward, conflicts become review questions, and only approved candidate changes can create v${state.brain.approvedVersion + 1}.` : "The system prepares suggestions and questions. It does not silently turn repeated material into core brand guidance."}</p>
        </aside>
      </div>
    `,
  );
}

function guidanceCommentBlock(section, paragraph, index) {
  const target = `${section.id}:prose:${index}`;
  const comments = commentsForTarget(target);
  const open = state.brain.commentTarget === target;
  return `
    <div class="guidance-prose-block">
      <p>${escapeHtml(paragraph)}</p>
      <div class="guidance-prose-actions">
        <button class="text-button" type="button" data-action="toggle-guidance-comment" data-target="${target}">${open ? "Close comment" : "Comment on this"}</button>
        ${comments.length ? `<span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>` : ""}
      </div>
      ${comments.map((comment) => `<div class="guidance-saved-comment ${comment.resolved ? "resolved" : ""}"><strong>${comment.resolved ? `Included in v${comment.resolvedVersion}` : "Your feedback"}</strong><span>${escapeHtml(comment.text)}</span></div>`).join("")}
      ${
        open
          ? `<div class="guidance-comment-form">
              <label><span>What should change here?</span><textarea data-action="guidance-comment-draft" placeholder="Point to what feels wrong, incomplete, or unclear.">${escapeHtml(state.brain.commentDraft)}</textarea></label>
              <button class="button secondary" type="button" data-action="save-guidance-comment" data-target="${target}" data-section="${section.id}">Save comment</button>
            </div>`
          : ""
      }
    </div>
  `;
}

function guidanceArtifactCard(section, artifact, index) {
  const id = `${section.id}-artifact-${index}`;
  const expanded = state.brain.selectedArtifactId === id;
  return `
    <article class="guidance-artifact-card ${expanded ? "expanded" : ""}">
      <span class="guidance-artifact-type">${escapeHtml(artifact.type)}</span>
      <strong>${escapeHtml(artifact.name)}</strong>
      <p>${escapeHtml(artifact.description)}</p>
      ${artifact.readerId ? `<button class="button artifact-open-button" type="button" data-action="open-brain-artifact" data-id="${artifact.readerId}">Open full artifact</button>` : ""}
      <button class="text-button" type="button" data-action="toggle-guidance-artifact" data-id="${id}">${expanded ? "Hide details" : "View artifact details"}</button>
      ${expanded ? `<div class="guidance-artifact-detail"><span><strong>What it contains</strong>${escapeHtml(artifact.description)}</span><span><strong>How it stays current</strong>Updates to this guidance create a new stored Brand Brain version with the earlier version preserved.</span></div>` : ""}
    </article>
  `;
}

function artifactFeedback(artifact, sectionId) {
  const target = `${artifact.id}:artifact:${sectionId}`;
  const comments = commentsForTarget(target);
  const open = state.brain.commentTarget === target;
  return `
    <div class="artifact-feedback">
      <button class="text-button" type="button" data-action="toggle-guidance-comment" data-target="${target}">${open ? "Close comment" : "Comment on this section"}</button>
      ${comments.length ? `<span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>` : ""}
      ${comments.map((comment) => `<div class="guidance-saved-comment ${comment.resolved ? "resolved" : ""}"><strong>${comment.resolved ? `Included in v${comment.resolvedVersion}` : "Your feedback"}</strong><span>${escapeHtml(comment.text)}</span></div>`).join("")}
      ${open ? `<div class="guidance-comment-form"><label><span>What should change here?</span><textarea data-action="guidance-comment-draft" placeholder="Point to what feels wrong, incomplete, or unclear.">${escapeHtml(state.brain.commentDraft)}</textarea></label><button class="button secondary" type="button" data-action="save-guidance-comment" data-target="${target}" data-section="${artifact.id}" data-label="${escapeHtml(artifact.name)}">Save comment</button></div>` : ""}
    </div>
  `;
}

function artifactSectionHeading(artifact, label, title, sectionId) {
  return `<div class="artifact-section-heading"><span><span class="section-label">${escapeHtml(label)}</span><h3>${escapeHtml(title)}</h3></span>${artifactFeedback(artifact, sectionId)}</div>`;
}

function renderDossierArtifact(artifact) {
  return `
    <section class="artifact-module artifact-read-module">
      ${artifactSectionHeading(artifact, "The read", artifact.read.join(" · "), "read")}
      <p class="artifact-lead-copy">${escapeHtml(artifact.readBody)}</p>
    </section>
    <div class="artifact-split">
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "Who this is for", "A person, not a segment", "audience")}
        <p>${escapeHtml(artifact.audience)}</p>
      </section>
      <section class="artifact-module artifact-highlight-module">
        ${artifactSectionHeading(artifact, "How they should feel", "The emotional outcome", "feeling")}
        <p>${escapeHtml(artifact.desiredFeeling)}</p>
      </section>
    </div>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "Product truth", artifact.productTruth, "product-truth")}
      <ul class="artifact-proof-list">${artifact.proof.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
    <div class="artifact-split artifact-visual-split">
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "Palette", "Pulled from approved identity", "palette")}
        <div class="artifact-palette">${artifact.palette.map((item) => `<article><i style="background:${item.color}"></i><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.role)}</small></span></article>`).join("")}</div>
      </section>
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "How it feels", "Material before polish", "materials")}
        <div class="artifact-materials">${artifact.materials.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </section>
    </div>
    <section class="artifact-module artifact-code-module">
      ${artifactSectionHeading(artifact, "Cultural codes", "What makes the world feel current and specific", "culture")}
      <p>${escapeHtml(artifact.culturalCodes)}</p>
    </section>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "Guardrails", "What breaks the read", "guardrails")}
      <div class="artifact-guardrails">${artifact.guardrails.map((item) => `<article><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></article>`).join("")}</div>
    </section>
  `;
}

function renderLivedArtifact(artifact) {
  return `
    <section class="artifact-module artifact-person-module">
      ${artifactSectionHeading(artifact, "The person", "A life the brand can honestly belong in", "person")}
      <p class="artifact-lead-copy">${escapeHtml(artifact.person)}</p>
    </section>
    <div class="artifact-split">
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "What they want", "More room, less performance", "wants")}
        <ul class="artifact-simple-list">${artifact.wants.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "What they reject", "The world they are moving away from", "rejects")}
        <ul class="artifact-simple-list negative">${artifact.rejects.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    </div>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "The tensions they live inside", "Useful contradictions", "tensions")}
      <div class="artifact-tensions">${artifact.tensions.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(item)}</p></article>`).join("")}</div>
    </section>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "Life patterns", "A normal day, felt from the inside", "patterns")}
      <div class="artifact-dayline">${artifact.patterns.map((item) => `<article><span>${escapeHtml(item.time)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></article>`).join("")}</div>
      <div class="artifact-emotion-line">${artifact.emotions.map((item, index) => `<span style="--step:${index}"><i></i>${escapeHtml(item)}</span>`).join("")}</div>
    </section>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "Their social world", "Alone and together", "social")}
      <div class="artifact-social">${artifact.social.map((item) => `<article><strong>${escapeHtml(item.mode)}</strong><p>${escapeHtml(item.body)}</p></article>`).join("")}</div>
    </section>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "Environments they have earned", "Settings justified by behavior", "environments")}
      <div class="artifact-environments">${artifact.environments.map((item) => `<article><span class="artifact-environment-mark" aria-hidden="true"></span><div><strong>${escapeHtml(item.name)}</strong><small>Earned by: ${escapeHtml(item.earned)}</small><p>${escapeHtml(item.detail)}</p></div></article>`).join("")}</div>
    </section>
    <div class="artifact-split">
      <section class="artifact-module artifact-highlight-module">${artifactSectionHeading(artifact, "Where the brand belongs", "The useful role", "belongs")}<p>${escapeHtml(artifact.belongs)}</p></section>
      <section class="artifact-module">${artifactSectionHeading(artifact, "The world this opens", "The creative territory", "opens")}<p>${escapeHtml(artifact.opens)}</p></section>
    </div>
  `;
}

function renderStoryArtifact(artifact) {
  return `
    <section class="artifact-module artifact-story-intro">
      ${artifactSectionHeading(artifact, "The rhythm", "One emotional arc across the day", "rhythm")}
      <p class="artifact-lead-copy">${escapeHtml(artifact.rhythm)}</p>
    </section>
    <section class="artifact-module">
      ${artifactSectionHeading(artifact, "The moment plan", "Four scenes from one believable life", "moments")}
      <div class="artifact-moments">${artifact.moments.map((item) => `<article><header><span>${escapeHtml(item.index)}</span><small>${escapeHtml(item.time)} · ${escapeHtml(item.scale)}</small></header><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.action)}</p><dl><div><dt>Feels</dt><dd>${escapeHtml(item.feeling)}</dd></div><div><dt>Role in the story</dt><dd>${escapeHtml(item.role)}</dd></div><div><dt>Product</dt><dd>${escapeHtml(item.product)}</dd></div></dl></article>`).join("")}</div>
    </section>
    <div class="artifact-split">
      <section class="artifact-module artifact-highlight-module">
        ${artifactSectionHeading(artifact, "Why these four", "The reasoning behind the sequence", "why")}
        <p>${escapeHtml(artifact.why)}</p>
      </section>
      <section class="artifact-module">
        ${artifactSectionHeading(artifact, "What holds it together", "Continuity across every output", "continuity")}
        <ul class="artifact-simple-list">${artifact.continuity.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    </div>
  `;
}

function renderBrainArtifactReader() {
  const artifact = brainArtifacts.find((item) => item.id === state.brain.selectedBrainArtifactId) ?? brainArtifacts[0];
  const body = artifact.id === "dossier" ? renderDossierArtifact(artifact) : artifact.id === "lived" ? renderLivedArtifact(artifact) : renderStoryArtifact(artifact);
  return `
    <nav class="brain-artifact-tabs" role="tablist" aria-label="Brand Brain artifacts">
      ${brainArtifacts.map((item) => `<button class="artifact-${item.id} ${item.id === artifact.id ? "active" : ""}" type="button" role="tab" aria-selected="${item.id === artifact.id}" data-action="select-brain-artifact" data-id="${item.id}"><span>${item.number}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.short)}</small></button>`).join("")}
    </nav>
    <article class="card brain-artifact-reader artifact-${artifact.id}">
      <header class="brain-artifact-reader-header">
        <span><span class="section-label">Artifact ${artifact.number}</span><h2>${escapeHtml(artifact.name)}</h2><p>${escapeHtml(artifact.description)}</p></span>
        <dl><div><dt>Built from</dt><dd>${artifact.sourceCount} sources</dd></div><div><dt>Guidance used</dt><dd>${artifact.categories.length} sections</dd></div><div><dt>Version</dt><dd>${state.brain.artifactVersion}</dd></div></dl>
      </header>
      <div class="brain-artifact-category-trail"><strong>Built across</strong>${artifact.categories.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      <div class="brain-artifact-body">${body}</div>
    </article>
  `;
}

function renderBrainGuidance() {
  if (state.brain.artifactStatus === "not-created") {
    const reviewReady = state.brain.processingComplete;
    return brainWorkspace(
      "Brand guidance",
      "This is where the stored, production-ready understanding of the brand will live.",
      `
        <section class="card brain-guidance-empty">
          <span class="brain-empty-mark small" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="eyebrow">Not ready yet</span>
          <h2>Complete onboarding to create your first stored version</h2>
          <p>${reviewReady ? "Finish the remaining review decisions, then the system can prepare Brand Brain v1 for your feedback and approval." : "Add sources and let the system organize them before reviewing your first Brand Brain draft."}</p>
          <button class="button primary" type="button" data-action="navigate-brain" data-screen="${reviewReady ? "brain" : "brain-sources"}">${reviewReady ? "Continue review" : "Add sources"}</button>
        </section>
      `,
    );
  }

  const ready = state.brain.artifactStatus === "ready";
  const candidateUpdate = !ready && state.brain.approvedResult && state.brain.approvedVersion < state.brain.artifactVersion;
  const section = guidanceSections.find((item) => item.id === state.brain.selectedGuidanceId) ?? guidanceSections[0];
  const commentCount = state.brain.guidanceComments.filter((comment) => !comment.resolved).length;
  return brainWorkspace(
    "Brand guidance",
    "Read what the Brand Brain understands, see why it reached each conclusion, and give feedback where it belongs.",
    `
      ${candidateUpdate ? `<section class="brain-source-update-callout"><span class="brain-status governed">Active v${state.brain.approvedVersion}</span><span><strong>You are reviewing candidate v${state.brain.artifactVersion}</strong><p>The approved version stays available to production. This candidate changes only after you approve it.</p></span></section>` : ""}
      <section class="card brain-artifact-header ${ready ? "ready" : ""}">
        <div>
          <span class="brain-status ${ready ? "success" : "governed"}">${ready ? "Ready for production" : "Draft for review"}</span>
          <h2>${escapeHtml(state.brandName)} Brand Brain v${state.brain.artifactVersion}</h2>
          <p>Built from ${brainSourceCount()} source items with ${brainResolvedCount()} review decisions attached.</p>
        </div>
        <div class="brain-artifact-meta">
          <span><strong>Created</strong>${escapeHtml(brainCreatedLabel())}</span>
          <span><strong>Sources</strong>${brainSourceCount()} items</span>
          <span><strong>Version</strong>${state.brain.artifactVersion}</span>
        </div>
      </section>

      <nav class="brain-guidance-view-switch" aria-label="Brand guidance view">
        <button class="${state.brain.guidanceView === "guidance" ? "active" : ""}" type="button" data-action="set-guidance-view" data-view="guidance"><span>Guidance</span><small>Read and edit the Brand Brain by category</small></button>
        <button class="${state.brain.guidanceView === "artifacts" ? "active" : ""}" type="button" data-action="set-guidance-view" data-view="artifacts"><span>Artifacts</span><small>Use composed dossiers, lived worlds, and stories</small></button>
      </nav>

      ${state.brain.guidanceView === "artifacts" ? renderBrainArtifactReader() : `

      <nav class="brain-guidance-tabs" role="tablist" aria-label="Brand guidance sections">
        ${guidanceSections.map((item) => `<button class="category-${item.id} ${item.id === section.id ? "active" : ""}" type="button" role="tab" aria-selected="${item.id === section.id}" data-action="select-guidance-tab" data-id="${item.id}"><span>${escapeHtml(item.name)}</span><small>${item.sourceCount} sources</small></button>`).join("")}
      </nav>

      <div class="brain-guidance-workspace">
        <article class="card brain-guidance-document">
          <header class="guidance-document-header">
            <span><span class="section-label">${escapeHtml(section.name)}</span><h2>${escapeHtml(section.summary)}</h2></span>
            <span class="brain-status success">Prepared</span>
          </header>

          <section class="guidance-document-section">
            <div class="guidance-section-heading"><span><span class="section-label">Synthesized guidance</span><h3>What the Brand Brain understands</h3></span><small>Comment on any passage to shape the next version.</small></div>
            <div class="guidance-prose">${section.prose.map((paragraph, index) => guidanceCommentBlock(section, paragraph, index)).join("")}</div>
          </section>

          <section class="guidance-document-section">
            <div class="guidance-section-heading"><span><span class="section-label">Working principles</span><h3>What should stay true</h3></span></div>
            <ol class="guidance-principles">${section.principles.map((principle, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(principle)}</strong></li>`).join("")}</ol>
          </section>

          <section class="guidance-document-section">
            <div class="guidance-section-heading"><span><span class="section-label">Source trail</span><h3>Why the system reached this view</h3></span><small>${section.sourceCount} connected source items</small></div>
            <div class="guidance-evidence-list">
              ${section.evidence.map((item) => `<article><span><strong>${escapeHtml(item.source)}</strong><small>${escapeHtml(item.ref)}</small></span><p>${escapeHtml(item.insight)}</p><span class="guidance-evidence-use"><strong>How it was used</strong>${escapeHtml(item.use)}</span></article>`).join("")}
            </div>
          </section>

          <section class="guidance-production-use">
            <span class="section-label">How production uses this section</span>
            <p>${escapeHtml(section.productionUse)}</p>
          </section>
        </article>

        <aside class="brain-guidance-rail">
          <section class="card guidance-artifacts-panel">
            <span class="section-label">Artifacts built from this guidance</span>
            <h2>What you can work with</h2>
            <p>These are durable references, not one-line summaries. They stay connected to this version and its source trail.</p>
            <div class="guidance-artifact-list">${section.artifacts.map((artifact, index) => guidanceArtifactCard(section, artifact, index)).join("")}</div>
          </section>

          <section class="card guidance-source-summary">
            <span class="section-label">How this section was shaped</span>
            <dl>
              <div><dt>Exact assets</dt><dd>Used as supplied</dd></div>
              <div><dt>Approved guidance</dt><dd>Followed where relevant</dd></div>
              <div><dt>Past work and research</dt><dd>Interpreted for patterns, not treated as rules</dd></div>
              <div><dt>References</dt><dd>Used for inspiration only</dd></div>
            </dl>
          </section>

          <section class="card brain-artifact-decision">
            <span class="section-label">${ready ? "Current status" : "Review status"}</span>
            <h2>${ready ? "Production can use this version" : commentCount ? `${commentCount} inline ${commentCount === 1 ? "comment" : "comments"} saved` : "Is this Brand Brain ready?"}</h2>
            <p>${ready ? "Future production packages can pin this exact version. Later edits will create a new version." : "Approve this stored version, comment directly on a passage, or leave overall feedback."}</p>
            ${
              ready
                ? `<button class="button secondary" type="button" data-action="navigate-brain" data-screen="chooser">Go to Design Studio</button>`
                : `
                  <button class="button primary" type="button" data-action="approve-brain-artifact">Approve for production</button>
                  ${commentCount ? `<button class="button secondary" type="button" data-action="create-comment-revision">Prepare revision from inline feedback</button>` : ""}
                  <button class="button" type="button" data-action="toggle-brain-feedback">Leave overall feedback</button>
                `
            }
            ${
              state.brain.feedbackOpen && !ready
                ? `
                  <div class="brain-feedback-form">
                    <label><span>What should change overall?</span><textarea data-action="brain-feedback" placeholder="Explain what feels incomplete, inaccurate, or unclear.">${escapeHtml(state.brain.feedbackDraft)}</textarea></label>
                    <button class="button secondary" type="button" data-action="create-brain-revision">Prepare a revised draft</button>
                  </div>
                `
                : ""
            }
          </section>
        </aside>
      </div>
      `}
    `,
  );
}

function renderBrainHistory() {
  const history = state.brain.history;
  return brainWorkspace(
    "History",
    "See how sources, decisions, feedback, and stored Brand Brain versions changed over time.",
    history.length
      ? `
        <section class="card brain-history-card">
          <div class="card-header"><h2>Brand Brain activity</h2><span class="mini-pill">${history.length} updates</span></div>
          <div class="brain-history-list">
            ${history
              .map(
                (item) => `
                  <article>
                    <span class="brain-history-marker ${escapeHtml(item.status ?? "")}"></span>
                    <span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p><small>${escapeHtml(item.time ?? "This session")}</small></span>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      `
      : `
        <section class="card brain-history-empty">
          <span class="eyebrow">No history yet</span>
          <h2>Your Brand Brain changes will be recorded here</h2>
          <p>Source batches, review decisions, feedback, approved versions, and future updates will stay visible instead of silently replacing earlier work.</p>
          <button class="button primary" type="button" data-action="navigate-brain" data-screen="brain-sources">Add your first sources</button>
        </section>
      `,
  );
}

function renderWorkspace() {
  const approved = approvedBrainForProduction();
  const hasBrain = Boolean(currentSynthesisResult);
  const dossier = brainArtifacts.find((a) => a.id === "dossier");
  const palette = dossier?.palette || [];
  const guardrails = dossier?.guardrails || [];
  const sourceCount = state.brain.sources.reduce((total, s) => total + s.count, 0);
  const brainVersion = state.brain.approvedVersion || state.brain.artifactVersion || 0;
  const brainDate = brainCreatedLabel();
  const candidateRules = state.production.candidateRules || [];
  const pendingCandidates = candidateRules.filter((r) => !r.dismissed);
  const affectedOutputs = state.outputs.filter((o) => o.status === "approved" && o.brainVersion < state.brain.approvedVersion);
  const productAffectedOutputs = outputsAffectedByProductVersion();
  const unresolvedExceptions = state.brain.processingComplete
    ? brainExceptions.filter((item) => !state.brain.resolutions[item.id])
    : [];
  const recentOutputs = state.outputs
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 6);
  const campaigns = state.campaigns || [];

  const needsAttention = [
    ...unresolvedExceptions.map((e) => ({
      kind: "exception",
      label: e.title,
      detail: e.summary || e.typeLabel,
      pill: e.typeLabel || "Needs review",
      pillClass: "pill-warning",
      action: "navigate-brain",
      screen: "brain",
    })),
    ...affectedOutputs.map((o) => ({
      kind: "affected",
      label: o.label || "Untitled output",
      detail: `Made with Brand Brain v${o.brainVersion}. Current version is v${state.brain.approvedVersion}.`,
      pill: `v${o.brainVersion}`,
      pillClass: "pill-warning",
      action: "preview-output",
      id: o.id,
    })),
    ...productAffectedOutputs.map((o) => ({
      kind: "product-affected",
      label: o.label || "Untitled output",
      detail: `Made with ${o.package.product.product_name} v${o.package.product.version}. Product record has been revised.`,
      pill: `Product v${o.package.product.version}`,
      pillClass: "pill-warning",
      action: "preview-output",
      id: o.id,
    })),
    ...pendingCandidates.map((r) => ({
      kind: "candidate",
      label: r.scope === "brand-rule" ? "Brand rule proposal" : "Candidate rule",
      detail: r.text || "Pending review",
      pill: r.scope === "brand-rule" ? "Brand rule" : "Candidate",
      pillClass: "pill-governed",
      action: "",
    })),
  ];

  // Brand context header (only when brain exists)
  const brandContext = hasBrain ? `
    <section class="ws-brand-context">
      <div class="ws-brand-header">
        <div>
          <h2 class="ws-brand-name">${escapeHtml(state.brandName)}</h2>
          <p class="ws-brand-meta">${escapeHtml(state.brandDescription || "")}</p>
        </div>
        <div class="ws-brain-status">
          <span class="mini-pill ${approved ? "pill-success" : "pill-neutral"}">${approved ? `Brain v${brainVersion}` : "Draft"}</span>
          <span class="ws-brain-date">${sourceCount} sources · ${escapeHtml(brainDate)}</span>
        </div>
      </div>
      ${palette.length ? `
        <div class="ws-palette">
          ${palette.map((c) => `<span class="ws-swatch" style="background: ${c.color}" title="${escapeHtml(c.name)}: ${escapeHtml(c.role)}"></span>`).join("")}
          <span class="ws-palette-label">${palette.map((c) => c.name).join(", ")}</span>
        </div>
      ` : ""}
      ${guardrails.length ? `
        <div class="ws-guardrails">
          ${guardrails.map((g) => `<span class="mini-pill pill-coral">${escapeHtml(g.title)}</span>`).join("")}
        </div>
      ` : ""}
    </section>
  ` : "";

  // Needs attention
  const attentionSection = needsAttention.length ? `
    <section class="card ws-attention-card">
      <div class="card-header">
        <h2>Needs attention</h2>
        <span class="mini-pill pill-warning">${needsAttention.length}</span>
      </div>
      <div class="ws-attention-list">
        ${needsAttention.map((item) => `
          <${item.action ? "button" : "div"} class="ws-attention-item" ${item.action ? `type="button" data-action="${item.action}" ${item.screen ? `data-screen="${item.screen}"` : ""} ${item.id ? `data-id="${item.id}"` : ""}` : ""}>
            <span class="mini-pill ${item.pillClass}">${escapeHtml(item.pill)}</span>
            <span class="ws-attention-text">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.detail)}</span>
            </span>
          </${item.action ? "button" : "div"}>
        `).join("")}
      </div>
    </section>
  ` : "";

  // Recent work
  const workSection = recentOutputs.length ? `
    <section class="card">
      <div class="card-header">
        <h2>Recent work</h2>
        <span class="mini-pill">${state.outputs.length} ${state.outputs.length === 1 ? "output" : "outputs"}</span>
      </div>
      <div class="ws-output-grid">
        ${recentOutputs.map((o) => `
          <button class="ws-output-card" type="button" data-action="preview-output" data-id="${o.id}">
            ${o.imageUrl
              ? `<span class="ws-output-thumb"><img src="${escapeHtml(o.imageUrl)}" alt="" onerror="this.closest('.ws-output-thumb').classList.add('ws-thumb-missing'); this.remove();"></span>`
              : `<span class="ws-output-thumb ws-thumb-empty"></span>`}
            <span class="ws-output-info">
              <strong>${escapeHtml(o.label || "Untitled")}</strong>
              <span>${escapeHtml(o.campaignName || o.channel || "")}${o.format ? ` · ${escapeHtml(o.format)}` : ""}</span>
            </span>
            <span class="mini-pill ${o.status === "approved" ? "pill-success" : "pill-neutral"}">${o.status === "approved" ? "Approved" : "Draft"}</span>
          </button>
        `).join("")}
      </div>
    </section>
  ` : "";

  // Campaigns
  const campaignSection = campaigns.length ? `
    <section class="card">
      <div class="card-header">
        <h2>Campaigns</h2>
        <span class="mini-pill">${campaigns.length}</span>
      </div>
      <div class="ws-campaign-list">
        ${campaigns.map((c) => {
          const count = outputsForCampaign(c.id).length;
          return `
            <button class="ws-campaign-item" type="button" data-action="open-campaign" data-id="${c.id}">
              <span class="ws-campaign-info">
                <strong>${escapeHtml(c.name)}</strong>
                <span>${escapeHtml(c.objective || c.description || "")}</span>
              </span>
              <span class="mini-pill">${count} ${count === 1 ? "output" : "outputs"}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  ` : "";

  // Quick starts
  const quickStarts = `
    <section class="ws-quick-starts">
      <button class="card ws-quick-card" type="button" data-action="chooser">
        <strong>Design Studio</strong>
        <span>Create social images, ad assets, product showcases, and more from the approved Brand Brain.</span>
      </button>
      <button class="card ws-quick-card" type="button" data-action="brand-brain">
        <strong>${hasBrain ? "Review the Brand Brain" : "Build the Brand Brain"}</strong>
        <span>${hasBrain ? "Review guidance, resolve exceptions, or add new sources." : "Add sources and build brand intelligence."}</span>
      </button>
    </section>
  `;

  // Guidance summary on sidebar
  const guidanceSummary = hasBrain && guidanceSections.length ? `
    <section class="card">
      <div class="card-header">
        <h2>Brand guidance</h2>
        <button class="button ghost compact" type="button" data-action="brand-brain">View all</button>
      </div>
      <ul class="exact-list">
        ${guidanceSections.map((s) => `
          <li>
            <strong>${escapeHtml(s.name)}</strong>
            <span>${escapeHtml(s.summary)}</span>
          </li>
        `).join("")}
      </ul>
    </section>
  ` : "";

  // Not-yet-built brain state
  if (!hasBrain) {
    return shell(`
      <section class="workspace">
        ${pageHeader("Workspace", "Your brand starts here. Add sources and build the Brand Brain to start producing.")}
        ${quickStarts}
      </section>
    `);
  }

  return shell(`
    <section class="workspace">
      ${pageHeader("Workspace", "")}
      ${brandContext}
      <div class="content-grid">
        <div>
          ${attentionSection}
          ${workSection}
          ${campaignSection}
          ${quickStarts}
        </div>
        <aside>
          ${guidanceSummary}
        </aside>
      </div>
    </section>
  `);
}

function renderChooser() {
  const approved = approvedBrainForProduction();
  const affectedOutputs = state.outputs.filter((o) => o.status === "approved" && o.brainVersion < state.brain.approvedVersion);
  const productAffectedOutputs = outputsAffectedByProductVersion();

  const recentOutputs = state.outputs
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 6);

  const categoryCards = studioCategories.map((cat) => `
    <button class="card studio-card ${!approved ? "unavailable" : ""}" type="button" data-action="select-studio-category" data-id="${cat.id}" ${!approved ? "disabled" : ""}>
      <span class="studio-card-icon studio-icon-${cat.icon}" aria-hidden="true"></span>
      <div class="studio-card-body">
        <h2>${escapeHtml(cat.name)}</h2>
        <p>${escapeHtml(cat.description)}</p>
      </div>
    </button>
  `).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "Design Studio",
        approved
          ? `${state.brandName} Brand Brain v${state.brain.approvedVersion} is ready. Each type carries its own format options, composition rules, and production knowledge.`
          : `Build and approve the ${state.brandName} Brand Brain first, then start creating.`,
      )}
      ${state.production.job?.status === "complete" && !state.production.approved && !state.production.bannerDismissed ? `<section class="production-resume"><span><strong>Your latest output is saved</strong><small>${escapeHtml(state.production.job.generationPackage?.output?.format || "Generated output")} · ${escapeHtml(state.production.job.model || "OpenAI")}</small></span><button class="button" type="button" data-action="view-latest-result">View result</button></section>` : ""}
      ${affectedOutputs.length ? `
        <details class="card collapsible-card affected-outputs-card">
          <summary class="card-header collapsible-header">
            <h2>Outputs using an earlier Brand Brain version</h2>
            <span class="collapsible-meta"><span class="mini-pill pill-warning">${affectedOutputs.length} ${affectedOutputs.length === 1 ? "output" : "outputs"} on v${affectedOutputs[0].brainVersion}</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
          </summary>
          <div class="affected-outputs-list">
            ${affectedOutputs.map((o) => `
              <div class="rule">
                <span class="mini-pill pill-warning">v${o.brainVersion}</span>
                <span><strong>${escapeHtml(o.label || `${o.output.placement} ${o.output.format}`)}</strong><span>Made with Brand Brain v${o.brainVersion}. Current version is v${state.brain.approvedVersion}.${o.lockedAsset ? ` Used ${o.lockedAsset.name}.` : ""}</span></span>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
      ${productAffectedOutputs.length ? `
        <details class="card collapsible-card affected-outputs-card">
          <summary class="card-header collapsible-header">
            <h2>Outputs using an earlier product record version</h2>
            <span class="collapsible-meta"><span class="mini-pill pill-warning">${productAffectedOutputs.length} ${productAffectedOutputs.length === 1 ? "output" : "outputs"} on older product version</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
          </summary>
          <div class="affected-outputs-list">
            ${productAffectedOutputs.map((o) => `
              <div class="rule">
                <span class="mini-pill pill-warning">Product v${escapeHtml(String(o.package.product.version))}</span>
                <span><strong>${escapeHtml(o.label || "Untitled output")}</strong><span>Made with ${escapeHtml(o.package.product.product_name)} v${escapeHtml(String(o.package.product.version))}. That product record has been revised.</span></span>
              </div>
            `).join("")}
          </div>
        </details>
      ` : ""}
      <div class="studio-grid">${categoryCards}</div>
      ${recentOutputs.length ? `
      <section class="card studio-recent-card">
        <div class="card-header">
          <h2>Recent work</h2>
          <span class="mini-pill">${state.outputs.length} ${state.outputs.length === 1 ? "output" : "outputs"}</span>
        </div>
        <div class="ws-output-grid">
          ${recentOutputs.map((o) => `
            <button class="ws-output-card" type="button" data-action="preview-output" data-id="${o.id}">
              ${o.imageUrl
                ? `<span class="ws-output-thumb"><img src="${escapeHtml(o.imageUrl)}" alt="" onerror="this.closest('.ws-output-thumb').classList.add('ws-thumb-missing'); this.remove();"></span>`
                : `<span class="ws-output-thumb ws-thumb-empty"></span>`}
              <span class="ws-output-info">
                <strong>${escapeHtml(o.label || "Untitled")}</strong>
                <span>${escapeHtml(o.campaignName || o.channel || "")}${o.format ? ` &middot; ${escapeHtml(o.format)}` : ""}</span>
              </span>
              <span class="mini-pill ${o.status === "approved" ? "pill-success" : "pill-neutral"}">${o.status === "approved" ? "Approved" : "Draft"}</span>
            </button>
          `).join("")}
        </div>
      </section>
      ` : ""}
    </section>
  `);
}

function studioActiveFormatCount() {
  return state.studio.activeFormats.length;
}

function renderStudioSetup() {
  const approved = approvedBrainForProduction();
  const cat = studioCategories.find((c) => c.id === state.studio.category);
  if (!cat) return renderChooser();

  // Brand template has its own setup flow
  if (cat.id === "template") {
    return renderTemplateSetup(cat);
  }

  // Sales enablement has its own setup flow
  if (cat.id === "sales") {
    return renderSalesSetup(cat);
  }

  // Social image is the first implemented category
  if (cat.id !== "social") {
    return shell(`
      <section class="workspace">
        ${pageHeader(cat.name, cat.description)}
        <section class="card">
          <div class="card-header"><h2>Coming soon</h2></div>
          <p class="page-description">This category is defined in the output type catalog but does not have a setup flow yet. Use the legacy production flow for now.</p>
        </section>
        <div class="actions">
          <button class="button" type="button" data-action="back-to-studio">&lsaquo; Design Studio</button>
          <button class="button primary" type="button" data-action="studio-use-legacy">Use legacy flow</button>
        </div>
      </section>
    `);
  }

  const campaigns = state.campaigns || [];
  const platforms = state.studio.platforms;
  const activeFormats = state.studio.activeFormats;
  const activeCount = activeFormats.length;
  const hasFormats = activeCount > 0;

  // Build format groups by platform
  const formatGroupsHtml = platforms.map((platformId) => {
    const platform = studioPlatformFormats[platformId];
    if (!platform) return "";
    const platformHasActive = platform.formats.some((f) => activeFormats.includes(f.id));
    return `
      <div class="studio-format-group">
        <span class="studio-format-group-label">${escapeHtml(platform.label)}</span>
        <div class="studio-format-tags">
          ${platform.formats.map((f) => {
            const isActive = activeFormats.includes(f.id);
            return `
              <button class="studio-format-tag ${isActive ? "active" : "inactive"}" type="button" data-action="toggle-studio-format" data-id="${f.id}" data-platform="${platformId}">
                <span>${escapeHtml(f.name)}</span>
                <span class="studio-format-ratio">${escapeHtml(f.ratio)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${!platformHasActive ? `<span class="studio-format-warning">No formats selected for ${escapeHtml(platform.label)}. Pick at least one, or deselect the platform.</span>` : ""}
      </div>
    `;
  }).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(cat.name, "Describe what you need and pick platforms. The system handles sizes, safe zones, and composition for each format.")}

      <div class="content-grid">
        <div>
          <section class="card">
            <div class="card-header"><h2>Your brief</h2></div>

            <div class="field-grid">
              <div class="field full">
                <label for="studio-brief">What are you making?</label>
                <textarea id="studio-brief" data-action="studio-brief-input" placeholder="Spring collection lifestyle shot with the Yuzu Ginger product on a wooden surface, warm afternoon light">${escapeHtml(state.studio.brief)}</textarea>
              </div>

              <div class="field full">
                <label>Platforms</label>
                <div class="studio-platform-grid">
                  ${Object.entries(studioPlatformFormats).map(([id, p]) => `
                    <button class="studio-platform-chip ${platforms.includes(id) ? "selected" : ""}" type="button" data-action="toggle-studio-platform" data-id="${id}">
                      ${escapeHtml(p.label)}
                    </button>
                  `).join("")}
                </div>
              </div>

              ${platforms.length ? `
                <div class="field full">
                  <div class="studio-formats-panel">
                    <div class="studio-formats-header">
                      <span class="section-label">Output formats</span>
                      <span class="mini-pill">${activeCount} ${activeCount === 1 ? "image" : "images"}</span>
                    </div>
                    ${formatGroupsHtml}
                  </div>
                </div>

                <div class="field full">
                  <button class="studio-toggle-row" type="button" data-action="toggle-studio-text-overlay">
                    <span class="studio-toggle-track ${state.studio.textOverlay ? "on" : ""}"><span class="studio-toggle-knob"></span></span>
                    <span class="studio-toggle-content">
                      <strong>This image will have text on it</strong>
                      <span class="field-note">Adjusts composition to leave space for headlines or captions you add in your layout tool.</span>
                      ${state.studio.textOverlay ? `<span class="field-note studio-toggle-detail">The system keeps the subject clear of text-safe zones. You place text in Canva, Figma, or your design tool after export.</span>` : ""}
                    </span>
                  </button>
                </div>
              ` : ""}

              <div class="field full">
                <label for="studio-campaign">Campaign</label>
                <div class="studio-campaign-row">
                  <select id="studio-campaign" data-action="studio-campaign-change">
                    <option value="">No campaign</option>
                    ${campaigns.map((c) => `<option value="${escapeHtml(c.id)}" ${state.studio.campaignId === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
                  </select>
                  <span class="field-note">Optional. Links to a campaign direction.</span>
                </div>
              </div>
            </div>

            ${state.studio.captionOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Post caption</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="captionOpen" aria-label="Remove post caption">&times;</button>
                </div>
                <div class="studio-additive-header">
                  <span class="field-note">Text that accompanies the image in the feed. Not rendered on the image.</span>
                  <span class="field-note">Governed by brand voice</span>
                </div>
                <textarea data-action="studio-caption-input" placeholder="Write your post text, or leave blank to draft from your Brand Brain">${escapeHtml(state.studio.caption)}</textarea>
                <span class="field-note">Approved claims available. Prohibited claims blocked.</span>
              </div>
            ` : ""}

            ${state.studio.referenceOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Reference image</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="referenceOpen" aria-label="Remove reference image">&times;</button>
                </div>
                <div class="studio-dropzone">
                  Drop an image or click to browse
                </div>
                <span class="field-note">Used as creative direction, not source material. Provenance and influence tracked.</span>
              </div>
            ` : ""}

            ${state.studio.directionOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Creative direction</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="directionOpen" aria-label="Remove creative direction">&times;</button>
                </div>
                <p class="field-note field-spaced">Art direction beyond the Brand Brain. This job only.</p>
                <textarea data-action="studio-direction-input" placeholder="Mood, lighting, composition preferences.">${escapeHtml(state.studio.direction)}</textarea>
              </div>
            ` : ""}

            <div class="studio-additive-links">
              ${!state.studio.captionOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="captionOpen">+ Add post caption</button>` : ""}
              ${!state.studio.referenceOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="referenceOpen">+ Add reference image</button>` : ""}
              ${!state.studio.directionOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="directionOpen">+ Add creative direction</button>` : ""}
            </div>
          </section>
        </div>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>Guidance applied</h2>
              <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list">
              <li><strong>${escapeHtml(state.brandName)} foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "foundation")?.summary || "Approve the Brand Brain to use this guidance")}</span></li>
              <li><strong>Identity direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "identity")?.summary || "Not active")}</span></li>
              <li><strong>Creative direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "creative")?.summary || "Not active")}</span></li>
            </ul>
          </section>
          ${state.studio.campaignId ? (() => {
            const campaign = campaigns.find((c) => c.id === state.studio.campaignId);
            return campaign ? `
            <section class="card surface-accent surface-accent-governed">
              <div class="card-header">
                <h2>Campaign direction</h2>
                <span class="mini-pill pill-governed">${escapeHtml(campaign.name)}</span>
              </div>
              <ul class="exact-list">
                ${campaign.campaignIdea ? `<li><strong>Campaign idea</strong><span>${escapeHtml(campaign.campaignIdea)}</span></li>` : ""}
                ${campaign.messageTerritory ? `<li><strong>Message territory</strong><span>${escapeHtml(campaign.messageTerritory)}</span></li>` : ""}
                ${campaign.explore ? `<li><strong>Explore</strong><span>${escapeHtml(campaign.explore)}</span></li>` : ""}
              </ul>
            </section>
            ` : "";
          })() : ""}
          <div class="studio-aside-note">
            <span class="field-note">Brand Brain, palette, and production knowledge applied automatically per format.</span>
          </div>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="back-to-studio">&lsaquo; Design Studio</button>
        <button class="button primary" type="button" data-action="studio-continue-preflight" ${hasFormats && approved ? "" : "disabled"}>Continue to preflight &rsaquo;</button>
      </div>
    </section>
  `);
}

function renderTemplateSetup(cat) {
  const approved = approvedBrainForProduction();
  const campaigns = state.campaigns || [];
  const targetUses = state.studio.targetUses;
  const templateFormats = state.studio.templateFormats;
  const hasFormats = templateFormats.length > 0;

  // Build format groups by target use
  const formatGroupsHtml = targetUses.map((useId) => {
    const use = studioTemplateFormats[useId];
    if (!use) return "";
    const useHasActive = use.formats.some((f) => templateFormats.includes(f.id));
    return `
      <div class="studio-format-group">
        <span class="studio-format-group-label">${escapeHtml(use.label)}</span>
        <div class="studio-format-tags">
          ${use.formats.map((f) => {
            const isActive = templateFormats.includes(f.id);
            return `
              <button class="studio-format-tag ${isActive ? "active" : "inactive"}" type="button" data-action="toggle-template-format" data-id="${f.id}" data-use="${useId}">
                <span>${escapeHtml(f.name)}</span>
                <span class="studio-format-ratio">${escapeHtml(f.ratio)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${!useHasActive ? `<span class="studio-format-warning">No formats selected for ${escapeHtml(use.label)}. Pick at least one, or deselect the use.</span>` : ""}
      </div>
    `;
  }).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(cat.name, "Create a reusable surface, environment, or composition foundation. Approved templates become locked assets available as inputs for future production.")}

      <div class="content-grid">
        <div>
          <section class="card">
            <div class="card-header"><h2>Your brief</h2></div>

            <div class="field-grid">
              <div class="field full">
                <label for="studio-brief">Describe the surface</label>
                <span class="field-note">What it looks like and where to leave open space for elements and text.</span>
                <textarea id="studio-brief" data-action="studio-brief-input" placeholder="Dark gradient using our navy and teal, lighter at the top third. Leave the bottom two-thirds open for product placement and text.">${escapeHtml(state.studio.brief)}</textarea>
              </div>

              <div class="field full">
                <label>Where will this be used?</label>
                <span class="field-note">Pick one or more. Drives output sizes and composition rules.</span>
                <div class="studio-platform-grid">
                  ${Object.entries(studioTemplateFormats).map(([id, u]) => `
                    <button class="studio-platform-chip ${targetUses.includes(id) ? "selected" : ""}" type="button" data-action="toggle-template-use" data-id="${id}">
                      ${escapeHtml(u.label)}
                    </button>
                  `).join("")}
                </div>
              </div>

              ${targetUses.length ? `
                <div class="field full">
                  <div class="studio-formats-panel">
                    <div class="studio-formats-header">
                      <span class="section-label">Output formats</span>
                      <span class="mini-pill">${templateFormats.length} ${templateFormats.length === 1 ? "image" : "images"}</span>
                    </div>
                    ${formatGroupsHtml}
                  </div>
                </div>
              ` : ""}

              <div class="field full">
                <label for="studio-campaign">Campaign</label>
                <div class="studio-campaign-row">
                  <select id="studio-campaign" data-action="studio-campaign-change">
                    <option value="">No campaign</option>
                    ${campaigns.map((c) => `<option value="${escapeHtml(c.id)}" ${state.studio.campaignId === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
                  </select>
                  <span class="field-note">Optional. Links to a campaign direction.</span>
                </div>
              </div>
            </div>

            ${state.studio.referenceOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Reference image</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="referenceOpen" aria-label="Remove reference image">&times;</button>
                </div>
                <span class="field-note">A surface or texture to draw from. Used as creative direction, not copied.</span>
                <div class="studio-dropzone">
                  Drop an image or click to browse
                </div>
              </div>
            ` : ""}

            ${state.studio.directionOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Creative direction</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="directionOpen" aria-label="Remove creative direction">&times;</button>
                </div>
                <p class="field-note field-spaced">Art direction beyond the Brand Brain. This job only.</p>
                <textarea data-action="studio-direction-input" placeholder="Moody, atmospheric. Inspired by the studio lighting in our spring campaign photography.">${escapeHtml(state.studio.direction)}</textarea>
              </div>
            ` : ""}

            <div class="studio-additive-links">
              ${!state.studio.referenceOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="referenceOpen">+ Add reference image</button>` : ""}
              ${!state.studio.directionOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="directionOpen">+ Add creative direction</button>` : ""}
            </div>
          </section>
        </div>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>How templates are evaluated</h2>
            </div>
            <ul class="exact-list">
              <li>Works as a foundation for placing elements and text on top</li>
              <li>Open zones are clear and usable at all selected sizes</li>
              <li>Crops well across the target aspect ratios</li>
              <li>No generated text or lettering</li>
            </ul>
            <p class="field-note" style="margin-top: var(--space-3);">The system evaluates whether the surface supports composition, not whether it stands on its own as a finished image.</p>
          </section>
          <section class="card">
            <div class="card-header">
              <h2>Guidance applied</h2>
              <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list">
              <li><strong>${escapeHtml(state.brandName)} foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "foundation")?.summary || "Not active")}</span></li>
              <li><strong>Identity direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "identity")?.summary || "Not active")}</span></li>
              <li><strong>Creative direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "creative")?.summary || "Not active")}</span></li>
            </ul>
          </section>
          ${state.studio.campaignId ? (() => {
            const campaign = campaigns.find((c) => c.id === state.studio.campaignId);
            return campaign ? `
            <section class="card surface-accent surface-accent-governed">
              <div class="card-header">
                <h2>Campaign direction</h2>
                <span class="mini-pill pill-governed">${escapeHtml(campaign.name)}</span>
              </div>
              <ul class="exact-list">
                ${campaign.campaignIdea ? `<li><strong>Campaign idea</strong><span>${escapeHtml(campaign.campaignIdea)}</span></li>` : ""}
                ${campaign.messageTerritory ? `<li><strong>Message territory</strong><span>${escapeHtml(campaign.messageTerritory)}</span></li>` : ""}
                ${campaign.explore ? `<li><strong>Explore</strong><span>${escapeHtml(campaign.explore)}</span></li>` : ""}
              </ul>
            </section>
            ` : "";
          })() : ""}
          <div class="studio-aside-note">
            <span class="field-note">Brand Brain, palette, and production knowledge applied automatically per format.</span>
          </div>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="back-to-studio">&lsaquo; Design Studio</button>
        <button class="button primary" type="button" data-action="template-continue-preflight" ${hasFormats && approved ? "" : "disabled"}>Continue to preflight &rsaquo;</button>
      </div>
    </section>
  `);
}

// Lightweight DOM update for the sales preflight validation message. Called on
// textarea input so the button hint updates without a full re-render (which
// would wipe the textarea cursor position).
function updateSalesReadyState() {
  const msg = document.getElementById("sales-validation-msg");
  if (!msg) return;
  const approved = !!approvedBrainForProduction();
  const hasElement = (state.studio.salesElement || "").trim().length > 0;
  const canProceed = approved && hasElement;
  msg.classList.toggle("is-hidden", canProceed);
  if (!canProceed) {
    msg.textContent = approved ? "Describe the content element to continue." : "Approve the Brand Brain before producing.";
  }
}

function renderSalesSetup(cat) {
  const approved = approvedBrainForProduction();
  const campaigns = state.campaigns || [];
  const fmt = salesOutputFormats[state.studio.salesFormat] || salesOutputFormats["slide-16x9"];

  // Find templates tagged in the brain sources, filtered by the selected format ratio
  const templates = productionTemplates(fmt.ratio);
  // Resolve any missing thumbnail URLs in the background; re-renders when ready.
  const unresolvedThumbs = templates.filter((t) => !t.thumbUrl && t.blobPathname).map((t) => t.blobPathname);
  if (unresolvedThumbs.length) void ensureThumbnailUrls(unresolvedThumbs);

  const selectedTemplate = templates.find((t) => t.id === state.studio.salesTemplateId);
  const hasElement = (state.studio.salesElement || "").trim().length > 0;
  const canProceed = approved && hasElement;

  return shell(`
    <section class="workspace">
      ${pageHeader(cat.name, "Pick a template, describe the content element, and the system generates a polished visual on your branded background.")}

      <div class="content-grid">
        <div>
          <section class="card">
            <div class="card-header"><h2>Setup</h2></div>

            <div class="field-grid">
              <div class="field full">
                <label>Output format</label>
                <span class="field-note">Determines dimensions and which templates are available.</span>
                <div class="studio-platform-grid">
                  ${Object.entries(salesOutputFormats).map(([id, f]) => `
                    <button class="studio-platform-chip ${state.studio.salesFormat === id ? "selected" : ""}" type="button" data-action="sales-set-format" data-id="${id}">
                      ${escapeHtml(f.label)}
                    </button>
                  `).join("")}
                </div>
                <div style="margin-top: var(--space-2);">
                  <span class="mini-pill">${escapeHtml(fmt.dim)}</span>
                  <span class="mini-pill">${escapeHtml(fmt.ratio)}</span>
                </div>
              </div>

              <div class="field full">
                <label>Background template</label>
                <span class="field-note">Uploaded during brain build and tagged as templates. The selected template becomes the locked background layer.</span>
                ${templates.length ? `
                  <div class="sales-template-grid">
                    ${templates.map((t) => `
                      <button class="sales-template-card ${state.studio.salesTemplateId === t.id ? "selected" : ""}" type="button" data-action="sales-select-template" data-id="${t.id}">
                        <span class="sales-template-thumb">${t.thumbUrl ? `<img src="${escapeHtml(t.thumbUrl)}" alt="">` : ""}</span>
                        <span class="sales-template-name">${escapeHtml(t.name)}</span>
                      </button>
                    `).join("")}
                  </div>
                ` : `
                  <div class="sales-empty-templates">
                    <p>No templates uploaded yet.</p>
                    <p class="field-note">Upload branded backgrounds during the Brand Brain build, then tag them as templates with their dimensions. They will appear here as selectable locked backgrounds.</p>
                    <span class="field-note">You can still generate a content element without a template. The element will be produced on a transparent or brand-colored background.</span>
                  </div>
                `}
              </div>

              <div class="field full">
                <label for="sales-element">Content element</label>
                <span class="field-note">What should be generated on top of the template. Describe the visual, not the copy.</span>
                <textarea id="sales-element" data-action="sales-element-input" placeholder="A premium phone mockup showing a text conversation between the system and a patient confirming an appointment. The phone should look modern and high-end, angled slightly.">${escapeHtml(state.studio.salesElement)}</textarea>
              </div>

              <div class="field full">
                <label for="sales-product">Product record</label>
                <span class="field-note">Pick an approved product to pull in its governed claims, exclusions, and visual direction. Add a product on the Products screen.</span>
                <div class="studio-campaign-row">
                  <select id="sales-product" data-action="sales-product-change">
                    <option value="">No product record</option>
                    ${approvedProducts().map((p) => `<option value="${escapeHtml(p.product_id)}" ${state.studio.salesProductId === p.product_id ? "selected" : ""}>${escapeHtml(p.product_name)}</option>`).join("")}
                  </select>
                  <span class="field-note">${approvedProducts().length ? "" : "No approved products yet."}</span>
                </div>
              </div>

              <div class="field full">
                <label for="sales-feature">Feature focus</label>
                <span class="field-note">Optional. A specific feature or angle to emphasize. Free text.</span>
                <input id="sales-feature" type="text" data-action="sales-feature-input" placeholder="RCS messaging, appointment reminders, two-way texting..." value="${escapeHtml(state.studio.salesFeature)}">
              </div>

              <div class="field full">
                <label for="sales-campaign">Campaign</label>
                <div class="studio-campaign-row">
                  <select id="sales-campaign" data-action="studio-campaign-change">
                    <option value="">No campaign</option>
                    ${campaigns.map((c) => `<option value="${escapeHtml(c.id)}" ${state.studio.campaignId === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}
                  </select>
                  <span class="field-note">Optional. Links to a campaign direction.</span>
                </div>
              </div>
            </div>

            ${state.studio.referenceOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Reference image</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="referenceOpen" aria-label="Remove reference image">&times;</button>
                </div>
                <span class="field-note">A visual reference for the content element. Used as creative direction, not copied.</span>
                <div class="studio-dropzone">
                  Drop an image or click to browse
                </div>
              </div>
            ` : ""}

            ${state.studio.directionOpen ? `
              <div class="studio-additive-section">
                <div class="studio-additive-header">
                  <span class="section-label">Creative direction</span>
                  <button class="studio-section-close" type="button" data-action="studio-close-section" data-section="directionOpen" aria-label="Remove creative direction">&times;</button>
                </div>
                <p class="field-note field-spaced">Art direction for the content element. This job only.</p>
                <textarea data-action="studio-direction-input" placeholder="High-end product photography feel. Studio lighting, subtle reflections on the screen.">${escapeHtml(state.studio.direction)}</textarea>
              </div>
            ` : ""}

            <div class="studio-additive-links">
              ${!state.studio.referenceOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="referenceOpen">+ Add reference image</button>` : ""}
              ${!state.studio.directionOpen ? `<button class="studio-add-link" type="button" data-action="studio-toggle-section" data-section="directionOpen">+ Add creative direction</button>` : ""}
            </div>
          </section>
        </div>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>How this works</h2>
            </div>
            <ul class="exact-list">
              <li><strong>Template</strong><span>Locked background. Placed exactly, never regenerated.</span></li>
              <li><strong>Element</strong><span>Generated content (device mockup, feature graphic, product shot) composed on top.</span></li>
              <li><strong>Result</strong><span>A single composed image ready for your slide or one-pager.</span></li>
            </ul>
            <p class="field-note" style="margin-top: var(--space-3);">The system applies backend production knowledge to make the element look premium: lighting, reflections, perspective, and scale that match the template.</p>
          </section>
          ${selectedTemplate ? `
            <section class="card surface-accent">
              <div class="card-header">
                <h2>Selected template</h2>
                <span class="mini-pill pill-governed">Locked</span>
              </div>
              <p>${escapeHtml(selectedTemplate.name)}</p>
              <p class="field-note">${escapeHtml(selectedTemplate.ratio)} &middot; Placed exactly as approved</p>
            </section>
          ` : ""}
          <section class="card">
            <div class="card-header">
              <h2>Guidance applied</h2>
              <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list">
              <li><strong>${escapeHtml(state.brandName)} foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "foundation")?.summary || "Not active")}</span></li>
              <li><strong>Identity direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "identity")?.summary || "Not active")}</span></li>
            </ul>
          </section>
          ${state.studio.campaignId ? (() => {
            const campaign = campaigns.find((c) => c.id === state.studio.campaignId);
            return campaign ? `
            <section class="card surface-accent surface-accent-governed">
              <div class="card-header">
                <h2>Campaign direction</h2>
                <span class="mini-pill pill-governed">${escapeHtml(campaign.name)}</span>
              </div>
              <ul class="exact-list">
                ${campaign.campaignIdea ? `<li><strong>Campaign idea</strong><span>${escapeHtml(campaign.campaignIdea)}</span></li>` : ""}
                ${campaign.messageTerritory ? `<li><strong>Message territory</strong><span>${escapeHtml(campaign.messageTerritory)}</span></li>` : ""}
              </ul>
            </section>
            ` : "";
          })() : ""}
          <div class="studio-aside-note">
            <span class="field-note">Brand Brain and production knowledge applied automatically to the generated element.</span>
          </div>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="back-to-studio">&lsaquo; Design Studio</button>
        <button id="sales-preflight-btn" class="button primary" type="button" data-action="sales-continue-preflight">Continue to preflight &rsaquo;</button>
      </div>
      <p id="sales-validation-msg" class="field-note sales-validation ${canProceed ? "is-hidden" : ""}">${approved ? "Describe the content element to continue." : "Approve the Brand Brain before producing."}</p>
    </section>
  `);
}

function renderCampaigns() {
  const campaigns = state.campaigns;
  const approved = approvedBrainForProduction();

  const campaignCards = campaigns.map((campaign) => {
    const outputs = outputsForCampaign(campaign.id);
    const approvedCount = outputs.filter((o) => o.status === "approved").length;
    const thumbs = outputs.filter((o) => o.imageUrl).slice(0, 4);
    return `
      <button class="card chooser-card" type="button" data-action="open-campaign" data-id="${escapeHtml(campaign.id)}">
        <div class="card-header">
          <h2>${escapeHtml(campaign.name)}</h2>
          <span class="mini-pill">${outputs.length} ${outputs.length === 1 ? "output" : "outputs"}</span>
        </div>
        <p>${escapeHtml(campaign.description)}</p>
        ${thumbs.length ? `
          <div class="campaign-card-thumbs">
            ${thumbs.map((o) => `<span class="campaign-card-thumb"><img src="${escapeHtml(o.imageUrl)}" alt="" onerror="this.closest('.campaign-card-thumb').classList.add('ws-thumb-missing'); this.remove();"></span>`).join("")}
          </div>
        ` : ""}
        <span class="chooser-contract">${escapeHtml(campaign.objective)}${approvedCount ? ` · ${approvedCount} approved` : ""}</span>
      </button>
    `;
  }).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "Campaigns",
        campaigns.length
          ? `${campaigns.length} ${campaigns.length === 1 ? "campaign" : "campaigns"} for ${state.brandName}. Each carries its own creative direction and inherits from the Brand Brain.`
          : `Define strategic contexts for ${state.brandName}. Each campaign inherits from the Brand Brain and adds its own creative direction.`,
      )}
      <div class="grid mode-grid">
        ${campaignCards}
        <button class="card chooser-card new-campaign-card" type="button" data-action="create-campaign" ${!approved ? "disabled" : ""}>
          <div class="card-header"><h2>New campaign</h2></div>
          <p>${approved ? "Define a new strategic context with its own objective, audience, and creative direction." : "Approve the Brand Brain first, then create campaigns."}</p>
          <span class="chooser-contract">Inherits from Brand Brain${approved ? ` v${state.brain.approvedVersion}` : ""}</span>
        </button>
      </div>
    </section>
  `);
}

function renderProductAddPanel() {
  const p = state.products;
  const creating = p.creating;
  const tab = p.addTab;
  const hasBrief = tab === "file" ? !!p.addFile : tab === "url" ? !!(p.addUrl || "").trim() : !!p.addText.trim();
  return `
    <div class="card product-add-panel">
      <div class="card-header">
        <span><span class="section-label">New product</span><h2>Add a product</h2></span>
        <button class="button" type="button" data-action="cancel-product-add" ${creating ? "disabled" : ""}>Cancel</button>
      </div>
      <p class="page-description">Give the product a name and its brief. The system reads the brief and builds a governed record: features, approved claim language, and rules production must follow. Every claim traces back to the brief, and nothing is usable until you review and approve it.</p>
      <div class="field">
        <label for="product-add-name">Product name</label>
        <input id="product-add-name" type="text" data-action="product-add-name-input" value="${escapeHtml(p.addName)}" placeholder="e.g. RCS Messaging" ${creating ? "disabled" : ""} />
      </div>
      <div class="source-method-tabs" role="tablist" aria-label="Brief source">
        <button class="${tab === "file" ? "active" : ""}" type="button" data-action="product-add-tab" data-tab="file" ${creating ? "disabled" : ""}>Upload a brief</button>
        <button class="${tab === "url" ? "active" : ""}" type="button" data-action="product-add-tab" data-tab="url" ${creating ? "disabled" : ""}>From a URL</button>
        <button class="${tab === "text" ? "active" : ""}" type="button" data-action="product-add-tab" data-tab="text" ${creating ? "disabled" : ""}>Paste text</button>
      </div>
      ${tab === "file" ? `
        <div class="field">
          <label for="product-add-file">Product brief, spec sheet, or feature deck</label>
          <input id="product-add-file" type="file" data-action="product-add-file" accept=".pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp" ${creating || p.addFileReading ? "disabled" : ""} />
          ${p.addFileReading ? `<p class="field-note">Uploading...</p>` : ""}
          ${p.addFile ? `<p class="field-note">Ready: ${escapeHtml(p.addFile.name)} (${formatFileSize(p.addFile.size)})</p>` : ""}
        </div>
      ` : tab === "url" ? `
        <div class="field">
          <label for="product-add-url">Product page or spec URL</label>
          <input id="product-add-url" type="url" data-action="product-add-url-input" value="${escapeHtml(p.addUrl || "")}" placeholder="https://example.com/products/analytics-pro" ${creating ? "disabled" : ""} />
          <p class="field-note">The system reads the page and builds the record from what it actually says.</p>
        </div>
      ` : `
        <div class="field">
          <label for="product-add-text">Paste the brief</label>
          <textarea id="product-add-text" rows="8" data-action="product-add-text-input" placeholder="Paste the product description, feature list, claims, or spec content here." ${creating ? "disabled" : ""}>${escapeHtml(p.addText)}</textarea>
        </div>
      `}
      <div class="actions">
        <button class="button primary" type="button" data-action="create-product-record" ${creating ? "disabled" : ""}>${creating ? "Building the record..." : "Create product record"}</button>
      </div>
      ${creating ? `<p class="field-note">Reading the brief and building the governed record. This usually takes under a minute.</p>` : !hasBrief || !p.addName.trim() ? `<p class="field-note">A product name and a brief are needed before the record can be built.</p>` : ""}
    </div>
  `;
}

function renderProducts() {
  const list = state.products.list;
  const loading = state.products.loading;
  const error = state.products.error;

  const cards = list.map((entry) => {
    const isApproved = entry.status === "approved";
    return `
      <button class="card chooser-card" type="button" data-action="view-product" data-id="${escapeHtml(entry.product_id)}">
        <div class="card-header">
          <h2>${escapeHtml(entry.product_name)}</h2>
          <span class="mini-pill ${isApproved ? "pill-success" : "pill-neutral"}">${isApproved ? "Approved" : "Needs review"}</span>
        </div>
        <p>Version ${escapeHtml(String(entry.version || "1"))} · Updated ${new Date(entry.updated_at || Date.now()).toLocaleString()}</p>
        <span class="chooser-contract">${isApproved ? "Available to production" : "Cannot be used until approved"}</span>
      </button>
    `;
  }).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "Products",
        list.length
          ? `${list.length} ${list.length === 1 ? "product record" : "product records"} for ${state.brandName}. Approved records are available to production; candidates are waiting for review.`
          : `The system builds a governed record for each product: what it does, its approved claim language, and the rules production must follow.`
      )}
      ${!state.products.addOpen ? `
        <div class="actions">
          <button class="button primary" type="button" data-action="open-product-add">+ Add a product</button>
        </div>
      ` : renderProductAddPanel()}
      ${error ? `<div class="rule-card"><div class="rule"><span class="mini-pill pill-warning">Error</span><span><strong>${escapeHtml(error)}</strong></span></div></div>` : ""}
      ${loading && !list.length ? `<p class="page-description">Loading product records...</p>` : ""}
      ${list.length ? `<div class="grid mode-grid">${cards}</div>` : loading || state.products.addOpen ? "" : `
        <div class="card">
          <div class="card-header"><h2>No products yet</h2></div>
          <p>Add your first product above. You will review everything the system builds before it can be used in production.</p>
        </div>
      `}
    </section>
  `);
}

function renderProductDetail() {
  const record = state.products.detail;
  const error = state.products.error;
  const approving = state.products.approving;

  if (!record && !error) {
    return shell(`
      <section class="workspace">
        ${pageHeader("Loading product record", "Fetching the full record...")}
      </section>
    `);
  }

  if (!record) {
    return shell(`
      <section class="workspace">
        ${pageHeader("Product record could not be loaded", error || "The record was not found.")}
        <button class="button" type="button" data-action="products">Back to products</button>
      </section>
    `);
  }

  const isApproved = !!record.approved_at;
  const featureRows = (record.features || []).map((f) => `
    <div class="product-rule">
      <span class="mini-pill ${f.origin === "stated" ? "pill-neutral" : "pill-warning"}">${escapeHtml(f.origin === "stated" ? "From source" : "Inferred")}</span>
      <div class="product-rule-body">
        <strong>${escapeHtml(f.name)}</strong>
        <span>${escapeHtml(f.benefit)}</span>
        ${f.approved_claim_language ? `<span class="product-rule-note"><strong>Approved language:</strong> "${escapeHtml(f.approved_claim_language)}"</span>` : ""}
        ${f.accuracy_note ? `<span class="product-rule-note"><strong>Accuracy:</strong> ${escapeHtml(f.accuracy_note)}</span>` : ""}
      </div>
    </div>
  `).join("");

  const reviewQuestions = (record.review_questions || []).map((q, index) => {
    const resolved = !!q.resolution;
    const draft = state.products.questionDrafts[index] || "";
    const answering = state.products.resolvingQuestionIndex === index;
    return `
    <div class="product-rule">
      <span class="mini-pill ${resolved ? "pill-success" : q.confidence === "high" ? "pill-warning" : "pill-neutral"}">${resolved ? "Answered" : escapeHtml(String(q.confidence || "").toUpperCase())}</span>
      <div class="product-rule-body">
        <strong>${escapeHtml(q.title)}</strong>
        <span>${escapeHtml(q.summary)}</span>
        ${q.evidence_quote ? `<span class="product-rule-note">"${escapeHtml(q.evidence_quote)}"</span>` : ""}
        ${resolved ? `
          <div class="product-question-answer">
            <span class="product-rule-note"><strong>Answer:</strong> ${escapeHtml(q.resolution.note)}</span>
            <span class="product-answer-meta">Recorded ${new Date(q.resolution.resolved_at).toLocaleString()}</span>
          </div>
        ` : `
          <div class="product-question-answer">
            <textarea rows="2" data-action="product-question-input" data-index="${index}" placeholder="Write what you established, so the answer travels with the record." ${answering ? "disabled" : ""}>${escapeHtml(draft)}</textarea>
            <div class="actions">
              <button class="button" type="button" data-action="resolve-product-question" data-index="${index}" ${answering || !draft.trim() ? "disabled" : ""}>${answering ? "Recording..." : "Record answer"}</button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
  }).join("");

  const exclusions = (record.exclusions || []).map((ex) => `<li>${escapeHtml(ex)}</li>`).join("");
  const proofPoints = (record.proof_points || []).map((p) => `<li>${escapeHtml(p)}</li>`).join("");

  return shell(`
    <section class="workspace">
      ${pageHeader(record.product_name, record.one_true_thing || record.category || "Product record")}

      <div class="page-actions">
        <button class="button" type="button" data-action="products">Back to products</button>
        ${isApproved
          ? `<span class="mini-pill pill-success">Approved · ${new Date(record.approved_at).toLocaleDateString()}</span>`
          : `<button class="button primary" type="button" data-action="approve-product" data-id="${escapeHtml(record.product_id)}" ${approving ? "disabled" : ""}>${approving ? "Approving..." : "Approve product record"}</button>`
        }
      </div>

      ${error ? `<div class="rule-card"><div class="rule"><span class="mini-pill pill-warning">Error</span><span><strong>${escapeHtml(error)}</strong></span></div></div>` : ""}

      <details class="card collapsible-card" open>
        <summary class="card-header collapsible-header">
          <h2>Summary</h2>
          <span class="collapsible-meta"><span class="mini-pill pill-neutral">v${escapeHtml(String(record.version))}</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
        </summary>
        <ul class="contract-list">
          <li><strong>Category:</strong> ${escapeHtml(record.category)}</li>
          <li><strong>Audience:</strong> ${escapeHtml(record.audience_note)}</li>
          <li><strong>Visual direction:</strong> ${escapeHtml(record.visual_direction)}</li>
          <li><strong>Source summary:</strong> ${escapeHtml(record.source_summary)}</li>
        </ul>
      </details>

      ${(record.features || []).length ? `
      <details class="card collapsible-card" open>
        <summary class="card-header collapsible-header">
          <h2>Features</h2>
          <span class="collapsible-meta"><span class="mini-pill pill-neutral">${record.features.length}</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
        </summary>
        <div class="product-record-list">${featureRows}</div>
      </details>
      ` : ""}

      ${proofPoints ? `
      <details class="card collapsible-card">
        <summary class="card-header collapsible-header">
          <h2>Proof points</h2>
          <span class="collapsible-chevron" aria-hidden="true"></span>
        </summary>
        <ul class="contract-list">${proofPoints}</ul>
      </details>
      ` : ""}

      ${exclusions ? `
      <details class="card collapsible-card" open>
        <summary class="card-header collapsible-header">
          <h2>What production must not do</h2>
          <span class="collapsible-meta"><span class="mini-pill pill-warning">${record.exclusions.length}</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
        </summary>
        <ul class="contract-list">${exclusions}</ul>
      </details>
      ` : ""}

      ${reviewQuestions ? `
      <details class="card collapsible-card">
        <summary class="card-header collapsible-header">
          <h2>Review questions</h2>
          <span class="collapsible-meta"><span class="mini-pill ${record.review_questions.every((q) => q.resolution) ? "pill-success" : "pill-neutral"}">${record.review_questions.filter((q) => q.resolution).length}/${record.review_questions.length} answered</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
        </summary>
        <div class="product-record-list">${reviewQuestions}</div>
      </details>
      ` : ""}
    </section>
  `);
}

function renderCampaignChooser() {
  return renderCampaigns();
}

function newCampaignDraft() {
  const dossier = brainArtifacts.find((a) => a.id === "dossier");
  return {
    name: "",
    description: "",
    objective: "",
    audience: "",
    currentBelief: "",
    desiredBelief: "",
    desiredAction: "",
    campaignIdea: "",
    messageTerritory: "",
    proofPoints: "",
    preserve: dossier ? dossier.materials.join(", ") + ", " + (dossier.palette || []).map((c) => c.name.toLowerCase()).join(", ") : "",
    explore: "",
    paletteShift: "",
    productFocus: "",
    channels: [],
    startDate: "",
    endDate: "",
  };
}

function renderCampaignCreation() {
  const draft = state.campaignDraft || newCampaignDraft();
  const dossier = brainArtifacts.find((a) => a.id === "dossier");
  const lived = brainArtifacts.find((a) => a.id === "lived");
  const approved = approvedBrainForProduction();

  const knownChannels = Object.keys(placementFormats).map((p) => p.replace(/ (feed|story|feature)$/i, "")).filter((v, i, a) => a.indexOf(v) === i);
  const hasName = draft.name.trim().length > 0;
  const hasObjective = draft.objective.trim().length > 0;

  return shell(`
    <section class="workspace">
      ${pageHeader("New campaign", `Define the strategic context. The Brand Brain provides the foundation; the campaign narrows and directs it.`)}

      <div class="content-grid">
        <div>
          <section class="card">
            <div class="card-header"><h2>What is this campaign?</h2></div>
            <div class="field-grid">
              <div class="field">
                <label for="campaign-name">Campaign name</label>
                <input class="input-like" id="campaign-name" data-action="campaign-draft-input" data-field="name" value="${escapeHtml(draft.name)}" placeholder="Summer Reset, Back to School, Q4 Launch">
              </div>
              <div class="field">
                <label for="campaign-objective">What is this campaign for?</label>
                <input class="input-like" id="campaign-objective" data-action="campaign-draft-input" data-field="objective" value="${escapeHtml(draft.objective)}" placeholder="Awareness and trial, perception shift, product launch">
              </div>
              <div class="field full">
                <label for="campaign-description">Describe the initiative in a sentence or two</label>
                <textarea id="campaign-description" data-action="campaign-draft-input" data-field="description" placeholder="What is the campaign doing and why now? This is the context that shapes every asset.">${escapeHtml(draft.description)}</textarea>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header"><h2>Who are you reaching?</h2></div>
            <div class="field-grid">
              <div class="field full">
                <label for="campaign-audience">Audience for this campaign</label>
                <textarea id="campaign-audience" data-action="campaign-draft-input" data-field="audience" placeholder="Who specifically? Not the whole brand audience, just who this campaign is aimed at.">${escapeHtml(draft.audience)}</textarea>
                ${dossier?.audience ? `<span class="field-note">Brand audience: ${escapeHtml(dossier.audience.length > 140 ? dossier.audience.slice(0, 140) + "..." : dossier.audience)}</span>` : ""}
              </div>
              <div class="field full">
                <label for="campaign-current-belief">What do they believe now?</label>
                <input class="input-like" id="campaign-current-belief" data-action="campaign-draft-input" data-field="currentBelief" value="${escapeHtml(draft.currentBelief)}" placeholder="The assumption or habit this campaign is trying to move">
              </div>
              <div class="field full">
                <label for="campaign-desired-belief">What should they believe after?</label>
                <input class="input-like" id="campaign-desired-belief" data-action="campaign-draft-input" data-field="desiredBelief" value="${escapeHtml(draft.desiredBelief)}" placeholder="The shift this campaign needs to make happen">
              </div>
              <div class="field full">
                <label for="campaign-desired-action">What should they do?</label>
                <input class="input-like" id="campaign-desired-action" data-action="campaign-draft-input" data-field="desiredAction" value="${escapeHtml(draft.desiredAction)}" placeholder="Try the product, visit the site, share with someone">
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header"><h2>Campaign idea and message</h2></div>
            <div class="field-grid">
              <div class="field full">
                <label for="campaign-idea">Theme or tagline</label>
                <input class="input-like" id="campaign-idea" data-action="campaign-draft-input" data-field="campaignIdea" value="${escapeHtml(draft.campaignIdea)}" placeholder="The organizing idea. A phrase, not a paragraph.">
                <span class="field-note">This appears across campaign assets as the connecting thread.</span>
              </div>
              <div class="field full">
                <label for="campaign-message-territory">Message territory</label>
                <textarea id="campaign-message-territory" data-action="campaign-draft-input" data-field="messageTerritory" placeholder="The space this campaign occupies. What idea ties the work together?">${escapeHtml(draft.messageTerritory)}</textarea>
              </div>
              <div class="field full">
                <label for="campaign-proof-points">Proof points (optional)</label>
                <textarea id="campaign-proof-points" data-action="campaign-draft-input" data-field="proofPoints" placeholder="Claims, facts, or evidence that support the message. Only approved claims will make it into copy.">${escapeHtml(draft.proofPoints)}</textarea>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header"><h2>Products and channels</h2></div>
            <div class="field-grid">
              <div class="field full">
                <label for="campaign-product-focus">Product focus</label>
                <input class="input-like" id="campaign-product-focus" data-action="campaign-draft-input" data-field="productFocus" value="${escapeHtml(draft.productFocus)}" placeholder="Which product or line is this campaign about? Leave blank for brand-level.">
                ${dossier?.proof ? `<span class="field-note">Known products: ${escapeHtml(dossier.proof.filter((p) => p.includes("flavor") || p.includes("product")).map((p) => p.split(" flavor")[0].split(" with")[0]).join(", ") || "Yuzu Ginger")}</span>` : ""}
              </div>
              <div class="field full">
                <label>Primary channels</label>
                <div class="campaign-channel-picker">
                  ${knownChannels.map((ch) => `
                    <label class="campaign-channel-option ${draft.channels.includes(ch) ? "selected" : ""}">
                      <input type="checkbox" data-action="campaign-toggle-channel" data-channel="${escapeHtml(ch)}" ${draft.channels.includes(ch) ? "checked" : ""}>
                      <span>${escapeHtml(ch)}</span>
                    </label>
                  `).join("")}
                </div>
              </div>
              <div class="field">
                <label for="campaign-start-date">Start date (optional)</label>
                <input class="input-like" id="campaign-start-date" type="date" data-action="campaign-draft-input" data-field="startDate" value="${escapeHtml(draft.startDate)}">
              </div>
              <div class="field">
                <label for="campaign-end-date">End date (optional)</label>
                <input class="input-like" id="campaign-end-date" type="date" data-action="campaign-draft-input" data-field="endDate" value="${escapeHtml(draft.endDate)}">
              </div>
            </div>
          </section>
        </div>

        <aside>
          <section class="card">
            <div class="card-header"><h2>Creative direction</h2></div>
            <div class="field-grid">
              <div class="field full">
                <label for="campaign-explore">What visual territory should this campaign explore?</label>
                <textarea id="campaign-explore" data-action="campaign-draft-input" data-field="explore" placeholder="New environments, moments, compositions, or moods this campaign can try.">${escapeHtml(draft.explore)}</textarea>
                ${lived?.environments ? `<span class="field-note">Brand environments: ${escapeHtml(lived.environments.map((e) => e.name).join(", "))}</span>` : ""}
              </div>
              <div class="field full">
                <label for="campaign-preserve">What should stay the same from the brand?</label>
                <textarea id="campaign-preserve" data-action="campaign-draft-input" data-field="preserve" placeholder="Brand qualities to carry into this campaign unchanged.">${escapeHtml(draft.preserve)}</textarea>
              </div>
              <div class="field full">
                <label for="campaign-palette-shift">Palette shift (optional)</label>
                <input class="input-like" id="campaign-palette-shift" data-action="campaign-draft-input" data-field="paletteShift" value="${escapeHtml(draft.paletteShift)}" placeholder="Push warmer, cooler, brighter, or keep the brand palette as is.">
                ${dossier?.palette ? `<span class="field-note">Brand palette: ${escapeHtml(dossier.palette.map((c) => c.name).join(", "))}</span>` : ""}
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <h2>Inheriting from Brand Brain</h2>
              <span class="status-pill">${approved ? `v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list campaign-inherit-list">
              <li><strong>Foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "foundation")?.summary || "Build the Brand Brain first")}</span></li>
              <li><strong>Identity</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "identity")?.summary || "Not available")}</span></li>
              <li><strong>Voice</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "voice")?.summary || "Not available")}</span></li>
              <li><strong>Creative rules</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "rules")?.summary || "Not available")}</span></li>
            </ul>
            <p class="field-note field-note-spaced">Every campaign inherits these. The campaign narrows and directs; it does not override.</p>
          </section>

          <section class="card ready-card">
            <div class="card-header"><h2>${!hasName ? "Name the campaign to continue" : !hasObjective ? "Add an objective" : "Ready to create"}</h2></div>
            <p class="page-description">${!hasName
              ? "A campaign needs at least a name and an objective. Everything else can come later."
              : !hasObjective
              ? "What is this campaign trying to accomplish? Even one sentence helps the system shape the work."
              : `${escapeHtml(draft.name)} will inherit from Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion}. You can add more detail after creation.`}</p>
            <button class="button primary" type="button" data-action="save-campaign" ${hasName && hasObjective ? "" : "disabled"}>Create campaign</button>
          </section>

          <div class="actions actions-compact">
            <button class="button" type="button" data-action="back-to-campaigns">‹ Back to campaigns</button>
          </div>
        </aside>
      </div>
    </section>
  `);
}

function renderCampaignWorkspace() {
  const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
  if (!campaign) return renderCampaigns();
  const approved = approvedBrainForProduction();
  const campaignOutputs = outputsForCampaign(campaign.id).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const approvedCount = campaignOutputs.filter((o) => o.status === "approved").length;
  const editingField = state.campaignEditField;
  const draft = state.campaignEditDraft || campaign;

  const fields = [
    { id: "campaignIdea", label: "Campaign idea", icon: "◇", placeholder: "The organizing idea" },
    { id: "objective", label: "Objective", icon: "◎", placeholder: "What this campaign is for" },
    { id: "audience", label: "Audience", icon: "◉", placeholder: "Who this reaches" },
    { id: "messageTerritory", label: "Message territory", icon: "◈", placeholder: "The space this campaign occupies" },
    { id: "currentBelief", label: "Current belief", icon: "←", placeholder: "What the audience believes now" },
    { id: "desiredBelief", label: "Desired belief", icon: "→", placeholder: "What they should believe after" },
    { id: "desiredAction", label: "Desired action", icon: "▸", placeholder: "What they should do" },
    { id: "proofPoints", label: "Proof points", icon: "✓", placeholder: "Claims, facts, or evidence" },
    { id: "explore", label: "Explore", icon: "◻", placeholder: "New territory for this campaign" },
    { id: "preserve", label: "Preserve", icon: "◼", placeholder: "What to carry forward from the brand" },
    { id: "paletteShift", label: "Palette shift", icon: "◔", placeholder: "Color direction" },
    { id: "productFocus", label: "Product focus", icon: "▢", placeholder: "Which product or line" },
  ].filter((f) => campaign[f.id] || editingField === f.id);

  const fieldCards = fields.map((f) => {
    const isEditing = editingField === f.id;
    const value = campaign[f.id] || "";
    return `
      <div class="cparam-card ${isEditing ? "cparam-editing" : ""}">
        ${isEditing ? `
          <div class="cparam-edit-header">
            <span class="cparam-icon" aria-hidden="true">${f.icon}</span>
            <span class="cparam-label">${escapeHtml(f.label)}</span>
            <div class="card-header-actions">
              <button class="button compact" type="button" data-action="cancel-field-edit">Cancel</button>
              <button class="button compact primary" type="button" data-action="save-field-edit" data-field="${f.id}">Save</button>
            </div>
          </div>
          <textarea data-action="campaign-edit-input" data-field="${f.id}" placeholder="${escapeHtml(f.placeholder)}">${escapeHtml(draft[f.id] || "")}</textarea>
        ` : `
          <button class="cparam-display" type="button" data-action="start-field-edit" data-field="${f.id}">
            <span class="cparam-icon" aria-hidden="true">${f.icon}</span>
            <span class="cparam-body">
              <span class="cparam-label">${escapeHtml(f.label)}</span>
              <span class="cparam-value">${escapeHtml(value)}</span>
            </span>
          </button>
        `}
      </div>
    `;
  }).join("");

  return shell(`
    <section class="workspace">
      <header class="page-header">
        <div class="campaign-header-row">
          <div>
            <h1 class="page-title">${escapeHtml(campaign.name)}</h1>
            <p class="page-description">${escapeHtml(campaign.description || campaign.objective)}</p>
          </div>
          <button class="button" type="button" data-action="back-to-campaigns">&lsaquo; All campaigns</button>
        </div>
      </header>

      <section class="campaign-cta-bar">
        <span>Create assets for this campaign in the Design Studio. The campaign direction compiles into every output.</span>
        <button class="button primary" type="button" data-action="studio-from-campaign" ${approved ? "" : "disabled"}>Open Design Studio</button>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Campaign direction</h2>
          ${campaign.channels?.length ? `<span class="mini-pill">${campaign.channels.join(", ")}</span>` : ""}
        </div>
        <div class="cparam-grid cparam-grid-wide">
          ${fieldCards}
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Campaign work</h2>
          <span class="mini-pill">${campaignOutputs.length} ${campaignOutputs.length === 1 ? "output" : "outputs"}${approvedCount ? `, ${approvedCount} approved` : ""}</span>
        </div>
        ${campaignOutputs.length ? `
          <div class="campaign-output-grid">
            ${campaignOutputs.map((o) => `
              <button class="campaign-output-card" type="button" data-action="preview-output" data-id="${o.id}">
                ${o.imageUrl
                  ? `<span class="campaign-output-thumb"><img src="${escapeHtml(o.imageUrl)}" alt="" onerror="this.closest('.campaign-output-thumb').classList.add('ws-thumb-missing'); this.remove();"></span>`
                  : `<span class="campaign-output-thumb ws-thumb-empty"></span>`}
                <span class="campaign-output-info">
                  <strong>${escapeHtml(o.label || "Untitled")}</strong>
                  <span>${escapeHtml(o.format || "")}${o.brainVersion ? ` · Brain v${o.brainVersion}` : ""}</span>
                </span>
                <span class="mini-pill ${o.status === "approved" ? "pill-success" : "pill-neutral"}">${o.status === "approved" ? "Approved" : "Draft"}</span>
              </button>
            `).join("")}
          </div>
        ` : `
          <p class="page-description">No outputs yet. Use the Design Studio button above to create assets linked to this campaign.</p>
        `}
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Brand guidance</h2>
          <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
        </div>
        <ul class="exact-list">
          <li><strong>Foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "foundation")?.summary || "Not available")}</span></li>
          <li><strong>Creative direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((s) => s.id === "creative")?.summary || "Not available")}</span></li>
        </ul>
      </section>
    </section>
  `);
}

function selectedBrainException() {
  return brainExceptions.find((item) => item.id === state.brain.selectedExceptionId) ?? brainExceptions[0];
}

function brainStatusClass(type) {
  if (type === "contradiction") return "danger";
  if (type === "suspected-canon") return "governed";
  if (type === "brand-rule") return "rule";
  return "evidence";
}

function brainResolutionLabel(resolution) {
  if (!resolution) return "";
  if (resolution === "leave-unresolved") return "Deferred";
  if (resolution === "evidence-only") return "Evidence only";
  if (["dismiss-proposal", "discard-suggestion"].includes(resolution)) return "Discarded";
  if (resolution === "keep-for-later") return "Saved for later";
  if (resolution === "use-rule") return "In use";
  return "Resolved";
}

function brainQueueItem(item) {
  const active = item.id === state.brain.selectedExceptionId;
  const resolution = state.brain.resolutions[item.id];
  return `
    <button
      class="brain-queue-item ${active ? "active" : ""}"
      type="button"
      data-action="select-brain-exception"
      data-id="${escapeHtml(item.id)}"
      ${active ? 'aria-current="true"' : ""}
    >
      <span class="brain-queue-topline">
        <span class="brain-status ${brainStatusClass(item.type)}">${escapeHtml(item.typeLabel)}</span>
        <span class="brain-signal">${resolution ? brainResolutionLabel(resolution) : escapeHtml(item.signal)}</span>
      </span>
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.summary)}</span>
    </button>
  `;
}

function brainEvidenceCard(item) {
  return `
    <article class="brain-evidence-card">
      <span class="brain-evidence-topline">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.ref)}</span>
      </span>
      <p>${escapeHtml(item.quote)}</p>
    </article>
  `;
}

function brainDecisionAction(action, selected, activeResolution) {
  return `
    <button
      class="brain-decision-action ${activeResolution === action.id ? "selected" : ""}"
      type="button"
      data-action="resolve-brain-exception"
      data-id="${escapeHtml(selected.id)}"
      data-resolution="${escapeHtml(action.id)}"
    >
      <span class="brain-decision-title"><strong>${escapeHtml(action.label)}</strong><span aria-hidden="true">›</span></span>
      <span>${escapeHtml(action.detail)}</span>
    </button>
  `;
}

function renderBrandBrain() {
  const incrementalReview = state.brain.revisionPending && state.brain.approvedVersion > 0;
  if (!state.brain.processingComplete) {
    return brainWorkspace(
      "Needs review",
      "Questions and suggestions will appear here after the system has organized your sources.",
      `
        <section class="card brain-review-empty">
          <span class="eyebrow">Nothing to review yet</span>
          <h2>${brainSourceCount() ? "Finish building your Brand Brain draft" : "Add sources to begin"}</h2>
          <p>${brainSourceCount() ? "Your source batch is ready. Start synthesis to find the few questions that need your judgment." : "Once sources are added, the system will organize them and bring only consequential questions to this section."}</p>
          <button class="button primary" type="button" data-action="navigate-brain" data-screen="brain-sources">${brainSourceCount() ? "Review sources" : "Add sources"}</button>
        </section>
      `,
    );
  }

  if (!brainExceptions.length) {
    const ready = state.brain.cleanApproved;
    return brainWorkspace(
      "Needs review",
      incrementalReview ? `The proposed update introduces no unresolved conflicts. Brand Brain v${state.brain.approvedVersion} remains active until you approve the candidate.` : "OpenAI found no conflicts or uncertain suggestions that require a decision in this source batch.",
      `
        ${incrementalReview ? `<section class="brain-source-update-callout"><span class="brain-status governed">Active v${state.brain.approvedVersion}</span><span><strong>${state.brain.affectedGuidanceIds.length || "No"} guidance ${state.brain.affectedGuidanceIds.length === 1 ? "area has" : "areas have"} a proposed change</strong><p>The active version is unchanged. Review the candidate draft before it can become v${state.brain.approvedVersion + 1}.</p></span></section>` : ""}
        <section class="card brain-review-empty brain-review-clear">
          <span class="brain-status success">No questions found</span>
          <h2>The synthesized Brand Brain is ready to read</h2>
          <p>The source trail, guidance, and working artifacts are prepared. Nothing was silently promoted into core brand guidance.</p>
          ${brainBatch.cleanCount > 0 && !ready ? `<button class="button primary" type="button" data-action="approve-clean-assets">Approve ${brainBatch.cleanCount} exact ${brainBatch.cleanCount === 1 ? "asset" : "assets"}</button>` : `<button class="button secondary" type="button" data-action="finish-brain-review">Review Brand Brain draft</button>`}
        </section>
      `,
    );
  }

  const selected = selectedBrainException();
  const resolution = state.brain.resolutions[selected.id];
  const canonReady = selected.id === "four-pm-reset" && resolution === "contextual";
  const isBrandRule = selected.type === "brand-rule";
  const queue = brainExceptions.map(brainQueueItem).join("");
  const evidence = selected.evidence.map(brainEvidenceCard).join("");
  const relationships = (selected.relationships ?? [])
    .map((relationship) => `<span>${escapeHtml(relationship)}</span>`)
    .join("");
  const actions = selected.actions.map((action) => brainDecisionAction(action, selected, resolution)).join("");
  const detailContent = isBrandRule
    ? `
        <div class="brain-rule-detail">
          <section class="brain-rule-statement">
            <span class="section-label">What this rule says</span>
            <p>${escapeHtml(selected.statement)}</p>
          </section>

          <section>
            <span class="section-label">Why this matters</span>
            <p>${escapeHtml(selected.rationale)}</p>
          </section>

          <section>
            <span class="section-label">Where this came from</span>
            <div class="brain-evidence-grid">${evidence}</div>
          </section>

          <section>
            <span class="section-label">Where this applies</span>
            <div class="brain-rule-scope">
              ${selected.scope
                .map(
                  ([label, value]) => `
                    <span><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></span>
                  `,
                )
                .join("")}
            </div>
          </section>

          <section>
            <span class="section-label">When it does not apply</span>
            <div class="brain-rule-empty">
              <strong>No exceptions in this version</strong>
              <span>If the rule feels too broad, keep it for later and refine it outside this review.</span>
            </div>
          </section>
        </div>
      `
    : `
        <section class="brain-detail-section">
          <span class="section-label">What we found</span>
          <div class="brain-evidence-grid">${evidence}</div>
        </section>

        <div class="brain-reasoning-grid">
          <section><span class="section-label">How we found it</span><p>${escapeHtml(selected.method)}</p></section>
          <section><span class="section-label">Why this matters</span><p>${escapeHtml(selected.rationale)}</p></section>
        </div>

        <div class="brain-relationships">
          <span class="section-label">What this could affect</span>
          <span class="evidence-chips">${relationships}</span>
        </div>
      `;
  const ruleOutcome = selected.actions.find((action) => action.id === resolution)?.detail;
  const decisionFollowUp = isBrandRule
    ? `
        <section class="brain-rule-outcome ${resolution ? "decided" : ""}">
          <span class="section-label">What happens next</span>
          <p>${escapeHtml(ruleOutcome ?? "Choose an option above. Nothing changes until you make a decision.")}</p>
        </section>
      `
    : `
        <section class="brain-canon-gate ${canonReady ? "ready" : ""}">
          <span class="brain-canon-heading"><strong>Core brand guidance</strong><span>${canonReady ? "Ready to review" : "Reviewed separately"}</span></span>
          <p>${
            selected.id === "four-pm-reset"
              ? canonReady
                ? "This pattern is now available as helpful guidance. You can separately decide whether it should become part of SLAKE's core brand guidance."
                : "First choose ‘Use as helpful guidance.’ Adding it to core brand guidance remains a separate decision."
              : "This decision resolves only this review item. It does not change SLAKE's core brand guidance."
          }</p>
          <button
            class="button ${canonReady ? "secondary" : ""}"
            type="button"
            data-action="review-canon-promotion"
            ${canonReady ? "" : "disabled"}
          >Review change to core guidance</button>
        </section>

        <section class="brain-policy-note">
          <span class="section-label">What this decision changes</span>
          <strong>This review item only</strong>
          <span>Other guidance and source material remain available.</span>
        </section>
      `;
  const reviewComplete = state.brain.cleanApproved && brainResolvedCount() === brainExceptions.length;

  return brainWorkspace(
    "Needs review",
    "Review the few items that need a decision. Everything else can move forward quickly without changing the brand's core guidance.",
    `
      ${incrementalReview ? `<section class="brain-source-update-callout"><span class="brain-status governed">Active v${state.brain.approvedVersion}</span><span><strong>Reviewing a proposed update</strong><p>${state.brain.affectedGuidanceIds.length || "No"} guidance ${state.brain.affectedGuidanceIds.length === 1 ? "area has" : "areas have"} candidate changes. The active version stays available to production until the next version is approved.</p></span></section>` : ""}
      <section class="brain-fast-path">
        <div class="brain-batch-identity">
          <span class="section-label">Batch</span>
          <strong>${escapeHtml(brainBatch.name)}</strong>
          <span>${brainBatch.assetCount} source items · ${escapeHtml(brainBatch.sources.join(" · "))}</span>
        </div>
        <div class="brain-clean-count">
          <span class="brain-clean-dot" aria-hidden="true"></span>
          <span><strong>${brainBatch.cleanCount ? `${brainBatch.cleanCount} exact ${brainBatch.cleanCount === 1 ? "asset" : "assets"} ready` : "Source reading complete"}</strong><span>${escapeHtml(brainBatch.rights)}</span></span>
        </div>
        <div class="brain-fast-action">
          <span>${brainBatch.cleanCount ? "Approved exact assets can be used in future work. Your core brand guidance stays the same." : "There are no exact assets waiting for approval in this batch."}</span>
          <button
            class="button primary"
            type="button"
            data-action="approve-clean-assets"
            ${state.brain.cleanApproved || !brainBatch.cleanCount ? "disabled" : ""}
          >${state.brain.cleanApproved ? `${brainBatch.cleanCount} approved for future work` : brainBatch.cleanCount ? `Approve ${brainBatch.cleanCount} for future work` : "No assets to approve"}</button>
        </div>
      </section>

      <div class="brain-review-grid">
        <aside class="brain-queue card" aria-label="Items requiring review">
          <div class="brain-panel-heading">
            <span>
              <span class="eyebrow">Review</span>
              <strong>Needs judgment</strong>
            </span>
            <span class="attention-count">${brainExceptions.length}</span>
          </div>
          <div class="brain-queue-list">${queue}</div>
          <div class="brain-batch-note">
            <span class="section-label">Sources in this batch</span>
            <p>${escapeHtml(brainBatch.sources.join(", "))}.</p>
            <strong>${escapeHtml(brainBatch.rights)}</strong>
          </div>
        </aside>

        <section class="brain-detail card">
          <header class="brain-detail-header">
            <span class="brain-status ${brainStatusClass(selected.type)}">${escapeHtml(selected.typeLabel)}</span>
            <h2>${escapeHtml(selected.title)}</h2>
            <p>${escapeHtml(selected.summary)}</p>
            <div class="brain-epistemics">
              <span><strong>How we found it</strong>${escapeHtml(selected.origin)}</span>
              <span><strong>How certain</strong>${escapeHtml(selected.confidence)}</span>
              <span><strong>Why it was flagged</strong>${escapeHtml(selected.signal)}</span>
            </div>
          </header>

          ${detailContent}
        </section>

        <aside class="brain-decision card">
          <div class="brain-panel-heading">
            <span><span class="eyebrow">Your decision</span><strong>What should happen?</strong></span>
          </div>
          <div class="brain-decision-list">${actions}</div>
          ${decisionFollowUp}
        </aside>
      </div>

      <section class="brain-review-finish ${reviewComplete ? "ready" : ""}">
        <span>
          <strong>${reviewComplete ? (incrementalReview ? `Candidate v${state.brain.approvedVersion + 1} is ready to read` : "Your Brand Brain draft is ready") : incrementalReview ? "Finish review without changing the active version" : "Finish review to prepare your stored draft"}</strong>
          <span>${state.brain.cleanApproved ? `${brainResolvedCount()} of ${brainExceptions.length} review decisions saved` : `Approve ${brainBatch.cleanCount} clean assets and resolve ${brainExceptions.length - brainResolvedCount()} review items`}</span>
        </span>
        <button class="button ${reviewComplete ? "secondary" : ""}" type="button" data-action="finish-brain-review" ${reviewComplete ? "" : "disabled"}>${incrementalReview ? "Review candidate update" : "Review Brand Brain draft"}</button>
      </section>
    `,
  );
}

function renderCanonPromotion() {
  const ritual = brainExceptions.find((item) => item.id === "four-pm-reset");
  const evidence = ritual.evidence.map(brainEvidenceCard).join("");

  return brainWorkspace(
    "Add to core brand guidance",
    "Decide whether the 4pm Reset should guide SLAKE work by default. Its earlier approval as helpful guidance remains unchanged.",
    `
      <div class="canon-grid">
        <div>
          <section class="card canon-entity-card">
            <div class="card-header">
              <span><span class="section-label">Proposed brand principle</span><h2>The 4pm Reset ritual</h2></span>
              <span class="brain-status governed">Found in past work · approved for use</span>
            </div>
            <p class="canon-definition">SLAKE belongs in an everyday late-afternoon pause: restorative, domestic, and unhurried rather than clinical, aspirational, or optimized.</p>
            <div class="brain-evidence-grid">${evidence}</div>
          </section>

          <section class="card">
            <div class="card-header"><h2>What will change</h2><span class="status-pill">Before you confirm</span></div>
            <div class="canon-impact-grid">
              <article><strong>Future creative work</strong><span>The 4pm Reset becomes a standing brand principle instead of an optional reference.</span></article>
              <article><strong>Supporting examples</strong><span>All 11 source items stay attached so people can see where the principle came from.</span></article>
              <article><strong>Brand rules</strong><span>The rule against medical or health claims still applies.</span></article>
              <article><strong>Change history</strong><span>The reason for this decision and the earlier state are saved together.</span></article>
            </div>
          </section>

          ${state.brain.canonPromoted ? `
            <section class="card canon-record">
              <div class="card-header"><h2>Change saved</h2><span class="brain-status success">Core guidance</span></div>
              <dl>
                <div><dt>Change</dt><dd>Added the 4pm Reset to core guidance</dd></div>
                <div><dt>Previously</dt><dd>Approved as helpful guidance</dd></div>
              </dl>
            </section>
          ` : ""}
        </div>

        <aside>
          <section class="card canon-decision-card">
            <div class="card-header"><h2>Make this core guidance</h2><span class="mini-pill">Separate decision</span></div>
            <label class="canon-rationale">
              <span class="section-label">Why should this become core guidance?</span>
              <textarea data-action="promotion-rationale">${escapeHtml(state.brain.promotionRationale)}</textarea>
            </label>
            <div class="canon-consequence">
              <strong>This changes core brand guidance</strong>
              <p>Future work will follow this principle by default until the brand guidance is deliberately changed again.</p>
            </div>
            <button
              class="button primary"
              type="button"
              data-action="promote-canon"
              ${state.brain.canonPromoted ? "disabled" : ""}
            >${state.brain.canonPromoted ? "Added to core guidance" : "Add to core brand guidance"}</button>
            <button class="button" type="button" data-action="back-to-brain">Back to review</button>
          </section>
        </aside>
      </div>
    `,
    "canon-workspace",
  );
}

function approvedBrainForProduction() {
  return state.brain.approvedResult || (state.brain.artifactStatus === "ready" ? currentSynthesisResult : null);
}

function productionReferenceLibrary() {
  if (state.brain.synthesisKind === "sample") return [];
  return state.brain.sources
    .filter((source) => !["exact-asset", "approved-guidance"].includes(source.authority))
    .map((source) => {
      const file = (source.files || []).find((item) => ["image/png", "image/jpeg", "image/webp"].includes(String(item.type || "").toLowerCase()) && item.blobPathname);
      if (!file) return null;
      return {
        id: source.id,
        name: source.name,
        detail: source.detail || source.declaredType || "Visual source",
        sourceType: source.declaredType || sourceMaterialType(source)?.shortLabel || "Visual source",
        provenance: file.name,
        role: source.role === "Creative direction" ? "Style calibration" : "Lighting + mood",
        influence: source.influence === "Not weighted" ? "Supporting" : source.influence || "Supporting",
        usageInstruction: source.usage || "Use only as visual inspiration where it supports the approved Brand Brain.",
        confidence: "User supplied",
        evidence: [],
        thumb: source.materialType === "image-grid" ? "grid" : "light",
      };
    })
    .filter(Boolean);
}

function syncProductionReferences() {
  const available = new Map(productionReferenceLibrary().map((item) => [item.id, item]));
  state.references = state.references
    .filter((item) => available.has(item.id))
    .map((item) => ({ ...available.get(item.id), ...item }));
}

function sceneStarters(approved, campaign) {
  const starters = [];
  // Campaign explore direction is the most specific starting point
  if (campaign?.explore) {
    for (const piece of campaign.explore.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 2)) {
      starters.push({
        label: piece.charAt(0).toUpperCase() + piece.slice(1),
        source: `${campaign.name} campaign`,
        text: `A moment set in ${piece.toLowerCase()}. ${campaign.messageTerritory || ""}`.trim(),
      });
    }
  }
  // Rituals and behaviors from the brand world section
  const world = approved?.guidanceSections?.find((s) => s.id === "world");
  for (const principle of (world?.principles || []).slice(0, 2)) {
    starters.push({
      label: principle.length > 46 ? `${principle.slice(0, 46)}...` : principle,
      source: "Brand world",
      text: principle,
    });
  }
  return starters.slice(0, 4);
}

function productionLockedAssets() {
  if (state.brain.synthesisKind === "sample") return [];
  return state.brain.sources
    .filter((source) => (source.authority === "exact-asset" || source.sessionProductAsset) && !source.templateMeta && !source.productMeta)
    .map((source) => {
      const file = (source.files || []).find((item) => ["image/png", "image/jpeg", "image/webp"].includes(String(item.type || "").toLowerCase()) && item.blobPathname);
      if (!file) return null;
      return { id: source.id, name: source.name, detail: source.detail || source.declaredType || "Protected asset", fileName: file.name };
    })
    .filter(Boolean);
}

function productionTemplates(ratioFilter) {
  return state.brain.sources
    .filter((source) => source.templateMeta?.isTemplate)
    .map((source) => {
      const file = (source.files || []).find((item) => ["image/png", "image/jpeg", "image/webp"].includes(String(item.type || "").toLowerCase()) && item.blobPathname);
      if (!file) return null;
      const ratio = source.templateMeta.ratio || "";
      if (ratioFilter && ratio !== ratioFilter) return null;
      const ratioLabels = { "16:9": "Slide 16:9", "4:3": "Slide 4:3", "17:22": "One-pager" };
      // Private blobs need a presigned URL. Use a data-URL fallback (local dev)
      // or the cached presigned URL resolved by ensureThumbnailUrls().
      const cachedThumb = file.data || state.thumbnailUrls[file.blobPathname] || null;
      return {
        id: source.id,
        name: source.name,
        ratio,
        ratioLabel: ratioLabels[ratio] || ratio,
        fileName: file.name,
        blobPathname: file.blobPathname,
        thumbUrl: cachedThumb,
      };
    })
    .filter(Boolean);
}

// Resolve presigned GET URLs for private source thumbnails and cache them.
// Called when a screen needs to display thumbnails; re-renders once resolved.
async function ensureThumbnailUrls(pathnames) {
  if (typeof fetch !== "function") return;
  const missing = pathnames.filter((p) => p && !state.thumbnailUrls[p]);
  if (!missing.length) return;
  let resolvedAny = false;
  await Promise.all(missing.map(async (pathname) => {
    try {
      const response = await fetch("/api/blob/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathname, mode: "read" }),
      });
      if (!response.ok) return;
      const body = await readApiJson(response);
      if (body.presignedUrl) {
        state.thumbnailUrls[pathname] = body.presignedUrl;
        resolvedAny = true;
      }
    } catch {
      // Leave unresolved; the thumbnail stays blank.
    }
  }));
  if (resolvedAny) render();
}

function renderLockedAssetPicker(options = {}) {
  const assets = productionLockedAssets();
  const required = options.required || false;
  const selected = assets.find((item) => item.id === state.lockedAssetId);
  const uploading = state.productAssetUploading;

  // Empty state: give the marketer a way to add a product asset right here
  if (!assets.length) {
    return `
      <div class="reference-section">
        <div class="reference-heading">
          <div>
            <span class="section-label">Product asset${required ? "" : " (optional)"}</span>
            <p>${required
              ? "This asset type places a real product in the scene. Upload the product image so it is preserved exactly rather than invented by the model."
              : "Upload a product image to preserve it exactly in the generated image."}</p>
          </div>
        </div>
        <label class="product-upload-drop ${uploading ? "busy" : ""}">
          <input type="file" accept="image/png,image/jpeg,image/webp" data-action="product-asset-input" ${uploading ? "disabled" : ""} hidden>
          <span class="product-upload-icon">${uploading ? "⋯" : "＋"}</span>
          <span class="product-upload-copy">
            <strong>${uploading ? "Uploading" : "Add a product image"}</strong>
            <span>${uploading ? "Storing the file" : "PNG, JPEG, or WebP. A clean pack shot on a plain background works best."}</span>
          </span>
        </label>
        ${required ? '<p class="field-note field-note-spaced">Without a product image the model will invent packaging, which will not match the real product.</p>' : ""}
      </div>
    `;
  }

  return `
    <div class="reference-section">
      <div class="reference-heading">
        <div>
          <span class="section-label">Product asset${required ? "" : " (optional)"}</span>
          <p>The selected file is placed without change. The model builds the scene around it.</p>
        </div>
      </div>
      <div class="reference-list">
        ${assets.map((item) => {
          const active = item.id === state.lockedAssetId;
          return `
            <article class="source-option ${active ? "surface-accent surface-accent-protected" : ""}">
              <span class="source-kind-icon">P</span>
              <span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.detail)} · ${escapeHtml(item.fileName)}</span></span>
              <button class="button ghost compact" type="button" data-action="toggle-locked-asset" data-id="${escapeHtml(item.id)}">${active ? "Remove" : "Include"}</button>
            </article>
          `;
        }).join("")}
        <label class="product-upload-inline ${uploading ? "busy" : ""}">
          <input type="file" accept="image/png,image/jpeg,image/webp" data-action="product-asset-input" ${uploading ? "disabled" : ""} hidden>
          <span>${uploading ? "Uploading" : "＋ Add another product image"}</span>
        </label>
        ${selected ? '<p class="field-note field-note-spaced">This asset stays exact. The prompt carries format-specific protection rules.</p>' : required ? '<p class="field-note field-note-spaced">Select a product image before generating.</p>' : ""}
      </div>
    </div>
  `;
}

function renderBrief() {
  if (state.selectedDeliverable.id === "linkedin-post") return renderLinkedInBrief();
  const formats = placementFormats[state.brief.placement];
  const referenceRows = state.references.map(referenceEditor).join("");
  const approved = approvedBrainForProduction();
  const rules = approved?.guidanceSections?.find((section) => section.id === "rules");
  const identity = approved?.guidanceSections?.find((section) => section.id === "identity");
  const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
  const modeLabel = campaign ? campaign.name : state.creativeMode === "explore" ? "Brand exploration" : "Standalone asset";
  // Drafts are kept deliberately, so the strip shows both. Recency is the default
  // sort because the thing you just made is the thing you are most likely to reuse.
  const recentOutputs = state.outputs
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 4);

  return shell(`
    <section class="workspace">
      ${pageHeader(
        campaign ? `New image for ${campaign.name}` : "New brand world image",
        approved
          ? campaign
            ? `Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion} + ${campaign.name} campaign direction shape the result.`
            : `Describe the image you need. ${state.brandName} Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion} will shape the result.`
          : "Describe the image you need after approving a Brand Brain.",
      )}

      <div class="content-grid">
        <section class="card">
          <div class="card-header">
            <h2>Your brief</h2>
            <span class="mini-pill">Scene image</span>
          </div>

          <div class="field-grid">
            <div class="field full">
              <label for="scene">What are you making?</label>
              <textarea id="scene" data-action="scene-input">${escapeHtml(state.brief.scene)}</textarea>
            </div>
            <div class="field full">
              <label for="exclusions">Anything to avoid?</label>
              <input class="input-like" id="exclusions" data-action="exclusions-input" value="${escapeHtml(state.brief.exclusions)}">
              <span class="field-note">These are added to the approved brand boundaries for this image only.</span>
            </div>
            <div class="field">
              <label for="placement">Placement</label>
              <select id="placement" data-action="placement-change">
                ${Object.keys(placementFormats)
                  .map((placement) => option(placement, state.brief.placement))
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="format">Format for ${escapeHtml(state.brief.placement)}</label>
              <select id="format" data-action="format-change">
                ${formats.map((format) => option(format, state.brief.format)).join("")}
              </select>
            </div>
          </div>

          <div class="reference-section">
            <div class="reference-heading">
              <div>
                <span class="section-label">Creative inputs (optional)</span>
                <p>Add an uploaded visual source only when you can name what it should influence. Approved guidance still takes priority.</p>
              </div>
              <button class="button ghost" type="button" data-action="toggle-source-picker">${state.sourcePickerOpen ? "Close" : "+ Add source"}</button>
            </div>
            ${renderSourcePicker()}
            <div class="reference-list">
              ${referenceRows || '<p class="page-description">No creative inputs added. Brand guidance still applies.</p>'}
            </div>
          </div>

          ${renderLockedAssetPicker()}
        </section>

        <aside>
          ${recentOutputs.length ? `
          <section class="card">
            <div class="card-header">
              <h2>Recent work</h2>
              <span class="mini-pill">${recentOutputs.length}</span>
            </div>
            <div class="recent-strip">
              ${recentOutputs.map((o) => `
                <div class="recent-item">
                  ${o.imageUrl
                    ? `<button class="output-thumb output-thumb-button" type="button" data-action="preview-output" data-id="${o.id}" aria-label="Preview ${escapeHtml(o.label)}"><img src="${escapeHtml(o.imageUrl)}" alt="" onerror="this.closest('.output-thumb').classList.add('output-thumb-missing'); this.remove();"></button>`
                    : `<span class="output-thumb"></span>`}
                  <span class="recent-item-body">
                    <strong>${escapeHtml(o.label)}</strong>
                    <span class="output-meta">${escapeHtml(o.format || "")}${o.campaignName ? ` · ${escapeHtml(o.campaignName)}` : ""}</span>
                  </span>
                  <span class="output-badges">
                    <span class="mini-pill ${o.status === "approved" ? "pill-success" : "pill-neutral"}">${o.status === "approved" ? "Approved" : "Draft"}</span>
                    ${o.package ? `<button class="button ghost compact" type="button" data-action="reuse-output" data-id="${o.id}">Reuse</button>` : ""}
                  </span>
                </div>
              `).join("")}
            </div>
          </section>
          ` : ""}
          ${campaign ? `
          <section class="card surface-accent surface-accent-governed">
            <div class="card-header">
              <h2>Campaign direction</h2>
              <span class="mini-pill pill-governed">${escapeHtml(campaign.name)}</span>
            </div>
            <ul class="exact-list">
              <li><strong>Campaign idea</strong><span>${escapeHtml(campaign.campaignIdea)}</span></li>
              <li><strong>Message territory</strong><span>${escapeHtml(campaign.messageTerritory)}</span></li>
              <li><strong>Explore</strong><span>${escapeHtml(campaign.explore)}</span></li>
              ${campaign.paletteShift ? `<li><strong>Palette shift</strong><span>${escapeHtml(campaign.paletteShift)}</span></li>` : ""}
              ${campaign.productFocus ? `<li><strong>Product focus</strong><span>${escapeHtml(campaign.productFocus)}</span></li>` : ""}
            </ul>
          </section>
          ` : ""}
          <section class="card">
            <div class="card-header">
              <h2>Guidance applied</h2>
              <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list">
              <li><strong>${escapeHtml(state.brandName)} foundation</strong><span>${escapeHtml(approved?.guidanceSections?.find((section) => section.id === "foundation")?.summary || "Approve the Brand Brain to use this guidance")}</span></li>
              <li><strong>Identity direction</strong><span>${escapeHtml(identity?.summary || "No approved identity direction is active")}</span></li>
              <li><strong>Creative direction</strong><span>${escapeHtml(approved?.guidanceSections?.find((section) => section.id === "creative")?.summary || "No approved creative direction is active")}</span></li>
            </ul>
            <div class="rule-card">
              <span class="section-label">Boundaries in play</span>
              <div class="rule">
                <span class="mini-pill">Applied</span>
                <span><strong>${escapeHtml(rules?.principles?.[0] || "Approved Brand Brain required")}</strong><span>${escapeHtml(rules?.summary || "Production remains unavailable until the Brand Brain is approved.")}</span></span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="save-draft">Save draft</button>
        <button class="button primary" type="button" data-action="continue-preflight" ${approved ? "" : "disabled"}>Continue to preflight ›</button>
      </div>
    </section>
  `);
}

function renderLinkedInBrief() {
  const approved = approvedBrainForProduction();
  const voice = approved?.guidanceSections?.find((section) => section.id === "voice");
  const foundation = approved?.guidanceSections?.find((section) => section.id === "foundation");
  const rules = approved?.guidanceSections?.find((section) => section.id === "rules");
  const postTypes = ["Thought leadership", "Product announcement", "Case study", "Event promotion", "Industry insight", "Behind the scenes"];

  return shell(`
    <section class="workspace">
      ${pageHeader(
        "New LinkedIn post",
        approved
          ? `Write a post grounded in ${state.brandName} voice and approved claims. Brand Brain v${state.brain.approvedVersion || state.brain.artifactVersion} shapes the copy.`
          : "Approve a Brand Brain before writing posts.",
      )}

      <div class="content-grid">
        <section class="card">
          <div class="card-header">
            <h2>Your brief</h2>
            <span class="mini-pill">Post + image</span>
          </div>

          <div class="field-grid">
            <div class="field">
              <label for="post-type">Post type</label>
              <select id="post-type" data-action="post-type-change">
                ${postTypes.map((t) => option(t, state.brief.postType)).join("")}
              </select>
            </div>
            <div class="field">
              <label for="placement">Placement</label>
              <select id="placement" data-action="placement-change">
                <option value="LinkedIn feed" selected>LinkedIn feed</option>
              </select>
            </div>
            <div class="field full">
              <label for="post-topic">What is this post about?</label>
              <textarea id="post-topic" data-action="post-topic-input" placeholder="Describe the key message or angle. The approved voice guidance and brand foundation shape the writing.">${escapeHtml(state.brief.postTopic)}</textarea>
            </div>
            <div class="field full">
              <label for="post-claims">Approved claims or product facts to include (optional)</label>
              <input class="input-like" id="post-claims" data-action="post-claims-input" value="${escapeHtml(state.brief.postClaims)}" placeholder="Only claims verified by the Brand Brain will appear in the post.">
              <span class="field-note">Leave blank to let the system draw from approved brand foundation only.</span>
            </div>
            <div class="field full">
              <label for="post-cta">Call to action (optional)</label>
              <input class="input-like" id="post-cta" data-action="post-cta-input" value="${escapeHtml(state.brief.postCta)}" placeholder="e.g., Visit the link in bio, Try it this afternoon">
            </div>
            <div class="field full">
              <label for="exclusions">Anything to avoid?</label>
              <input class="input-like" id="exclusions" data-action="exclusions-input" value="${escapeHtml(state.brief.exclusions)}">
            </div>
            <div class="field full">
              <label class="checkbox-label">
                <input type="checkbox" data-action="toggle-include-image" ${state.brief.includeImage ? "checked" : ""}>
                <span>Generate a supporting image for this post</span>
              </label>
              ${state.brief.includeImage ? `
                <div class="field field-spaced">
                  <label for="format">Image format</label>
                  <select id="format" data-action="format-change">
                    ${(placementFormats["LinkedIn feed"] || ["1:1 square"]).map((f) => option(f, state.brief.format)).join("")}
                  </select>
                </div>
                <div class="field field-spaced">
                  <label for="scene">Image direction (optional)</label>
                  <input class="input-like" id="scene" data-action="scene-input" value="${escapeHtml(state.brief.scene)}" placeholder="Leave blank to let the system compose from brand guidance.">
                </div>
              ` : ""}
            </div>
          </div>
        </section>

        <aside>
          <section class="card">
            <div class="card-header">
              <h2>Guidance applied</h2>
              <span class="status-pill">${approved ? `Brain v${state.brain.approvedVersion || state.brain.artifactVersion}` : "Not ready"}</span>
            </div>
            <ul class="exact-list">
              <li><strong>Voice and messaging</strong><span>${escapeHtml(voice?.summary || "Approve the Brand Brain to use this guidance")}</span></li>
              <li><strong>${escapeHtml(state.brandName)} foundation</strong><span>${escapeHtml(foundation?.summary || "No approved foundation is active")}</span></li>
            </ul>
            <div class="rule-card">
              <span class="section-label">Boundaries in play</span>
              <div class="rule">
                <span class="mini-pill">Applied</span>
                <span><strong>${escapeHtml(rules?.principles?.[0] || "Approved Brand Brain required")}</strong><span>${escapeHtml(rules?.summary || "Production remains unavailable until the Brand Brain is approved.")}</span></span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="save-draft">Save draft</button>
        <button class="button primary" type="button" data-action="continue-preflight" ${approved ? "" : "disabled"}>Continue to preflight ›</button>
      </div>
    </section>
  `);
}

function referenceEditor(item, index) {
  return `
    <article class="reference-card">
      <span class="thumb ${item.thumb}" aria-hidden="true"></span>
      <span class="reference-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.detail)}</span>
        <span class="reference-meta"><span class="mini-pill">${escapeHtml(item.sourceType)}</span><span>${item.confidence === "User supplied" ? "Uploaded source" : `${escapeHtml(item.confidence)}-confidence read`}</span></span>
      </span>
      <button class="icon-button" type="button" data-action="remove-reference" data-index="${index}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
      <span class="reference-controls">
        <label>
          <span>Use for</span>
          <select data-action="reference-role" data-index="${index}" aria-label="Role for ${escapeHtml(item.name)}">
            ${["Lighting + mood", "Composition", "Materials", "Casting", "Style calibration", "Differentiate away"]
              .map((role) => option(role, item.role))
              .join("")}
          </select>
        </label>
        <label>
          <span>Influence</span>
          <select data-action="reference-influence" data-index="${index}" aria-label="Influence for ${escapeHtml(item.name)}">
            ${["Lead", "Strong", "Supporting", "Light"].map((level) => option(level, item.influence)).join("")}
          </select>
        </label>
        <label class="guidance-field">
          <span>Usage instruction</span>
          <input class="usage-input" data-action="reference-guidance" data-index="${index}" value="${escapeHtml(item.usageInstruction)}" aria-label="Usage instruction for ${escapeHtml(item.name)}">
        </label>
      </span>
    </article>
  `;
}

function renderSourcePicker() {
  if (!state.sourcePickerOpen) return "";
  const available = productionReferenceLibrary().filter(
    (item) => !state.references.some((reference) => reference.id === item.id),
  );
  return `
    <section class="source-picker">
      <div class="source-picker-heading">
        <span><strong>Choose another source</strong><span>Select a visual source you already added to the Brand Brain.</span></span>
        <span class="mini-pill">Your sources</span>
      </div>
      <div class="source-options">
        ${available.length
          ? available
              .map(
                (item) => `
                  <button class="source-option" type="button" data-action="attach-source" data-id="${item.id}">
                    <span class="thumb ${item.thumb}" aria-hidden="true"></span>
                    <span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sourceType)} · ${escapeHtml(item.provenance)}</span></span>
                    <span aria-hidden="true">+</span>
                  </button>
                `,
              )
              .join("")
          : '<p class="page-description">No other uploaded PNG, JPG, or WEBP creative sources are available.</p>'}
      </div>
    </section>
  `;
}

function option(value, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`;
}

function renderPreflight() {
  const generationPackage = state.production.package;
  if (!generationPackage) {
    return shell(`
      <section class="workspace">
        ${pageHeader("Preparing preflight", state.production.error || "Building the exact prompt from your approved Brand Brain.")}
        <section class="card production-wait-card">
          <div class="production-spinner" aria-hidden="true"></div>
          <h2>${state.production.status === "error" ? "Preflight needs another try" : "Building your production package"}</h2>
          <p>${escapeHtml(state.production.error || "This should only take a moment. No image is being generated yet.")}</p>
          ${state.production.status === "error" ? '<button class="button primary" type="button" data-action="continue-preflight">Try again</button>' : ""}
        </section>
      </section>
    `);
  }
  const sources = generationPackage.compiledComponents
    .map((source) => `<span class="source-chip">${escapeHtml(source)}</span>`)
    .join("");
  const prompt = generationPackage.sections
    .map(
      (section) => `<p><strong>${escapeHtml(section.title.toUpperCase())}</strong>: ${escapeHtml(section.body)}</p>`,
    )
    .join("");

  return shell(`
    <section class="workspace">
      ${pageHeader("Preflight", "Review the exact prompt and inputs before OpenAI generates the image.")}

      <div class="preflight-grid">
        <div>
          <details class="card collapsible-card">
            <summary class="card-header collapsible-header">
              <h2>Compiled prompt</h2>
              <span class="collapsible-meta"><span class="mini-pill pill-success">${generationPackage.sections.length} sections compiled</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
            </summary>
            <div class="prompt-panel">
              <span class="component-kicker">Compiled components</span>
              <div class="source-chips">${sources}</div>
              <div class="compiled-prompt">${prompt}</div>
            </div>
            <div class="utility-actions">
              <button class="button" type="button" data-action="copy-prompt">Copy prompt</button>
              <button class="button" type="button" data-action="download-package">Download package</button>
            </div>
          </details>

          <details class="card collapsible-card">
            <summary class="card-header collapsible-header">
              <h2>Production contract</h2>
              <span class="collapsible-meta"><span class="mini-pill pill-neutral">${escapeHtml(generationPackage.aestheticMode?.name || "Compiled")}</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
            </summary>
            <ul class="contract-list">
              <li><strong>Grounded in:</strong> ${escapeHtml(generationPackage.policy.groundedIn)}</li>
              ${generationPackage.lockedAsset ? `<li><strong>Protected asset:</strong> ${escapeHtml(generationPackage.lockedAsset.name)} (${escapeHtml(generationPackage.lockedAsset.format)})</li>` : ""}
              ${generationPackage.product ? `<li><strong>Product record:</strong> ${escapeHtml(generationPackage.product.product_name)} v${escapeHtml(generationPackage.product.version)}</li>` : ""}
              ${generationPackage.aestheticMode ? `<li><strong>Visual register:</strong> ${escapeHtml(generationPackage.aestheticMode.name)}</li>` : ""}
              <li><strong>Flexible:</strong> ${escapeHtml(generationPackage.policy.flexible.join(", "))}</li>
              <li><strong>Excluded:</strong> ${escapeHtml(generationPackage.policy.excluded.join("; "))}</li>
            </ul>
            ${generationPackage.stateNeutralizations?.length ? `<div class="rule-card"><span class="section-label">Scene adjustments</span><div class="rule"><span class="mini-pill">Adjusted</span><span><strong>Your scene was adjusted to keep the protected asset sealed</strong><span>${escapeHtml(generationPackage.stateNeutralizations.join(", "))} changed to match the supplied asset state.</span></span></div></div>` : ""}
          </details>

          ${generationPackage.treatments?.length ? `
          <details class="card collapsible-card">
            <summary class="card-header collapsible-header">
              <h2>What the system will do</h2>
              <span class="collapsible-meta"><span class="mini-pill pill-success">${generationPackage.treatments.filter((t) => t.treatment === "locked").length} exact · ${generationPackage.treatments.filter((t) => t.treatment === "suggested").length} interpreted</span><span class="collapsible-chevron" aria-hidden="true"></span></span>
            </summary>
            ${["locked", "suggested", "not_needed", "needs_input"].map((treatment) => {
              const items = generationPackage.treatments.filter((t) => t.treatment === treatment);
              if (!items.length) return "";
              const treatmentLabels = { locked: "Stays exact", suggested: "System interprets", not_needed: "Not needed for this job", needs_input: "Needs your input" };
              const treatmentClasses = {
                locked: "pill-protected",
                suggested: "pill-success",
                not_needed: "pill-neutral",
                needs_input: "pill-warning",
              };
              return `
                <div class="rule-card">
                  <span class="section-label">${treatmentLabels[treatment]}</span>
                  ${items.map((item) => `
                    <div class="rule">
                      <span class="mini-pill ${treatmentClasses[treatment]}">${escapeHtml(item.category)}</span>
                      <span><strong>${escapeHtml(item.element)}</strong><span>${escapeHtml(item.reason)}</span></span>
                    </div>
                  `).join("")}
                </div>
              `;
            }).join("")}
            ${generationPackage.requirementCheck?.length ? `
              <div class="rule-card">
                <span class="section-label">Deliverable requirements</span>
                ${generationPackage.requirementCheck.filter((r) => r.active).map((r) => `
                  <div class="rule">
                    <span class="mini-pill ${r.met ? "pill-success" : "pill-warning"}">${r.met ? "Met" : "Missing"}</span>
                    <span><strong>${escapeHtml(r.label)}</strong><span>${escapeHtml(r.condition)}</span></span>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </details>
          ` : ""}
        </div>

        <aside>
          <section class="card ready-card">
            <div class="card-header"><h2>${generationPackage.ready !== false ? "Ready to generate" : "Needs your input"}</h2><span class="mini-pill">${generationPackage.ready !== false ? "Ready" : "Review"}</span></div>
            <p>${generationPackage.ready !== false
              ? "The exact prompt, approved Brand Brain version, creative sources, and output format are saved in this package."
              : `${(generationPackage.requirementCheck || []).filter((r) => r.active && !r.met).map((r) => r.label).join(", ")} ${(generationPackage.requirementCheck || []).filter((r) => r.active && !r.met).length === 1 ? "is" : "are"} not available yet. You can still generate, but the result may be incomplete.`
            }</p>
            <button class="button secondary" type="button" data-action="generate">Generate with OpenAI</button>
          </section>


          <section class="card">
            <div class="card-header">
              <h2>Generation inputs</h2>
              <span class="mini-pill">${generationPackage.lockedAsset ? "Protected asset" : state.references.length ? `${state.references.length} source ${state.references.length === 1 ? "image" : "images"}` : "Brain only"}</span>
            </div>
            <div class="input-list">
              <article class="input-row">
                <span class="thumb product" aria-hidden="true"></span>
                <span><strong>${escapeHtml(state.brandName)} Brand Brain v${generationPackage.brainVersion}</strong><span>Approved guidance · applied to the full prompt</span></span>
              </article>
              ${generationPackage.lockedAsset ? `
                <article class="input-row surface-accent surface-accent-protected">
                  <span class="thumb product" aria-hidden="true"></span>
                  <span><strong>${escapeHtml(generationPackage.lockedAsset.name)}</strong><span>Protected ${escapeHtml(generationPackage.lockedAsset.format)} · stays exact · sent as reference image</span></span>
                </article>
              ` : ""}
              ${state.references.map(referenceInput).join("")}
            </div>
            <div class="resolution-section">
              <span class="section-label">How inputs resolved</span>
              <div class="resolution-list">${state.references.length ? state.references.map(referenceResolution).join("") : '<p class="page-description">No additional visual sources are attached.</p>'}</div>
            </div>
          </section>

        </aside>
      </div>

      <div class="actions">
        <button class="button" type="button" data-action="back-to-brief">‹ Back to brief</button>
        ${state.production.job?.status === "complete" ? '<button class="button" type="button" data-action="back-to-result">View result ›</button>' : ""}
      </div>
    </section>
  `);
}

function referenceInput(item) {
  return `
    <article class="input-row">
      <span class="thumb ${item.thumb}" aria-hidden="true"></span>
      <span><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sourceType)} · ${escapeHtml(item.role.toLowerCase())} · ${escapeHtml(item.influence.toLowerCase())}</span></span>
    </article>
  `;
}

function referenceResolution(item) {
  return `
    <article class="resolution-row">
      <span class="resolution-topline"><strong>${escapeHtml(item.name)}</strong><span class="included-status">Included</span></span>
      <p>${escapeHtml(item.usageInstruction)}</p>
      ${item.evidence?.length ? `<span class="evidence-chips">${item.evidence.map((piece) => `<span>${escapeHtml(piece)}</span>`).join("")}</span>` : ""}
      <span class="resolution-note">Included as ${escapeHtml(item.influence.toLowerCase())} influence for ${escapeHtml(item.role.toLowerCase())}</span>
    </article>
  `;
}

function buildEvaluationFindings(job) {
  if (!job?.generationPackage) return [];
  const findings = [];
  const pkg = job.generationPackage;

  // Locked-asset check
  if (pkg.lockedAsset) {
    findings.push({
      id: "locked-asset",
      element: pkg.lockedAsset.name || "Protected asset",
      category: "Fidelity",
      status: "verify",
      finding: "The protected asset was included in the generation input. Verify that the label, proportions, and state are preserved in the result.",
      repairAction: "retry-with-direction",
      repairLabel: "Retry with stronger protection",
    });
  }

  // Composition / placement check
  findings.push({
    id: "composition",
    element: `${pkg.output.format} composition`,
    category: "Output",
    status: "verify",
    finding: `The image was generated at ${pkg.output.size || "default"} for ${pkg.output.placement || "the requested placement"}. Confirm the composition works at this ratio.`,
    repairAction: "retry-with-direction",
    repairLabel: "Retry with adjusted composition",
  });

  // Accidental text / visual claims
  findings.push({
    id: "accidental-text",
    element: "Unintended text or claims",
    category: "Compliance",
    status: "verify",
    finding: "Check for any accidental readable text, logos, or visual elements that could imply a health or performance claim.",
    repairAction: "retry-exclude",
    repairLabel: "Retry with explicit exclusion",
  });

  // Brand-world fidelity
  findings.push({
    id: "brand-fidelity",
    element: `${pkg.brandName} world`,
    category: "Brand",
    status: "verify",
    finding: `Does the scene feel specific to ${pkg.brandName}? The approved creative direction, palette, and materials were compiled into the prompt. The result should feel grounded in those choices, not generic.`,
    repairAction: "retry-with-direction",
    repairLabel: "Retry with stronger direction",
  });

  // Constraint audit findings
  for (const constraint of pkg.constraintAudit || []) {
    if (constraint.status === "excluded" || constraint.status === "warning") {
      findings.push({
        id: `constraint-${constraint.rule?.replace(/\s/g, "-") || Math.random()}`,
        element: constraint.rule || "Constraint",
        category: "Rules",
        status: constraint.status === "excluded" ? "enforced" : "verify",
        finding: constraint.status === "excluded"
          ? `This element was excluded from the prompt: ${constraint.rule}.`
          : `A constraint was flagged during compilation: ${constraint.rule}. Verify the result complies.`,
        repairAction: null,
        repairLabel: null,
      });
    }
  }
  return findings;
}

function renderResult() {
  const job = state.production.job;
  const working = state.production.status === "generating" || job?.status === "working";
  const failed = state.production.status === "error" || job?.status === "error";
  const complete = job?.status === "complete" && job.imageUrl;
  const isLinkedIn = job?.deliverable === "linkedin-post" || job?.generationPackage?.deliverable === "linkedin-post";
  const generationMethod = isLinkedIn ? "Post copy + image" : job?.endpoint?.includes("/edits") ? "Reference-guided image" : "Prompt-only image";
  const findings = complete ? buildEvaluationFindings(job) : [];

  // Add LinkedIn-specific evaluation findings
  if (complete && isLinkedIn && job.postCopy) {
    findings.unshift(
      {
        id: "voice-fidelity",
        element: "Voice and tone",
        category: "Copy",
        status: "verify",
        finding: "Does the post sound like the approved brand voice? Check that it matches the tone, register, and vocabulary from the voice guidance.",
        repairAction: "retry-with-direction",
        repairLabel: "Retry with adjusted voice direction",
      },
      {
        id: "claims-check",
        element: "Claims and facts",
        category: "Compliance",
        status: "verify",
        finding: "Verify that every factual claim in the post is approved by the Brand Brain. Check for implied health, performance, or efficacy claims that may violate scoped prohibitions.",
        repairAction: "retry-exclude",
        repairLabel: "Retry with explicit claim boundaries",
      },
      {
        id: "structural-rules",
        element: "Writing structure",
        category: "Copy",
        status: "verify",
        finding: "Check for em dashes, fragment stacks, hedging verbs, filler intensifiers, or promotional register. These are structural violations of the prose ruleset.",
        repairAction: "retry-with-direction",
        repairLabel: "Retry with stricter structure",
      },
    );
  }
  const candidateRules = state.production.candidateRules || [];
  const feedbackOpen = state.production.feedbackOpen || false;
  const feedbackDraft = state.production.feedbackDraft || "";
  const feedbackScope = state.production.feedbackScope || "this-output";

  return shell(`
    <section class="workspace">
      ${pageHeader(
        failed ? "Generation needs attention" : working ? "Generating your image" : complete ? "Evaluate result" : "Generated result",
        failed ? "Your package is still saved and ready to try again."
          : working ? "OpenAI is creating the image from the reviewed package."
          : complete ? `Created from ${state.brandName} Brand Brain v${job.generationPackage.brainVersion}. Review the findings below before approving or revising.`
          : ""
      )}

      <div class="result-grid">
        <div>
          <section class="card">
            <div class="card-header">
              <h2>${escapeHtml(state.brandName)} brand world image</h2>
              <span class="mini-pill">${complete ? "Generated" : working ? "Working" : "Not generated"}</span>
            </div>
            ${complete
              ? isLinkedIn
                ? `<div class="linkedin-result">
                    ${job.postCopy ? `<div class="linkedin-post-copy"><span class="section-label">Generated post</span><div class="linkedin-post-text">${escapeHtml(job.postCopy).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</div><button class="button small" type="button" data-action="copy-post-text">Copy text</button></div>` : ""}
                    ${job.imageUrl ? `<figure class="generated-output linkedin-image"><img src="${escapeHtml(job.imageUrl)}" alt="Generated ${escapeHtml(state.brandName)} supporting image"><figcaption class="result-caption"><strong>Supporting image</strong><span>${escapeHtml(job.generationPackage?.output?.format || "1:1 square")}</span></figcaption></figure>` : state.brief.includeImage ? '<p class="page-description">The supporting image could not be generated. The post copy is still usable.</p>' : ""}
                  </div>`
                : `<figure class="generated-output"><img src="${escapeHtml(job.imageUrl)}" alt="Generated ${escapeHtml(state.brandName)} brand world image"><figcaption class="result-caption"><strong>${escapeHtml(job.generationPackage.output.format)}</strong><span>${escapeHtml(generationMethod)} · ${escapeHtml(job.model)}</span></figcaption></figure>`
              : `<div class="generation-state ${failed ? "error" : ""}"><div class="production-spinner" aria-hidden="true"></div><h3>${failed ? "The image was not generated" : "OpenAI is rendering the image"}</h3><p>${escapeHtml(state.production.error || job?.error || "The reviewed prompt and approved Brand Brain are saved with this job.")}</p>${failed ? '<button class="button primary" type="button" data-action="retry-generate">Try again</button>' : ""}</div>`
            }
          </section>

          ${complete && findings.length ? `
          <section class="card">
            <div class="card-header">
              <h2>Evaluation findings</h2>
              <span class="mini-pill">${findings.filter((f) => f.status === "verify").length} to verify</span>
            </div>
            <ul class="evaluation-list">
              ${findings.map((f) => `
                <li class="evaluation-item ${f.status}">
                  <div class="evaluation-item-header">
                    <span class="mini-pill ${f.status === "enforced" ? "pill-success" : "pill-warning"}">${f.status === "enforced" ? "Enforced" : "Verify"}</span>
                    <strong>${escapeHtml(f.element)}</strong>
                    <span class="evaluation-category">${escapeHtml(f.category)}</span>
                  </div>
                  <p>${escapeHtml(f.finding)}</p>
                  ${f.repairAction ? `<button class="button small" type="button" data-action="${f.repairAction}" data-finding="${f.id}">${escapeHtml(f.repairLabel)}</button>` : ""}
                </li>
              `).join("")}
            </ul>
          </section>
          ` : ""}
        </div>

        <aside>
          ${complete ? `
          <section class="card">
            <div class="card-header"><h2>Actions</h2></div>
            <div class="result-actions">
              ${state.production.approved
                ? `<button class="button is-disabled" type="button" disabled>Approved</button>`
                : `<button class="button secondary" type="button" data-action="approve-output">Approve this output</button>`
              }
              <button class="button" type="button" data-action="open-feedback">Provide feedback</button>
              <button class="button" type="button" data-action="retry-generate">Try again</button>
              <button class="button" type="button" data-action="back-to-preflight">View package</button>
              <button class="button" type="button" data-action="download-result">Download image</button>
            </div>
          </section>

          ${feedbackOpen ? `
          <section class="card feedback-card">
            <div class="card-header"><h2>What should change?</h2></div>
            <textarea class="feedback-textarea" data-field="feedbackDraft" placeholder="Describe what you would change. Be specific about which element and why." rows="4">${escapeHtml(feedbackDraft)}</textarea>
            <div class="feedback-scope">
              <span class="section-label">Where should this apply?</span>
              <label class="feedback-scope-option ${feedbackScope === "this-output" ? "selected" : ""}">
                <input type="radio" name="feedbackScope" value="this-output" ${feedbackScope === "this-output" ? "checked" : ""} data-action="set-feedback-scope">
                <span><strong>Fix this one</strong>Revise the current output only. Nothing else changes.</span>
              </label>
              <label class="feedback-scope-option ${feedbackScope === "remember" ? "selected" : ""}">
                <input type="radio" name="feedbackScope" value="remember" ${feedbackScope === "remember" ? "checked" : ""} data-action="set-feedback-scope">
                <span><strong>Propose for future work</strong>Submit for review as a candidate rule. Does not change the Brand Brain until someone approves it.</span>
              </label>
              <label class="feedback-scope-option ${feedbackScope === "brand-rule" ? "selected" : ""}">
                <input type="radio" name="feedbackScope" value="brand-rule" ${feedbackScope === "brand-rule" ? "checked" : ""} data-action="set-feedback-scope">
                <span><strong>Propose as a brand rule</strong>Submit for review as a potential identity-defining rule. Requires brand-owner approval before it takes effect.</span>
              </label>
            </div>
            <div class="actions">
              <button class="button secondary" type="button" data-action="submit-feedback" ${feedbackDraft.trim() ? "" : "disabled"}>
                ${feedbackScope === "this-output" ? "Revise this output" : "Submit for review"}
              </button>
              <button class="button" type="button" data-action="cancel-feedback">Cancel</button>
            </div>
          </section>
          ` : ""}

          ${candidateRules.length ? `
          <section class="card">
            <div class="card-header">
              <h2>Pending review</h2>
              <span class="mini-pill">${candidateRules.length} candidate ${candidateRules.length === 1 ? "rule" : "rules"}</span>
            </div>
            <ul class="candidate-rules-list">
              ${candidateRules.map((rule, index) => `
                <li class="candidate-rule-item">
                  <div class="candidate-rule-header">
                    <span class="mini-pill ${rule.scope === "brand-rule" ? "pill-protected" : "pill-governed"}">${rule.scope === "brand-rule" ? "Brand rule proposal" : "Candidate rule"}</span>
                  </div>
                  <p>${escapeHtml(rule.feedback)}</p>
                  <span class="candidate-rule-source">From: ${escapeHtml(rule.sourceOutput || state.brandName + " production")} · ${escapeHtml(rule.time)}</span>
                  <button class="button small" type="button" data-action="dismiss-candidate" data-index="${index}">Dismiss</button>
                </li>
              `).join("")}
            </ul>
          </section>
          ` : ""}

          <section class="card">
            <div class="card-header"><h2>Production record</h2></div>
            <div class="rule-card">
              <div class="rule"><span class="mini-pill">Brain</span><span>v${job.generationPackage.brainVersion} · ${job.generationPackage.sourceCount || 0} sources</span></div>
              <div class="rule"><span class="mini-pill">Mode</span><span>${escapeHtml(job.generationPackage.aestheticMode?.name || "Standard")}</span></div>
              <div class="rule"><span class="mini-pill">Output</span><span>${escapeHtml(job.generationPackage.output?.placement || "")} · ${escapeHtml(job.generationPackage.output?.format || "")}</span></div>
              <div class="rule"><span class="mini-pill">Render</span><span>${escapeHtml(job.model || "OpenAI")} · ${escapeHtml(generationMethod)}</span></div>
              ${job.generationPackage.lockedAsset ? `<div class="rule"><span class="mini-pill">Locked</span><span>${escapeHtml(job.generationPackage.lockedAsset.name)}</span></div>` : ""}
              ${job.generationPackage.references?.length ? `<div class="rule"><span class="mini-pill">Sources</span><span>${job.generationPackage.references.map((r) => escapeHtml(r.name)).join(", ")}</span></div>` : ""}
            </div>
          </section>
          ` : `
          <section class="card" ${working ? "" : "hidden"}>
            <div class="card-header"><h2>Production record</h2></div>
            <p class="page-description">Details will appear when generation completes.</p>
          </section>
          `}

          <section class="card">
            <div class="card-header"><h2>Start over</h2></div>
            <p class="page-description">Begin a new production job from the workflow chooser.</p>
            <button class="button" type="button" data-action="start-new">Start another</button>
          </section>
        </aside>
      </div>
    </section>
  `);
}

function render() {
  if (state.screen === "workspace") root.innerHTML = renderWorkspace();
  else if (state.screen === "brain-overview") root.innerHTML = renderBrainOverview();
  else if (state.screen === "brain-sources") root.innerHTML = renderBrainSources();
  else if (state.screen === "brain-processing") root.innerHTML = renderBrainProcessing();
  else if (state.screen === "brain") root.innerHTML = renderBrandBrain();
  else if (state.screen === "brain-guidance") root.innerHTML = renderBrainGuidance();
  else if (state.screen === "brain-history") root.innerHTML = renderBrainHistory();
  else if (state.screen === "brain-canon") root.innerHTML = renderCanonPromotion();
  else if (state.screen === "studio-setup") root.innerHTML = renderStudioSetup();
  else if (state.screen === "campaigns") root.innerHTML = renderCampaigns();
  else if (state.screen === "campaign-creation") root.innerHTML = renderCampaignCreation();
  else if (state.screen === "campaign-workspace") root.innerHTML = renderCampaignWorkspace();
  else if (state.screen === "products") root.innerHTML = renderProducts();
  else if (state.screen === "product-detail") root.innerHTML = renderProductDetail();
  else if (state.screen === "brief") root.innerHTML = renderBrief();
  else if (state.screen === "preflight") root.innerHTML = renderPreflight();
  else if (state.screen === "result") root.innerHTML = renderResult();
  else root.innerHTML = renderChooser();
}

function navigate(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function recordBrainHistory(title, detail, status = "") {
  state.brain.history.unshift({ title, detail, status, time: "This session" });
}

function serializableSources() {
  return state.brain.sources.map((source) => ({
    ...source,
    files: (source.files ?? []).map(({ data: _data, ...file }) => file),
  }));
}

async function persistBrainState() {
  if (typeof fetch !== "function" || !currentSynthesisResult) return;
  const snapshot = {
    kind: "state",
    sources: serializableSources(),
    result: currentSynthesisResult,
    approvedResult: state.brain.approvedResult,
    model: state.brain.synthesisModel,
    responseId: state.brain.synthesisResponseId,
    synthesisRequestId: state.brain.synthesisRequestId,
    brain: {
      stage: state.brain.stage,
      processingComplete: state.brain.processingComplete,
      resolutions: state.brain.resolutions,
      cleanApproved: state.brain.cleanApproved,
      artifactVersion: state.brain.artifactVersion,
      artifactStatus: state.brain.artifactStatus,
      approvedVersion: state.brain.approvedVersion,
      revisionPending: state.brain.revisionPending,
      pendingSourceIds: state.brain.pendingSourceIds,
      affectedGuidanceIds: state.brain.affectedGuidanceIds,
      candidateBaseVersion: state.brain.candidateBaseVersion,
      guidanceComments: state.brain.guidanceComments,
      history: state.brain.history,
    },
  };
  try {
    const response = await fetch("/api/brand-brain/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
    if (response.ok) {
      const saved = await readApiJson(response);
      state.brain.savedAt = saved.savedAt || state.brain.savedAt;
    }
  } catch {
    // The UI remains usable if local persistence is temporarily unavailable.
  }
}

function normalizeGuidanceSections(sections) {
  return sections.map((section) => ({
    ...section,
    artifacts: section.artifacts.map((artifact) => ({ ...artifact, readerId: artifact.readerId === "none" ? "" : artifact.readerId })),
  }));
}

function changedGuidanceIds(baseline, result) {
  if (!baseline?.guidanceSections) return [];
  const previous = new Map(baseline.guidanceSections.map((section) => [section.id, section]));
  return result.guidanceSections.filter((section) => JSON.stringify(previous.get(section.id)) !== JSON.stringify(section)).map((section) => section.id);
}

function applySynthesisResult(result, options = {}) {
  const incremental = Boolean(options.baseline);
  currentSynthesisResult = result;
  state.brandName = result.brandName || state.brandName;
  state.brandDescription = result.brandDescription || state.brandDescription;
  guidanceSections = normalizeGuidanceSections(result.guidanceSections);
  brainArtifacts = [
    { id: "dossier", number: "01", name: "Brand Dossier", short: "The strategic read", ...result.artifacts.dossier },
    { id: "lived", number: "02", name: "Lived World", short: "The person and their life", ...result.artifacts.livedWorld },
    { id: "story", number: "03", name: "Story Architecture", short: "The moments production can build", ...result.artifacts.storyArchitecture },
  ];
  brainExceptions = result.reviewQuestions.map((question, index) => ({
    ...question,
    id: question.id || `review-${index + 1}`,
    scope: (question.scope ?? []).map((entry) => [entry.label, entry.value]),
  }));
  brainBatch = {
    id: `brand-brain-${Date.now()}`,
    name: `${state.brandName} source batch`,
    assetCount: brainSourceCount(),
    cleanCount: result.cleanAssetCount,
    sources: state.brain.sources.map((source) => source.name),
    rights: "Source instructions attached · Approval remains yours",
  };
  state.brain.selectedExceptionId = brainExceptions[0]?.id ?? "";
  state.brain.cleanApproved = result.cleanAssetCount === 0;
  state.brain.resolutions = {};
  state.brain.processingComplete = true;
  state.brain.processingError = "";
  state.brain.processingStep = synthesisSteps.length;
  state.brain.stage = "review";
  if (incremental) {
    state.brain.approvedResult = options.baseline;
    state.brain.approvedVersion = options.baselineVersion || state.brain.approvedVersion || state.brain.artifactVersion;
    state.brain.candidateBaseVersion = state.brain.approvedVersion;
    state.brain.affectedGuidanceIds = changedGuidanceIds(options.baseline, result);
    state.brain.revisionPending = true;
    state.brain.artifactStatus = "ready";
  } else {
    state.brain.artifactStatus = "not-created";
    state.brain.artifactVersion = 1;
    state.brain.approvedVersion = 0;
    state.brain.approvedResult = null;
    state.brain.pendingSourceIds = [];
    state.brain.affectedGuidanceIds = [];
    state.brain.candidateBaseVersion = 0;
  }
  state.brain.selectedGuidanceId = "foundation";
  state.brain.guidanceView = "guidance";
  state.brain.selectedBrainArtifactId = "dossier";
}

async function hydrateStoredBrain() {
  if (typeof fetch !== "function") return;
  try {
    const response = await fetch("/api/brand-brain", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const { saved } = await readApiJson(response);
    if (!saved?.result || !Array.isArray(saved.sources)) return;
    state.brain.sources = saved.sources;
    const savedBaseline = saved.approvedResult || null;
    applySynthesisResult(saved.result, {
      baseline: savedBaseline,
      baselineVersion: saved.baselineVersion || saved.brain?.approvedVersion || saved.brain?.candidateBaseVersion,
    });
    state.brain.synthesisKind = "openai";
    syncProductionReferences();
    state.brain.synthesisModel = saved.model || "";
    state.brain.synthesisResponseId = saved.responseId || "";
    state.brain.synthesisRequestId = saved.synthesisRequestId || "";
    state.brain.savedAt = saved.savedAt || "";
    if (saved.brain) {
      state.brain.stage = saved.brain.stage || state.brain.stage;
      state.brain.processingComplete = saved.brain.processingComplete ?? state.brain.processingComplete;
      state.brain.resolutions = saved.brain.resolutions || {};
      state.brain.cleanApproved = saved.brain.cleanApproved ?? state.brain.cleanApproved;
      state.brain.artifactVersion = saved.brain.artifactVersion || 1;
      state.brain.artifactStatus = saved.brain.artifactStatus || "not-created";
      state.brain.approvedVersion = saved.brain.approvedVersion || state.brain.approvedVersion;
      state.brain.revisionPending = saved.brain.revisionPending ?? state.brain.revisionPending;
      state.brain.pendingSourceIds = saved.brain.pendingSourceIds || [];
      state.brain.affectedGuidanceIds = saved.brain.affectedGuidanceIds || state.brain.affectedGuidanceIds;
      state.brain.candidateBaseVersion = saved.brain.candidateBaseVersion || state.brain.candidateBaseVersion;
      state.brain.guidanceComments = saved.brain.guidanceComments || [];
      state.brain.history = saved.brain.history || [];
    }
    if (savedBaseline) state.brain.approvedResult = savedBaseline;
    else if (state.brain.artifactStatus === "ready") {
      state.brain.approvedResult = JSON.parse(JSON.stringify(saved.result));
      state.brain.approvedVersion = state.brain.artifactVersion;
    }
    render();
  } catch {
    // A plain static server can still display the sample prototype.
  }
}

function loadSampleSources() {
  brainBatch = JSON.parse(JSON.stringify(sampleBrainBatch));
  guidanceSections = JSON.parse(JSON.stringify(sampleGuidanceSections));
  brainArtifacts = JSON.parse(JSON.stringify(sampleBrainArtifacts));
  brainExceptions = JSON.parse(JSON.stringify(sampleBrainExceptions));
  currentSynthesisResult = sampleResultSnapshot();
  state.brandName = "SLAKE";
  state.brandDescription = "Adaptogen sparkling water";
  state.brain.sources = sampleSourceGroups.map((source) => ({ ...source }));
  state.brain.stage = "intake";
  state.brain.processingComplete = false;
  state.brain.processingStep = -1;
  state.brain.processingError = "";
  state.brain.synthesisKind = "sample";
  state.brain.synthesisModel = "";
  state.brain.synthesisResponseId = "";
  state.brain.synthesisRequestId = "";
  state.brain.selectedExceptionId = brainExceptions[0]?.id ?? "";
  state.brain.cleanApproved = false;
  state.brain.resolutions = {};
  state.brain.canonPromoted = false;
  state.brain.artifactVersion = 1;
  state.brain.artifactStatus = "not-created";
  state.brain.revisionPending = false;
  state.brain.approvedVersion = 0;
  state.brain.approvedResult = null;
  state.brain.pendingSourceIds = [];
  state.brain.affectedGuidanceIds = [];
  state.brain.candidateBaseVersion = 0;
  state.brain.selectedGuidanceId = "foundation";
  state.brain.guidanceView = "guidance";
  state.brain.selectedBrainArtifactId = "dossier";
  state.brain.selectedSourceId = "";
  state.brain.selectedArtifactId = "";
  state.brain.commentTarget = "";
  state.brain.commentDraft = "";
  state.brain.guidanceComments = [];
  state.brain.feedbackOpen = false;
  state.brain.feedbackDraft = "";
  state.brain.history = [];
  recordBrainHistory("SLAKE source batch added", "50 items from the website, strategy decks, campaign archive, and stakeholder material were collected.", "complete");
  navigate("brain-sources");
}

function simulateBrainSynthesis() {
  state.brain.synthesisKind = "sample";
  const timer = window.setInterval(() => {
    if (state.brain.processingStep < synthesisSteps.length - 1) {
      state.brain.processingStep += 1;
    } else {
      window.clearInterval(timer);
      state.brain.processingComplete = true;
      state.brain.stage = "review";
      recordBrainHistory("Synthesis prepared for review", `${brainBatch.cleanCount} clean assets and ${brainExceptions.length} questions were prepared from the source batch.`, "complete");
    }
    if (state.screen.startsWith("brain")) render();
  }, 1250);
}

async function recoverBrainSynthesis(requestId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch("/api/brand-brain", { headers: { Accept: "application/json" } });
      if (response.ok) {
        const { saved } = await readApiJson(response);
        if (saved?.synthesisRequestId === requestId && saved.result) return saved;
      }
    } catch {
      // A later check can still find the saved result after the connection returns.
    }
    await wait(1500);
  }
  return null;
}

async function startBrainSynthesis() {
  if (!state.brain.sources.length) return;
  if (state.brain.stage === "processing" && !state.brain.processingComplete) {
    navigate("brain-processing");
    return;
  }
  const incremental = sourceHasApprovedBaseline();
  if (incremental && !state.brain.pendingSourceIds.length) {
    setToast("Add at least one new source before preparing an update");
    return;
  }
  if (incremental && !state.brain.approvedResult && currentSynthesisResult) {
    state.brain.approvedResult = JSON.parse(JSON.stringify(currentSynthesisResult));
    state.brain.approvedVersion = state.brain.artifactVersion;
  }
  const requestSources = incremental
    ? state.brain.sources.filter((source) => state.brain.pendingSourceIds.includes(source.id) && !source.templateMeta && !source.productMeta)
    : state.brain.sources.filter((source) => !source.templateMeta && !source.productMeta);
  if (!requestSources.length) {
    // Only templates or product briefs were added. These are stored alongside
    // the brain but excluded from brain synthesis (templates are production
    // assets; product briefs route to per-product synthesis per ADR 0012).
    if (currentSynthesisResult) {
      void persistBrainState();
    }
    const hasProductBriefs = state.brain.sources.some((s) => s.productMeta);
    setToast(hasProductBriefs
      ? "Product briefs saved. Build their product records from the Products screen."
      : "Templates saved. They do not change the Brand Brain synthesis.");
    return;
  }
  if (sourceFileBytes(requestSources.map((source) => source.id)) > MAX_SYNTHESIS_FILE_BYTES) {
    setToast("This build can read up to 40 MB of uploaded files in one synthesis. Prepare a smaller batch.");
    return;
  }
  const baseline = incremental ? state.brain.approvedResult : null;
  state.brain.revisionPending = incremental;
  state.brain.selectedExceptionId = brainExceptions[0]?.id ?? "";
  state.brain.cleanApproved = false;
  state.brain.resolutions = {};
  state.brain.stage = "processing";
  state.brain.processingComplete = false;
  state.brain.processingError = "";
  state.brain.processingStep = 0;
  navigate("brain-processing");
  if (typeof fetch !== "function") {
    simulateBrainSynthesis();
    return;
  }

  state.brain.synthesisKind = "openai";
  const requestId = newRequestId("synthesis");
  state.brain.synthesisRequestId = requestId;
  const progressTimer = window.setInterval(() => {
    if (state.brain.processingStep < synthesisSteps.length - 1) state.brain.processingStep += 1;
    if (state.screen === "brain-processing") render();
  }, 1400);

  try {
    const response = await fetch("/api/brand-brain/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources: requestSources,
        mode: incremental ? "incremental" : "initial",
        baselineVersion: incremental ? state.brain.approvedVersion : undefined,
        requestId,
      }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The Brand Brain could not be built.");
    applySynthesisResult(body.result, {
      baseline: body.approvedResult || baseline,
      baselineVersion: body.baselineVersion || state.brain.approvedVersion,
    });
    state.brain.synthesisModel = body.model || "OpenAI";
    state.brain.synthesisResponseId = body.responseId || "";
    state.brain.synthesisRequestId = body.synthesisRequestId || requestId;
    state.brain.savedAt = body.savedAt || "";
    recordBrainHistory(
      incremental ? `Update to Brand Brain v${state.brain.approvedVersion} prepared` : "Brand Brain synthesis prepared for review",
      incremental
        ? `${requestSources.length} new ${requestSources.length === 1 ? "source was" : "sources were"} checked against the approved version. ${state.brain.affectedGuidanceIds.length || "No"} guidance ${state.brain.affectedGuidanceIds.length === 1 ? "area was" : "areas were"} changed in the candidate.`
        : `${brainSourceCount()} source items produced six guidance sections, three working artifacts, and ${brainExceptions.length} review ${brainExceptions.length === 1 ? "question" : "questions"}.`,
      "complete",
    );
  } catch (error) {
    const recovered = await recoverBrainSynthesis(requestId);
    if (recovered) {
      applySynthesisResult(recovered.result, {
        baseline: recovered.approvedResult || baseline,
        baselineVersion: recovered.baselineVersion || state.brain.approvedVersion,
      });
      state.brain.synthesisModel = recovered.model || "OpenAI";
      state.brain.synthesisResponseId = recovered.responseId || "";
      state.brain.synthesisRequestId = recovered.synthesisRequestId || requestId;
      state.brain.savedAt = recovered.savedAt || "";
      recordBrainHistory(
        incremental ? `Update to Brand Brain v${state.brain.approvedVersion} recovered` : "Brand Brain synthesis recovered",
        "The browser connection dropped after the work was saved. The completed draft was restored automatically.",
        "complete",
      );
      setToast("The completed Brand Brain draft was recovered after the connection dropped");
    } else {
      state.brain.processingError = `${error.message || "The Brand Brain response was lost."} Your sources are still saved. Try again when the connection is stable.`;
      state.brain.stage = "intake";
    }
  } finally {
    window.clearInterval(progressTimer);
    if (state.screen.startsWith("brain")) render();
  }
}

function setToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}

function newRequestId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function productionRequest(jobId) {
  const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
  return {
    jobId,
    brief: { ...state.brief },
    productId: state.studio.salesProductId || undefined,
    lockedAssetId: state.lockedAssetId || undefined,
    templateAssetId: state.studio.salesTemplateId || undefined,
    references: state.references.map((item) => ({
      id: item.id,
      role: item.role,
      influence: item.influence,
      usageInstruction: item.usageInstruction,
    })),
    campaign: campaign ? {
      name: campaign.name,
      campaignIdea: campaign.campaignIdea,
      messageTerritory: campaign.messageTerritory,
      objective: campaign.objective,
      audience: campaign.audience,
      desiredBelief: campaign.desiredBelief,
      preserve: campaign.preserve,
      explore: campaign.explore,
      paletteShift: campaign.paletteShift,
      productFocus: campaign.productFocus,
      priorOutputs: state.campaignReferences.map((ref) => ({
        label: ref.label,
        scene: ref.scene,
        role: ref.role,
        channel: ref.channel,
        format: ref.format,
      })),
    } : undefined,
  };
}

async function prepareProductionPreflight() {
  if (!approvedBrainForProduction()) {
    setToast("Approve the Brand Brain before starting production");
    return;
  }
  state.production.status = "preflighting";
  state.production.error = "";
  state.production.package = null;
  navigate("preflight");
  if (typeof fetch !== "function") return;
  try {
    const response = await fetch("/api/production/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productionRequest()),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The production package could not be prepared.");
    state.production.package = body.generationPackage;
    state.production.status = "ready";
  } catch (error) {
    state.production.status = "error";
    state.production.error = error.message || "The production package could not be prepared.";
  }
  render();
}

function outputsForCampaign(campaignId) {
  return state.outputs.filter((o) => o.campaignId === campaignId);
}

function outputLabel(pkg, assetType) {
  const typeNames = { scene: "Scene image", product: "Product in scene", post: "Post + image", banner: "Banner" };
  const channel = (pkg?.output?.placement || "").split(" ")[0] || "Image";
  return `${channel} ${typeNames[assetType] || "image"}`.trim();
}

// Upsert by job id. Generation writes a draft; approval promotes it. Re-entry
// from a refresh or a recovered job updates the existing record rather than
// creating a duplicate.
function recordOutput(job, extras = {}) {
  if (!job?.jobId) return null;
  const pkg = job.generationPackage || null;
  const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
  const assetType = state.brief.assetType || "scene";
  const existing = state.outputs.find((o) => o.id === job.jobId);
  const record = {
    id: job.jobId,
    label: outputLabel(pkg, assetType),
    status: existing?.status === "approved" ? "approved" : "draft",
    createdAt: existing?.createdAt || new Date().toISOString(),
    approvedAt: existing?.approvedAt || null,
    campaignId: state.activeCampaignId || null,
    campaignName: campaign?.name || null,
    assetType,
    brandName: pkg?.brandName || state.brandName,
    brainVersion: pkg?.brainVersion || state.brain.approvedVersion || 1,
    placement: pkg?.output?.placement || state.brief.placement,
    channel: (pkg?.output?.placement || state.brief.placement || "").split(" ")[0],
    format: pkg?.output?.format || state.brief.format,
    scene: state.brief.scene || state.brief.postTopic || "",
    lockedAsset: pkg?.lockedAsset ? { name: pkg.lockedAsset.name, format: pkg.lockedAsset.format } : null,
    // Presigned URLs expire. Treat this as a cache and fall back to a placeholder
    // in the UI rather than showing a broken image.
    imageUrl: extras.imageUrl || job.imageUrl || existing?.imageUrl || null,
    postCopy: extras.postCopy || job.postCopy || existing?.postCopy || null,
    model: job.model || existing?.model || null,
    // The durable substrate. Guidance section names decay as the brain is revised;
    // the compiled prompt is the only record of what the brand actually asserted
    // at the moment this was made.
    package: pkg || existing?.package || null,
  };
  if (existing) Object.assign(existing, record);
  else state.outputs.push(record);
  return existing || record;
}

function applyProductionJob(job, hydrating = false) {
  if (!job) return false;
  state.production.job = job;
  state.production.package = job.generationPackage || state.production.package;
  state.production.status = job.status === "complete" ? "complete" : job.status === "error" ? "error" : "generating";
  state.production.error = job.error || "";
  state.production.recovered = hydrating;
  if (job.status === "complete" && !hydrating) {
    recordOutput(job);
    void persistOutputs();
  }
  return true;
}

async function fetchCurrentProductionJob() {
  const response = await fetch("/api/production/current", { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  return (await readApiJson(response)).job || null;
}

async function recoverProductionJob(jobId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const job = await fetchCurrentProductionJob();
      if (job?.jobId === jobId && ["complete", "error"].includes(job.status)) return job;
    } catch {
      // The next check can still recover a job that completed while the connection was unavailable.
    }
    await wait(1500);
  }
  return null;
}

async function startProductionGeneration() {
  if (state.selectedDeliverable.id === "linkedin-post") {
    return startLinkedInGeneration();
  }
  if (!state.production.package) {
    await prepareProductionPreflight();
    if (!state.production.package) return;
  }
  const jobId = newRequestId("render");
  state.production.status = "generating";
  state.production.error = "";
  state.production.recovered = false;
  state.production.bannerDismissed = false;
  state.production.job = {
    jobId,
    status: "working",
    model: "gpt-image-2",
    generationPackage: state.production.package,
  };
  navigate("result");
  try {
    const response = await fetch("/api/production/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productionRequest(jobId)),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The image could not be generated.");
    applyProductionJob(body.job);
  } catch (error) {
    const recovered = await recoverProductionJob(jobId);
    if (recovered) {
      applyProductionJob(recovered);
      setToast("The completed image was recovered after the connection dropped");
    }
    else {
      state.production.status = "error";
      state.production.error = `${error.message || "The image response was lost."} The reviewed package is still saved, so you can try again without rebuilding the Brand Brain.`;
    }
  }
  render();
}

async function startLinkedInGeneration() {
  const jobId = newRequestId("linkedin");
  state.production.status = "generating";
  state.production.error = "";
  state.production.recovered = false;
  state.production.approved = false;
  state.production.bannerDismissed = false;
  state.production.job = {
    jobId,
    status: "working",
    model: "gpt-4o",
    deliverable: "linkedin-post",
    generationPackage: state.production.package || {
      version: "linkedin-post-v1",
      deliverable: "linkedin-post",
      brandName: state.brandName,
      brainVersion: state.brain.approvedVersion || state.brain.artifactVersion,
      output: { placement: "LinkedIn feed", format: state.brief.format },
      brief: { postType: state.brief.postType, postTopic: state.brief.postTopic, postClaims: state.brief.postClaims, postCta: state.brief.postCta, exclusions: state.brief.exclusions, includeImage: state.brief.includeImage, scene: state.brief.scene },
      treatments: state.production.package?.treatments || [],
      requirementCheck: state.production.package?.requirementCheck || [],
      ready: true,
    },
  };
  navigate("result");

  try {
    // Step 1: Generate copy
    const copyResponse = await fetch("/api/production/generate-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postType: state.brief.postType,
        postTopic: state.brief.postTopic,
        postClaims: state.brief.postClaims,
        postCta: state.brief.postCta,
        exclusions: state.brief.exclusions,
      }),
    });
    const copyBody = await readApiJson(copyResponse);
    if (!copyResponse.ok) throw new Error(copyBody.error || "The post copy could not be generated.");

    state.production.job.postCopy = copyBody.postCopy;
    state.production.job.model = copyBody.model;
    state.production.job.generationPackage.brainVersion = copyBody.brainVersion;
    render();

    // Step 2: Generate supporting image if requested
    if (state.brief.includeImage) {
      if (!state.production.package) {
        // Build a package for the image component
        state.brief.placement = "LinkedIn feed";
        await prepareProductionPreflight();
      }
      if (state.production.package) {
        const imageResponse = await fetch("/api/production/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productionRequest(jobId)),
        });
        const imageBody = await readApiJson(imageResponse);
        if (imageResponse.ok && imageBody.job?.imageUrl) {
          state.production.job.imageUrl = imageBody.job.imageUrl;
        }
        // Image failure is non-fatal for a LinkedIn post
      }
    }

    state.production.job.status = "complete";
    state.production.status = "complete";
    recordOutput(state.production.job);
    void persistOutputs();
  } catch (error) {
    state.production.status = "error";
    state.production.error = error.message || "The post could not be generated.";
    state.production.job.status = "error";
  }
  render();
}

async function hydrateProductionJob() {
  if (typeof fetch !== "function") return;
  try {
    const job = await fetchCurrentProductionJob();
    if (!job) return;
    // If the output was already approved (persisted in the outputs list),
    // restore the job reference for the result screen but do not reactivate
    // banners or the resume card.
    const alreadyApproved = state.outputs.some((o) => o.id === job.jobId && o.status === "approved");
    applyProductionJob(job, true);
    if (alreadyApproved) {
      state.production.approved = true;
      state.production.bannerDismissed = true;
    }
  } catch {
    // Production remains available even when no earlier job can be restored.
  }
}

async function persistOutputs() {
  if (typeof fetch !== "function") return;
  try {
    await fetch("/api/production/outputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outputs: state.outputs }),
    });
  } catch {
    // The output log is still usable in-session if persistence fails.
  }
}

async function hydrateOutputs() {
  if (typeof fetch !== "function") return;
  try {
    const response = await fetch("/api/production/outputs", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const payload = await readApiJson(response);
    if (!Array.isArray(payload.outputs) || !payload.outputs.length) return;
    // Merge: server outputs form the baseline, then any in-session outputs
    // (from hydrateProductionJob or a generation that completed before this
    // call returned) layer on top via the existing upsert-by-id logic.
    const sessionOutputs = [...state.outputs];
    const merged = new Map(payload.outputs.map((o) => [o.id, o]));
    for (const o of sessionOutputs) merged.set(o.id, o);
    state.outputs = [...merged.values()];
    render();
  } catch {
    // The workspace still works with whatever outputs are already in state.
  }
}

function plainPrompt() {
  return state.production.package?.prompt || "";
}

async function copyPrompt() {
  const value = plainPrompt();
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  setToast("Compiled prompt copied");
}

function downloadPackage() {
  const generationPackage = state.production.package;
  if (!generationPackage) return;
  const file = new Blob([JSON.stringify(generationPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${state.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-world-generation-package.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setToast("Generation package downloaded");
}

async function downloadGeneratedImage() {
  const imageUrl = state.production.job?.imageUrl;
  if (!imageUrl) return;
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("The saved image link expired.");
    const file = await response.blob();
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${state.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-world.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch {
    const refreshed = await fetchCurrentProductionJob();
    if (refreshed?.imageUrl) {
      applyProductionJob(refreshed);
      window.open?.(refreshed.imageUrl, "_blank", "noopener");
    } else setToast("The saved image could not be downloaded yet");
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, data: reader.result }));
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

async function uploadSourceToBlob(file) {
  const clientId = readActiveClientCookie() || state.activeClientId || "default";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const pathname = `brand-world-system/clients/${clientId}/sources/${Date.now()}-${safeName}`;
  const contentType = file.type || "application/octet-stream";

  // Step 1: Get a presigned upload URL from the server.
  const presignResponse = await fetch("/api/blob/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname, contentType, size: file.size }),
  });
  if (!presignResponse.ok) {
    const body = await readApiJson(presignResponse);
    throw new Error(body.error || "Could not prepare the upload.");
  }
  const { presignedUrl, pathname: confirmedPathname } = await readApiJson(presignResponse);

  // Step 2: Upload the file directly to Vercel Blob.
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType, "x-content-length": String(file.size) },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error(`Could not upload ${file.name}. Try again.`);

  return {
    name: file.name,
    type: contentType,
    size: file.size,
    blobPathname: confirmedPathname,
  };
}

// Wire blob upload so source files go to storage instead of staying
// as base64 data URLs in client-side state. The fallback to readFileAsDataUrl
// keeps local development working when the blob endpoint is unavailable.
window.storeBrandWorldSourceFile = async function storeSourceFile(file) {
  try {
    return await uploadSourceToBlob(file);
  } catch {
    // If blob upload fails (local dev, network issue), fall back to data URL.
    return readFileAsDataUrl(file);
  }
};

async function readApiJson(response) {
  const contentType = response.headers?.get?.("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The app server returned an unexpected response. Reload the page and try again.");
  }
  try {
    return await response.json();
  } catch {
    throw new Error("The app server returned an incomplete response. Try again in a moment.");
  }
}

root.addEventListener("input", (event) => {
  if (event.target.matches('[data-action="brain-source-url"]')) {
    state.brain.sourceUrl = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-title"]')) {
    state.brain.sourceTitle = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-text"]')) {
    state.brain.sourceText = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-usage"]')) {
    state.brain.sourceUsage = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-exclusions"]')) {
    state.brain.sourceExclusions = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-template-ratio"]')) {
    state.brain.sourceTemplateRatio = event.target.value;
    render();
  }
  if (event.target.matches('[data-action="brain-source-product-name"]')) {
    state.brain.sourceProductName = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-item-usage"]')) {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    if (source) source.usage = event.target.value;
  }
  if (event.target.matches('[data-action="brain-source-item-exclusions"]')) {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    if (source) source.exclusions = event.target.value;
  }
  if (event.target.matches('[data-action="guidance-comment-draft"]')) {
    state.brain.commentDraft = event.target.value;
  }
  if (event.target.matches('[data-action="brain-feedback"]')) {
    state.brain.feedbackDraft = event.target.value;
  }
  if (event.target.matches('[data-action="promotion-rationale"]')) {
    state.brain.promotionRationale = event.target.value;
  }
  if (event.target.matches('[data-action="scene-input"]')) {
    state.brief.scene = event.target.value;
  }
  if (event.target.matches('[data-action="exclusions-input"]')) {
    state.brief.exclusions = event.target.value;
  }
  if (event.target.matches('[data-action="post-topic-input"]')) {
    state.brief.postTopic = event.target.value;
  }
  if (event.target.matches('[data-action="post-claims-input"]')) {
    state.brief.postClaims = event.target.value;
  }
  if (event.target.matches('[data-action="post-cta-input"]')) {
    state.brief.postCta = event.target.value;
  }
  if (event.target.matches('[data-action="banner-headline-input"]')) {
    state.brief.bannerHeadline = event.target.value;
  }
  if (event.target.matches('[data-action="reference-guidance"]')) {
    state.references[Number(event.target.dataset.index)].usageInstruction = event.target.value;
  }
  if (event.target.matches('[data-field="feedbackDraft"]')) {
    state.production.feedbackDraft = event.target.value;
  }
  if (event.target.matches('[data-action="campaign-draft-input"]')) {
    if (!state.campaignDraft) state.campaignDraft = newCampaignDraft();
    state.campaignDraft[event.target.dataset.field] = event.target.value;
  }
  if (event.target.matches('[data-action="studio-brief-input"]')) {
    state.studio.brief = event.target.value;
  }
  if (event.target.matches('[data-action="studio-caption-input"]')) {
    state.studio.caption = event.target.value;
  }
  if (event.target.matches('[data-action="studio-direction-input"]')) {
    state.studio.direction = event.target.value;
  }
  if (event.target.matches('[data-action="sales-element-input"]')) {
    state.studio.salesElement = event.target.value;
    updateSalesReadyState();
  }
  if (event.target.matches('[data-action="sales-feature-input"]')) {
    state.studio.salesFeature = event.target.value;
  }
  if (event.target.matches('[data-action="sales-product-change"]')) {
    state.studio.salesProductId = event.target.value;
    render();
  }
  if (event.target.matches('[data-action="product-add-name-input"]')) {
    state.products.addName = event.target.value;
  }
  if (event.target.matches('[data-action="product-add-text-input"]')) {
    state.products.addText = event.target.value;
  }
  if (event.target.matches('[data-action="product-add-url-input"]')) {
    state.products.addUrl = event.target.value;
  }
  if (event.target.matches('[data-action="product-question-input"]')) {
    const index = Number(event.target.dataset.index);
    const hadDraft = !!(state.products.questionDrafts[index] || "").trim();
    state.products.questionDrafts[index] = event.target.value;
    // Enable or disable the matching button without a full re-render, which
    // would wipe the textarea cursor.
    const hasDraft = !!event.target.value.trim();
    if (hadDraft !== hasDraft) {
      const btn = document.querySelector(`[data-action="resolve-product-question"][data-index="${index}"]`);
      if (btn) btn.disabled = !hasDraft;
    }
  }
});

root.addEventListener("change", async (event) => {
  const action = event.target.dataset.action;
  if (action === "studio-campaign-change") {
    state.studio.campaignId = event.target.value;
    render();
  }
  if (action === "product-add-file") {
    const file = Array.from(event.target.files ?? [])[0];
    if (file) {
      state.products.addFileReading = true;
      render();
      try {
        state.products.addFile = await window.storeBrandWorldSourceFile(file);
      } catch {
        state.products.addFile = null;
        setToast(`Could not read ${file.name}. Try again.`);
      } finally {
        state.products.addFileReading = false;
        render();
      }
    }
  }
  if (action === "campaign-toggle-channel") {
    if (!state.campaignDraft) state.campaignDraft = newCampaignDraft();
    const ch = event.target.dataset.channel;
    const idx = state.campaignDraft.channels.indexOf(ch);
    if (idx >= 0) state.campaignDraft.channels.splice(idx, 1);
    else state.campaignDraft.channels.push(ch);
    render();
  }
  if (action === "source-file-input") {
    const file = Array.from(event.target.files ?? [])[0];
    if (file) {
      const validationError = validateSourceFile(file);
      if (validationError) {
        state.brain.pendingFiles = [];
        setToast(validationError);
      } else {
        state.brain.sourceFileReading = true;
        state.brain.pendingFiles = [{ name: file.name, type: file.type, size: file.size }];
        render();
        try {
          const storeFile = window.storeBrandWorldSourceFile || readFileAsDataUrl;
          state.brain.pendingFiles = [await storeFile(file)];
        } catch (error) {
          state.brain.pendingFiles = [];
          setToast(error.message);
        } finally {
          state.brain.sourceFileReading = false;
          render();
        }
      }
    }
  }
  if (action === "product-asset-input") {
    const file = Array.from(event.target.files ?? [])[0];
    if (file) {
      const validationError = validateSourceFile(file);
      if (validationError) {
        setToast(validationError);
      } else {
        state.productAssetUploading = true;
        render();
        try {
          const storeFile = window.storeBrandWorldSourceFile || readFileAsDataUrl;
          const stored = await storeFile(file);
          const id = `product-${Date.now()}`;
          const displayName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          state.brain.sources.push({
            id,
            name: displayName || "Product image",
            detail: "Uploaded for production",
            declaredType: "Protected asset",
            authority: "exact-asset",
            sessionProductAsset: true,
            files: [stored],
          });
          state.lockedAssetId = id;
          setToast(`${displayName} will be preserved exactly`);
        } catch (error) {
          setToast(error.message || "The product image could not be uploaded.");
        } finally {
          state.productAssetUploading = false;
          render();
        }
      }
    }
  }
  if (action === "brain-source-authority") {
    state.brain.sourceAuthority = event.target.value;
    if (!sourceUsesInfluence()) state.brain.sourceInfluence = "Supporting";
    render();
  }
  if (action === "brain-source-role") state.brain.sourceRole = event.target.value;
  if (action === "brain-source-influence") state.brain.sourceInfluence = event.target.value;
  if (action === "brain-source-item-authority") {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    if (source) {
      source.authority = event.target.value;
      source.influence = sourceUsesInfluence(source.authority) ? (source.influence === "Not weighted" ? "Supporting" : source.influence) : "Not weighted";
      render();
    }
  }
  if (action === "brain-source-item-material-type") {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    const material = sourceMaterialType(event.target.value);
    if (source && material) {
      source.materialType = material.id;
      source.declaredType = material.label;
      source.authority = material.authority;
      source.influence = sourceUsesInfluence(material.authority) ? (source.influence === "Not weighted" ? "Supporting" : source.influence) : "Not weighted";
      source.verification = "Pending content check";
      render();
    }
  }
  if (action === "brain-source-item-role") {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    if (source) source.role = event.target.value;
  }
  if (action === "brain-source-item-influence") {
    const source = state.brain.sources.find((item) => item.id === event.target.dataset.id);
    if (source) source.influence = event.target.value;
  }
  if (action === "brain-source-text-type") {
    state.brain.sourceTextType = event.target.value;
  }
  if (action === "placement-change") {
    state.brief.placement = event.target.value;
    state.brief.format = placementFormats[state.brief.placement][0];
    render();
  }
  if (action === "format-change") state.brief.format = event.target.value;
  if (action === "banner-text-side-change") state.brief.bannerTextSide = event.target.value;
  if (action === "post-type-change") { state.brief.postType = event.target.value; render(); }
  if (action === "toggle-include-image") { state.brief.includeImage = event.target.checked; render(); }
  if (action === "reference-role") {
    state.references[Number(event.target.dataset.index)].role = event.target.value;
  }
  if (action === "reference-influence") {
    state.references[Number(event.target.dataset.index)].influence = event.target.value;
  }
});

// Guarded: the test harness runs this file against a minimal document stub.
if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.previewOutputId) {
      state.previewOutputId = null;
      render();
    }
  });
}

root.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    if (state.clientSwitcherOpen && !event.target.closest(".brand-switcher-wrap")) {
      state.clientSwitcherOpen = false;
      render();
    }
    return;
  }
  const action = target.dataset.action;

  if (action === "toggle-client-switcher") { state.clientSwitcherOpen = !state.clientSwitcherOpen; render(); return; }
  if (action === "switch-client") { switchClient(target.dataset.id); return; }
  if (action === "create-client") { state.clientSwitcherOpen = false; void createClient(); return; }

  if (action === "workspace") { navigate("workspace"); }
  if (action === "chooser") { state.creativeMode = null; state.activeCampaignId = null; navigate("chooser"); }
  if (action === "campaigns") { navigate("campaigns"); }
  if (action === "products") {
    navigate("products");
    void loadProducts();
  }
  if (action === "view-product") {
    state.screen = "product-detail";
    render();
    void loadProductDetail(target.dataset.id);
  }
  if (action === "approve-product") {
    void approveProductRecord(target.dataset.id);
  }
  if (action === "synthesize-product-from-source") {
    void synthesizeProductFromSource(target.dataset.id);
  }
  if (action === "open-product-add") {
    state.products.addOpen = true;
    state.products.addName = "";
    state.products.addTab = "file";
    state.products.addFile = null;
    state.products.addText = "";
    state.products.addUrl = "";
    render();
  }
  if (action === "cancel-product-add") {
    state.products.addOpen = false;
    render();
  }
  if (action === "product-add-tab") {
    state.products.addTab = target.dataset.tab;
    render();
  }
  if (action === "create-product-record") {
    void createProductRecord();
  }
  if (action === "resolve-product-question") {
    void resolveProductQuestion(Number(target.dataset.index));
  }
  if (action === "open-campaign") {
    state.activeCampaignId = target.dataset.id;
    navigate("campaign-workspace");
  }
  if (action === "select-studio-category") {
    state.studio.category = target.dataset.id;
    // Preload the product list when entering the sales enablement setup so
    // the picker has options ready. Loaders belong in action handlers, not in
    // render functions. See docs/ui-contribution-guide.md.
    if (target.dataset.id === "sales") void loadProducts();
    state.studio.brief = "";
    state.studio.platforms = [];
    state.studio.activeFormats = [];
    state.studio.textOverlay = false;
    state.studio.campaignId = "";
    state.studio.caption = "";
    state.studio.captionOpen = false;
    state.studio.referenceOpen = false;
    state.studio.directionOpen = false;
    state.studio.direction = "";
    state.studio.targetUses = [];
    state.studio.templateFormats = [];
    state.studio.salesFormat = "slide-16x9";
    state.studio.salesTemplateId = "";
    state.studio.salesElement = "";
    state.studio.salesFeature = "";
    state.studio.salesProductId = "";
    navigate("studio-setup");
  }
  if (action === "back-to-studio") {
    state.studio.category = null;
    navigate("chooser");
  }
  if (action === "studio-use-legacy") {
    state.creativeMode = "explore";
    state.activeCampaignId = null;
    state.selectedDeliverable = deliverables[0];
    navigate("brief");
  }
  if (action === "toggle-studio-platform") {
    const platformId = target.dataset.id;
    const platforms = state.studio.platforms;
    const idx = platforms.indexOf(platformId);
    if (idx >= 0) {
      platforms.splice(idx, 1);
      const platformFormats = studioPlatformFormats[platformId]?.formats || [];
      state.studio.activeFormats = state.studio.activeFormats.filter((fid) => !platformFormats.some((f) => f.id === fid));
    } else {
      platforms.push(platformId);
      const platformFormats = studioPlatformFormats[platformId]?.formats || [];
      platformFormats.forEach((f) => { if (f.default && !state.studio.activeFormats.includes(f.id)) state.studio.activeFormats.push(f.id); });
    }
    render();
  }
  if (action === "toggle-studio-format") {
    const fid = target.dataset.id;
    const idx = state.studio.activeFormats.indexOf(fid);
    if (idx >= 0) state.studio.activeFormats.splice(idx, 1);
    else state.studio.activeFormats.push(fid);
    render();
  }
  if (action === "toggle-studio-text-overlay") {
    state.studio.textOverlay = !state.studio.textOverlay;
    render();
  }
  if (action === "studio-toggle-section") {
    const section = target.dataset.section;
    state.studio[section] = !state.studio[section];
    render();
  }
  if (action === "studio-close-section") {
    const section = target.dataset.section;
    state.studio[section] = false;
    if (section === "captionOpen") state.studio.caption = "";
    if (section === "directionOpen") state.studio.direction = "";
    render();
  }
  if (action === "studio-continue-preflight") {
    // Bridge to existing preflight: map studio state to legacy brief state
    state.selectedDeliverable = deliverables[0];
    state.creativeMode = state.studio.campaignId ? "campaign" : "explore";
    state.activeCampaignId = state.studio.campaignId || null;
    state.brief.scene = state.studio.brief;
    // Use the first active format for the legacy single-format path
    const firstFormat = state.studio.activeFormats[0];
    if (firstFormat) {
      for (const [platformId, platform] of Object.entries(studioPlatformFormats)) {
        const match = platform.formats.find((f) => f.id === firstFormat);
        if (match) {
          // Map to legacy placement format
          const legacyPlacement = Object.keys(placementFormats).find((p) => p.toLowerCase().includes(platform.label.toLowerCase()));
          if (legacyPlacement) state.brief.placement = legacyPlacement;
          state.brief.format = match.ratio + (match.ratio.includes(":") && parseInt(match.ratio) > 1 ? " landscape" : parseInt(match.ratio.split(":")[0]) < parseInt(match.ratio.split(":")[1] || "1") ? " portrait" : " square");
          break;
        }
      }
    }
    void prepareProductionPreflight();
  }
  if (action === "toggle-template-use") {
    const useId = target.dataset.id;
    const uses = state.studio.targetUses;
    const idx = uses.indexOf(useId);
    if (idx >= 0) {
      uses.splice(idx, 1);
      // Remove formats belonging to this use
      const useFormats = studioTemplateFormats[useId]?.formats || [];
      state.studio.templateFormats = state.studio.templateFormats.filter((fid) => !useFormats.some((f) => f.id === fid));
    } else {
      uses.push(useId);
      // Add default formats for this use
      const useFormats = studioTemplateFormats[useId]?.formats || [];
      useFormats.forEach((f) => { if (f.default && !state.studio.templateFormats.includes(f.id)) state.studio.templateFormats.push(f.id); });
    }
    render();
  }
  if (action === "toggle-template-format") {
    const fid = target.dataset.id;
    const idx = state.studio.templateFormats.indexOf(fid);
    if (idx >= 0) state.studio.templateFormats.splice(idx, 1);
    else state.studio.templateFormats.push(fid);
    render();
  }
  if (action === "template-continue-preflight") {
    // Bridge template state to legacy preflight
    state.selectedDeliverable = deliverables[0];
    state.creativeMode = state.studio.campaignId ? "campaign" : "explore";
    state.activeCampaignId = state.studio.campaignId || null;
    state.brief.scene = state.studio.brief;
    // Use the first active template format for the legacy single-format path
    const firstTplFormat = state.studio.templateFormats[0];
    if (firstTplFormat) {
      for (const [useId, use] of Object.entries(studioTemplateFormats)) {
        const match = use.formats.find((f) => f.id === firstTplFormat);
        if (match) {
          state.brief.placement = "Brand template";
          state.brief.format = match.dim.replace(" x ", "x");
          break;
        }
      }
    }
    void prepareProductionPreflight();
  }
  if (action === "sales-set-format") {
    state.studio.salesFormat = target.dataset.id;
    state.studio.salesTemplateId = "";
    render();
  }
  if (action === "sales-select-template") {
    state.studio.salesTemplateId = state.studio.salesTemplateId === target.dataset.id ? "" : target.dataset.id;
    render();
  }
  if (action === "sales-continue-preflight") {
    const approved = approvedBrainForProduction();
    const hasElement = (state.studio.salesElement || "").trim().length > 0;
    if (!approved) {
      setToast("Approve the Brand Brain before producing");
      return;
    }
    if (!hasElement) {
      setToast("Describe the content element before continuing");
      const el = document.getElementById("sales-element");
      if (el) el.focus();
      updateSalesReadyState();
      return;
    }
    const fmt = salesOutputFormats[state.studio.salesFormat] || salesOutputFormats["slide-16x9"];
    state.selectedDeliverable = deliverables[0];
    state.creativeMode = state.studio.campaignId ? "campaign" : "explore";
    state.activeCampaignId = state.studio.campaignId || null;
    // Compose the brief from element description and feature focus
    const featureNote = state.studio.salesFeature ? ` This showcases the ${state.studio.salesFeature} capability.` : "";
    state.brief.scene = state.studio.salesElement + featureNote;
    state.brief.placement = "Sales enablement";
    state.brief.format = fmt.dim.replace(" x ", "x");
    void prepareProductionPreflight();
  }
  if (action === "select-creative-mode") {
    state.creativeMode = target.dataset.id;
    if (target.dataset.campaignShortcut) {
      state.activeCampaignId = target.dataset.campaignShortcut;
      navigate("chooser");
    } else if (target.dataset.id === "explore" || target.dataset.id === "standalone") {
      state.activeCampaignId = null;
      state.selectedDeliverable = deliverables[0];
      navigate("brief");
    } else {
      render();
    }
  }
  if (action === "select-campaign") {
    state.activeCampaignId = target.dataset.id;
    render();
  }
  if (action === "start-campaign-asset") {
    if (state.brief.assetType === "product" && !state.lockedAssetId) {
      setToast("Add a product image first, or switch to Scene image");
      return;
    }
    if (state.brief.assetType === "post") {
      state.selectedDeliverable = deliverables.find((d) => d.id === "linkedin-post") || deliverables[0];
      state.brief.placement = "LinkedIn feed";
      void startLinkedInGeneration();
    } else {
      state.selectedDeliverable = deliverables[0];
      if (state.brief.assetType === "banner") {
        state.brief.format = "16:9 landscape";
      }
      void prepareProductionPreflight();
    }
  }
  if (action === "back-to-modes") { state.creativeMode = null; state.activeCampaignId = null; navigate("campaigns"); }
  if (action === "back-to-campaigns") {
    state.activeCampaignId = null;
    state.campaignDraft = null;
    state.campaignEditing = false;
    state.campaignEditDraft = null;
    state.creativeMode = null;
    navigate("campaigns");
  }
  if (action === "start-field-edit") {
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    if (campaign) {
      state.campaignEditField = target.dataset.field;
      state.campaignEditDraft = { ...campaign };
    }
    render();
  }
  if (action === "cancel-field-edit") {
    state.campaignEditField = null;
    state.campaignEditDraft = null;
    render();
  }
  if (action === "save-field-edit") {
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    const draft = state.campaignEditDraft;
    const field = target.dataset.field;
    if (campaign && draft && field) {
      campaign[field] = (draft[field] || "").trim();
      recordBrainHistory(`Campaign updated: ${campaign.name}`, `${field} was edited.`, "complete");
      setToast("Campaign updated");
    }
    state.campaignEditField = null;
    state.campaignEditDraft = null;
    render();
  }
  if (action === "start-campaign-edit") {
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    if (campaign) {
      state.campaignEditing = true;
      state.campaignEditDraft = { ...campaign };
    }
    render();
  }
  if (action === "cancel-campaign-edit") {
    state.campaignEditing = false;
    state.campaignEditDraft = null;
    render();
  }
  if (action === "save-campaign-edit") {
    const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
    const draft = state.campaignEditDraft;
    if (campaign && draft) {
      const editableFields = ["name", "description", "objective", "audience", "currentBelief", "desiredBelief", "desiredAction", "campaignIdea", "messageTerritory", "proofPoints", "preserve", "explore", "paletteShift", "productFocus"];
      for (const field of editableFields) {
        campaign[field] = (draft[field] || "").trim();
      }
      recordBrainHistory(`Campaign updated: ${campaign.name}`, "Campaign parameters were edited.", "complete");
      setToast("Campaign updated");
    }
    state.campaignEditing = false;
    state.campaignEditDraft = null;
    render();
  }
  if (action === "campaign-edit-input") {
    if (state.campaignEditDraft) {
      state.campaignEditDraft[target.dataset.field] = target.value;
    }
  }
  if (action === "studio-from-campaign") {
    state.studio.campaignId = state.activeCampaignId;
    navigate("chooser");
  }
  if (action === "set-asset-type") { state.brief.assetType = target.dataset.type; render(); }
  if (action === "preview-output") { state.previewOutputId = target.dataset.id; render(); }
  if (action === "close-preview") {
    // Only close on the overlay itself or the close button, not on panel clicks.
    if (target.dataset.action === "close-preview" && event.target.closest(".preview-panel") && event.target.dataset.action !== "close-preview") return;
    state.previewOutputId = null;
    render();
  }
  if (action === "reuse-output") {
    const source = state.outputs.find((o) => o.id === target.dataset.id);
    if (!source) return;
    // Restore the brief that produced this output. The stored package is the
    // record of intent, not a guarantee of an identical image.
    state.brief.assetType = source.assetType || "scene";
    state.brief.scene = source.package?.brief?.scene || source.scene || "";
    state.brief.exclusions = source.package?.brief?.exclusions || state.brief.exclusions;
    if (source.placement && placementFormats[source.placement]) state.brief.placement = source.placement;
    if (source.format) state.brief.format = source.format;
    if (source.assetType === "post") {
      state.brief.postTopic = source.package?.brief?.postTopic || source.scene || "";
      state.brief.postClaims = source.package?.brief?.postClaims || "";
      state.brief.postCta = source.package?.brief?.postCta || "";
      state.brief.includeImage = source.package?.brief?.includeImage ?? true;
    }
    state.lockedAssetId = "";
    if (source.lockedAsset) {
      const match = productionLockedAssets().find((a) => a.name === source.lockedAsset.name);
      if (match) state.lockedAssetId = match.id;
    }
    state.previewOutputId = null;
    setToast(source.lockedAsset && !state.lockedAssetId
      ? "Brief restored. The original product image is no longer available, so add one before generating."
      : "Brief restored from that asset. Adjust anything, then generate.");
    render();
  }
  if (action === "use-scene-starter") {
    const text = target.dataset.text || "";
    state.brief.scene = state.brief.scene.trim() ? `${state.brief.scene.trim()} ${text}` : text;
    render();
  }
  if (action === "toggle-campaign-ref") {
    const id = target.dataset.id;
    const existing = state.campaignReferences.findIndex((r) => r.id === id);
    if (existing >= 0) {
      state.campaignReferences.splice(existing, 1);
    } else {
      const campaign = state.campaigns.find((c) => c.id === state.activeCampaignId);
      const output = outputsForCampaign(state.activeCampaignId).find((o) => o.id === id);
      if (output) state.campaignReferences.push({ id, role: "continue-direction", label: output.label, scene: output.scene, channel: output.channel, format: output.format });
    }
    render();
  }
  if (action === "set-campaign-ref-role") {
    const ref = state.campaignReferences.find((r) => r.id === target.dataset.id);
    if (ref) ref.role = target.dataset.role;
    render();
  }
  if (action === "create-campaign") {
    state.campaignDraft = newCampaignDraft();
    navigate("campaign-creation");
  }
  if (action === "save-campaign") {
    const draft = state.campaignDraft;
    if (!draft || !draft.name.trim() || !draft.objective.trim()) return;
    const id = "campaign-" + Date.now();
    state.campaigns.push({
      id,
      name: draft.name.trim(),
      description: draft.description.trim(),
      objective: draft.objective.trim(),
      audience: draft.audience.trim(),
      currentBelief: draft.currentBelief.trim(),
      desiredBelief: draft.desiredBelief.trim(),
      desiredAction: draft.desiredAction.trim(),
      campaignIdea: draft.campaignIdea.trim(),
      messageTerritory: draft.messageTerritory.trim(),
      proofPoints: draft.proofPoints.trim(),
      preserve: draft.preserve.trim(),
      explore: draft.explore.trim(),
      paletteShift: draft.paletteShift.trim(),
      productFocus: draft.productFocus.trim(),
      channels: draft.channels.slice(),
      startDate: draft.startDate || "",
      endDate: draft.endDate || "",
      learnings: [],
      createdAt: new Date().toISOString(),
    });
    state.campaignDraft = null;
    state.activeCampaignId = id;
    state.creativeMode = null;
    recordBrainHistory(`Campaign created: ${draft.name.trim()}`, `New campaign with objective: ${draft.objective.trim()}`, "complete");
    setToast(`${draft.name.trim()} created. Start making assets.`);
    navigate("campaign-workspace");
  }
  if (action === "brand-brain") navigate("brain-overview");
  if (action === "navigate-brain") navigate(target.dataset.screen);
  if (action === "begin-brain-onboarding") {
    state.brain.stage = "intake";
    navigate("brain-sources");
  }
  if (action === "load-sample-sources") loadSampleSources();
  if (action === "set-source-form") {
    resetSourceComposer();
    state.brain.sourceForm = target.dataset.kind;
    render();
  }
  if (action === "select-source-material-type") {
    const material = sourceMaterialType(target.dataset.id);
    if (material) {
      const pendingFile = state.brain.pendingFiles[0];
      state.brain.sourceMaterialType = material.id;
      state.brain.sourceAuthority = material.authority;
      if (!sourceUsesInfluence(material.authority)) state.brain.sourceInfluence = "Supporting";
      if (pendingFile) {
        const validationError = validateSourceFile(pendingFile, material);
        if (validationError) {
          state.brain.pendingFiles = [];
          setToast(`${pendingFile.name} was cleared because it does not match ${material.label}.`);
          return;
        }
      }
      render();
    }
  }
  if (action === "add-file-source") {
    const files = state.brain.pendingFiles;
    const material = sourceMaterialType();
    if (!material) {
      setToast("Choose what kind of material this is first");
    } else if (!files.length) {
      setToast("Choose one file first");
    } else if (!state.brain.sourceUsage.trim()) {
      setToast("Add a usage instruction before continuing");
    } else if (material.isTemplate && !state.brain.sourceTemplateRatio) {
      setToast("Choose a template format before adding");
    } else if (material.isProductBrief && !state.brain.sourceProductName.trim()) {
      setToast("Enter a product name before adding");
    } else {
      const file = files[0];
      const sourceId = `file-${Date.now()}`;
      const templateMeta = material.isTemplate ? { isTemplate: true, ratio: state.brain.sourceTemplateRatio } : undefined;
      const productMeta = material.isProductBrief ? { isProductBrief: true, productName: state.brain.sourceProductName.trim() } : undefined;
      state.brain.sources.push({
        id: sourceId,
        name: file.name,
        type: material.label,
        detail: `${fileExtension(file).toUpperCase()} · ${formatFileSize(file.size)}`,
        count: 1,
        status: "Ready",
        files: [{ ...file }],
        templateMeta,
        productMeta,
        ...sourceContract(material.id),
      });
      markSourceAdded(sourceId);
      recordBrainHistory("File added", `${file.name} was added as ${material.label.toLowerCase()} with its own usage instruction.`, "complete");
      resetSourceComposer();
      setToast(sourceHasApprovedBaseline() ? "Source added to the proposed update" : "Source added with its usage instructions");
    }
  }
  if (action === "add-url-source") {
    const url = state.brain.sourceUrl.trim();
    const material = sourceMaterialType();
    if (!material) {
      setToast("Choose what kind of material this is first");
    } else if (!url) {
      setToast("Add a web address first");
    } else if (!state.brain.sourceUsage.trim()) {
      setToast("Add a usage instruction before continuing");
    } else if (material.isProductBrief && !state.brain.sourceProductName.trim()) {
      setToast("Enter a product name before adding");
    } else {
      const sourceId = `url-${Date.now()}`;
      const productMeta = material.isProductBrief ? { isProductBrief: true, productName: state.brain.sourceProductName.trim() } : undefined;
      state.brain.sources.push({
        id: sourceId,
        name: state.brain.sourceTitle.trim() || url,
        type: material.label,
        detail: url,
        url,
        count: 1,
        status: "Ready",
        productMeta,
        ...sourceContract(material.id),
      });
      markSourceAdded(sourceId);
      recordBrainHistory("URL added", `${state.brain.sourceTitle.trim() || url} was added to the current source batch.`, "complete");
      resetSourceComposer();
      setToast(sourceHasApprovedBaseline() ? "URL added to the proposed update" : "URL added to the source batch");
    }
  }
  if (action === "add-text-source") {
    const sourceText = state.brain.sourceText.trim();
    const material = sourceMaterialType();
    if (!material) {
      setToast("Choose what kind of material this is first");
    } else if (!sourceText) {
      setToast("Paste some material first");
    } else if (!state.brain.sourceUsage.trim()) {
      setToast("Add a usage instruction before continuing");
    } else if (material.isProductBrief && !state.brain.sourceProductName.trim()) {
      setToast("Enter a product name before adding");
    } else {
      const title = state.brain.sourceTitle.trim() || material.label;
      const sourceId = `text-${Date.now()}`;
      const productMeta = material.isProductBrief ? { isProductBrief: true, productName: state.brain.sourceProductName.trim() } : undefined;
      state.brain.sources.push({
        id: sourceId,
        name: title,
        type: material.label,
        detail: sourceText.length > 92 ? `${sourceText.slice(0, 92)}...` : sourceText,
        content: sourceText,
        count: 1,
        status: "Ready",
        productMeta,
        ...sourceContract(material.id),
      });
      markSourceAdded(sourceId);
      recordBrainHistory(`${material.label} added`, `${title} was added with its own usage instruction.`, "complete");
      resetSourceComposer();
      setToast(sourceHasApprovedBaseline() ? "Material added to the proposed update" : "Material added to the source batch");
    }
  }
  if (action === "remove-brain-source") {
    const source = state.brain.sources.find((item) => item.id === target.dataset.id);
    const locked = sourceHasApprovedBaseline() && !state.brain.pendingSourceIds.includes(target.dataset.id);
    if (locked) {
      setToast("Active sources cannot be removed here. Source retirement will be a separate reviewed change.");
    } else {
      state.brain.sources = state.brain.sources.filter((item) => item.id !== target.dataset.id);
      state.brain.pendingSourceIds = state.brain.pendingSourceIds.filter((id) => id !== target.dataset.id);
      if (source) setToast(`${source.name} removed`);
    }
  }
  if (action === "toggle-source-details") {
    state.brain.selectedSourceId = state.brain.selectedSourceId === target.dataset.id ? "" : target.dataset.id;
    render();
  }
  if (action === "start-brain-synthesis") startBrainSynthesis();
  if (action === "retry-brain-synthesis") startBrainSynthesis();
  if (action === "select-brain-exception") {
    state.brain.selectedExceptionId = target.dataset.id;
    render();
  }
  if (action === "approve-clean-assets" && !state.brain.cleanApproved) {
    state.brain.cleanApproved = true;
    void persistBrainState();
    setToast(`${brainBatch.cleanCount} ${brainBatch.cleanCount === 1 ? "asset" : "assets"} approved for future work. Core brand guidance unchanged.`);
  }
  if (action === "resolve-brain-exception") {
    state.brain.resolutions[target.dataset.id] = target.dataset.resolution;
    void persistBrainState();
    setToast("Decision saved");
  }
  if (action === "finish-brain-review" && state.brain.cleanApproved && brainResolvedCount() === brainExceptions.length) {
    if (state.brain.revisionPending) state.brain.artifactVersion += 1;
    state.brain.revisionPending = false;
    syncProductionReferences();
    state.brain.pendingSourceIds = [];
    state.brain.artifactStatus = "draft";
    state.brain.stage = "draft";
    state.brain.selectedGuidanceId = "foundation";
    state.brain.guidanceView = "guidance";
    recordBrainHistory(`Brand Brain v${state.brain.artifactVersion} created`, `${brainSourceCount()} source items and ${brainResolvedCount()} review decisions were stored with the draft.`, "governed");
    void persistBrainState();
    navigate("brain-guidance");
  }
  if (action === "approve-brain-artifact" && state.brain.artifactStatus === "draft") {
    state.brain.artifactStatus = "ready";
    state.brain.stage = "ready";
    state.brain.approvedResult = JSON.parse(JSON.stringify(currentSynthesisResult));
    const previousVersion = state.brain.approvedVersion;
    state.brain.approvedVersion = state.brain.artifactVersion;
    state.brain.pendingSourceIds = [];
    state.brain.affectedGuidanceIds = [];
    state.brain.candidateBaseVersion = 0;
    state.brain.revisionPending = false;
    syncProductionReferences();
    // Check impact on completed outputs
    const affectedCount = state.outputs.filter((o) => o.status === "approved" && o.brainVersion < state.brain.approvedVersion).length;
    const impactNote = affectedCount > 0
      ? ` ${affectedCount} existing ${affectedCount === 1 ? "output uses" : "outputs use"} an earlier version.`
      : "";
    recordBrainHistory(`Brand Brain v${state.brain.artifactVersion} approved`, `This exact stored version is now available to future production work.${impactNote}`, "complete");
    void persistBrainState();
    setToast(`Brand Brain v${state.brain.artifactVersion} is ready for production${impactNote}`);
  }
  if (action === "toggle-brain-feedback") {
    state.brain.feedbackOpen = !state.brain.feedbackOpen;
    render();
  }
  if (action === "create-brain-revision") {
    const feedback = state.brain.feedbackDraft.trim();
    if (!feedback) {
      setToast("Describe what should change first");
    } else {
      state.brain.artifactVersion += 1;
      state.brain.artifactStatus = "draft";
      state.brain.stage = "draft";
      state.brain.feedbackOpen = false;
      state.brain.feedbackDraft = "";
      recordBrainHistory(`Brand Brain v${state.brain.artifactVersion} prepared`, `A revised draft was created from feedback: ${feedback}`, "governed");
      void persistBrainState();
      setToast(`Brand Brain v${state.brain.artifactVersion} draft prepared`);
    }
  }
  if (action === "select-guidance-tab") {
    state.brain.selectedGuidanceId = target.dataset.id;
    state.brain.selectedArtifactId = "";
    state.brain.commentTarget = "";
    state.brain.commentDraft = "";
    render();
  }
  if (action === "set-guidance-view") {
    state.brain.guidanceView = target.dataset.view;
    state.brain.commentTarget = "";
    state.brain.commentDraft = "";
    render();
  }
  if (action === "open-brain-artifact") {
    state.brain.guidanceView = "artifacts";
    state.brain.selectedBrainArtifactId = target.dataset.id;
    state.brain.commentTarget = "";
    state.brain.commentDraft = "";
    render();
  }
  if (action === "select-brain-artifact") {
    state.brain.selectedBrainArtifactId = target.dataset.id;
    state.brain.commentTarget = "";
    state.brain.commentDraft = "";
    render();
  }
  if (action === "toggle-guidance-artifact") {
    state.brain.selectedArtifactId = state.brain.selectedArtifactId === target.dataset.id ? "" : target.dataset.id;
    render();
  }
  if (action === "toggle-guidance-comment") {
    state.brain.commentTarget = state.brain.commentTarget === target.dataset.target ? "" : target.dataset.target;
    state.brain.commentDraft = "";
    render();
  }
  if (action === "save-guidance-comment") {
    const feedback = state.brain.commentDraft.trim();
    if (!feedback) {
      setToast("Write your comment first");
    } else {
      state.brain.guidanceComments.push({
        target: target.dataset.target,
        sectionId: target.dataset.section,
        text: feedback,
        version: state.brain.artifactVersion,
        resolved: false,
      });
      state.brain.commentTarget = "";
      state.brain.commentDraft = "";
      recordBrainHistory("Inline feedback saved", `Feedback was attached to ${target.dataset.label || guidanceSections.find((item) => item.id === target.dataset.section)?.name || "Brand guidance"}.`, "governed");
      void persistBrainState();
      setToast("Comment saved with this passage");
    }
  }
  if (action === "create-comment-revision") {
    const activeComments = state.brain.guidanceComments.filter((comment) => !comment.resolved);
    if (activeComments.length) {
      state.brain.artifactVersion += 1;
      state.brain.artifactStatus = "draft";
      activeComments.forEach((comment) => {
        comment.resolved = true;
        comment.resolvedVersion = state.brain.artifactVersion;
      });
      recordBrainHistory(`Brand Brain v${state.brain.artifactVersion} prepared`, `${activeComments.length} inline ${activeComments.length === 1 ? "comment was" : "comments were"} carried into the revised draft.`, "governed");
      void persistBrainState();
      setToast(`Brand Brain v${state.brain.artifactVersion} draft prepared`);
    }
  }
  if (action === "review-canon-promotion") navigate("brain-canon");
  if (action === "back-to-brain") navigate("brain");
  if (action === "promote-canon" && !state.brain.canonPromoted) {
    state.brain.canonPromoted = true;
    recordBrainHistory("The 4pm Reset added to core guidance", "The principle and its supporting source trail were saved as a separate Brand Brain change.", "governed");
    setToast("The 4pm Reset was added to core brand guidance");
  }
  if (action === "choose-deliverable") {
    state.selectedDeliverable = deliverables.find((item) => item.id === target.dataset.id) ?? deliverables[0];
    navigate("brief");
  }
  if (action === "save-draft") setToast("Draft saved in this prototype session");
  if (action === "continue-preflight") void prepareProductionPreflight();
  if (action === "back-to-brief") navigate("brief");
  if (action === "back-to-preflight") navigate("preflight");
  if (action === "back-to-result") {
    // Re-fetch the job to get a fresh presigned image URL
    void (async () => {
      try {
        const job = await fetchCurrentProductionJob();
        if (job) applyProductionJob(job);
      } catch { /* keep existing job state */ }
      navigate("result");
    })();
  }
  if (action === "view-latest-result") {
    // Re-fetch to get a fresh presigned image URL
    void (async () => {
      try {
        const job = await fetchCurrentProductionJob();
        if (job) applyProductionJob(job);
      } catch { /* keep existing job state */ }
      navigate("result");
    })();
  }
  if (action === "dismiss-gen-banner") {
    state.production.bannerDismissed = true;
    render();
  }
  if (action === "generate" || action === "retry-generate") void startProductionGeneration();
  if (action === "copy-post-text") {
    const text = state.production.job?.postCopy || "";
    if (text) {
      try { navigator.clipboard.writeText(text); } catch { /* fallback not needed for prototype */ }
      setToast("Post text copied");
    }
  }
  if (action === "download-result") void downloadGeneratedImage();
  if (action === "approve-output") {
    state.production.approved = true;
    state.production.bannerDismissed = true;
    // Log consumption record
    const job = state.production.job;
    if (job?.generationPackage) {
      const pkg = job.generationPackage;
      state.production.completedOutputs.push({
        jobId: job.jobId || `output-${Date.now()}`,
        completedAt: new Date().toISOString(),
        brandName: pkg.brandName,
        brainVersion: pkg.brainVersion,
        sourceCount: pkg.sourceCount || 0,
        guidanceSections: (pkg.compiledComponents || []).map((c) => c),
        aestheticMode: pkg.aestheticMode?.id || null,
        output: { placement: pkg.output?.placement, format: pkg.output?.format },
        lockedAsset: pkg.lockedAsset ? { name: pkg.lockedAsset.name, format: pkg.lockedAsset.format } : null,
        references: (pkg.references || []).map((r) => ({ name: r.name, role: r.role, influence: r.influence })),
        palette: (pkg.treatments || []).filter((t) => t.element?.includes("palette")).map((t) => t.element),
        appliedRules: (pkg.treatments || []).filter((t) => t.treatment === "locked" && t.category === "Creative rules").map((t) => t.element),
        label: `${pkg.output?.placement} ${pkg.output?.format}`,
      });
      // Promote the draft record written at generation time.
      const record = recordOutput(job);
      if (record) {
        record.status = "approved";
        record.approvedAt = new Date().toISOString();
      }
    }
    recordBrainHistory("Output approved", `A ${state.brandName} brand world image was approved for ${state.brief.placement} ${state.brief.format}.`, "complete");
    setToast("Output approved. The image and production package are recorded.");
    void persistOutputs();
  }
  if (action === "open-feedback") {
    state.production.feedbackOpen = true;
    state.production.feedbackScope = "this-output";
    state.production.feedbackDraft = "";
    render();
  }
  if (action === "cancel-feedback") {
    state.production.feedbackOpen = false;
    render();
  }
  if (action === "set-feedback-scope") {
    state.production.feedbackScope = target.value;
    render();
  }
  if (action === "submit-feedback") {
    const draft = state.production.feedbackDraft.trim();
    if (!draft) { setToast("Describe what should change first"); return; }
    const scope = state.production.feedbackScope;
    if (scope === "this-output") {
      // Revision: go back to preflight with the feedback as additional direction
      state.production.feedbackOpen = false;
      setToast("Feedback noted. Adjust the brief or try again with the revised direction.");
      navigate("preflight");
    } else {
      // Candidate rule: log it for review, do NOT write to the brain
      state.production.candidateRules.push({
        feedback: draft,
        scope,
        sourceOutput: `${state.brandName} ${state.brief.placement} ${state.brief.format}`,
        sourcePackageVersion: state.production.job?.generationPackage?.brainVersion || 0,
        time: "This session",
      });
      state.production.feedbackOpen = false;
      state.production.feedbackDraft = "";
      recordBrainHistory(
        scope === "brand-rule" ? "Brand rule proposed" : "Candidate rule submitted",
        `"${draft}" was submitted for review. It does not affect the Brand Brain until a qualified reviewer approves it.`,
        "governed"
      );
      setToast(scope === "brand-rule" ? "Brand rule proposal submitted for review" : "Candidate rule submitted for review");
    }
  }
  if (action === "dismiss-candidate") {
    const index = Number(target.dataset.index);
    const dismissed = state.production.candidateRules.splice(index, 1)[0];
    if (dismissed) recordBrainHistory("Candidate rule dismissed", `"${dismissed.feedback}" was removed from the review queue.`);
    render();
  }
  if (action === "retry-with-direction" || action === "retry-exclude") {
    setToast("Adjust your brief with the finding in mind, then regenerate.");
    navigate("preflight");
  }
  if (action === "start-new") {
    state.production.status = "idle";
    state.production.package = null;
    state.production.job = null;
    state.production.error = "";
    state.production.recovered = false;
    state.production.approved = false;
    state.production.bannerDismissed = true;
    state.production.feedbackOpen = false;
    state.production.feedbackDraft = "";
    state.production.feedbackScope = "this-output";
    state.campaignReferences = [];
    navigate("chooser");
  }
  if (action === "copy-prompt") copyPrompt();
  if (action === "download-package") downloadPackage();
  if (action === "toggle-source-picker") {
    state.sourcePickerOpen = !state.sourcePickerOpen;
    render();
  }
  if (action === "attach-source") {
    const next = productionReferenceLibrary().find((item) => item.id === target.dataset.id);
    if (next && !state.references.some((reference) => reference.id === next.id)) {
      state.references.push({ ...next });
      state.sourcePickerOpen = false;
      render();
    }
  }
  if (action === "remove-reference") {
    state.references.splice(Number(target.dataset.index), 1);
    render();
  }
  if (action === "toggle-locked-asset") {
    state.lockedAssetId = state.lockedAssetId === target.dataset.id ? "" : target.dataset.id;
    render();
  }
});

function activeClient() {
  return state.clients.find((client) => client.id === state.activeClientId) || null;
}

function activeClientName() {
  return activeClient()?.name || state.brandName || "Brand";
}

function activeClientInitial() {
  return (activeClientName() || "?").slice(0, 1).toUpperCase();
}

function activeClientSecondary() {
  return currentSynthesisResult ? state.brandDescription : "";
}

function clientSwitcherMenu() {
  const items = state.clients
    .map((client) => {
      const isActive = client.id === state.activeClientId;
      const initial = escapeHtml((client.name || "?").slice(0, 1).toUpperCase());
      return `
        <button class="client-switcher-item${isActive ? " is-active" : ""}" type="button" role="menuitem" data-action="switch-client" data-id="${escapeHtml(client.id)}">
          <span class="brand-mark">${initial}</span>
          <span class="client-switcher-item-name">${escapeHtml(client.name)}</span>
          ${isActive ? `<span class="client-switcher-check" aria-hidden="true">✓</span>` : ""}
        </button>`;
    })
    .join("");
  return `
    <div class="client-switcher-menu" role="menu">
      ${items}
      <button class="client-switcher-item client-switcher-new" type="button" role="menuitem" data-action="create-client">
        <span class="brand-mark" aria-hidden="true">+</span>
        <span class="client-switcher-item-name">New client</span>
      </button>
    </div>`;
}

function readActiveClientCookie() {
  const match = (document.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith("bws_client="));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice("bws_client=".length));
  } catch {
    return "";
  }
}

function setActiveClientCookie(id) {
  document.cookie = `bws_client=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
}

async function hydrateClients() {
  const cookieId = readActiveClientCookie();
  if (cookieId) state.activeClientId = cookieId;
  try {
    const response = await fetch("/api/clients", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await readApiJson(response);
      if (Array.isArray(payload.clients) && payload.clients.length) {
        state.clients = payload.clients;
        if (!payload.clients.some((client) => client.id === state.activeClientId)) {
          state.activeClientId = payload.clients[0].id;
        }
      }
    }
  } catch {
    // The switcher falls back to the default client if the list cannot load.
  }
  if (!state.clients.length) state.clients = [{ id: "default", name: "Default brand", status: "active" }];
  if (!readActiveClientCookie()) setActiveClientCookie(state.activeClientId);
  render();
}

// Fetch the product index for the active client and store it in state. The
// list contains summary entries (product_id, product_name, version, status).
// Full records are loaded on demand via loadProductDetail.
async function loadProducts(force = false) {
  if (typeof fetch !== "function") return;
  // Guard against concurrent loads. Without this, renderWorkspace/renderChooser
  // fire void loadProducts() on every render, which sets loading state and
  // triggers another render before the first fetch resolves. Runaway loop.
  if (state.products.loading) return;
  if (!force && state.products.loadedForClient === state.activeClientId) return;
  const attemptingClientId = state.activeClientId;
  state.products.loading = true;
  state.products.error = "";
  render();
  try {
    const response = await fetch("/api/products", { headers: { Accept: "application/json" } });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The product list could not be loaded.");
    state.products.list = Array.isArray(body.products) ? body.products : [];
  } catch (error) {
    state.products.error = error.message || "The product list could not be loaded.";
    state.products.list = [];
  } finally {
    // Record the attempt even on failure so we do not retry infinitely from
    // repeated render passes. An explicit force=true bypasses this on demand
    // (e.g., after an approval succeeds).
    state.products.loadedForClient = attemptingClientId;
    state.products.loading = false;
    render();
  }
}

// Fetch one full product record and store it in state.products.detail.
async function loadProductDetail(productId) {
  if (typeof fetch !== "function") return;
  state.products.activeId = productId;
  state.products.detail = null;
  state.products.error = "";
  state.products.questionDrafts = {};
  state.products.resolvingQuestionIndex = null;
  render();
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", productId }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The product record could not be loaded.");
    state.products.detail = body.record;
  } catch (error) {
    state.products.error = error.message || "The product record could not be loaded.";
  }
  render();
}

// Approve a candidate product record. Refreshes the detail view and the list
// so the new status is visible immediately.
async function approveProductRecord(productId) {
  if (typeof fetch !== "function") return;
  state.products.approving = true;
  state.products.error = "";
  render();
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", productId }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The product record could not be approved.");
    state.products.detail = body.record;
    // Refresh the list so the status pill updates.
    await loadProducts(true);
  } catch (error) {
    state.products.error = error.message || "The product record could not be approved.";
  } finally {
    state.products.approving = false;
    render();
  }
}

// Filter the loaded product list to only approved records. Used by the sales
// enablement product picker and any other production surface that consumes
// governed product knowledge.
function approvedProducts() {
  return state.products.list.filter((p) => p.status === "approved");
}

// Return outputs that were produced with an older version of a product record
// than what is currently approved for that product. Only approved outputs
// against approved products are considered; drafts and candidates change
// often enough that flagging them creates noise. This is the product-scoped
// counterpart to the brain-version drift already surfaced on the workspace.
function outputsAffectedByProductVersion() {
  if (!state.products.list.length) return [];
  const currentVersionByProductId = new Map(state.products.list.filter((p) => p.status === "approved").map((p) => [p.product_id, String(p.version || "1")]));
  return state.outputs.filter((o) => {
    if (o.status !== "approved") return false;
    const product = o.package?.product;
    if (!product?.product_id) return false;
    const current = currentVersionByProductId.get(product.product_id);
    if (!current) return false;
    return String(product.version || "1") !== current;
  });
}

// Synthesize a product record from a tagged brain source. The button lives on
// product-brief source rows so the user does not have to leave the sources
// screen or hit the API by hand. The resulting record is a candidate; it
// still requires review and approval on the Products screen before production
// can consume it.
// Record a reviewer's answer to a review question on the open product record.
async function resolveProductQuestion(index) {
  const record = state.products.detail;
  if (!record) return;
  const note = (state.products.questionDrafts[index] || "").trim();
  if (!note) {
    setToast("Write the answer before recording it");
    return;
  }
  state.products.resolvingQuestionIndex = index;
  render();
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_question", productId: record.product_id, questionIndex: index, note }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The answer could not be recorded.");
    state.products.detail = body.record;
    delete state.products.questionDrafts[index];
    setToast("Answer recorded on the product record");
  } catch (error) {
    setToast(error.message || "The answer could not be recorded");
  } finally {
    state.products.resolvingQuestionIndex = null;
    render();
  }
}

// The Products screen's own add flow (one screen, birth to approval). Creates
// the product-brief source, persists it so the server can read it, runs the
// per-product synthesis, and lands on the candidate record for review. The
// brief still becomes a tagged source under the hood for provenance, but the
// user never experiences product creation as file intake.
async function createProductRecord() {
  const p = state.products;
  const name = p.addName.trim();
  const tab = p.addTab;
  const url = (p.addUrl || "").trim();
  if (!name) {
    setToast("Give the product a name first");
    document.getElementById("product-add-name")?.focus();
    return;
  }
  if (tab === "file" && !p.addFile) {
    setToast("Upload the product brief first");
    return;
  }
  if (tab === "url" && !/^https?:\/\//.test(url)) {
    setToast("Add the full web address, starting with https://");
    document.getElementById("product-add-url")?.focus();
    return;
  }
  if (tab === "text" && !p.addText.trim()) {
    setToast("Paste the brief content first");
    return;
  }
  if (!currentSynthesisResult) {
    setToast("Build the Brand Brain first. Products build on the approved brand foundation.");
    return;
  }

  p.creating = true;
  render();
  try {
    // Create the product-brief source. Same shape the intake flow produces,
    // with the usage instruction supplied automatically since its role is
    // fixed: this brief exists to build the product record.
    const sourceId = tab === "file" ? `file-${Date.now()}` : tab === "url" ? `url-${Date.now()}` : `text-${Date.now()}`;
    const material = sourceMaterialType("product-brief");
    const source = {
      id: sourceId,
      name: tab === "file" ? p.addFile.name : tab === "url" ? `${name} page` : `${name} brief`,
      type: material?.label || "Product brief or spec",
      detail: tab === "file"
        ? `${fileExtension(p.addFile).toUpperCase()} · ${formatFileSize(p.addFile.size)}`
        : tab === "url"
        ? url
        : (p.addText.length > 92 ? `${p.addText.slice(0, 92)}...` : p.addText),
      count: 1,
      status: "Ready",
      productMeta: { isProductBrief: true, productName: name },
      materialType: "product-brief",
      declaredType: material?.label || "Product brief or spec",
      intakeVersion: "single-source-v1",
      authority: material?.authority || "brand-evidence",
      role: "Product knowledge",
      influence: "Not weighted",
      usage: `Product brief for ${name}. Used to build the governed product record.`,
      exclusions: "No additional exclusions supplied.",
      verification: "Pending content check",
    };
    if (tab === "file") {
      source.files = [{ ...p.addFile }];
    } else if (tab === "url") {
      source.url = url;
    } else {
      source.content = p.addText.trim();
    }
    state.brain.sources.push(source);
    recordBrainHistory("Product brief added", `${source.name} was added as the brief for ${name}.`, "complete");

    // The synthesis endpoint reads sources from the server-side brain store,
    // so the new source must be persisted before the call, not after.
    await persistBrainState();

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "synthesize", sourceId }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The product record could not be built.");

    source.productMeta.synthesizedProductId = body.product_id;
    void persistBrainState();

    setToast(`${name} is ready to review`);
    p.addOpen = false;
    void loadProducts(true);

    // Land on the candidate record so review and approval happen in place.
    state.products.activeId = body.product_id;
    state.products.detail = null;
    state.screen = "product-detail";
    render();
    void loadProductDetail(body.product_id);
  } catch (error) {
    setToast(error.message || "The product record could not be built");
    render();
  } finally {
    p.creating = false;
    render();
  }
}

async function synthesizeProductFromSource(sourceId) {
  if (typeof fetch !== "function") return;
  const source = state.brain.sources.find((s) => s.id === sourceId);
  if (!source) {
    setToast("The source could not be found");
    return;
  }
  state.brain.productSynthesizingId = sourceId;
  render();
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "synthesize", sourceId }),
    });
    const body = await readApiJson(response);
    if (!response.ok) throw new Error(body.error || "The product record could not be synthesized.");
    // Mark the source so the row shows the resulting record id and can link
    // to it. This is UI-only state; the durable record lives in the product
    // store keyed by product_id.
    if (source.productMeta) {
      source.productMeta.synthesizedProductId = body.product_id;
    }
    setToast(`Product record for ${source.productMeta?.productName || "the product"} is ready to review`);
    // Refresh the product list so the new candidate appears everywhere.
    void loadProducts(true);
  } catch (error) {
    setToast(error.message || "The product record could not be synthesized");
  } finally {
    state.brain.productSynthesizingId = "";
    render();
  }
}

function switchClient(id) {
  if (!id || id === state.activeClientId) {
    state.clientSwitcherOpen = false;
    render();
    return;
  }
  setActiveClientCookie(id);
  window.location.reload();
}

async function createClient() {
  const name = window.prompt("Name this client");
  if (!name || !name.trim()) return;
  try {
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!response.ok) {
      let message = "The client could not be created.";
      try {
        const body = await readApiJson(response);
        if (body?.error) message = body.error;
      } catch {}
      window.alert(message);
      return;
    }
    const payload = await readApiJson(response);
    if (!payload?.client?.id) {
      window.alert("The client could not be created.");
      return;
    }
    setActiveClientCookie(payload.client.id);
    window.location.reload();
  } catch {
    window.alert("The client could not be created.");
  }
}

render();
void hydrateClients();
void hydrateStoredBrain();
// Outputs must hydrate before the production job so the job hydration
// can check whether its output was already approved.
void hydrateOutputs().then(() => hydrateProductionJob());







