# Design Studio audit: where the front end promises what the back end does not do

- Date: 2026-09-12
- Repo: `grey-highroads/brand-world-system`, branch `main`, head `5fdf58ba9df6ce98aa0200762a913799b5e7f8e9`
- Production deployment: `dpl_HSkfXGdjaCGtnrdpGpjCGwEu9iR4`, built from the same commit (Vercel `list_deployments`, checked this session)
- Files read in full: `app/app.js` (11,984 lines), `api/production/preflight.js`, `api/production/generate.js`, `api/production/current.js`, `src/production/service.js`
- Files read in part, with the lines named: `src/production/package.js` (1 to 120, 210 to 250, 455 to 870), `src/scope/resolver.js` (39 to 125), `api/production/generate-copy.js` (body reads only, by grep), `src/renderers/openai-images.js` and `src/renderers/seedream-images.js` (endpoint choice and size handling only)
- Not read: `src/production/prompt-craft.js`, `src/production/looks.js`, `src/copy/generate.js`, `api/production/outputs.js`, tests, docs
- Owner: Grey. The Decision column was filled by the rulings section below; the table cells were left blank so the rows read as the audit found them.

Every claim below carries a `file:line`. Where a claim depends on a live render rather than on code, it is marked VERIFIED, REASONED, or ASSUMED per the project rules. Everything not so marked is VERIFIED from the code at head.

## How the Studio actually runs a job

This is the spine every row below hangs off, so it comes first.

1. Every Studio setup screen holds its own state in `state.studio` (`app.js:1400-1458`). None of it is sent directly.
2. Each "Continue to preflight" button copies a subset of that state into the legacy `state.brief` object, then calls `prepareProductionPreflight()`:
   - social: `app.js:9937-9959`
   - template: `app.js:9984-10003`
   - website: `app.js:10054-10081`
   - sales: `app.js:10091-10115`
3. `productionRequest()` (`app.js:8625-8672`) builds the request body. It sends `brief` (the whole `state.brief` plus segment), `productId`, `lockedAssetId`, `templateAssetId`, `segment`, `copyOutputs`, `draftedCopy`, `renderCopyIntoImage`, `displayZone`, `displayFields`, `copyDirection`, `engine`, `directions`, `references` (legacy source picker only), and `campaign` (from `state.activeCampaignId`). Nothing from `state.studio` reaches the server unless step 2 copied it into `state.brief` or one of those named fields.
4. `POST /api/production/preflight` and `POST /api/production/generate` both pass that body straight to `src/production/service.js` (`preflight.js:18`, `generate.js:63`).
5. `generateProductionImage()` makes one render call and writes one image per job (`service.js:606-668`). There is no loop over formats anywhere on either side. `startProductionGeneration()` on the client also calls generate exactly once per job (`app.js:8857-8861`) and records one output (`app.js:8864`, `8730-8771`).
6. The compiled package declares `quantity: 1` (`package.js:819`).

So the single-asset-per-run behavior you see is not a rendering fault. It is what both halves of the system are written to do.

## Section 1: chooser cards

| Card | What it says (`app.js:143-148`) | What happens | Gap | Decision |
|---|---|---|---|---|
| Social image | "Feed posts, stories, and carousels for any platform." | Has a setup flow. See Section 2. Carousels are a single format entry (`ig-carousel`, `app.js:225`) that renders one 4:5 image; nothing produces a set. | Carousel claim unsupported. Story support has a placement bug, see 2.7. | |
| Website image | "Heroes, features, cards, and share images." | Has a setup flow. Six placements. Each renders one image at its stated size. | Honest. | |
| Product showcase | "Product photography, device mockups, and lifestyle scenes." | No setup flow. Lands on "Coming soon" with a "Use legacy flow" button (`app.js:4557-4571`). The legacy flow is the pre-Studio brief screen. | Dead card. Note `package.js:86-91` defines a `product-showcase` requirement set that nothing calls with that id (`package.js:808` always passes `"brand-world-image"`). | |
| Sales enablement | "Elements and backgrounds for slides, one-pagers, and pitch materials." | Has a setup flow. See Section 5. Renders one element image, with or without a template as a reference image. | Partly honest. "Backgrounds" is what the template card does, not this one. | |
| Brand template | "Reusable surfaces, environments, and composition foundations." | Has a setup flow. See Section 3. Renders one surface image. | The header on the setup screen makes a claim the code does not keep, see 3.3. | |
| Ad image | "Paid social and display ads with copy governance." | No setup flow. Same "Coming soon" card as showcase (`app.js:4557-4571`). | Dead card. | |

