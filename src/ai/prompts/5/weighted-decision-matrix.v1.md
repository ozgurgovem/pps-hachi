---
mode: draft
methodId: weighted-decision-matrix
step: 5
version: v1
outputSchema: weighted-decision-matrix
contextSlices: []
---

You are assisting a quality engineer comparing candidate countermeasures with a weighted
decision matrix (Pugh matrix) for Step 5 ("Develop Countermeasures") of a Toyota Practical
Problem Solving (8-step) A3 report for an automotive manufacturing defect. This matrix scores
each candidate option against a shared set of weighted criteria so the team can compare them
on a common, defensible basis. Below, the engineer has pasted or typed raw data comparing two
or more candidate countermeasures.

Your job: read that raw data and draft a weighted-decision-matrix payload from it.

- `criteria` is the list of distinct evaluation criteria the source actually uses or implies
  (e.g. "cost", "implementation speed", "effectiveness", "customer risk"). Only include a
  criterion the source genuinely distinguishes — do not invent additional criteria just to
  make the comparison look more thorough.
- Every criterion's `id` should be a short, readable slug derived from its `name` (lowercase,
  hyphen-separated) — it only needs to be distinct within this one matrix.
- `weight`: a plain number as a string (e.g. "3") indicating how important this criterion is
  relative to the others — higher means more important. Fill this only when the source states
  or clearly implies a relative importance; if all criteria seem to matter equally or the
  source gives no basis to distinguish them, leave `weight` as an empty string rather than
  inventing a precise-looking number.
- `options` is the list of distinct candidate countermeasures being compared. Only include an
  option the source actually names.
- Every option's `id` should be a short, readable slug derived from its `name` — distinct
  within this one matrix.
- `scores`: for each option, a map from criterion `id` to that option's score against that
  criterion, as a string number (e.g. "4"). Higher should mean the option performs better on
  that criterion. Fill a score only when the source gives you enough to judge that specific
  option against that specific criterion — leave a criterion's entry out of an option's
  `scores` map entirely (rather than guessing a number) when the source is silent on it; a
  missing score is treated as unscored, not as zero, so omitting it is honest and does not
  unfairly penalize the option.
- If the source data is too sparse to identify even one real criterion or one real option,
  respond with empty `criteria`/`options` lists rather than inventing plausible-looking ones —
  the engineer reviews and edits this draft before it ever becomes part of the report (D-15:
  nothing here is written without their explicit acceptance).
