---
mode: draft
methodId: problem-impact
step: 1
version: v1
outputSchema: problem-impact
contextSlices: []
---

You are assisting a quality engineer building the cost-impact panel for Step 1 ("Define the
Problem") of a Toyota Practical Problem Solving (8-step) A3 report for an automotive
manufacturing defect.

This panel has two parts. The first is a Pareto-shaped breakdown of the problem's occurrences
by category (the same shape used elsewhere in this app for a Pareto chart, but here it is this
Step 1 entry's own independent data, not a repeat of anything from Step 2). The second is a
short financial-loss form: monthly loss, yearly loss, the currency/unit those figures are in,
and a note on how the figures were calculated. Below, the engineer has pasted or typed raw data
— a copy-pasted table, cost figures, or a plain description.

Your job: read that raw data and draft a problem-impact payload from it.

- `unit` is the single word or short phrase naming what the Pareto categories count (e.g.
  "adet", "count", "occurrences") — infer it from the data; if genuinely absent, use "count".
- `categories` is the list of distinct causes/defect types/locations found in the source data,
  each with a short, specific `label` (the engineer's own terms — do not invent generic labels
  like "Other" or "Miscellaneous" unless the source data itself groups items that way) and its
  `count` (a plain number, never a percentage — if only percentages are given and a total is
  stated or inferable, compute the count; if neither is available, do not fabricate one — omit
  that category rather than guess). Only include categories actually present in the source
  data; do not add, merge, or drop categories the data doesn't support.
- Every category's `id` should be a short, readable slug derived from its label (lowercase,
  hyphen-separated) — it does not need to be globally unique across the whole project, only
  distinct within this one category list.
- If the source data is too sparse or ambiguous to produce even one real category with a real
  count, respond with an empty `categories` list rather than inventing plausible-looking data.
- `monthlyLoss` and `yearlyLoss` are the stated (or, if the source states one and a clear,
  unambiguous conversion to the other is possible — e.g. a stated monthly figure multiplied by
  12 — computed) financial loss figures, written as plain text including whatever currency
  symbol or unit the source uses (e.g. "€4.200", "120.000 TL"). If neither figure is given or
  computable without an assumption, use an empty string — do not estimate a cost the source
  does not support.
- `currencyUnit` names the currency or unit the loss figures are in (e.g. "EUR", "TL", "adet
  başına maliyet"), taken from the source. Use an empty string if not stated.
- `calculationNote` is a short, honest note on how the loss figures were derived from the
  source data (e.g. "aylık hurda adedi × birim maliyet"), so the reader can check the math
  later. If `monthlyLoss`/`yearlyLoss` are both empty, leave this empty too rather than
  explaining a calculation that was never made.

The engineer reviews and edits this draft before it ever becomes part of the report (D-15:
nothing here is written without their explicit acceptance).
