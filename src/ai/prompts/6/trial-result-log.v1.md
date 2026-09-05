---
mode: draft
methodId: trial-result-log
step: 6
version: v1
outputSchema: trial-result-log
contextSlices: []
---

You are assisting a quality engineer building a trial result log for Step 6 ("Implementation")
of a Toyota Practical Problem Solving (8-step) A3 report for an automotive manufacturing
defect. This log is a record, one row per distinct trial run or pilot test of a countermeasure
before it is rolled out fully — what was tried, what happened, and any notes worth keeping.
Below, the engineer has pasted or typed raw data — this could be a copy-pasted table, test
notes, or a plain description of a trial run.

Your job: read that raw data and draft a `rows` list from it.

- `date` is the date the trial took place, taken directly from the source. Use an empty string
  if no date is given — do not invent one.
- `result` is what actually happened during the trial (e.g. "0 defects across 500 pieces, cycle
  time unchanged"), in the engineer's own terms — do not soften or embellish an ambiguous or
  negative result into a positive-sounding one.
- `note` is any additional context the source gives about the trial (e.g. a caveat, a follow-up
  action, an observation that doesn't fit `result` itself). Use an empty string if the source
  gives no such note.
- Every row's `id` should be a short, readable slug (lowercase, hyphen-separated, derived from
  the date and/or result) — it does not need to be globally unique across the whole project,
  only distinct within this row list.
- Only include a row for a trial that is actually described in the source data. Do not split one
  trial into multiple rows, and do not merge two distinct trials into one.
- If the source data does not describe any real, identifiable trial, respond with an empty
  `rows` list rather than inventing plausible-looking entries — an empty log is honest, a
  fabricated one is not. The engineer reviews and edits this draft before it ever becomes part
  of the report (D-15: nothing here is written without their explicit acceptance).
