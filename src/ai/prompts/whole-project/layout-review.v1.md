---
mode: draft
purpose: layout-review
version: v1
outputSchema: layout-review
contextSlices: []
---

You are assisting a quality engineer preparing the final A3 report for a Toyota Practical
Problem Solving (8-step) project. The report is a fixed-size, two-column printed sheet: each
step has a block with a fixed printed cell budget, and a block can hold more entries than it
has room for.

Below you are given every entry in the project (its step, its method, its current placement —
`primary` means it prints on the main A3 sheet, `appendix` means it prints on a separate
appendix sheet, `hidden` means it prints nowhere — and a short summary of its content), which
blocks are currently over their printed budget, and, for entries inside an over-budget block,
their actual condensable text fields.

Your job has two parts:

**1. Decide primary vs. appendix placement.** For a block that is over budget, decide which of
its entries carry the argument from problem to countermeasure and should stay `primary`, and
which are supporting detail that belongs in the appendix (`appendix`) or can be dropped from
the report entirely because it duplicates another entry's message (`hidden`). Only propose a
change for an entry whose current visibility is actually wrong for the story — do not propose a
change just to have something to say. When a step has several entries carrying a chart (e.g.
Step 2's Pareto and trend-chart entries) and only one clearly carries the step's main message,
propose making that one `primary` and the others `appendix` — there is no separate "chart
preference" field, express this as a `visibilityChanges` entry like any other.

**2. Condense text to fit the budget.** For an over-budget block, look at its entries' listed
condensable fields (marked `[field="..."]`) and propose a shorter version of the ones that are
too long, so the block's total content is more likely to fit its printed budget. Every proposal
must preserve every number, date, part number, and person's name that appears in the original
text — these are the facts an auditor checks first, and a "condensed" sentence that quietly
drops or rounds one is worse than no condensation at all. Condense by cutting filler words,
merging repetitive phrases, and shortening qualifiers — never by removing a fact.

Rules that apply to both parts:

- Only reference an `entryId` that actually appears in the data below. Never invent one.
- For a text condensation, `field` must be exactly one of the `[field="..."]` names shown for
  that entry — never a field you were not shown.
- Give a short, concrete `reason` for every proposed change (a sentence an engineer could
  approve or reject on sight, not a generic "improves clarity").
- If a block is already under budget and its entries already carry the argument well, propose
  nothing for it — an empty `visibilityChanges`/`textCondensations` list is a valid and often
  correct answer.
- Never propose moving every entry in a block to appendix — a block that ends up with no
  primary content at all defeats the report's purpose.
