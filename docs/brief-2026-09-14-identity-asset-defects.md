# Brief: three identity asset defects

Date: 2026-09-14
Repo state this brief was written against: `main` at `fb4aebdd60`
Related: ADR 0020 (identity assets as governed records)

## Push first

If you hit the tool limit with work on disk and nothing pushed, push before you do anything else, including before you write your report.

## What this session does

Three defects found in the 2026-09-14 audit of the Sources path. None of them depends on the identity asset record type, which is a later build. Each one is small and each one is wrong today.

Do not build the record type in this session. Do not touch placement.

## 1. The asset contract never reaches synthesis

The protected-asset intake saves `assetKind`, `assetVariation`, and `assetVariationOther` on the source contract. `sourceMetadata` in `src/brand-brain/chat-completions-provider.js` builds the object each source becomes in the synthesis payload, and none of the three fields is in it. So a brand with five logo files gives synthesis five filenames to guess from, after the user already answered which variation each one is.

Add them to `sourceMetadata` for sources that carry them. Send the resolved variation rather than the raw enum plus the other-field, so the model reads "Monochrome" or the typed value rather than having to combine two fields. The same resolution already exists in `assetVariationLabel` in `app/app.js`.

Sources saved before the contract existed carry none of these fields and must keep working unchanged. Absent means absent, not an empty string in the payload.

## 2. The studio offers logos into a path that will redraw them

`productionLockedAssets` in `app/app.js` returns every `exact-asset` source that has a PNG, JPEG, or WebP file, which includes logos and claim lockups. They appear in a picker titled "Product asset" whose body copy says the selected file is placed without change and the model builds the scene around it. On a scene render nothing protects it: the Protection section is gated to the template and sales enablement paths and `sceneProtectionBlock` is imported and never called. The file is attached as a reference to a generative edit, and a generative edit redraws artwork.

Exclude sources whose `contract.assetKind` is `logo` or `lockup` from `productionLockedAssets`. Packaging, typeface, and other are unchanged, as are session product uploads.

Two things to be careful about.

`other` stays in. It is the escape hatch for a packaging file someone did not categorize, and removing it would break working behavior to catch a case we have not seen.

A job that already selected a logo has that id in `state.lockedAssetId` and in stored records. Reopening such a job must not crash and must not silently swap in a different asset. It should behave the way it already behaves when a locked asset cannot be matched, which is the path around `app/app.js` line 9930.

Leave the picker's title and copy alone. It says "Product asset" and after this change that is accurate.

## 3. Unreadable formats are accepted silently

The protected-asset intake accepts `.svg`, `.ai`, `.eps`, `.otf`, `.ttf`, `.woff`, and `.woff2`. `src/brand-brain/source-normalizer.js` can only look at GIF, JPEG, PNG, and WebP, so anything else under `exact-asset` returns as metadata carrying a note that it was not visually interpreted. `productionLockedAssets` then filters to raster. The file is stored, never looked at, and never usable, and nothing in the interface says so.

Keep accepting these formats and keep storing them. Per ADR 0020 they are the files to have if the real logo is ever placed.

Tell the person what happened, at the point they add the file. The file is saved, the system cannot look at it, and adding a PNG of the same mark lets the brain see it. Plain words, no jargon, and it is a notice rather than an error, because nothing went wrong.

The normalizer already writes the reason onto the file record as `note`. Use what is there rather than deriving the condition a second time in the interface.

## Tests

- `sourceMetadata` carries the resolved variation for a source with a contract, and carries none of the three fields for a source without one.
- `productionLockedAssets` excludes a logo source and a lockup source, and still returns a packaging source, an `other` source, and a session product upload.
- A stored job whose locked asset is now excluded reopens without error.
- Every existing assertion in the suite passes unchanged.

## Out of scope

- The identity asset record type, its schema, its store, and the conversion of existing logo sources.
- Anything about how a logo is placed in an image.
- Reading SVG or EPS.
- The Sources tab card layout for layer 1.

## If the brief is wrong

Stop and say so in your report. Briefs from this desk have carried a wrong file count, a false claim about what reaches the writer, and a default that bound the wrong setting. Raise it rather than building around it.
