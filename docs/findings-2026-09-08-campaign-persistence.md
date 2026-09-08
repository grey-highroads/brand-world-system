# Findings: campaigns become client-scoped and persistent

Date: 2026-09-08
Base: `main` at `71a7e374bbd81e7361321dbd907e02ab3e7db037`

Campaigns now live in Blob storage under the client's namespace, on the same
pattern products already use. The seeded Dialog Health campaign is gone from
the source. What follows is what the work turned up that the brief did not
anticipate, plus the checks the brief asked to have reported.

## Line numbers in the brief were off by 54 in one place, and the shapes matched

The seed is where the brief says: the comment at line 1299 and `campaigns: [`
at line 1301. The `save-campaign` handler is at line 9701 rather than 9647, and
its record fields run 9705 through 9724 rather than 9651 through 9672. The
handler's content is exactly what the brief describes and the tree SHA matched
the base the brief was written against, so the offset is in the brief's line
numbers rather than in the tree. Work proceeded on that reading.

## Products has no local dev fallback store, so campaigns has none either

The brief made a campaign dev store conditional on products having one.
`src/products/store.js` is Blob-only. `src/production/store.js` does have a
file-backed store for local development, but products does not, and campaigns
follows products.

The acceptance criteria still required a two-client store test, which a
Blob-only module with a static import cannot support. The campaign store
therefore takes its Blob operations through an options seam that defaults to
`@vercel/blob`, and exports `createInMemoryCampaignBlobOperations` for tests.
This is a deviation from the products pattern. It tests the real store rather
than a parallel implementation, which is the stronger of the two options, and
it costs one parameter.

## The deferred-work entry was deleted rather than marked as shipped

The brief asked for `docs/deferred-work.md` to say the work shipped in this
commit. The file's own governing rules say an entry that ships is deleted, not
marked done, because git history holds the record. The register's rule won and
the entry is gone. Flagging it because the brief said otherwise.

## ADR 0011 already names campaigns, so it was not edited

The brief listed ADR 0011 as in scope if it enumerates which stores are
client-scoped. It does not enumerate stores. It states that all durable state
including campaigns lives under the client's namespace, which is what this
commit implements rather than changes. The ADR is frozen and needed no edit.

## The serverless function count is now 13

Twelve `api/**/*.js` handlers before this commit, thirteen after. That crosses
the Vercel Hobby ceiling of 12 that the deferred-work register names as a
standing constraint. **VERIFIED**: the owner checked the Vercel account during
this session and the plan is Pro, whose ceiling is above 12. The register's
entry on the 12-function ceiling is stale on that point and is left for the
owner of that item rather than edited here.

## "Before They Open It" survives in one historical document

`docs/handoff-2026-08-10-ui-pass.md` line 79 records the session that added the
seed. It is a record of what happened, not source, and deleting it would edit
the history the handoff exists to hold. Left in place. No source file, fixture,
or spec contains either the campaign name or `dh-rcs-campaign`.

## Every mutation of campaign state, and what happened to it

Grep of `state.campaigns` found three writing sites and the rest reads.

- `save-campaign`: pushed a new record onto the array. Now calls
  `createCampaignFromDraft`, which posts to `/api/campaigns` and only then
  updates state and navigates. A failed save shows a toast and leaves the
  person on the creation form with the draft intact.
- `save-field-edit`: assigned one field on the record in place. Now calls
  `persistCampaignEdit` with that one field.
- `save-campaign-edit`: assigned fourteen fields in place. Now calls
  `persistCampaignEdit` with all fourteen.

Both edit paths take the record storage returned rather than the object they
sent, so what the screen shows is what storage holds. On failure state is left
alone.

Grep of `learnings` found two initialisers and no mutation anywhere. The array
is created empty on a new campaign and nothing in the app has ever written to
it. The store carries the field through unchanged; there was no write path to
route.

## Client switching needs no extra work

`switchClient` calls `window.location.reload()`. Campaign hydration runs at
module load beside `hydrateClients`, so the new client's campaigns load on the
reload. `loadCampaigns` also records which client it loaded for, on the same
guard shape as `loadProducts`, so a later soft switch would not silently keep
the previous client's list.
