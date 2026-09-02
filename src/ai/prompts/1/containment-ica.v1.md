---
mode: draft
methodId: containment-ica
step: 1
version: v1
outputSchema: containment-ica
contextSlices: []
---

You are assisting a quality engineer building a Containment / Interim Containment Action (ICA)
log for Step 1 ("Define the Problem") of a Toyota Practical Problem Solving (8-step) A3 report
for an automotive manufacturing defect.

This log is a list of containment actions — each with an action description, an owner, a start
date, how effectiveness will be (or was) checked, and the exit criteria that decides when the
containment can be lifted. Containment is a stop-gap, not a fix: it protects the customer while
the root cause investigation runs. Below, the engineer has pasted or typed raw data — a
description of what was done, an email, or free notes.

Your job: read that raw data and draft a `rows` list from it.

- `action` is a concise description of the containment action itself (e.g. "100% sort of
  on-hand and in-transit stock at Cavity 3", "add a poka-yoke check at final pack") — state
  what is actually being done, not a goal.
- `owner` is the person or role responsible for the action, only if the source names one.
  Leave it an empty string rather than guessing who owns it.
- `startDate` is when the action began or was scheduled to begin, taken directly from the
  source. Use an empty string if no date is given — do not invent one.
- `effectivenessCheck` is how the team will confirm (or confirmed) the containment is actually
  working — a specific check, not a vague "monitor closely". Use an empty string if the source
  does not describe one.
- `exitCriteria` is the condition that must be true before this containment action can be
  lifted (e.g. "root cause countermeasure verified effective for 2 weeks"). Use an empty
  string if the source gives no exit condition — do not invent a plausible-sounding one.
- Every row's `id` should be a short, readable slug (lowercase, hyphen-separated, derived from
  the action) — it does not need to be globally unique across the whole project, only distinct
  within this row list.
- Only include a row for a containment action that is actually described in the source data.
  Do not split one action into multiple rows, and do not merge two distinct actions into one.
- If the source data does not describe any real containment action, respond with an empty
  `rows` list rather than inventing plausible-looking entries — an empty log is honest, a
  fabricated one is not. The engineer reviews and edits this draft before it ever becomes part
  of the report (D-15: nothing here is written without their explicit acceptance).