The chooser header (`app.js:4401`) says "Each type carries its own format options, composition rules, and production knowledge." True for four of six.

## Section 2: Social image setup (`app.js:4573-4782`)

| # | Control | What the screen implies | What is sent | What the server does | Gap | Decision |
|---|---|---|---|---|---|---|
| 2.1 | Platforms chips, multi-select (`4657-4666`, handler `9866-9880`) | Pick several platforms in one run | Only `activeFormats[0]` is used (`9944`); the comment on `9943` says so: "Use the first active format for the legacy single-format path" | One render | Multi-select is decorative beyond the first format. | |
| 2.2 | Output formats per platform, multi-select (`4668-4677`, handler `9881-9887`) | Pick several sizes | Same as 2.1 | One render at `formatSizes[format]` (`package.js:218-247`) | Same. | |
| 2.3 | "N images" pill (`4673`) | The run produces N images | Not sent | One image | Counts formats, not outputs. | |
| 2.4 | Page header: "The system handles sizes, safe zones, and composition for each format." (`4605`) | Per-format handling | Only the first format's `craft` paragraph is appended to the scene (`9953`) | Size for that one format only | "Each format" is false past the first. Safe zones exist only as prose in the craft paragraph, nothing measures them. | |
| 2.5 | Text overlay toggle (`4679-4688`, handler `9888-9891`) | "Adjusts composition to leave space for headlines"; "The system keeps the subject clear of text-safe zones" | Never sent. `state.studio.textOverlay` is read only by the render function and by the reset (`4681`, `4685`, `9832`) | Nothing | Dead control. The only thing that changes is the toggle graphic. | |
| 2.6 | Reference image section (`4712-4723`) | "Drop an image or click to browse"; "Provenance and influence tracked." | Nothing. The dropzone is a `<div>` with no `<input type="file">` (`4718-4720`) and no handler anywhere in the file (grep for `dropzone` finds only the class attributes) | Nothing | Dead control on social, template (`4882-4884`), and sales (`5330-5332`). Clicking it does nothing. | |
| 2.7 | Platform to placement mapping (`9950-9951`) | The job is made for the platform you chose | `brief.placement` is set by finding a `placementFormats` key that contains the platform label. Instagram matches "Instagram feed", LinkedIn matches "LinkedIn feed". Facebook, X, Threads, Pinterest, and TikTok match nothing, so `brief.placement` keeps whatever it held before (default `"Instagram feed"`, `1353`). An Instagram Story also maps to "Instagram feed", not "Instagram story". | The placement compiles into the prompt twice: "Create one 9:16 portrait brand world image for Instagram feed" (`package.js:651`) and the Output section (`package.js:783`). It is also the claims scope axis (`service.js:302`, `resolver.js:80`). | Five of seven platforms compile with the wrong placement in the prompt and the wrong scope for claims. The size is right, the prompt text is wrong. `resolver.js:43-47` already has "Facebook feed", "X feed", "Threads feed", "Pinterest pin", "TikTok cover" entries, so the fix is a mapping table, not new scope work. | |
| 2.8 | "Associate a campaign. Brings in the campaign idea, message territory, and audience." (`4626-4634`) | Campaign shapes the image | Campaign object is sent (`8652-8670`) without an `id` field | On the scene path the Campaign direction section compiles only for template and sales (`package.js:794-796`). For claims scope, `body.campaign?.id` is read (`service.js:303`) and is always undefined, so campaign never scopes claims. | The campaign reaches the scene writer when you ask for three directions (`11456-11470`) and nothing else on social or website. If you write the brief yourself, the campaign is not in the prompt. The aside card on the setup screen (`4755-4770`) shows the campaign as if it applies. | |
| 2.9 | "Attach a product. Brings in approved claims, exclusions, and product imagery." (`4614-4623`) | Product knowledge shapes the image | `productId` sent (`8630`) | Isolated image becomes the locked asset and is sent as a reference image (`service.js:254-268`). In-context images join `references` (`service.js:269-281`) and are sent as image inputs (`service.js:597-600`). The Product knowledge section compiles only for template and sales (`package.js:706-709`). Claims and exclusions reach the caption (`service.js:322-333`, `705-712`). | Imagery: honest. Claims and exclusions: reach the caption, not the image prompt. The note under the picker (`5571-5584`) describes imagery correctly. | |
| 2.10 | Creative direction textarea (`4725-4734`, handler `9392-9394`) | "Art direction beyond the Brand Brain. This job only." | Never sent. `state.studio.direction` is read only by render and by clears (`4732`, `4895`, `5165`, `5343`, `9844`, `9934`) | Nothing | Dead control on all four setups. Anything typed here is discarded. | |
| 2.11 | Caption toggle and direction (`4692-4710`) | Caption written and checked against claims | `copyOutputs: ["social_caption"]` when on (`8442`), `copyDirection` (`8641`) | Produced after the render, audited, recorded (`service.js:699-738`) | Honest. | |
| 2.12 | Headline set and "Place the headline on the image" (`8457-8606`) | Copy drafted, checked, rendered into the image | `copyOutputs`, `draftedCopy`, `renderCopyIntoImage`, `displayZone`, `displayFields` (`8634-8640`) | Display copy compiled into the prompt (`package.js:770-775`), only when `OPENAI_API_KEY` is set (`service.js:338`) | Honest, and the screen already says nothing verifies the lettering (`8576`). The `OPENAI_API_KEY` gate applies even when the engine is Seedream, which is a copy-production dependency rather than a render one. | |
| 2.13 | Filter (look) grid (`4474-4506`) | A look shapes the photograph | `brief.look` (`8629` via state.brief) | Compiles as the Capture section (`package.js:663-668`) | Honest. | |
| 2.14 | Scene kind (`4516-4534`) | With people or place and product | `brief.kind` | Read at `package.js:495-496`; drives default look for peopleless scenes | Honest. | |
| 2.15 | "Show me three directions" (`4646-4655`) | Writer proposes directions from context | `scene_brief` action with campaign, product, format, look, hint (`11457-11480`) | `generate-copy.js` reads all of those (`639`, `645`, `825`, `1029-1031`) | Honest. | |
| 2.16 | Aside note: "Brand Brain, palette, and production knowledge applied automatically per format." (`4772`) | Brain content is in the prompt | See 2.7 for "per format" | Scene path compiles Assignment, Capture, Display copy, and Output only (`package.js:634-642`). No guidance section, no palette, no world block reaches the scene prompt. | The Brand Brain reaches the scene writer, not the render prompt, unless the user asked for directions. The "Guidance applied" card (`4744-4754`) lists foundation, identity, and creative direction summaries as if they compile. They do not on this path. | |

