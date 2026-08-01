# What five real A3s actually contain — 2026-08-01

Source: `reference/Examples/` — five completed Farplas A3 reports (7–50 MB each, BIFF8),
extracted mechanically. This changes assumptions the spec makes.

## 1. The headline: these sheets are canvases, not spreadsheets

| File | A3 sheet | Cell text (chars) | Drawing objects |
|---|---|---|---|
| GÖKÇEN — 263 Door Panel Noise | `A3 (3)` | 795 | — |
| MECNUR — Astar Revizyon | `A3` | 876 | 3 |
| ÖNDER — N.Doblo PLS Door Noise | `A3` | 646 | **83** |
| Örnek A3 | `A3 (3)` | 664 | — |
| SİNAN — Balans problemi | `A3` | 935 | **92** |

The blank template already carries roughly 600–700 characters of its own labels (title,
header fields, loss categories, work-plan strip, seven block headers, footer). So a
*completed* A3 adds on the order of **100–300 characters of cell text** — and 80–90 floating
drawing objects.

**Every substantive thing the engineer wrote is in a shape, a text box, or a pasted
screenshot.** Not one of the five has the problem statement, the analysis, the target or
the countermeasures in cells.

**Step 3 specifically: not one of the five has any cell text in the Step 3 block.** The
worked example supplied separately — item table, H/M/L markers, trend chart, target
statement — is entirely drawing objects layered over the grid.

## 2. What follows for the app

### 2.1 Our output will not look like theirs, and that is the point

`PPS Hachi` writes structured content into cells (D-03, D-04). Current practice pastes
pictures. Ours is searchable, validatable, traceable to a root cause, and machine-readable
on the `Data` sheet; theirs is an image nobody can query. That is the product thesis.

But it must be said out loud rather than discovered at the Phase 4 fidelity test: **the
fidelity test compares our export against the blank template, not against a filled one.** A
filled company A3 is not a target we can or should reproduce.

### 2.2 Type must be sized for the printed page, not inherited from the template

This is the sharp consequence. Their text boxes are sized by hand, so they come out legible.
Our cell text inherits the template's 14 pt body font, which at the verified **41.5 %** scale
prints at **5.8 pt** — unreadable.

So `buildA3Layout` needs a legibility floor: pick a minimum printed size (8 pt is the usual
floor for a document meant to be read at arm's length), divide by the template's fit scale,
and treat the result as the authored minimum — **≥ 19 pt** for `farplas-7step-tr`. Less text
fits per block as a result, which is what the overflow → appendix mechanism (`SPEC.md` §2.3)
is for. That mechanism is load-bearing, not a nicety.

### 2.3 Real users edit the geometry; we will not

| | Rows | Row height total | B:O | P:AB | Split |
|---|---|---|---|---|---|
| **Blank template (ENG)** | 63 | 1965.15 pt | 256.41 | 259.48 | 49.7 / 50.3 |
| MECNUR | 67 | 1910.5 pt | 254.54 | 209.56 | 54.8 / 45.2 |
| ÖNDER | 73 | 2091.0 pt | 235.80 | 218.82 | 51.9 / 48.1 |
| SİNAN | 68 | 1907.2 pt | 237.67 | 234.56 | 50.3 / 49.7 |

Nobody keeps the grid. Rows get inserted (63 → 67–73), columns get re-widened, and one
author moved the Step 3 header into the right column entirely. Sheets get renamed to
`A3 (3)`, and extra working sheets appear alongside (`SATURASYON`, `schenck`, `C1…C9`,
`1…8`, `Team`).

Fixed geometry is therefore a **feature** — it is the standard the app exists to enforce —
but it removes the escape hatch people currently use when content does not fit. Appendix
overflow is that escape hatch and has to be good.

Note the splits: 50.3 – 54.8 % left. Even hand-edited, nobody lands near 59 %. This is
independent corroboration of §9.2 — the Plan-side weighting `SPEC.md` §3.1 asserts is not
in this form's practice either.

### 2.4 Annotation is used everywhere, not just on Step 1 photos

`SPEC.md` §1.3 offers annotation (arrows, circles, callouts) only on the Step 1 defect photo
board. Real practice annotates every block: severity markers, arrows onto screenshots,
callouts, status ticks. The supplied Step 3 example uses shape-coded H / M / L markers — a
red square, a yellow triangle, a green circle — which stay distinguishable in monochrome
because the **shape** carries the meaning, not only the colour. Worth adopting as a
convention across the app.

### 2.5 The export performance budget is wrong

`SPEC.md` §3.3 budgets *"under 3 seconds for a project with 20 images."* Two of the five real
files carry 83 and 92 drawing objects. Whatever the right number is, 20 is not it, and the
budget should also state whether frontend chart rendering and PNG encoding are inside it.
