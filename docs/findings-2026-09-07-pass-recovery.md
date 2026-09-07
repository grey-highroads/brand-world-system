# A dropped connection on any synthesis pass recovers

- Date: 2026-09-07
- Base commit: `c00e086cc2462c449163bc2bf6f5ed8550d0da14`
- Modules: `app/app.js`, `api/brand-brain/synthesize.js`, `src/brand-brain/service.js`, `scripts/dev-server.js`, `docs/image-pipeline-contract.md`, tests
- Status: shipped

## What happened

The first four-pass synthesis on the deployed app failed on pass 1 with "Failed to fetch." The server side did not fail. Two POSTs to `/api/brand-brain/synthesize` at 22:02:59 and 22:04:59 both returned 200, and no runtime error was recorded in the window. The function finished pass 1 and stored the in-progress brain. The browser connection was severed before the response arrived, so the client never sent pass 2.

This is the same connection drop that cut renders off around sixty seconds, which the render path already handles by polling the job's own status rather than trusting the connection.

## What was wrong

The four-pass session shipped recovery on the final pass only, on the reasoning that only the final pass can leave a saved brain behind. That reasoning is correct about the saved brain and wrong about the failure. Any pass can outlive its connection, and passes 1 through 3 leave an in-progress state the client had no way to see.

Two things followed from that. The client had no read that would tell it a pass had finished. And it treated every failure the same way, so a severed connection and a real error inside a pass produced the same outcome.

## What changed

**A recovery read.** `GET /api/brand-brain/synthesize?requestId=` returns `{ requestId, inProgress, completedPass, nextPass }`, computed by `service.js#readSynthesisProgress` from the in-progress record. It returns nothing else from that record, so the half-built brain stays unreachable by the browser, which is what the four-pass session established and this does not weaken.

It answers plainly rather than erroring when there is nothing to report: no in-progress state, a request id that belongs to a different synthesis, or no request id at all all return `inProgress: false`. The client polls this while the server may still be writing, and an error there would read as a failure when the honest answer is that the pass has not finished yet.

It went on the synthesize route rather than `api/brand-brain/index.js` because it is about synthesis and that route already has the store and the pass protocol. It adds no serverless function, which matters at the Hobby ceiling.

**The client distinguishes a dropped connection from a failed pass.** `fetch` throwing means no reply arrived and the server may still be working. A response with a body, ok or not, is a real answer. On passes 1 through 3 a thrown fetch polls the recovery read until that pass reports complete, then continues from the next pass. Nothing is shown to the person beyond the progress step moving on. If the pass never reports complete inside the window, the original network error surfaces as it did before.

A server error with a body still fails immediately and names the pass, unchanged.

The pass is polled for, never retried. Retrying a pass the server may still be running would start a second model call against an in-progress record that is about to be written by the first.

**Pass 4 is unchanged in mechanism.** By the time pass 4 fails the in-progress record has been cleared, so the saved brain is the thing to poll for, and `recoverBrainSynthesis` still does that.

## One change beyond the brief's letter, stated plainly

The brief said the final pass recovers as it does today. I kept the mechanism and changed the window.

Both pollers ran for 30 seconds, twenty attempts at 1500 ms. A pass has the route's full 300 seconds. A 30 second window gives up on a pass that is still running and reports a failure that did not happen, and that short window is a large part of why the deployed drop ended the synthesis rather than pausing it. Leaving it in place on pass 4 would have shipped the same defect on one pass out of four while fixing it on the other three.

Both pollers now run 220 attempts at 1500 ms, a window of 330 seconds, which is longer than the server's own limit. The brief's instruction not to add a client-side timeout shorter than the server's is what decided the number.

## Files and what happened to each

- `src/brand-brain/service.js`: `readSynthesisProgress` added. Nothing else touched.
- `api/brand-brain/synthesize.js`: a GET branch ahead of the POST branch, and `Allow` updated to `GET, POST`.
- `scripts/dev-server.js`: the same GET branch, so local development behaves like the deployment.
- `app/app.js`: `waitForSynthesisPass` added, the pass loop wraps its fetch, the two poll constants are shared, and the comment at the old line 7686 saying only the last pass is worth recovering is gone.
- The pass instructions, the schema slices and the provider were not touched.

## Verification

- `node --check` on every edited file.
- Full suite: 189 tests, 188 passing. `fixtures/copy-audit-mechanism-test.mjs` fails for a missing key, pre-existing, left alone.
- No em dashes in any touched file, checked mechanically.

Eight new tests.

In `test/browser-prototype.test.js`, against a stubbed server that completes a pass and then throws on the way back, reproducing the deployed failure exactly. One test per dropped pass, 1 through 3: each asserts all four passes ran once, that the client asked the recovery read, that no error reached the person, and that the synthesis finished. One test asserts a server error with a body stops the loop at that pass, names it, and is never polled for. One asserts the recovery read is asked for a request id and nothing more.

The harness gained two options to make this testable: an injectable `fetch`, absent by default so every other test still falls through to the simulated path, and a `runTimeouts` flag so `wait()` resolves. Both are off unless a test asks.

In `test/brand-brain-openai.test.js`, four tests on the read itself: it reports the completed pass and carries none of the brain, it answers plainly for an unknown or missing request id, it does not answer for a different synthesis, and a finished synthesis reports nothing in progress because its record is cleared.

## What this does not fix

The connection drop itself, which is external and has been tolerated since the render recovery work. This makes the synthesis survive it rather than preventing it.

MycoPop still needs re-synthesizing for the artifact shapes from `c5da34bb`, and re-synthesis still drops attached product images, so the isolated can needs re-attaching afterward.