## Section 3: Brand template setup (`app.js:4785-4958`)

| # | Control | What the screen implies | What is sent | What the server does | Gap | Decision |
|---|---|---|---|---|---|---|
| 3.1 | Target uses and formats, multi-select (`4839-4861`) | Several sizes in one run | `templateFormats[0]` only (`9991-9992`) | One render | Same as 2.1 and 2.2. The "N images" pill (`4856`) counts formats. | |
| 3.2 | Template production instructions (compiled) | Surface that crops well across ratios | Scene text plus placement "Brand template" and format "1080x1080" style dim (`9996-9997`) | `package.js:31-43` tells the model to crop well "if multiple formats are being produced" | The model is told about other formats that are never produced. Harmless, but it is the same lie inside the prompt. | |
| 3.3 | Page header: "Approved templates become locked assets available as inputs for future production." (`4818`) | Approving the output registers it as a template | Approval is `approve-output` (`10855-10892`): sets the output record's status and persists the outputs log | Nothing creates a `templateMeta` source, and `productionTemplates()` reads only `state.brain.sources` with `templateMeta.isTemplate` (`6504-6511`) | An approved template output never appears in the sales template picker. The only way in is uploading a file as a Background template on the Sources screen (`2539-2550`). | |
| 3.4 | Aside "How templates are evaluated" (`4906-4918`): open zones usable at all sizes, crops well, no generated text; "The system evaluates whether the surface supports composition" | Some evaluation runs on the result | Nothing template-specific is sent | The result screen findings are the generic four `verify` prompts plus the constraint audit (`7195-7263`). Nothing inspects the image. | The card describes an evaluation that does not exist. The handoff already records that image evaluation does not exist. | |
| 3.5 | Reference image and creative direction | See 2.6 and 2.10 | Not sent | Nothing | Dead. | |

