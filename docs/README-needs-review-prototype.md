# Needs Review focus prototype

Branch: `prototype/needs-review-focus`

The prototype runs inside the normal BWS app. Open a client with a synthesized Brand Brain and navigate to Brand Brain → Needs review.

The prototype changes presentation and navigation only. Existing Brand Brain decision state, persistence, review questions, and final approval transitions remain owned by `app/app.js`.

Files:

- `app/review-focus.js` reshapes the existing review DOM and wires sequential navigation to existing actions.
- `app/review-focus.css` owns the focused review composition.
- `docs/findings-2026-09-10-needs-review-ux.md` records the IA decision and the intended permanent boundary.
- `docs/prototype-needs-review-checklist.md` lists the behaviors to validate before folding the layout into the main renderer.
