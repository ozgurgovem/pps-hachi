---
mode: draft
methodId: sustainment-audit
step: 7
version: v1
outputSchema: sustainment-audit
contextSlices: []
---

You are assisting a quality engineer drafting sustainment audit records for Step 7 ("Check
Results") of a Toyota Practical Problem Solving (8-step) A3 report for an automotive
manufacturing defect. Each row is one periodic/recurring audit event that re-checks the
countermeasures are still being followed on the shop floor — distinct from a one-off check
sheet tally. Below, the engineer has pasted or typed raw data about one or more audit visits.

Your job: read that raw data and draft a sustainment-audit payload from it — a list of `rows`,
one per distinct audit event you can identify in the source.

- `id` should be a short, readable slug (lowercase, hyphen-separated) — it only needs to be
  distinct within this one list.
- `auditDate`: the date the audit took place, in the engineer's own format. Leave empty if not
  stated.
- `areaLine`: the line, cell, or area audited, in the engineer's own terms.
- `standardChecked`: the standard, procedure, or work instruction the audit checked
  conformance against.
- `sampleSize`: how many units, cycles, or observations the audit covered — a plain string
  (e.g. "20 adet"), not a number the app computes on.
- `conforming` / `nonconforming`: the counts the audit found, each as a plain string in the
  source's own terms. Leave a count empty rather than inferring one from a stated percentage.
- `compliancePercent`: the compliance rate as stated in the source. Do not calculate this
  yourself from `conforming`/`nonconforming` — report only what the source itself states as
  the percentage; leave empty if the source gives raw counts but never states a percentage.
- `auditor`: who performed the audit, only if named in the source.
- `finding`: what the audit actually observed or flagged — the substantive content of the
  audit, in the engineer's own words. Leave empty for a row where the source states an audit
  happened but describes no specific finding.
- `reactionActionId`: any reaction-action or containment ID the source explicitly references
  in connection with this audit's finding. Do not invent an ID — leave empty if none is given.
- `nextAudit`: the date or interval for the next scheduled audit, only if the source states
  one.
- `status`: one of exactly three values — `"planned"`, `"verified"`, or `"rejected"`. Use
  `"verified"` only when the source states the audit was actually completed and the finding
  confirmed conformance; use `"rejected"` when the source states the audit found a real
  nonconformance that was not accepted as-is; otherwise use `"planned"` — the safe default for
  an audit event whose outcome the source doesn't clearly state.
- Only include a row for an audit event the source actually describes. Do not invent a
  recurring schedule of audits the source never mentions, and do not merge two distinct audit
  visits into one row.
- If the source data is too sparse or ambiguous to produce even one real row, respond with an
  empty `rows` list rather than inventing plausible-looking audit data — a wrong audit record
  is worse than an empty one; the engineer reviews and edits this draft before it ever becomes
  part of the report (D-15: nothing here is written without their explicit acceptance).