## Section 4: Website image setup (`app.js:5082-5211`)

| # | Control | What the screen implies | What is sent | What the server does | Gap | Decision |
|---|---|---|---|---|---|---|
| 4.1 | Six placement cards, single select (`5098-5111`) | One image at that size | placement and dim (`10077-10078`) | `formatSizes` has every website dim (`package.js:238-244`) | Honest on OpenAI. See 6.1 for Seedream. | |
| 4.2 | Placement into claims scope | Claims scoped to the placement | "Website hero", "Website feature", "Blog header" are in `placementScopes` (`resolver.js:49-51`). "Website card" and "Website share image" (`app.js:178`, `188`, `198`) are not. | Unknown placement warns and fails closed (`resolver.js:85-88`) | Card, card-square, and OG jobs lose any placement-scoped approved claims from their headline copy. Small, but real. | |
| 4.3 | Campaign, product, creative direction, "Guidance applied" | Same as 2.8, 2.9, 2.10, 2.16 | Same | Same | Same gaps. The website aside lists "Brand world" as applied (`5199`); the world block stopped compiling on 2026-08-31 (`package.js:626-631`). | |
| 4.4 | Field note: "The system composes this from everything above plus your Brand Brain." (`5152`) | The prompt is composed from the form and the brain | Brief plus craft paragraph, look, kind, placement, format | Scene path compiles three or four sections. The brain is in the prompt only through what the writer put in the brief. | True when the user takes an offered direction. False when the user writes the brief by hand. | |

## Section 5: Sales enablement setup (`app.js:5213-5414`)

| # | Control | What the screen implies | What is sent | What the server does | Gap | Decision |
|---|---|---|---|---|---|---|
| 5.1 | Output format, single (`5238-5252`) | One element at that size | `brief.format` from `fmt.dim` (`10113`), for example "1920x1080" | Mapped to 1536x864, 1536x1152, or 1024x1312 (`package.js:229-233`) | Honest. The pill shows the delivered dim, the render is at the mapped size, and nothing upscales. ASSUMED that the client expects the pill dimension; recommend stating the render size. | |
| 5.2 | Background template picker (`5254-5273`); aside: "Locked background. Placed exactly, never regenerated." (`5360`); selected card: "Placed exactly as approved" (`5373`) | The template is preserved by mechanism | `templateAssetId` (`8632`) | The template file is the first reference image on a generative edit call (`service.js:583-586`, `597-600`). The prompt asks the model to preserve it (`package.js:54-58`). No compositing happens on this path. `composite.js` is reachable only through `body.action === "place-on-background"` (`generate.js:54`), which `app.js` never sends (grep). | "Never regenerated" is a request to the model, not a guarantee. The handoff already flagged the README version of this claim. The interface still makes it. | |
| 5.3 | Empty state: "The element will be produced on a transparent or brand-colored background." (`5270`) | Transparent output possible | Nothing transparency-related is sent | Prompt asks for "a clean, simple background (white, light neutral, or brand-colored)" (`package.js:60`). Neither renderer builder sets a transparent background option (grep for `transparent` and `background` in both renderer files returns nothing). | Transparent is not produced. | |
| 5.4 | Aside: "The system applies backend production knowledge to make the element look premium: lighting, reflections, perspective, and scale that match the template." (`5364`) | Something measures the template | Prompt text at `package.js:45-72` | Prose instructions only. Nothing reads the template's lighting or perspective. | Overstated. The prompt says "premium"; the system does not match anything to the template. | |
| 5.5 | Feature focus (`5287-5291`) | Emphasis in the element | Appended to the scene: "This showcases the X capability." (`10110-10111`) | In the Assignment section | Honest. | |
| 5.6 | Product picker | Claims, exclusions, imagery | `productId` | On the sales path, Product knowledge compiles (`package.js:706-709`) and product exclusions compile into Protection (`package.js:760`) | Honest on this path, unlike social and website. | |
| 5.7 | Campaign | Campaign idea, territory, audience | Campaign object | Campaign direction compiles on the sales path (`package.js:794`) | Honest on this path. The missing `id` (2.8) still means claims are not campaign-scoped. | |
| 5.8 | Reference image and creative direction | See 2.6 and 2.10 | Not sent | Nothing | Dead. | |

