# Builder brief: Design Studio truth pass

- Date: 2026-09-12
- Repo: `grey-highroads/brand-world-system`, branch `main`. Assert HEAD before starting; the audit was read at `5fdf58ba9df6ce98aa0200762a913799b5e7f8e9`.
- Owner: Grey. Rulings below are his, made 2026-09-12 against `docs/findings-2026-09-12-design-studio-audit.md`. Build what is ruled. State disagreement once, plainly, then build it.
- Shape: ten items, one per builder session. Each is self-contained. Do them in order, because 1 and 2 change the state that 3 through 10 read.
- Every line reference is to `app/app.js` at the audit SHA unless another file is named. Re-fetch and re-locate before editing; line numbers move after item 1.

## Standing mechanics for every item

Same as every BWS builder session: fresh fetch at a pinned SHA, Git Data API for writes, `node --check` on every touched JS file, zero em dash check on every touched file, read back the committed blob after the push, deploy trigger as a separate commit on the same tree. Interface copy follows the Higher Roads prose ruleset: no em dashes, no fragment stacks, no "It's not X, it's Y", plain register, the user's words over the architecture's words. Pre-existing test failures are reported, not touched.

Each item ends with the builder reporting: files touched, the before and after of every copy string changed, and what was checked in the deployed app.

## Item 1. One run, one image

Ruling: a Studio run produces one image. Multi-select comes out.

Social setup (`4573-4782`):
- The Platforms grid (`4657-4666`) becomes single-select. `state.studio.platforms` becomes a single id or stays an array of at most one; the builder picks whichever leaves less churn, and says which.
- The per-platform format tags (`4668-4677`) become single-select within the chosen platform. `state.studio.activeFormats` holds one id.
- Remove the "N images" pill (`4673`) and the "No formats selected" warning (`4598`), which cannot occur with a default format.
- The continue handler (`9937-9959`) already reads `activeFormats[0]`. Keep that, remove the comment on `9943` about the legacy single-format path, since single format is now the design.
- Page header (`4605`) changes from "Describe what you need and pick platforms. The system handles sizes, safe zones, and composition for each format." to copy that describes one platform and one format. The builder drafts it; Grey reviews the string.

Template setup (`4785-4958`):
- Target uses (`4839-4849`) and formats (`4851-4861`) become single-select the same way. Remove the "N images" pill (`4856`).
- Continue handler (`9984-10003`) already reads `templateFormats[0]`.
- In `src/production/package.js`, the template production instruction "The surface should crop well across different aspect ratios if multiple formats are being produced." (`package.js:40`) comes out, since multiple formats are never produced.

Do not touch the website or sales setups in this item; both are already single-select.

Check in the deployed app: pick a platform, confirm one format is selected by default, confirm a second click on another format swaps rather than adds, generate, confirm one output in the Library.

## Item 2. Every platform gets a real placement

Ruling: platforms stay, and each one must compile with its own placement in the prompt and its own claims scope.

Today (`9950-9951`) the placement is found by searching `placementFormats` keys for the platform label. Only Instagram and LinkedIn match; Facebook, X, Threads, Pinterest, and TikTok leave `state.brief.placement` at whatever it held before. An Instagram Story maps to "Instagram feed".

Build:
- Add a `placement` string to every format entry in `studioPlatformFormats` (`218-271`). Use the keys already in `src/scope/resolver.js:39-47` so scope resolves without a resolver change: "Instagram feed", "Instagram story", "LinkedIn feed", "Facebook feed", "X feed", "Threads feed", "Pinterest pin", "TikTok cover". The Instagram story and carousel entries and the Facebook story entry need their own values; the builder proposes them and confirms each exists in `placementScopes` or adds it there.
- The continue handler sets `state.brief.placement` from the format's `placement` field. Remove the label-search.
- `studioPlacementForDraft()` (`11153-11162`) reads `studioPlatformFormats[platformId]?.placement`, which never existed. Point it at the selected format's placement.
- Add every new placement to `placementFormats` (`131-140`) only if something still reads it after item 6 closes the legacy screen. If nothing does, note that and leave it.

Check: pick Facebook feed, open preflight, confirm the Assignment line reads "for Facebook feed" and the Output section matches. Pick Instagram Story, confirm "Instagram story".

## Item 3. Campaigns are labels

Ruling: a selected campaign is an association on the finished asset. It does not go into the render prompt on any path.

