# Writer corpus

Sentences the scene writer produced that a camera cannot use, each with the sentence that replaces it and the cause in one line. The owner adds to this file by hand from the job record, which since 2026-09-10 carries all three offered directions, the chosen one, and every sentence the meaning check stripped. The moments brief, when it comes, reads this file first.

The meaning check in `api/production/generate-copy.js` (`MEANING_TELLS`) grows from this file. A sentence that reached a render is a sentence the list missed.

## Format

One entry per sentence. Date, the direction it came from, the sentence as written, the fix, the cause.

## Entries

### 2026-09-09, MycoPop, evolved world, gpt-4o

- Direction: DJ's back room. Wrote: "In the venue back room, two friends are captured amidst a hive of activity." Fix: "In the venue back room, two friends work at the same table." Cause: the sentence describes the photograph being taken rather than what was in front of it, and "hive of activity" names nothing a camera records.
- Direction: DJ's back room. Wrote: "two coworkers move seamlessly around each other" Fix: "two coworkers pass each other between the table and the rack." Cause: "seamlessly" is a judgment about the movement, not the movement.
- Direction: restaurant kitchen after service. Wrote: "A MycoPop sits on the edge of the counter, condensation pooling at its base, a quiet nod to the end of a busy service." Fix: "A MycoPop sits on the edge of the counter, condensation pooling at its base." Cause: the closing clause tells the reader what the object means. The direction ended on it.
- Direction: repair shop at opening. Wrote: "Hanging parts and tools sway gently as the air stirs, creating a dynamic yet calm atmosphere for the solitary worker systematically preparing the shop for the day's tasks." Fix: "Hanging parts and tools sway on their hooks." Cause: the sentence summarizes the picture and its mood. The direction ended on it.

### Pattern across the four

Every direction ended on a sentence that told the reader what the picture meant, with a task paragraph that already said not to. The rule was one clause in a task paragraph while the look's full optical description sat in RULES; position, not wording. See `docs/findings-2026-09-10-writer-behavior-and-meaning.md`.

## Model comparison

The writer model is now set by `OPENAI_WRITER_MODEL`. Runs on `gpt-4o` and `gpt-5.6` against the same brief go here, with which model each direction came from, read off the job record.

(none yet)
