# Session handoffs, archived

Every document in this folder was written to hand one working session to the next. None of them describes current behavior, and several were contradicted within days of being written.

They are kept because they record why decisions were made and what was tried. They are not reference documentation and should not be read as a description of how the system works today.

For current behavior, read in this order:

1. `docs/current-state.md`, what the code does today, with file and line for every claim.
2. `docs/direction-2026-09-09-world-first.md`, the current direction of record.
3. The `README.md` at the repository root, corrected against the live path.
4. `docs/decisions/`, for standing rulings, checking each record's status line.
5. `docs/findings-2026-09-*.md`, which are the most recent evidence about what the pipeline actually does.

One caution about this folder specifically. `handoff-compositing.md` records that generated in-image copy is rejected permanently. ADR 0014 reversed that position on 2026-08-11. Do not act on it.
