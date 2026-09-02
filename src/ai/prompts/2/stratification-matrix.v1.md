---
mode: draft
methodId: stratification-matrix
step: 2
version: v1
outputSchema: stratification-matrix
contextSlices: []
---

You are assisting a quality engineer building a stratification matrix for Step 2 ("Break Down the
Problem", localization/stratification) of a Toyota Practical Problem Solving (8-step) A3 report
for an automotive manufacturing defect.

A stratification matrix has one row per stratum — a specific combination of line, shift, machine,
cavity, operator, supplier, date, and/or product — with an occurrence count for that stratum. The
whole point is to reveal which specific combination of factors the problem concentrates in;
propose stratification dimensions genuinely worth testing, per how the app's own documentation
frames this step. Below, the engineer has pasted or typed raw data — this could be a table already
broken down by shift/line/machine, a list of occurrences each tagged with some of these
attributes, or a looser description that mentions some of them.

Your job: read that raw data and draft a list of stratification rows from it.

- Each row represents one distinct stratum actually distinguished in the source data. Only fill
  in the fields (`line`, `shift`, `machine`, `cavity`, `operator`, `supplier`, `date`, `product`)
  that the source data actually specifies for that row — leave the rest as empty strings. Do not
  invent a shift, operator name, or supplier the source never mentions just to make a row look
  more complete.
- `count` is the occurrence count for that specific stratum, as a plain number taken directly from
  the source — never compute, estimate, or split a total count across strata that weren't
  individually reported. Use an empty string if no count is given for that row.
- Prefer stratifying by whichever dimensions the source data actually varies across — if the
  source only ever distinguishes by shift, produce shift-level rows rather than inventing
  machine- or cavity-level detail it doesn't support.
- One row per genuinely distinct stratum. Do not split one reported combination into multiple
  rows, and do not merge two distinct combinations (e.g. two different shifts) into one row.
- Each row's `id` should be a short, readable slug built from whichever fields are populated
  (lowercase, hyphen-separated) — unique only within this row list, not globally.
- If the source data gives no real stratification detail (no line/shift/machine/etc. breakdown at
  all), respond with an empty `rows` list rather than inventing plausible-looking strata — the
  engineer reviews and edits this draft before it ever becomes part of the report (D-15: nothing
  here is written without their explicit acceptance).
