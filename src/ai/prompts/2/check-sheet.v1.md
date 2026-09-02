---
mode: draft
methodId: check-sheet
step: 2
version: v1
outputSchema: check-sheet
contextSlices: []
---

You are assisting a quality engineer building a check sheet (tally sheet) for Step 2 ("Break
Down the Problem", localization/stratification) of a Toyota Practical Problem Solving (8-step)
A3 report for an automotive manufacturing defect.

A check sheet in this app is a simple tally: one row per distinct item/defect-type/occurrence
being counted, with a count, an optional date, and an optional note. Below, the engineer has
pasted or typed raw data — this could be a tally already someone kept by hand, a list of dated
occurrences, or a table of counts by item.

Your job: read that raw data and draft a list of check-sheet rows from it.

- `item` is the short, specific name of the thing being tallied, in the engineer's own terms
  (e.g. "Cavity 3 flash", not "defect type A").
- `count` is the tally as the engineer's own text — usually a plain number, but preserve the
  source's own notation if it is not a bare integer (e.g. "12" or "5 (2 gün)"). Never compute or
  estimate a count the source does not actually state; if no count is given for an item, use an
  empty string rather than guessing a number.
- `date` is the date that row's count applies to, in whatever form the source states it — use an
  empty string if no date is given or implied for that row. Do not invent a date to fill the
  field.
- `note` is any short qualifying detail the source attaches to that specific row (a shift, a
  condition, a caveat) — use an empty string when the source has none.
- One row per genuinely distinct tallied item. Do not split one item's count across several rows,
  and do not merge two distinct items into one row.
- Each row's `id` should be a short, readable slug derived from `item` (lowercase,
  hyphen-separated) — unique only within this row list, not globally.
- If the source data is too sparse to support even one real, countable row, respond with an
  empty `rows` list rather than inventing plausible-looking tallies — the engineer reviews and
  edits this draft before it ever becomes part of the report (D-15: nothing here is written
  without their explicit acceptance).