## Section 6: Preflight and result screens

| # | Control or copy | What it says | What is true | Gap | Decision |
|---|---|---|---|---|---|
| 6.1 | Render engine select (`7133-7135`) plus preflight header "before OpenAI generates the image" (`7040`) and result working copy "OpenAI is creating the image" (`7536`) | Engine is a choice; copy names OpenAI regardless | `engine` is sent (`8642`) and honored (`service.js:35-44`, `591`). REASONED from `seedream-images.js:83-90` and `57-59`: on Seedream, any job carrying a reference image (locked asset, product isolated image, template, in-context image, legacy reference) goes to the edit endpoint, and the edit request omits `image_size`, so output size follows the input image, not the chosen format. Recommend one live run to confirm. | Copy names the wrong engine when Seedream is selected. On Seedream with any reference, the format picker does not control output size. | |
| 6.2 | "Generation inputs" and "How inputs resolved" (`7140-7162`): each reference "Included as X influence for Y" | The role and influence shape the prompt | On the scene path, the Creative references section does not compile (`package.js:721-726`). The image bytes are still sent as a reference (`service.js:597-600`). | The role, influence, and usage instruction the user set are recorded on the package and never reach the model on social or website jobs. | |
| 6.3 | "Provide feedback": Fix this one (`7622-7625`), Propose for future work (`7626-7629`), Propose as a brand rule with "Requires brand-owner approval before it takes effect" (`7630-7633`) | The text goes somewhere | `submit-feedback` (`10907-10934`): "this-output" shows a toast and navigates to preflight; the text is discarded. The other two push into `state.production.candidateRules`, which is in memory only: it is not in the persisted brain snapshot (`7757-7783`), not in the outputs log, and not sent to any route. A reload loses it. | No feedback path stores anything. "Requires brand-owner approval" describes a review that has no queue. | |
| 6.4 | Evaluation finding repair buttons "Retry with stronger protection", "Retry with adjusted composition", etc. (`7195-7244`) | The retry applies the finding | `retry-with-direction` and `retry-exclude` (`10941-10944`): toast plus navigate to preflight. The finding text is not applied to the brief. | Labels promise a targeted retry; the action is a page change. | |
| 6.5 | Evaluation findings card (`7565-7587`) | An evaluation ran | Every image finding has status `verify` (`7206`, `7218`, `7229`, `7240`) and says so. Copy findings come from the real claims audit (`7367-7431`). | Honest, provided the reader sees "Verify" for what it is. The rendered-copy panel says nothing checks the lettering (`7285`). | |
| 6.6 | "Scene before product placement" figure (`11088-11093`) and preflight two-call display (`7025-7030`, `7052-7054`) | A two-call render exists | `twoCallEnabled = false` (`service.js:388`) | Both are gated on `twoCall` being present, so they never render. Not a lie, just dead code on screen, which the finding of 2026-09-07 already records. | |
| 6.7 | Approve this output (`7595-7598`, handler `10855-10892`) | Approval has consequences | Sets status on the output record and persists the outputs log. Nothing downstream reads approval except the drift cards and library filters. | Honest as far as it goes. It does not promote a template (3.3). | |
| 6.8 | "Save draft" on the legacy brief (`6764`, `6867`) | A draft is saved | Toast only (`10809`) | Dead button. Legacy screen, reached through "Use legacy flow". | |