Build:
- Social (`4626-4634`), template (`4864-4872`), website (`5126-5134`), sales (`5294-5302`): the field note "Optional. Brings in the campaign idea, message territory, and audience." changes to copy that says the output will be filed under the campaign. The builder drafts it.
- The "Campaign direction" aside cards (`4755-4770`, `4930-4945`, `5386-5400`) come out. Replace with nothing, or with a one-line "Filed under: {name}" if the card slot looks empty. The builder chooses and shows a screenshot.
- `productionRequest()` (`8652-8670`): stop sending the `campaign` object. The output record already carries `campaignId` and `campaignName` from `state.activeCampaignId` (`8742-8743`), which the continue handlers set from `state.studio.campaignId`. Keep that.
- `src/production/package.js`: the Campaign direction and Campaign continuity sections (`557-582`, compiled at `794-795`) stop compiling on the template and sales paths. Leave the builder functions in place, uncalled, so reversal is one revert, and say so in a comment dated today.
- `service.js:303` reads `body.campaign?.id` for claims scope. With no campaign sent it is always null, which is the ruled behavior. Leave it.
- The scene writer (`suggestSceneBriefs`, `11456-11470`) still sends the campaign when the user asks for three directions. Grey left this open. Default: remove it too, for consistency with the ruling. If the builder thinks it is worth keeping, say so in the report and leave it out until Grey rules.
- The campaign workspace's CTA bar (`6068-6071`) says "The campaign direction compiles into every output." Change to say outputs made from here are filed under the campaign.
- Do not touch the campaign creation form. Its fields still describe the campaign for people.

Check: attach a campaign, generate, confirm the Library filter chip shows the campaign and the compiled prompt in preflight does not mention it.

## Item 4. Products: photo placed, caption governed

Ruling: on social and website, the product's photo is placed and the caption is governed by the product's claims. Nothing else changes. Sales and template keep compiling product knowledge.

Build, copy only:
- Social (`4614-4623`) and website (`5114-5123`): the field note "Optional. Brings in approved claims, exclusions, and product imagery." changes to say the product photo is placed in the image and the caption is checked against the product's approved claims. The builder drafts it.
- Sales (`5276-5285`) keeps its current note, since on that path claims and exclusions do compile into the prompt.
- `productImageryNote()` (`5571-5584`) is accurate. Leave it.

No code change. Check: read the two notes in the deployed app.

## Item 5. Three controls become coming soon

Ruling: text overlay, reference image, and creative direction stay visible, disabled, and labeled coming soon. Nothing is deleted.

Build:
- Text overlay toggle, social only (`4679-4688`): render disabled, add a "Coming soon" label in the same style as the rest of the row. The handler (`9888-9891`) can stay; a disabled button does not fire it.
- Reference image: the "+ Add reference image" links on social (`4737`), template (`4900`), and sales (`5348`) become disabled with the same label. Remove the expanded sections (`4712-4723`, `4875-4886`, `5323-5334`), since a disabled link never opens them. The `studio-dropzone` markup goes with them. Keep `state.studio.referenceOpen` if removing it touches the reset at `9842`; otherwise remove both.
- Creative direction: the "+ Add creative direction" links on social (`4738`), template (`4901`), website (`5170`), and sales (`5349`) become disabled with the label. Remove the expanded sections (`4725-4734`, `4888-4897`, `5158-5167`, `5336-5345`) and the input handler at `9392-9394`. `state.studio.direction` and its resets can go.
- One CSS rule for the disabled link and label, in `app/styles.css`. Check the existing `.is-disabled` and `.studio-add-link` rules before adding a new one.

Check: all four setups show the links grayed with the label, nothing opens on click.

## Item 6. Showcase and Ad cards grayed, legacy flow closed

Ruling: Product showcase and Ad image are grayed out with no click-through. The legacy brief flow closes.

Build:
- `studioCategories` (`142-149`): add `available: false` to showcase and ad. In `renderChooser` (`4386-4394`) render those two cards disabled with a "Coming soon" label, using the same treatment item 5 introduced.
- Remove the "Coming soon" fallback block in `renderStudioSetup` (`4557-4571`) and the `studio-use-legacy` handler (`9860-9865`). Nothing else should reach `navigate("brief")` from the Studio.
- The `brief` screen and `renderBrief` (`6616-6769`) stay in the file for now. Remaining routes into it are `choose-deliverable` (`10805-10808`), `select-creative-mode` (`10116-10128`), and `reuse-output` which restores a brief but does not navigate. The builder greps for every `navigate("brief")` and every `data-action="choose-deliverable"` and `select-creative-mode` in `app/*.html` and `app/app.js`, and reports what remains reachable. Do not delete the screen in this item; report so Grey can rule on removal separately.
- The "Save draft" button on the legacy screens (`6764`, `6867`) and its toast (`10809`): remove the button. The screen it sits on is closed, but the button is a lie wherever it renders.

Check: the chooser shows four live cards and two grayed. Nothing in the Studio reaches the old brief screen.

## Item 7. Sales copy says what the code does

Ruling: sales stays live. Copy states the mechanism. No compositing work until after the B2B beta.

Build, copy only, in `renderSalesSetup` (`5213-5414`):
- Page header (`5230`): "Pick a template, describe the content element, and the system generates a polished visual on your branded background." Keep or adjust; it is close to true.
- Template field note (`5256`): "The selected template becomes the locked background layer." Change to say the template is supplied to the model as the background reference and the model is asked to keep it unchanged, and that the result should be checked against the original.
- Empty state (`5270`): "The element will be produced on a transparent or brand-colored background." Change to a clean white, light, or brand-colored background. Remove "transparent".
- Aside "How this works" (`5359-5364`): "Locked background. Placed exactly, never regenerated." changes to the same reference-and-check language as the field note. "Composed on top" stays if reworded as the model placing the element. Remove the sentence "The system applies backend production knowledge to make the element look premium: lighting, reflections, perspective, and scale that match the template." Nothing matches anything to the template.
- Selected template card (`5373`): "Placed exactly as approved" changes to "Supplied as the background reference".

