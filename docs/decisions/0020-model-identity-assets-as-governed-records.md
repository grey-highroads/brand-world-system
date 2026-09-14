# ADR 0020: Model identity assets as governed records

- Status: Accepted 2026-09-14. Nothing is implemented.
- Date: 2026-09-14
- Owner: Higher Roads
- Supersedes: Nothing. Extends ADR 0012 (products as governed records) with a second record type on the same shape.
- Related: ADR 0011 (shared multi-client deployment), ADR 0012 (products as governed records), ADR 0006 (portable generation package)

## Context

A brand's logo is not one file. It is one mark in several forms: primary, alternate, monochrome, icon only, wordmark, horizontal lockup, stacked lockup. Each form has rules about when it is used, and where the rules are not written down there are practical ones that amount to the same thing, like a light mark on a dark ground.

The system already collects most of this and then loses it. An audit of `fb4aebdd60` on 2026-09-14 found the following, each verified by reading the file.

**The variation is collected and discarded.** The protected-asset intake in `app/app.js` asks which kind of asset a file is, and for a logo or a lockup it asks which of eight variations. The answer is saved on the source contract as `assetKind`, `assetVariation`, and `assetVariationOther`, and `assetVariationLabel` renders it in two places in the interface. `sourceMetadata` in `src/brand-brain/chat-completions-provider.js` builds the payload synthesis reads, and the contract is not in it. Synthesis sees five files with five filenames and infers from the filenames that they are one mark, when the user already answered the question.

**Rules reach the brain and never reach an image.** A source's `usage` and `exclusions` are in the synthesis payload and the pass instructions act on them. Neither is in the compiled package. `compileBrandWorldImagePackage` records `lockedAsset: { name, format }` and nothing more. A rule like a light mark on dark grounds can shape what the brain says about the brand and cannot affect the image being produced.

**A logo is treated as a product.** `productionLockedAssets` returns every `exact-asset` source with a raster file, logos included, into a picker titled "Product asset" whose copy says the model builds the scene around it. On a scene render the Protection section is gated to the template and sales enablement paths, and `sceneProtectionBlock` is imported and uncalled, so nothing tells the renderer the file is artwork. Selecting a logo today asks a generative model to redraw a logo.

**The formats brands actually hold are accepted and ignored.** The intake accepts SVG, AI, EPS, and font files. The vision set in `src/brand-brain/source-normalizer.js` is GIF, JPEG, PNG, and WebP, so anything else under `exact-asset` is stored as metadata with a note saying it was not visually interpreted. `productionLockedAssets` then filters to raster, so the file cannot be selected either. The person is told none of this.

The first two are a modeling problem rather than a set of separate defects. A logo is currently a source, and a source is a thing the brain reads. Five variations of one mark are five unrelated sources that happen to share a slot in the interface. Nothing in the data says they are one mark, so nothing can carry a rule that applies across them, and nothing can choose between them.

Products had the same problem and ADR 0012 solved it by taking them out of the brain document and giving them their own records. Identity assets are the same shape of thing at a smaller scale.

## Decision

**Logos and other identity artwork become governed records of their own type, stored alongside the brain and the products, namespaced per client.** One record per mark. The variations live inside the record rather than beside each other as separate sources.

**A record holds two kinds of rules, kept apart.** Placement rules are the ones a machine can act on: clear space, minimum size, which variation goes on light grounds and which on dark, approved colorways. Guidance is the rest, the judgment a person would apply, and it goes to the brain as guidance for the writer. Mixing them into one list is how the old compiled governance reached forty-four occurrences of "do not," and the separation is cheaper to make now than later.

**Identity assets keep feeding synthesis.** Moving a logo into its own record is not a reason for the brain to stop seeing the mark. The record is where the logo lives; the brain still reads it, and it now reads the variation along with it. This is a deliberate departure from ADR 0012, where product briefs are excluded from brain synthesis, and the reason for the difference is that a product brief is text the brain does not need and a logo is the brand's own face.

**Existing logo sources convert once.** MycoPop and Simply Agree have logo sources in the Sources tab today. They are converted as part of the build. The system does not carry two shapes for the same thing.

## What this decision does not settle

**How a logo reaches an image.** Tabled on 2026-09-14 and not decided here. Today protected assets are supplied as a reference to a generative edit, and a generative edit will redraw a logo. Placing the real file means deterministic compositing, which was retired on 2026-09-09 and would be coming back for this one case. That is a real decision with its own cost and it gets its own session.

The consequence for this one: **no identity asset reaches a render until that decision is made.** The record type, the variations, the rules, and the conversion can all be built and be useful to synthesis without it. A logo appearing in the studio waits.

**Whether vector formats become readable.** SVG and EPS keep being accepted and stored, because if deterministic placement arrives they are exactly the files to have. Whether anything reads them is open.

**Whether a variation is chosen by the user or by the system.** A rule saying a light mark goes on a dark ground is executable only if something knows the ground. That depends on the placement decision.

## Consequences

The studio loses the ability to select a logo, which is a capability people have today. What they have today produces a redrawn logo, so the removal is correct, and it should be understood as a feature going away rather than as a silent fix.

Synthesis gets better without any render changing, because the variation and the rules arrive as structured fields instead of as filenames.

A second record type is a second thing to version, diff, and show drift for. Products already carry that machinery and identity assets should reuse its shape rather than invent a parallel one.

## Sequencing

1. The three current defects, which do not depend on this decision. See `docs/brief-2026-09-14-identity-asset-defects.md`.
2. The record type, the schema, the store, and the conversion of existing logo sources.
3. Synthesis reads the record.
4. Placement, after its own decision.

## Implementation

Nothing is implemented. This section stays empty until it is not, and an accepted status here does not mean running code.