## Section 7: outside the Studio, noticed in passing

| Item | Where | What is true |
|---|---|---|
| "Export complete PDF" on the artifact library | `app.js:3860`, handler `10789` | Toast: "PDF export will follow the artifact reader design". Dead button. |
| LinkedIn post deliverable | `app.js:6771-6872`, `8885-8963` | A full screen and a two-step generation path exist. The only entry is `choose-deliverable` (`10805-10808`) or `start-campaign-asset` with `assetType === "post"` (`10138-10141`). I found no button in the current chooser or campaign workspace that sets either. REASONED: unreachable from the current interface. Recommend a click-through to confirm. |
| Product showcase requirement set | `package.js:86-91` | Defined, never selected (`package.js:808`). |


## Rulings, 2026-09-12

Made by Grey after reading this audit, one question at a time. These govern the builder brief at `docs/brief-2026-09-12-studio-truth-pass.md`.

1. One run, one image. A single intent and a single output until there is evidence for more. Multi-select platforms and formats, and the image count pill, come out.
2. Platforms stay. Landing the image in the right ratio for the intended platform is user value. Every platform gets its own placement in the prompt and in claims scope.
3. Campaigns are associations. They label and group finished assets and drive filtered views. They do not enter the render prompt, which is the most fragile surface in the system.
4. Products on social and website: the real product photo is placed, and the caption is governed by the product's claims. Nothing more. Sales and template keep compiling product knowledge.
5. Text overlay, reference image, and creative direction stay visible, disabled, and labeled coming soon.
6. Product showcase and Ad image cards are grayed out with no click-through. The legacy brief flow is closed.
7. Sales enablement stays live with copy that says what the code does. The compositing decision waits for the B2B beta tester. The owner does not want to recreate Canva and does not yet know how far to push this flow.
8. The feedback panel and its three scopes come out, along with the finding repair buttons. The owner likes the idea of reactions feeding an intelligence about good versus bad images, but nothing does that today, and a simple app that is true is preferred over one that implies intelligence it does not have.
9. Image findings come out. Reviewers do not need checklists. The copy claims audit stays.
10. The render engine stays user-facing for now, as a testing affordance, in known conflict with `docs/concept-visibility.md`. Copy that names OpenAI regardless of choice is corrected. Seedream is the reliable edit endpoint for images with products; the owner has tested it extensively.

Open after the rulings: the Seedream edit-endpoint output size (row 6.1, still REASONED until a rendered file's dimensions are checked), compositing for sales, removal of the legacy brief screen and the LinkedIn path, and any learning loop from reactions, which should start from the directions-offered record rather than from a feedback box.

## What I could not settle from code

1. Seedream edit-endpoint output size (6.1). The code says the size is omitted on edits and the comment says output follows input. One render of a website hero on Seedream with a product attached would confirm.
2. Whether the LinkedIn path is reachable by any click in the deployed app (Section 7). Two minutes in the app settles it.
3. `api/production/outputs.js` was not read. The approve path (6.7) is judged from the client side only.

## Summary by kind of gap

Dead controls (a user acts, nothing changes): text overlay (2.5), reference image dropzone on three setups (2.6), creative direction on four setups (2.10), the three feedback scopes (6.3), the finding repair buttons (6.4), save draft (6.8), export PDF (Section 7).

Multi-select that resolves to one: platforms, formats, and the image count pill on social (2.1 to 2.3) and template (3.1).

Copy that names a mechanism that does not exist: sizes and safe zones per format (2.4), template evaluation (3.4), template locked on approval (3.3), transparent background (5.3), matched lighting and perspective (5.4), "never regenerated" (5.2), "requires brand-owner approval" (6.3), OpenAI named when Seedream is selected (6.1).

Prompt content mismatches: five platforms compile as "Instagram feed" or a stale placement (2.7); campaign has no id for scope on any path and no prompt section on scene paths (2.8); references carry roles the scene prompt never sees (6.2); "Guidance applied" and "Brand world" cards on scene setups list sections that stopped compiling (2.16, 4.3); two website placements fall outside the claims scope table (4.2).

Cards with no flow: Product showcase and Ad image (Section 1).