The builder drafts all strings and shows before and after in the report. Grey edits the final copy.

Check: read the screen with and without a template uploaded.

## Item 8. Feedback panel and repair buttons come out

Ruling: nothing behind the feedback panel stores or learns, so the panel goes. Approve and Discard stay.

Build, in `renderResult` (`7460-7692`) and the click dispatch:
- Remove the "Provide feedback" button (`7599`), the feedback card (`7616-7641`), and the "Pending review" candidate rules card (`7644-7663`).
- Remove the handlers `open-feedback`, `cancel-feedback`, `set-feedback-scope`, `submit-feedback`, `dismiss-candidate` (`10893-10940`) and the `feedbackDraft` input handler (`9350-9352`).
- Remove `candidateRules`, `feedbackOpen`, `feedbackDraft`, `feedbackScope` from `state.production` (`1385-1388`) and every reset of them (`8844-8846`, `8890`, `10953-10955`, and any others grep finds).
- Remove the repair buttons on findings. Item 9 removes the image findings entirely; the copy findings keep their "Write it again" button, which calls `rewriteCaption` and does real work. The `retry-with-direction` and `retry-exclude` handlers (`10941-10944`) go.
- Keep "Try again" (`7600`), "View package" (`7601`), "Download image" (`7602`), Approve, and Discard.

Check: result screen shows the image, the produced copy, Approve, Try again, View package, Download, Discard, and nothing that asks for feedback.

## Item 9. Image findings come out

Ruling: reviewers do not need checklists. The image findings, which are all Verify prompts, come out. The copy claims audit stays.

Build:
- `buildEvaluationFindings` (`7195-7263`): stop calling it from `renderResult` (`7492`). Keep the function or delete it; the builder chooses and says which. The constraint audit it reads (`pkg.constraintAudit`) is still on the package and still visible under "View package"; that is enough.
- The LinkedIn findings block (`7495-7525`) goes with it.
- Rename the card from "Evaluation findings" (`7568`) to something that names the copy check, since only copy findings remain. "Claims check" is the term the pills already use (`7362`). `findingCountLabel` (`7451-7458`) drops its "to verify" branch.
- Page header copy (`7534`, `7539`): "Evaluate result" and "Review the findings below before approving or revising" change to language about reviewing the image and its copy.
- Template aside (`4906-4918`): remove the "How templates are evaluated" card entirely. The sentence "The system evaluates whether the surface supports composition" describes nothing that runs.
- Breadcrumb and "Open evaluation" labels (`1706`, `4207`, `1581`): rename to "Open" or "Review". The builder lists every occurrence of "evaluation" in user-facing strings and proposes a replacement for each.

Check: generate a social image with caption on, confirm the claims card shows the audit pill and findings, confirm no image findings appear.

## Item 10. Engine copy names the selected engine

Ruling: the engine picker stays for now. Copy that names OpenAI regardless of choice is corrected.

Build:
- Preflight header (`7040`): "Review the exact prompt and inputs before OpenAI generates the image." Use `renderEngineLabel(state.studio.renderEngine)`.
- Result working copy (`7536`): "OpenAI is creating the image from the reviewed package." Use `job.engineLabel || renderEngineLabel(job.engine || state.studio.renderEngine)`, which the generation-state block at `7561` already does.
- Generation banner (`1647`): "Rendering your image" is fine. Leave it.
- Record in `docs/concept-visibility.md` or the deferred-work register, whichever Grey prefers, that the engine picker is a deliberate testing affordance in conflict with the no-picker rule, dated today, with the reason: the owner is comparing engines. This is a doc line, not a design change. The builder proposes the location and the sentence.

Check: select Seedream, open preflight and the result screen, confirm both name Seedream.

## Recorded but not built in this pass

- Seedream edit endpoint output size. `src/renderers/seedream-images.js:83-90` omits `image_size` on edits. Grey reports Seedream renders with products have come back at the chosen ratio. Row 6.1 of the audit stays REASONED until a rendered file's dimensions are checked against the format picked. Thirty seconds on any recent output.
- Compositing for sales templates. `composite.js` and the `place-on-background` action exist and are unreached. Decision after the B2B beta.
- The legacy brief screen and the LinkedIn post path. Item 6 reports what remains reachable; removal is a separate ruling.
- Learning from reactions. The directions-offered record already keeps the three directions and the chosen one on every job. That is the raw material for the corrections corpus in the 2026-09-09 plan. Nothing on the result screen should suggest learning until that corpus has a mechanism.
- "Export complete PDF" on the artifact library (`3860`, `10789`) is a toast. Outside the Studio; noted for a separate pass.
