# Brand World System Design System

## Product context

Brand World System is a governed brand-intelligence layer paired with configurable production workflows. It serves people doing brand strategy and production work. The interface must make authority, provenance, evidence, confidence, lifecycle, and policy consequences understandable without exposing implementation plumbing. The bootstrap does not model users, roles, permissions, escalation, notifications, or external review routing.

The application has two connected but distinct journeys:

1. **Brand Brain:** intake evidence, resolve exceptions, inspect proposed knowledge, approve entities for use, and separately promote selected material into canon.
2. **Production:** select a recurring deliverable, provide a job brief and optional creative inputs, inspect a compiled generation package, generate, evaluate, revise, and approve.

Approval and canon promotion are separate actions. Inferred material must remain visibly inferred even when approved for contextual use. Prohibitions are scoped rules, not entity statuses. No interface may imply that a generative renderer is the source of brand truth.

## Existing product shell

- Persistent 242px SLAKE sidebar with brand switcher, primary navigation, workspace tools, and compact profile without a role label.
- Sticky 58px topbar with breadcrumb, global search, and a `Needs you` count.
- Maximum 1320px workspace with compact page header and dense cards.
- Desktop-first information architecture that becomes single-column under 1040px and collapses sidebar navigation under 760px.
- Brand Brain must be a first-class sidebar destination and must preserve the same shell as Production.

## Visual language

Use only the existing dark product palette and Inter/system sans typography.

- Page background: `#28303a`
- Cards: `#2e3643`
- Nested surfaces: `#27313e` or `#26313e`
- Sidebar: `#303a4e`
- Strong text: `#dedddc`
- Muted text: `#939ba8`
- Borders: `#374250` and `#465365`
- Primary action / active state: coral `#e6845a`
- Informational/evidence state: blue `#72b8d7`, pale blue `#b9e7f7`
- Governed/compiled state: lavender `#9188c7`
- Success/verified: green `#68c69b`
- Prohibition/conflict/destructive: red-orange `#ef765e`

Avoid gradients except the small existing brand mark and restrained decorative rules. Avoid large rounded consumer cards, glassmorphism, neon, purple gradients, serif display type, oversized marketing headings, and generic AI sparkle imagery.

## Typography

- Font family: Inter, then native system sans fallbacks.
- Body: 14px, 1.5 line height.
- Page title: 25–30px, weight 650, tight tracking.
- Card headings: 17px, weight 650.
- Labels and metadata: 9–12px, weight 650–800.
- Copy should be operational and concise. Use sentence case. Do not use em dashes.

Some of the prototype's smallest functional text is difficult to read. Run a selective readability pass rather than changing the full type scale: raise essential source counts, timestamps, help text, status metadata, and action-supporting labels that currently fall below 10px; improve their line height or contrast where needed. Smaller text may remain only when it is decorative or safely nonessential. Do not enlarge headings, body copy, or the overall interface wholesale.

## Interface language

Write for marketers and people responsible for a brand, not for architects implementing the system. Start with the decision, the evidence, and what will happen next. Internal terminology belongs in contracts and documentation unless a person genuinely needs it to decide.

Prefer these plain-language labels in the interface:

- `Brand rule`, not `scoped prohibition` or `scoped rule`.
- `Where this rule applies`, not `scope`.
- `What this rule prevents`, not `production effect`.
- `Why this matters`, not `rationale`.
- `Where this came from`, not `provenance`.
- `Suggested by the system` or `added directly`, not `epistemic origin`.
- `Use this rule`, `Keep for later`, and `Discard this suggestion`, not lifecycle or governance-event names.
- `Core brand guidance` in ordinary explanatory copy. Use `canon` only where the distinction itself is the decision, and explain it in plain language.

Do not show semantic tags, schema field names, governance roles, lifecycle values, policy precedence, or event names unless they directly help the current decision. Technical detail may remain available in an audit view later.

## Geometry and spacing

- Card radius: 5px. Nested surface radius: 3–4px. Large containers: no more than 8px.
- Pills: fully rounded but compact.
- Standard workspace gaps: 20–22px.
- Card padding: 18px.
- Controls: 38–42px height.
- Borders do most of the hierarchy work; shadows are low, dark, and restrained.
- Dense tables and queues are appropriate when row scanning is the user job, but each exception must expose a clear next action and evidence trail.

## Components

- Primary button: coral fill, white text, compact 3px radius.
- Secondary button: blue fill, dark text.
- Neutral button: transparent with slate border.
- Cards: dark slate fill, 1px slate border, restrained shadow.
- Status pills: color communicates semantic category, always accompanied by text.
- Thumbnails: abstract placeholders are acceptable for synthetic assets; exact brand assets must not be redrawn in production.
- Evidence chips: compact blue-tinted pills.
- Exception rows: combine asset thumbnail, issue type, evidence/provenance summary, confidence, and one clear resolution action.

## Brand Brain interaction requirements

The first high-fidelity flow uses one sanitized SLAKE batch of 50 assets and must visibly include:

- One contradiction against existing guidance.
- One suspected duplicate.
- One suspected-canon item.
- Batch-level provenance and rights context.
- An honest fast path for the majority of clean assets.
- Exception review without hiding why an item was flagged.
- Evidence detail with source, method, rationale, confidence, and relationships.
- Approval for use as a separate action from canon promotion.
- Canon promotion presented as a separate deliberate decision with an impact preview and governed revision record, without implying a V1 authorization model.

Brand Brain uses five persistent user-facing destinations: Overview, Sources, Needs review, Brand guidance, and History. The internal five-domain model must not become top-level navigation. The empty landing view should explain the value, supported source types, and onboarding sequence. A populated overview should answer: What does the brain know, what needs attention, which stored version can production use, and what should I do next?

The onboarding spine is: empty overview, source intake, visible synthesis progress, consequential review, stored Brand Brain draft, feedback or approval, and history. Synthesis progress uses plain stages such as reading sources, connecting the brand story, checking for questions, and preparing the draft. It must not expose model or service architecture.

The live local implementation now sends actual uploaded documents and images, readable public pages, and pasted material through the server to OpenAI. Structured output fills the existing six guidance sections, review queue, Brand Dossier, Lived World, and Story Architecture. The interface continues to say what is happening in plain brand-work language; model names, API mechanics, credentials, and provider selection do not appear in the routine Brand Brain flow.

Source intake must distinguish authority before synthesis. The four plain-language choices are Exact brand asset, Approved brand guidance, Brand evidence, and Creative or cultural reference. Exact assets are kept exact and approved guidance is followed where relevant; neither receives an influence weight. Evidence and outside references can use Lead, Strong, Supporting, or Light influence, always explained as creative priority rather than a blend percentage. Every source can also carry the guidance area it should inform, a plain-language usage instruction, and explicit exclusions.

Brand guidance is a reading and review workspace, not a card index. The six content categories appear as tabs within the Brand guidance destination. Each tab opens extended synthesized prose, working principles, a source trail that explains how evidence was used, a production-use statement, and richer artifacts such as dossiers, lived experience maps, personas, and rule sets. Users can comment on the exact passage they want changed, and revision records preserve which version incorporated that feedback.

The six Brand guidance tabs are the primary visual navigation in that workspace. They use larger labels and a restrained category accent drawn only from the existing palette: foundation is lavender, identity is blue, world and story is coral, voice is green, creative direction is pale coral, and creative rules is red-orange. The stored-version status above them remains compact and visually secondary.

Brand guidance has two local views. Guidance is the editable knowledge organized by category. Artifacts are composed, cross-category readings built from that knowledge. The first three artifacts are Brand Dossier, Lived World, and Story Architecture. They share versioning and inline feedback behavior but use different information modules rather than one repeated card template. Artifact sections may include a strategic read, audience, product truth, palette, materials, guardrails, tensions, daily patterns, emotional progression, earned environments, social modes, and a sequenced moment plan.

## Motion and responsiveness

- Use 140–160ms hover/focus transitions already established in the prototype.
- Do not animate governance state changes in a celebratory way.
- Support reduced motion.
- At tablet widths, stack detail beside/below the queue without losing exception state. At mobile widths, prioritize one issue and one decision at a time.

## Design constraints

- Preserve the existing SLAKE shell and palette exactly.
- Do not expose renderer/provider settings in Brand Brain.
- Do not collapse approval and canon promotion into one control.
- Do not make inference look canonical through color or copy.
- Do not bury provenance or confidence behind unexplained icons.
- Do not add a generic dashboard whose metrics are disconnected from decisions.
- Use only the fonts, colors, spacing, and component styles defined here and in `app/styles.css`.
