# A3 Template Analysis

> Reverse-engineered from `PPS_A3_Format_ENG.xls` and `PPS_A3_Format_TR.xls`.
> Both are legacy BIFF8 `.xls`, created 2010-02-16, last saved 2021–2022.
> Save this at `reference/TEMPLATE_ANALYSIS.md`. It defines Template A.

---

## 1. What these files actually are

**They are a 7-step form, not an 8-step one.** The title cell reads
"7 STEPS MAJOR KAIZEN FORM" / "7 ADIMLI MAJOR KAIZEN FORMU". This is the Imai/Kaizen
lineage — a TPM Kobetsu Kaizen form — rather than the Toyota Business Practice 8-step
model. The difference is that Toyota's steps 5 (develop countermeasures) and 6 (implement)
are collapsed into a single step 5 here.

Step mapping between this template and the app's internal 8-step model:

| Template step | Template label (EN) | App step |
|---|---|---|
| 1 | Problem Definition | 1 Clarify |
| 2 | Current Condition Analysis | 2 Break Down |
| 3 | Target Setting | 3 Set Target |
| 4 | Root Cause Analysis | 4 Root Cause |
| 5 | Proposed Countermeasures & Action Plans | **5 Develop + 6 Implement (merged)** |
| 6 | Monitor Results and Process | 7 Monitor |
| 7 | Standardization / Institutionalization & Dissemination | 8 Standardize |

**Architectural consequence:** the app's `ProjectModel` keeps all 8 steps. A template is a
*projection* of that model onto a sheet. Template A renders app-steps 5 and 6 into one
block. Never collapse the model to match a template — the model is the superset, always.

## 2. Workbook structure

| Sheet | ENG | TR | Purpose |
|---|---|---|---|
| `A3` | ✓ | ✓ | The report. Landscape, A3, fit 1×1 page |
| `Problem Bildirim Formu` | — | ✓ | Problem report intake form (portrait A4) |
| `Problem Definition Form` / `Problem Tanımlama Formu` | ✓ | ✓ | 5G + 5N1K questionnaire (portrait A4) |
| `STEP-1` … `STEP-7` | ✓ | ✓ | Training images only — no cell content. Guidance material for each step |
| `Onay formu` | — | ✓ | Benefit calculation and approval form (portrait A4) |

The `STEP-N` sheets contain nothing but embedded instruction images. In the app these
become the **coaching content** for each step (`SPEC.md` §2.2, coach band) — extracted,
rewritten as text and diagrams, not shipped as JPEGs.

## 3. `A3` sheet geometry — Template A

Both language versions share the same grid within ~1 pt. Use the ENG values as canonical
and treat TR as the same template with a one-row offset (TR content starts at row 1, ENG
at row 2) and slightly different column J/K widths.

**Page setup**
```
paperSize      8 (A3)
orientation    landscape
fitToPage      true, fitToWidth 1, fitToHeight 1
scale          40   (stored value; ignored while fitToPage is on — CORRECTED from 100)
printArea      ENG  $B$2:$AB$63      TR  $B$1:$AB$62
margins (in)   left 0.2362  right 0.2362  top 0.1969  bottom 0.1969   — CORRECTED
               = 6 mm / 6 mm / 5 mm / 5 mm. The previously stated bottom 0.3153 was wrong.
               Printable height therefore 297 − 10 mm = 287 mm = 813.5 pt (was 805).
```

**Column widths** (Excel character units; `default` = 8.43)
```
CORRECTED 2026-08-01 from the .xls — see §9. Every 8.43 below was a parser artefact.
ENG  A 1.55   B:C 20.78   D 2.22   E 23.66   F:G 22.66   H 2.78   I 23.66
     J 19.89  K 25.44     L 2.78   M 23.66   N 44.66     O 0.78
     P 3.22   Q 23.66     R:S 22.66   T 22.00   U:AB 20.66   AC 2.00   AD:IW 9.22
TR   A 1.54   B:C 20.73   D 2.27   E 23.63   F:G 22.63   H 2.73   I 23.63
     J:K 22.63            L 2.73   M 23.63   N 44.63     O 0.82
     P 3.27   Q 23.63     R:S 22.63   T 22.00   U:AB 20.63   AC 2.00   AD:IW 9.18
```

**CORRECTED.** Left column **B:O = 256.41** (ENG) / **256.05** (TR).
Right column **P:AB = 259.48** (ENG) / **259.20** (TR).

Split is **49.7 % / 50.3 %** in both files — the sheet is essentially **balanced**, and the
right column is marginally the wider of the two. The previously stated 59 / 41 was an
artefact of the parser bug above. **There is no Plan-side width weighting in this template.**
`SPEC.md` §3.1's instruction *"Do not 'balance' the columns"* describes a property the
company form does not have; see §9.2.

**Row heights** (pt)
```
1   7.2      spacer, outside ENG print area
2   38.55    title band
3–7 20.10    header band (5 rows)
8–56 30.00   body grid
57  93.75
58  30.00
59  153.75
60  18.00 · 61 17.40 · 62 18.00 · 63 18.00   footer band
```

Total printable content height ≈ **1958 pt**. Against an A3 landscape printable height of
~805 pt this forces an automatic scale of roughly **41 %**. That is deliberate: the grid is
sized for *pasted screenshots and charts*, not typed prose. Body text at 14 pt renders at
about 5.7 pt on paper. **The app must warn when a block is filled with text rather than
graphics** — it will be technically correct and practically unreadable.

**Block map** (ENG rows; subtract 1 for TR)

| Block | Columns | Header row | Content rows | Content height | % of column |
|---|---|---|---|---|---|
| Step 1 Problem Definition | B:O | 8 | 9–22 | 420 pt | 25.3 % |
| Step 2 Current Condition | B:O | 23 | 24–57 | 1083.75 pt | 65.4 % |
| Step 3 Target Setting | B:O | 58 | 59 | 153.75 pt | **9.3 %** |
| Step 4 Root Cause Analysis | P:AB | 8 | 9–22 | 420 pt | 25.8 % |
| Step 5 Countermeasures & Actions | P:AB | 23 | 24–36 | 390 pt | 24.0 % |
| Step 6 Monitor Results | P:AB | 37 | 38–55 | 540 pt | 33.2 % |
| Step 7 Standardization | P:AB | 56 | 57–59 | 277.5 pt | 17.1 % |

**CORRECTED:** the columns total **1657.5 pt** (left) and **1627.5 pt** (right). The
figure 1747.5 appears in no file and is not a budget — see §9.3. Template B in §7 is built
to 1747.5 per column and is therefore 90 pt taller than Template A.

**Merged ranges** (46, ENG)
```
title    B2:AB2
header   B3:C4  D3:F4  G3:G4  H3:J4  K3:K4  L3:O4  P3:Q4  R3:S4  T3:T4
team     B5:C7  D5:E5  F5:G5  J5:K5  N5:O5  R5:S5  T5:T7
         F6:G6  J6:K6  N6:O6  R6:S6  F7:G7  J7:K7  N7:O7  R7:S7
plan     U6:U7  V6:V7  W6:W7  X6:X7  Y6:Y7  Z6:Z7  AA6:AA7  AB6:AB7
blocks   B8:O8   P8:AB8   B23:O23  P23:AB23  P37:AB37  P56:AB56  B58:O58  B59:O59
footer   J60:M60  N60:Q60  R60:T60  U60:X60  Y60:AA60
```

**Typography and fills**
```
Font           Tahoma throughout (one stray Calibri at B59 — a defect, normalize to Tahoma)
Title          20 pt bold, medium border box
Field labels   18 pt bold, fill C0C0C0 (grey)
Field values   12 pt bold, centered
Loss-type      14 pt bold label, 11 pt category cells, "X" marks the selection
Block headers  18 pt bold, left/bottom aligned, wrap on
Body cells     14 pt regular
Footer labels  14 pt bold, 12 pt for the date cell
```

Block header fills encode PDCA:

| Block | Fill | Text | PDCA |
|---|---|---|---|
| Steps 1, 2, 3, 4 | `FFFF0000` red | white | Plan |
| Step 5 | `FFFFFF00` yellow | black | Do |
| Step 6 | `FF00CCFF` cyan | black | Check |
| Step 7 | `FF008000` green | black | Act |

Borders: `medium` on the outer frame and block edges, `thick` on the left edge of column P
(the Plan/Do column divider), `thin` inside the loss-type and team grids.

## 4. Header and footer fields

**Header band, rows 2–7**
```
B2:AB2   title
B3 Champion        → D3:F4       G3 Kaizen No       → H3:J4
K3 Issue Definition→ L3:O4       P3 Department      → R3:S4
T3 Lostness Type   → U3:AA3 categories, row 4 = X marks
         Work Safety · Costing · Productivity · Quality
         Maintenance · Human Resources · Environment
B5 Work Team       → 8 slots, each Badge Number + Name Surname
                     numbered 1–8 at D6 D7 H6 H7 L6 L7 P6 P7
T5 Work Plan       → U5:AB5 = 1st…7th Step + Briefing, dates in U6:AB7
```

The Work Plan strip is a compact 8-column Gantt for the project itself. It is a good idea
and most A3 templates lack it — keep it.

**Footer band, rows 60–63**
```
B60 BENEFIT    F60 COST    J60:M60 REALIZED INCOME    N60:Q60 BENEFIT / COST
R60:T60 CHAMPION APPROVAL   U60:X60 DEPARTMENT MNG/TEAM LEADER APPROVAL
Y60:AA60 QUALITY MNG/TEAM LEADER APPROVAL   AB60 APPROVAL DATE
```

TR footer is `ONAY 1 / ONAY 2 / MÜD-YÖN. ONAYI / ONAY TARİHİ` — three approvals rather than
named roles. Template A should carry both label sets under the same geometry.

## 5. Supporting forms — port these into the app

**`Problem Tanımlama Formu` — 5G + 5N1K.** The strongest part of the whole workbook and
more rigorous than most Western A3 practice. Wire it into Step 1 as a method plugin:

```
5G   GEMBA      Did you go to where the problem is?
     GEMBUTSU   Did you see the defect? Compare good vs bad part / process / structure?
                Did you talk to the operators?
     GENJITSU   Was the problem examined in detail — occurrence mode, count, frequency?
     GENRI      Were the standards and norms reviewed?
     GENSOKU    Were the process standards reviewed?

5N1K NE         What is the real problem?
     NEREDE     Where detected (line / machine / area)? Where on the part?
     NASIL      How does it occur? Effect of material, equipment, person, method, environment?
     NE ZAMAN   When? Effect of shift, temperature, set-up?
     NE KADAR   Frequency? Intermittent or continuous? Loss in €?
     KİM        Who detected it? Which shift? Is it person-dependent?
```

**`Problem Bildirim Formu` — intake.** Problem, reporter (unit / name / shift), defect
frequency, loss (type / amount €), description, photo. This is the app's New Project
dialog. Prefill Step 1 from it.

**`Onay formu` — benefit calculation.** Gain categories with € amounts: standard time,
lost direct labour, indirect labour, energy, auxiliary material, direct material, scrap
loss → total gain, implementation cost, **B/C ratio**. Plus the 8-member team roster and
two approval signatures.

This is a genuinely good financial spine and most A3 tools have nothing like it. Model it
as a first-class `BenefitCase` object on the project, feeding the A3 footer automatically.
The € figures are the reason management signs these off.

## 6. Honest assessment — what to keep and what to fix

**Keep, unchanged:**
- The 59/41 column split and PDCA colour coding
- The TPM loss-type taxonomy in the header (Safety, Cost, Productivity, Quality,
  Maintenance, HR, Environment) — better than the generic SQDCM in `SPEC.md` §1.3;
  replace SQDCM with this
- The Work Plan Gantt strip
- The benefit / cost / B-C ratio footer and approval signatures
- 5G + 5N1K — promote it to the recommended default method for Step 1
- The 8-slot team roster

**Fix — these are real methodological gaps, not style preferences:**

1. **Target gets 9.3 % of the left column, jammed into the bottom-left corner.** This is
   the single biggest weakness. Step 3 is the step that separates the Toyota model from
   the Kaizen model and it is treated here as a footnote. In practice a target written in
   a 153 pt box is a slogan, not a SMART commitment.

2. **Countermeasure development and implementation are merged.** Toyota separates them
   deliberately, because the dominant failure mode in problem solving is jumping straight
   to doing. One combined block invites exactly that.

3. **No containment / ICA anywhere.** For a customer complaint under IATF this is not
   optional — you must record what protected the customer while you investigated, and when
   it was removed. There is no cell for it.

4. **No root-cause verification.** Nothing in the form asks "how did you prove this is the
   cause?" A fishbone pasted as an image satisfies the form completely. This is the gap an
   auditor opens first.

5. **No occurrence / detection / systemic split.** Customer 8Ds require all three legs.

6. **Step 6 checks results only** (the TR label says "Sonuçların Kontrolü" while the ENG
   says "Monitor Results and Process" — the TR version dropped the process half). Process
   confirmation is a separate discipline: was the countermeasure actually executed as
   designed, verified at the gemba?

7. **No document-update checklist and no read-across matrix.** Step 7 says "dissemination"
   but gives no structure for it, so in practice it gets a sentence. PFMEA and Control Plan
   updates — the IATF linkage — have nowhere to live.

8. **The grid is sized for pasted images.** At ~41 % print scale, typed text is ~5.7 pt on
   paper. Fine for its original purpose; a trap for an app that generates text.

9. Minor: one Calibri cell at B59 among all-Tahoma; TR/ENG row offset by one; TR loss
   categories differ from ENG (TR splits maintenance into Bağımsız/Profesyonel Bakım).
   Normalize all three in the app's template definitions.

## 6b. Template A′ — 7 blocks, 8 disciplines

The cheapest way to get most of the 8-step benefit at zero organisational cost. Identical
to Template A in every measurable respect — same grid, same merges, same colours, same
numbering, same approval chain, same document an auditor already recognises — except that
the STEP 5 block is divided internally into two labelled sub-bands:

```
STEP 5: KARŞI ÖNLEMLERİN BELİRLENMESİ VE İYİLEŞTİRME FAALİYETLERİNİN PLANLANMASI
├─ 5a  Karşı önlem seçimi     app-step 5   root cause → option → why this one
└─ 5b  Uygulama                app-step 6   who · what · when · status · evidence
```

Sub-band labels are 12 pt bold on a light tint of the parent block's fill, not full block
headers, so the printed form still reads as seven steps.

**Why this exists.** Merging app-steps 5 and 6 has a measurable cost in Template A: the
combined block gets 420 pt while step 6 (results) gets 570 pt, so *deciding and doing*
together occupy less of the sheet than *checking*. That is backwards, and it happens
because two jobs were given one box. In practice the concrete job (the action table) fills
the box and the abstract one (why this countermeasure and not another) never gets written.
The sub-band forces both without changing the form.

**Recommend A′ as the default over A** once the fidelity test on A passes. Offer B to teams
willing to re-approve the document.

**A note on the "no room for 8 blocks" objection:** it does not hold. An eighth block costs
one 30 pt header row out of a 1747.5 pt column budget — 1.8%. If Template B is rejected it
should be for the retraining and re-approval cost, not for page space.

## 7. Template B — the proposed 8-step variant

Not a replacement. A second template the user picks per project, for cases that need the
full automotive discipline — customer complaints, 8D-linked issues, safety and recall
topics. Same page setup, same column grid, same header and footer, same 1747.5 pt block
budget per column, so both templates print identically and feel like the same family.

| Block | Columns | Height | vs Template A |
|---|---|---|---|
| 1 Clarify the Problem + **Containment (ICA)** | B:O | 450 pt | +30, ICA strip added |
| 2 Break Down / Current Condition | B:O | 900 pt | −184 |
| 3 **Set a Target** | B:O | 397.5 pt | **+244, from 9 % to 23 % of the column** |
| 4 Root Cause Analysis + **verification table** | P:AB | 510 pt | +90 |
| 5 Develop Countermeasures | P:AB | 360 pt | split from A's step 5 |
| 6 Implementation | P:AB | 330 pt | split from A's step 5 |
| 7 Results **and Process Confirmation** | P:AB | 300 pt | −240, split into two sub-blocks |
| 8 Standardize · Sustain · **Yokoten** | P:AB | 247.5 pt | −30, three sub-blocks |

Step 4's block carries a small verification strip: *cause · how verified · evidence ·
confirmed / rejected*. Step 8's block splits into *documents updated (PFMEA, Control Plan,
SOP, WI) · sustain plan · read-across*. Step 7 splits into *result* and *process*.

Colour coding extends the existing scheme: blocks 1–4 red (Plan), 5–6 yellow (Do), 7 cyan
(Check), 8 green (Act).

## 8. Template system

Templates are data, not code.

```ts
type A3Template = {
  id: string                       // 'farplas-7step-en' | 'farplas-7step-tr' | 'pps-8step-auto'
  name: string
  language: 'tr' | 'en' | 'bilingual'
  pageSetup: PageSetup
  columns: { key: string; width: number }[]
  rows: { index: number; height: number }[]
  blocks: {
    appSteps: StepId[]             // [5, 6] for Template A's merged block
    label: { tr: string; en: string }
    range: CellRange
    headerFill: string
    contentBudgetPt: number
  }[]
  headerFields: FieldDef[]
  footerFields: FieldDef[]
  merges: string[]
  styles: NamedStyle[]
}
```

Ship four at launch:

| id | Blocks | Disciplines enforced | Organisational cost |
|---|---|---|---|
| `farplas-7step-tr` | 7 | 7 | none — byte-faithful to the approved form |
| `farplas-7step-en` | 7 | 7 | none |
| `farplas-7step-plus` (A′) | 7 | 8 | none — sub-bands inside the STEP 5 block |
| `pps-8step-auto` (B) | 8 | 8 + ICA, verification, yokoten | re-approval, retraining |

The user picks one when creating a project and can switch later — content is preserved
because it lives in the model, not the template. Switching from B to A merges app-steps 5
and 6 into one block and warns about anything that will land in an appendix instead.
Switching to A′ never loses anything, since it holds the same eight app-steps as B.

**Default is `farplas-7step-tr` until the fidelity test passes, then `farplas-7step-plus`.**
The company standard wins. An app that outputs a non-standard A3 does not get adopted,
however much better the non-standard one is — but A′ is not non-standard, it is the
standard form with its step 5 box divided in two.

### Deciding whether Template B is worth its cost

Do not settle this by argument. Run three or four real projects on A or A′ and read the
STEP 5 block: does it contain countermeasure *selection reasoning* — options considered,
position on the error-proofing hierarchy, why this one — or only an action table with
owners and dates? If only the table, the merge is costing the plant real method quality and
there is a concrete, local case for B. That argument will land with management in a way
that "the Toyota standard has eight steps" will not.

---

---

## 9. Source verification — 2026-08-01

Verified directly against `PPS_A3_Format_ENG.xls` and `PPS_A3_Format_TR.xls` (BIFF8, OLE2,
cp1254, created 2010-02-16). Method: `xlrd` 2.0.2 for cells, styles, merges, `COLINFO` and
`ROW` records; raw BIFF record walk over the `Workbook` stream for `SETUP`, `WSBOOL` and the
four margin records, which `xlrd` does not expose. The walker was self-tested against an
embedded well-formed and truncated record before any real file was opened.

**Corrections from this pass have been applied in place in §3.** This section records what
was checked, what held, and what did not.

### 9.1 Confirmed against the files

| Item | Result |
|---|---|
| Merged ranges | **46 in both files**, and the ENG list in §3 matches range-for-range |
| Row heights (ENG) | exact: 7.2 · 38.55 · 20.1×5 · 30×49 · 93.75 · 30 · 153.75 · 18 · 17.4 · 18 · 18 |
| Block map | ENG step headers at rows 8, 8, 23, 23, 37, 56, 58 — exactly as stated |
| Block heights | 420 · 1083.75 · 153.75 · 420 · 390 · 540 · 277.5 — all seven exact |
| PDCA header fills | **all four confirmed**: steps 1–4 `FF0000` red on white; step 5 `FFFF00`; step 6 `00CCFF`; step 7 `008000` |
| Typography | Tahoma throughout; title 20 pt bold; block headers 18 pt bold |
| Paper / orientation / fit | paper code 8 (A3), landscape, `fitToPage` true, fitWidth 1, fitHeight 1 |
| Workbook structure | ENG 9 sheets, TR 11 sheets — the §2 table is correct, including the three TR-only forms |
| Footer labels | ENG `BENEFIT · COST · REALIZIED INCOME · BENEFIT / COST · CHAMPION APPROVAL · …`; TR `KAZANÇ · MALİYET · GERÇEKLEŞEN GETİRİ · ONAY 1 · ONAY 2 · MÜD/YÖN. ONAYI · ONAY TARİHİ` — both as stated (`REALIZIED` is a typo in the source; preserve or fix deliberately) |
| Content height | ENG print area rows 2–63 = **1957.95 pt**; TR rows 1–62 = **1958.75 pt** |

### 9.2 Correction — column widths, and the 59/41 split does not exist

**Root cause: a parser bug in the original analysis.** A BIFF `COLINFO` record covers a
*range* of columns. The original pass applied each record's width to its **first** column
only and let the remainder fall back to the 8.43 default. The raw records:

```
B..C  20.78      →  analysis had B 20.77, C 8.43
F..G  22.66      →  analysis had F 22.66, G 8.43
R..S  22.66      →  analysis had R 22.66, S 8.43
U..AB 20.66      →  analysis had U 20.66, V–AB 8.43
```

Every 8.43 in the original width table sits at exactly the second-or-later column of a
multi-column record. No other value was affected beyond ±0.02 rounding.

**Consequence:** left **256.41** / right **259.48** → **49.7 % / 50.3 %** (TR: 256.05 /
259.20, same ratio). The form is **balanced**; the right column is fractionally the wider.

This retires the "59 % Plan / 41 % Do-Check-Act, deliberate, matches Toyota practice"
reading in §3 and §6, and contradicts `SPEC.md` §3.1, which instructs *"Do not 'balance' the
columns."* **`SPEC.md` §3.1 must be corrected** — building to 59/41 would fail the Phase 4
fidelity test on column geometry.

### 9.3 Correction — 1747.5 pt is not in either file

Confirmed from the verified row heights: left **1657.5 pt**, right **1627.5 pt**, unequal by
30 pt. §7's Template B is cut to 1747.5 pt per column and is therefore **90 pt taller than
Template A**, which changes the fit-to-page scale. §7's "both templates print identically
and feel like the same family" does not hold as specified.

### 9.4 Correction — print setup

| Field | Was | Verified |
|---|---|---|
| bottom margin | 0.3153 in | **0.1969 in** — margins are 6 / 6 / 5 / 5 mm |
| top margin | 0.1965 in | 0.1969 in |
| left / right | 0.2361 in | 0.2362 in |
| stored `scale` | 100 | **40** (ignored while `fitToPage` is on) |

Printable height is therefore 297 − 10 mm = **813.5 pt**, not 805. Forced scale =
813.5 / 1958 = **41.5 %**. The conclusion is unchanged: body text at 14 pt prints at about
**5.8 pt**. The stored 40 % corroborates it — someone had set that scale by hand.

### 9.5 Correction — TR is not merely ENG offset by one row

§3 stated TR is "the same template with a one-row offset" and gave only the ENG row table.
The block-header offset holds (TR rows 7, 7, 22, 22, 36, 55, 57 = ENG − 1), but the heights
differ:

```
ENG  1: 7.2 (spacer)  2: 38.55  3–7: 20.10  …  60: 18.0  61: 17.40  62–63: 18.0
TR   (no spacer)      1: 38.50  2–6: 20.15  …  59: 18.0  60: 17.50  61: 18.5  62: 18.0
```

TR has **no spacer row**; its title band is row 1. Header rows are 20.15 not 20.10, and the
footer differs. **TR needs its own row table in the template definition** — reusing ENG's
with an offset will drift by ~0.8 pt over the sheet.

### 9.6 Resolved — the loss-type mismatch is real, and §4 described only ENG

| | Cells | Count | Categories |
|---|---|---|---|
| ENG | `U3:AA3` | **7** | Work Safety · Costing · Productivity · Quality · Maintenance · Human Resources · Environment |
| TR | `U2:AB2` | **8** | İş Güvenliği · Maliyet · Verimlilik · Kalite · **Bağı. Bakım** · **Prof. Bakım** · İnsan Kayn. · Çevre |

§6 item 9 was right that TR splits maintenance; §4's `U3:AA3` was right for ENG only. Both
statements were correct about different files, and the document conflated them. This also
answers the ENG `AB3` question from the earlier audit: **it is empty**, because ENG has one
category fewer than the eight columns the Work Plan strip uses.

The Work Plan strip is 8 cells in both (`U:AB`): ENG `1st…7th Step` + `Briefing`,
TR `1.Adım…7.Adım` + `Sunum`.

**For the template definitions:** the loss taxonomy is a **per-template list**, not a shared
constant. `farplas-7step-en` has 7 entries, `farplas-7step-tr` has 8. A single hardcoded
taxonomy will silently corrupt one of the two.

### 9.7 Header field labels — TR, previously unrecorded

```
B2 Sorumlu   G2 Kaizen No   K2 Konu   P2 Müdürlük   T2 Kayıp Cinsi
B4 Çalışma Ekibi   D4/I4/M4/Q4 Sicil   F4/J4/N4/R4 Ad Soyad   T4 Çalışma Planı
```

### 9.8 Still unverified

- The stray Calibri cell reported at ENG `B59` was not re-checked.
- Embedded instruction images on the `STEP-1`…`STEP-7` sheets were not extracted.
- Conditional formatting and data validation rules were not inspected.

---

## 10. Candidate template — `PPS_A3_Format_Examp_FINAL.xlsx`, verified 2026-08-05

Supplied by Barış mid-session during Phase 6c and deferred to its own clean session (Anayasa
Madde 4). Verified with the same discipline as §9: geometry read from the file's own records,
never eyeballed. The `.xlsx` equivalent of §9's `COLINFO`/`ROW` walk is the OOXML
`<cols>`/`<row ht>`/`<mergeCells>`/`<pageSetup>` elements plus the `xl/drawings` anchor tree.

**Method and its self-test.** A `<col>` record carries `min`/`max` and covers a **range** —
the exact shape of the parser bug §9.2 caught, which invented the phantom 59/41 split by
applying each record to its first column only. The reader used here expands `min..max` and
was self-tested against a synthetic fixture (8/8, including that range case, a default
fallback, and hidden rows/columns counting as 0) **before the real file was opened**, per
Anayasa §4's "the scanner itself must be verified — 'clean' is the most dangerous output."
Column widths are converted to points with the exact Excel formula
`px = int(((256·w + int(128/MDW))/256)·MDW)`, `MDW = 7`, `pt = px · 0.75` — not the raw
character-unit sums §3 used. Re-running that conversion over §3's corrected ENG/TR width
tables reproduces **49.6 / 50.4** (ENG) and **49.7 / 50.3** (TR): **D-35 is confirmed a
second time, by a second method.**

### 10.1 What the file actually is

**A completed A3, not a blank form.** Sheet `TBP` (Toyota Business Practice) carries a real
Farplas project — scrap-rate reduction on moulds EK-5188/EK-5492. The other 15 sheets are its
working data (machine/mould stoppage breakdowns, `karşı önlem`, `FireNedenleri`, `Hedef`), two
of them very large (7 MB and 36 MB of XML) and hidden.

**It is a canvas, not a cell grid** — the same finding `docs/02_REAL_WORLD_FINDINGS.md`
records for the five real company A3s, one layer more extreme:

| | Template A (`PPS_A3_Format_TR/ENG.xls`) | Candidate (`TBP`) |
|---|---|---|
| Merged ranges | 46 | **8** |
| Non-empty cells on the A3 sheet | full form | **20** |
| Floating drawing objects | few | **107** |

Nothing in it is a reusable blank. The block *geometry* is derivable (the bands are
column-aligned and the rows are regular); the *content* is not — it is 107 hand-placed shapes.

### 10.2 Measured geometry

`Print_Area = TBP!$A$3:$AN$97`. Blocks located from the step-header shape anchors, not by eye:

| Band | Columns | Width | Blocks |
|---|---|---|---|
| 1 | C:O | 614.25 pt — **36.4 %** | Adım 1, Adım 2, Adım 3 |
| 2 | P:Z | 604.50 pt — **35.8 %** | Adım 4, **Adım 5-6** |
| 3 | AA:AM | 469.50 pt — **27.8 %** | Adım 7, Adım 8 |

Each band's content height is **exactly 1301.25 pt** — a disciplined three-band grid. But the
bands are **not** equal in width: band 3 is ~145 pt narrower than band 1.

**Block shares of their own band**, against §3's Template A figures for the same measure:

| Block | Candidate | Template A equivalent |
|---|---|---|
| Adım 1 | 451.50 pt — 34.7 % | 420 pt — 25.3 % |
| Adım 2 | 456.75 pt — 35.1 % | 1083.75 pt — 65.4 % |
| **Adım 3 (Hedef)** | **393.00 pt — 30.2 %** | **153.75 pt — 9.3 %** |
| Adım 4 | 594.75 pt — 45.7 % | 420 pt — 25.8 % |
| Adım 5-6 | 706.50 pt — 54.3 % | 390 pt — 24.0 % |
| Adım 7 | 837.00 pt — 64.3 % | 540 pt — 33.2 % |
| Adım 8 | 464.25 pt — 35.7 % | 277.5 pt — 17.1 % |

**§6's number-one criticism is fixed here.** §6 called Step 3's 9.3 % "the single biggest
weakness … a target written in a 153 pt box is a slogan, not a SMART commitment." The
candidate gives Target **30.2 %** of its band — and at **393 pt** it lands within 4.5 pt of
the **397.5 pt** §7 proposed for Template B, derived independently. That is real corroborating
evidence for §7's Step 3 budget.

**It is 7 blocks for 8 steps, not 8 blocks.** The block is labelled `Adım 5-6: Karşı Önlem
Geliştirme & Aksiyon Planı Uygulama` — develop and implement are still merged, exactly as in
Template A. Eight steps are *numbered*, seven blocks are *printed*. That is §6b's
**Template A′ / `farplas-7step-plus`** — "seven printed blocks, eight disciplines" — realised
by the company itself, without §6b's 5a/5b sub-bands.

### 10.3 The three-column question — measured, not argued

Fold axis (the physical middle of the sheet; `printOptions horizontalCentered="1"`, all
margins 0, so the print area's midpoint *is* the page's midpoint) sits at **x = 874.88 pt**.
That is **232 pt inside band 2**. Folding the sheet in half cuts through four objects:

- `Adım 4: Kök Neden Analizi` block header
- `Adım 5-6: Karşı Önlem…` block header
- the root-cause SmartArt diagram (`graphicFrame`, x 642.6 → 1224.4)
- the title (expected — titles span the sheet in any template)

For comparison, Template A's fold axis misses its column divider by **9.75 pt out of 2712**
(0.36 %) — for practical purposes it lands exactly on the divider.

Only **one** vertical rule is drawn on the candidate, at x = 642.8 (the band 1 | band 2
boundary). There is **no** rule at the band 2 | band 3 boundary.

Band 3 is **not** a separate approval or annex strip — it carries Adım 7 and Adım 8 as full
content blocks. It is a genuine third content column.

**Why three columns exist, and what reducing them costs.** It is a trade, not a defect:

| | Candidate | Template A ENG |
|---|---|---|
| Authored content | 1749.75 × 1392 pt | 2712 × 1958 pt |
| Fit-to-page scale | **60.5 %** | 41.6 % |
| 11 pt authored prints at | **6.65 pt** | 4.57 pt |
| D-40's 8 pt printed floor needs | ≥ **13.2 pt** authored | ≥ 19.3 pt authored |

The stored `scale="60"` corroborates the computed 60.5 %, exactly as §9.4's stored 40 %
corroborated Template A's 41.5 %. More columns means shorter columns means a larger print
scale: reflowing the same content into two columns at a fixed page roughly multiplies column
height by 1.5 and returns the scale to ~41 % — losing the one measurable thing that makes this
file better. Merging bands 2+3 instead gives 36/64, nowhere near any balance.

### 10.4 What the candidate loses

- **No header identity band on the A3.** No Sorumlu, Kaizen No, Konu, Müdürlük, **Kayıp Cinsi**
  (the TPM loss taxonomy D-36 locks as a per-template list), 8-slot Çalışma Ekibi, or Çalışma
  Planı Gantt strip. The header band rows carry the title and nothing else.
- **No footer band on the A3.** No benefit / cost / B-C ratio, no approval signatures, no
  approval date. `SPEC.md` §3.0 instructs porting these; §5 calls the financial spine "the
  reason management signs these off."
- The workbook does carry identity and approval data — on a **separate A4-portrait sheet**
  (`head`, `paperSize="9"`, outside the print area): Şirket Adı / İsim Soyisim / Görev, an
  English project title, and a **Süpervizör · Mentör · Hazırlayan** row with roles
  (COO · T1 Fabrika Müdürü · Teknik Tkm Yön.) and a Rev. Date. Note the *mentor* — a genuine
  TBP practice Template A has no field for. There is no financial data anywhere in the file.
- **10 leftover objects from a different, English OEE A3** (Farplas Group & Supplied Toyota
  locations, `OEE = Availability * Performance * Quality`, Year-to-Date OEE, Risk Points) are
  parked in the hidden zero-width columns past the print area. Dead weight carried in the file.
- Printed body text is still **below D-40's floor** (6.05–6.65 pt against 8 pt) — ~15 % better
  than Template A, not a solution.

### 10.5 Correction to §9.3 / D-27 — 1747.5 pt **is** in the files

§9.3 states "the figure 1747.5 appears in no file and is not a budget," and D-27 blocks
Template B's geometry on that basis. Recomputed from §9.1's own verified ENG row heights:

```
rows 8..56  49 × 30.00 = 1470.00
row  57                =   93.75
row  58                =   30.00
row  59                =  153.75
                         ─────────
rows 8..59             = 1747.50 pt      ← the full block band, block header rows included
  less left  column's 3 block headers × 30 =  90 → 1657.50   (§3's left  figure)
  less right column's 4 block headers × 30 = 120 → 1627.50   (§3's right figure)
```

**1747.5 is the gross band height; 1657.5 / 1627.5 are net of block headers.** §9.3 compared a
gross figure against two net ones and read the difference as an error. §7's "same 1747.5 pt
block budget per column" is therefore *correct as stated*, and D-27's stated reason for
blocking Template B does not hold. Template B may still need re-cutting — but not for this
reason. **D-27's rationale is superseded by D-147; the block itself is lifted.**

### 10.6 Decisions taken from this evaluation (2026-08-05, Barış)

1. **D-95's ordering is respected.** The candidate is recorded here as a verified geometry
   source. No template file is authored this session; the default stays `farplas-7step-tr`.
2. **Two columns, not three** (D-145). The candidate's three-band geometry is evidence for the
   *block budget*, not the column count.
3. **Exact A3 fit is now a first-class constraint** (D-146) — see §10.7. Margins are 5 pt on
   all four sides, equal.
4. **No header or footer band for now** (D-148). The A3 is blocks only; a header/footer band
   is added later if it proves needed. This supersedes `SPEC.md` §3.0's "port the header and
   the benefit/cost footer" as a Phase-11 default, without deleting the underlying data model.

### 10.7 The A3-exact page contract — derived, for whichever phase authors the template

This is the binding arithmetic, not a sketch.

```
A3 landscape                 1190.551 × 841.890 pt   (420 × 297 mm)
margins, all four sides             5 pt
printed content area         1180.551 × 831.890 pt
required aspect ratio             1.419120
```

Excel quantises column widths to whole pixels (0.75 pt) and row heights to 1/20 pt (0.05 pt).
Under that quantisation the closest **1:1** canvas is:

```
authored canvas              1180.50 × 831.85 pt   (1574 px of column width)
achieved aspect                   1.419126   (error 0.000006)
fit-to-page scale                 100.004 %
column split, D-35's 49.7/50.3    left 586.50 pt  |  right 594.00 pt
fold axis                         590.25 pt — 3.75 pt from the divider (0.3 %)
block band height                 831.85 pt per column (no header/footer band)
```

**The consequence that matters most: authored pt == printed pt.** D-40's legibility floor
collapses from "≥ 19.3 pt authored for an 8 pt printed floor" to **≥ 8 pt authored**. The A3
stops being a 2.4×-oversized canvas that shrinks to 41 %, and becomes a real-size page. The
cost is that the sheet is now genuinely small in authored units — 1180 × 832 pt against
Template A's 2712 × 1958 — so how much content a block can hold becomes a hard geometric
limit rather than a styling preference. That limit is a **product** question (which methods,
how many entries per step), which is why it is coupled to the interface work Barış opened at
the end of this session.

At 10 pt margins the same arithmetic gives 1170.75 × 822.05 pt and 2.1 % less printed area;
5 pt was chosen for the extra room.

### 10.8 Still unverified / open

- Cell **styles** on the candidate (fills, borders, fonts per style id) were not inventoried;
  only the font *table* and the drawing text sizes were read. Its PDCA colour coding was not
  checked against §3's `FF0000` / `FFFF00` / `00CCFF` / `008000`.
- The two large hidden data sheets (7 MB, 36 MB) were not opened.
- Whether the company has a **blank** version of this format — this file is a completed
  example ("Examp"), and a blank would be a better source than a filled one.
- Whether the 8.3 MB file should stay in the repo at full size once the geometry is recorded
  here (62 MB uncompressed, mostly embedded photos and two data sheets).

---

## 11. **REFERANS FORMAT** — `PPS_A3_Problem_Solving_Template_Rev00.xlsx`, verified 2026-08-05

**This is the format the application is built on.** Barış designated it as the reference for
all further work, superseding §10's candidate (`PPS_A3_Format_Examp_FINAL.xlsx`) and displacing
the Farplas `.xls` forms of §3 from the design-target role — those remain the record of the
*existing company form*, not the target. Verified with the same method as §9/§10: OOXML
`<cols>`/`<row ht>`/`<mergeCells>`/`<pageSetup>` read directly, parser self-tested 8/8 before
the file was opened.

**Finally a real blank form.** 50 KB, no embedded photos, no leftover objects, no hidden data
sheets — the opposite of §10's 8.3 MB filled example. **It is a cell grid, not a canvas:**
136 merged ranges, 279 populated cells, 0 floating shapes. That matters architecturally: §8's
`A3Template` type (columns, rows, blocks with `CellRange`, merges, styles) can be transcribed
from it directly, which was impossible for §10's 107-shape canvas.

Workbook: `A3 Summary` (the report, `Print_Area = $A$1:$Y$45`) plus six per-step working sheets
(`Problem Definition`, `Data Analysis`, `Root Cause Analysis`, `Action Plan`,
`Effectiveness Check`, `Lessons Learned`) and `Lists & Settings`.

### 11.1 The three claims, tested

| Claim | Verdict |
|---|---|
| 8 adımlı | ✅ **True.** Eight numbered step blocks, `ADIM 1`…`ADIM 8`, Turkish throughout |
| Ortadan katlanabilir | ✅ **True, and exactly** — see 11.2 |
| A3 kağıda tam oturur | ❌ **Not as delivered** — 150.48 pt of horizontal slack, see 11.4 |

### 11.2 Column geometry — the fold is exact

```
A..L   12 columns × 41.25 pt = 495.00 pt     left half
M       1 column               9.75 pt       divider — labelled "KAT" in M3
N..Y   12 columns × 41.25 pt = 495.00 pt     right half
                              ─────────
total A..Y                     999.75 pt
```

The split is **exactly 50.0 / 50.0** — not §3's 49.7/50.3, and deliberately so: the divider is
its own column and the sheet's midpoint is **499.875 pt**, which is the **exact centre of
column M** (M spans 495.00 → 504.75). Folding the sheet in half lands precisely on the gutter.
The template's own author named the column `KAT`. This is the property §10's candidate failed
by 232 pt, and it is what D-145 chose two columns to preserve.

### 11.3 Row geometry and block budget

45 rows, **789.00 pt** total. Both columns share the title band, the case-information band and
the approval band; the eight step blocks divide the middle.

| Band | Rows | Height | Spans |
|---|---|---|---|
| Title | 1–2 | 32 pt | both |
| `VAKA BİLGİLERİ` / header fields | 3–6 | 71 pt | both |
| Step blocks | 7–42 | **644 pt** | split L/R |
| `Hazırlayan · Kontrol Eden · Onaylayan · İmza · Tarih` | 43–45 | 42 pt | both |

**Left column (A:L) — 3 blocks · Right column (N:Y) — 5 blocks**, 644 pt of block area each:

| Block | Rows | Height | % of block area |
|---|---|---|---|
| ADIM 1 — Problemi netleştirin | 7–15 | 162 pt | 25.2 % |
| ADIM 2 — Problemi parçalara ayırın | 16–36 | 383 pt | **59.5 %** |
| ADIM 3 — Hedef belirleyin | 37–42 | 99 pt | 15.4 % |
| ADIM 4 — Kök nedeni analiz edin | 7–20 | 252 pt | 39.1 % |
| ADIM 5 — Uygulama planı | 21–26 | 108 pt | 16.8 % |
| ADIM 6 — Çözümleri uygulama | 27–32 | 113 pt | 17.5 % |
| ADIM 7 — Sonuçları izleme | 33–38 | 108 pt | 16.8 % |
| ADIM 8 — Standardizasyon / kurumsallaştırma | 39–42 | 63 pt | 9.8 % |

**Header fields** (rows 4–5): PPS ID · Problem Başlığı · Problem Sahibi · Müşteri/Tesis ·
Hat/Makine · Öncelik · Bölüm · Parça/Proses · Açılış Tarihi · Revizyon · Hedef Kapanış ·
Genel RAG. **This restores a header identity band and an approval footer** — D-148 deferred
both because §10's candidate had neither; this format has both, so D-148 is superseded (D-153).
Note what is *not* here relative to §3: no TPM `Kayıp Cinsi` taxonomy (D-36), no 8-slot team
roster, no Work-Plan Gantt strip, and no benefit/cost/B-C financial footer.

**Two budget observations for Oturum A, both measurable, neither fatal:**

- **ADIM 2 takes 59.5 %** of its column — the same over-allocation §6 criticised in Template A
  (65.4 %), and the same shape §10's candidate had corrected to 35.1 %.
- **ADIM 8 gets 63 pt** — four rows for standardisation, read-across and yokoten, the block
  §6 item 7 already called under-structured.

### 11.4 The A3 fit gap — measured, and it cannot be fixed with margins

```
page setup   paperSize 8 (A3), landscape, fitToPage 1, autoPageBreaks 0, no explicit scale
margins      0.28 in = 20.16 pt on all four sides;  horizontallyCentered + verticallyCentered
printable    1150.23 × 801.57 pt        aspect 1.43497
content       999.75 × 789.00 pt        aspect 1.26711
```

Excel's fit-to-page **only shrinks** — it never enlarges — so the effective scale is 100 %, and
the sheet prints as authored. Centred on the page that leaves:

```
horizontal slack 150.48 pt      vertical slack 12.57 pt
printed margins  left/right ≈ 95.4 pt (33.7 mm)   top/bottom ≈ 26.4 pt (9.3 mm)
```

**3.6× more margin on the sides than top and bottom.** The sheet fills the height and floats in
the width.

**No choice of equal margins can correct this.** With equal margins `m`, the printable aspect is
`(1190.55−2m)/(841.89−2m)`, which is minimised at **1.4141** when `m = 0` and grows from there.
The content's 1.26711 is below that floor, so the fix must widen the content, not adjust the
page. Keeping all 45 row heights and the fold symmetry, widening the 24 content columns from
41.25 pt to **46.50 pt** (62 px) reaches aspect ≈ 1.4325 with the divider re-cut to suit; the
fold stays exactly on the divider's midpoint by construction, because both halves grow equally.
**The exact final grid is Oturum A's deliverable, not this document's** — §11 states the
constraint and the measurement; Oturum A cuts the numbers.

### 11.5 What carries over from §10, and what does not

- **D-146's 1:1 authoring principle is confirmed by this file**: 789 pt of content against
  801.57 pt of printable height is authored essentially at real size, not the 2.4×-oversized,
  shrink-to-41 % canvas of §3. Authored pt ≈ printed pt, so D-40's legibility floor stays at
  **≥ 8 pt authored**, not 19.3.
- **D-146's specific 5 pt margin figure is not what this file uses** (it uses 20.16 pt). Which
  margin wins is an Oturum A decision; §11.4 shows the aspect fix is required either way.
- §10 (the `Examp` candidate) is retained as evidence — its Step-3 budget finding and its
  §10.5 correction to D-27 stand — but it is **no longer the design target**.

### 11.6 Open

- **P-29** — is `Rev00` an *approved company form*, or an ideal target we are designing to?
  D-10's rationale for defaulting to the Farplas form is adoption ("an app that outputs a
  non-standard A3 does not get adopted"). The title reads `OTOMOTİV PPS`, not Farplas-branded,
  and the header field set differs from §3's. This changes what `farplas-7step-tr` is *for*.
- Cell styles, fills, borders and fonts were not inventoried this pass — only geometry, merges,
  text and page setup. PDCA colour coding not checked.
- The six per-step working sheets and `Lists & Settings` were not analysed; they likely define
  the per-step data model and the dropdown vocabularies, which is direct input to Oturum B.

---

## 12. **SAYFA SÖZLEŞMESİ** — Oturum A çıktısı, 2026-08-05

D-149'un dört oturumundan ilki. §11 kısıtı ve ölçümü koydu; bu bölüm sayıları keser.
Oturum B (adım sayfası anatomisi) buradaki kapasite tablosunu girdi olarak alır.

**Yöntem:** §9/§11 ile aynı. `xl/worksheets/sheet1.xml` OOXML kayıtları (`<cols>`,
`<row ht>`, `<mergeCells>`, `<sheetFormatPr>`, `<sheetPr><pageSetUpPr>`, `<pageSetup>`,
`<pageMargins>`, `<printOptions>`) doğrudan okundu; parser gerçek dosya açılmadan önce
**20/20 sabit-örnek öz-testinden geçti** (R1 aralık-kaydı hatası — §9.2'nin tam olarak
düştüğü tuzak, R2 kayıtsız kolon, R3 `ht`siz satır, R4 dönüşüm çapaları, R5 bozuk XML
RAISE etmeli, R6 boş ayrıştırma RAISE etmeli). Taranan öğe sayıları rapor edildi:
3 `<col>` kaydı, 45 `<row>`, 136 birleştirme.

### 12.0 Önce bir düzeltme: `width` iki farklı birimde yaşar

Bu oturumun ilk okuması §11.2 ile çelişti — kolonlar 45.00 pt çıktı, 41.25 değil. Sebep
parser hatası değil, **birim karışıklığıydı**, ve şablon yazılırken tekrar edilirse tüm
sayfayı %9.4 bozar:

| Birim | Nerede | Rev00 gövde kolonu | → px |
|---|---|---|---|
| **Saklanan** (OOXML `<col width>`) | dosyanın içi | `7.83203125` | ECMA-376 §18.3.1.13: `trunc(((256w + trunc(128/MDW))/256)·MDW)` = **55 px** |
| **Görünür karakter** (Excel arayüzü, `rust_xlsxwriter::set_column_width`) | bizim `A3Template.charWidth` alanımız | `8.285714` (yeni ızgara) | `round(w·7 + 5)` = **63 px** |

Hangisinin doğru olduğu tartışmayla değil çapayla belirlendi: Excel'in belgelenmiş
varsayılan kolonu arayüzde `8.43` karakter, dosyada `9.140625`, ekranda **64 px**. ECMA
formülü `9.140625 → 64 px` verir ✅; `round(w·7+5)` formülü `69 px` verir ❌. Ters yön de
tutar: `trunc((8.43·7+5)/7·256)/256 = 9.140625` tam olarak.

**Sonuç:** `src/a3/layout/measure.ts`'in `excelColumnWidthToPt` fonksiyonu **doğrudur** —
o *görünür karakter* birimini çevirir ve D-101 zaten `charWidth`'i `set_column_width`'e
aynen geçirir. Hata olmadı. Ama **şablon yazılırken OOXML'den okunan saklanan değer
`charWidth` alanına doğrudan kopyalanamaz**; her kolon 5 px (3.75 pt) geniş olur, sayfa
1143.75 yerine 1233.75 pt'ye çıkar ve A3'e oturmaz. §11.2'nin 41.25 / 9.75 / 999.75 pt
rakamları **doğrulandı**.

### 12.1 A3 tam-oturma ızgarası

Dört kenarda eşit basılı boşluk isteniyorsa (D-146, Barış'ın koşulu) tek bir özdeşlik
bağlar — sayfanın uzun kenarı eksi kısa kenarı sabittir:

```
içerik_genişlik − içerik_yükseklik = 420 mm − 297 mm = 348.6619 pt     (SABİT)
kenar boşluğu m = (841.8910 − içerik_yükseklik) / 2
```

Yani yükseklik seçilir, genişlik ve kenar boşluğu **türetilir**. Kuantalama gerçek:
kolonlar 0.75 pt (1 px), satırlar 0.05 pt.

**Kenar boşluğu kararı — donanım kısıtı, tercih değil.** D-146 5 pt (1.76 mm) demişti;
çoğu A3 lazer yazıcının fiziksel basılamaz kenarı ~5 mm (≈14.17 pt), bazı cihazlarda arka
kenarda 6 mm. **5 pt kırpılır.** Aday ızgaralar tarandı:

| gövde kolonu | ayraç | içerik gen. | gerekli yük. | m (pt) | m (mm) | hüküm |
|---|---|---|---|---|---|---|
| 48.00 pt (64 px) | 9.75 | 1161.75 | 813.09 | 14.40 | 5.08 | donanım tabanında, pay yok |
| 48.00 pt | 13.50 | 1165.50 | 816.84 | 12.53 | 4.42 | **KIRPILIR** |
| **47.25 pt (63 px)** | **9.75** | **1143.75** | **795.09** | **23.40** | **8.26** | ✅ seçildi |
| 46.50 pt (62 px) | 13.50 | 1129.50 | 780.84 | 30.53 | 10.77 | güvenli ama israf |

Seçilen: **`pageMargins` dört kenarda 0.32 in = 23.04 pt = 8.13 mm.** 5 mm donanım
tabanının 3.13 mm üstünde, Rev00'ın kendi 0.28 in'inden 1.02 mm daha ihtiyatlı, ve
inç cinsinden temiz bir değer (Excel kenar boşluklarını inç saklar).

**Genişlik nasıl kazanılıyor:** 24 gövde kolonu **41.25 → 47.25 pt** (55 → 63 px, +%14.5).
Ayraç `KAT` kolonu Rev00'ın ölçülen **9.75 pt** değerinde bırakıldı — D-151 katlamayı
*doğrulanmış yapısal özellik* olarak kilitledi, genişletmek bir tasarım eylemi olurdu.

**Reddedilen iki alternatif, gerekçesi sayısal:**

- **Kolon eklemek** (12+1+12 → 13+1+13): 136 birleştirmenin **hepsi** 12'li ızgarada
  ifade edilmiş; 13. kolon her birini elle yeniden kesmeyi gerektirir — bu "bunun üzerine
  kurmak" (D-150) değil, yeniden yazmaktır. Dahası **13 asal sayıdır**: D-102'nin `zones`
  mekanizması `widthFraction`'ı tam kolon sınırına yapıştırır, 12 ise yarım/üçte/dörtte/
  altıda birleri tam verir (6·4·3·2). 13'te hiçbir temiz kesir yoktur — gerileme olurdu.
- **Satır yüksekliğini düşürerek genişlik kazanmak:** m = 0.32 in'de gereken oran 1.4381;
  999.75 pt genişlikte kalınsaydı yükseklik 695.2 pt'ye inerdi — blok bandından **−94 pt
  (%14.6 kapasite kaybı)**, üstelik kolonlar hâlâ 41.25 pt basılırdı. Her eksende daha kötü.

### 12.2 Kolon tablosu

| Kolon | Görünür karakter | px | pt | Kümülatif pt |
|---|---|---|---|---|
| A…L (12) | 8.285714 | 63 | 47.25 | 567.00 |
| **M (`KAT`)** | 1.142857 | 13 | 9.75 | 576.75 |
| N…Y (12) | 8.285714 | 63 | 47.25 | **1143.75** |

`charWidth` alanına **8.285714** ve **1.142857** yazılır (§12.0). Gidiş-dönüş kararlıdır:
`8.285714 → saklanan 9.0 → 63 px`, `1.142857 → saklanan 1.85546875 → 13 px`.

**Katlama simetrisi (D-151) korundu ve TAM:** sol yarı 567.00 pt, ayraç 567.00 → 576.75 pt,
ayracın merkezi **571.875 pt**, sayfa ortası 1143.75/2 = **571.875 pt**. Eşitlik yapı
gereği kesindir — iki yarı eşit kolon sayısı ve eşit genişlikte olduğu sürece herhangi bir
`(c, d)` çifti için sağlanır.

### 12.3 Satır bandları ve ulaşılan oran

| Band | pt | Rev00 | Not |
|---|---|---|---|
| Başlık | 32.00 | 32.00 | değişmedi |
| `VAKA BİLGİLERİ` (D-153 kimlik bandı) | 71.00 | 71.00 | değişmedi |
| **Blok bandı** | **650.00** | 644.00 | +6.00 pt — kazanılan yüksekliğin tamamı buraya |
| Onay altbandı (D-153) | 42.00 | 42.00 | değişmedi |
| **Toplam** | **795.00** | 789.00 | |

```
basılabilir alan (0.32 in)   1144.4730 × 795.8110 pt    oran 1.438122
içerik                       1143.75   × 795.00   pt    oran 1.438679
fit ölçeği                   min(1.000632, 1.001020) = 1.000632 → Excel yalnızca küçültür, %100
basılan boşluk  sol/sağ      23.4015 pt (8.256 mm)
                üst/alt      23.4455 pt (8.271 mm)
                fark          0.0440 pt (0.0155 mm)
```

**D-152'nin açığı kapandı.** §11.4'ün 150.48 pt yatay boşluğu 0.72 pt'ye indi; dört kenar
arasındaki fark 0.0155 mm — ölçülemez. Fit ölçeği %100 olduğu için **D-146'nın 1:1 yazımı
korunur**, yani D-40'ın okunabilirlik tabanı **8 pt yazılmış** olarak kalır (19.3 değil).

### 12.4 Blok bütçesi — Barış'ın kararı: **B, iki uçtan düzeltme**

> ⚠️ **§12.4–§12.6'nın sayıları §12.8 ile GEÇERSİZ KILINDI** (aynı gün, D-158/D-159).
> Aşağıdakiler kararın nasıl alındığının kaydıdır; bağlayıcı tablo §12.8'dedir.

Blok bandı 650.00 pt = **50 satır × 13.00 pt**. 13 pt satır, 8 pt yazıya 1.63× satır arası
verir ve 650'yi tam böler. (Rev00'ın 18 pt satırı 36.11 satır verirdi — tam bölmez ve 11 pt
yazı için ölçülmüştü; 1:1 yazımda 8 pt taban geçerli olduğundan 18 pt satır %38 israftır.)

Üç seçenek sayısallaştırılıp Barış'a soruldu (A: referansa birebir · B: iki uçtan düzeltme ·
C: her adıma görsel). **Seçilen: B.** §11.3'ün kendi işaretlediği iki aşırılık düzeltilir,
gerisi referansta kalır.

| Blok | Satır | pt | % | Rev00 % | Değişim |
|---|---|---|---|---|---|
| ADIM 1 — Problemi netleştirin | 15 | 195 | 30.0 % | 25.2 % | +4.8 |
| **ADIM 2 — Problemi parçalara ayırın** | 24 | 312 | **48.0 %** | **59.5 %** | **−11.5** |
| ADIM 3 — Hedef belirleyin | 11 | 143 | 22.0 % | 15.4 % | +6.6 |
| ADIM 4 — Kök nedeni analiz edin | 19 | 247 | 38.0 % | 39.1 % | −1.1 |
| ADIM 5 — Uygulama planı | 8 | 104 | 16.0 % | 16.8 % | −0.8 |
| ADIM 6 — Çözümleri uygulama | 8 | 104 | 16.0 % | 17.5 % | −1.5 |
| ADIM 7 — Sonuçları izleme | 8 | 104 | 16.0 % | 16.8 % | −0.8 |
| **ADIM 8 — Standardizasyon** | 7 | 91 | **14.0 %** | **9.8 %** | **+4.2** |

Sol 15+24+11 = 50 satır ✅ · Sağ 19+8+8+8+7 = 50 satır ✅

**Rev00'ın blok anatomisi — §11.3'te olmayan ölçüm.** Her blok bir kartuş satırı (`ADIM n
— …`) artı bir etiket satırı taşır; kalanı tuvaldir. Sağ kolon aslında bir **tablo
kolonudur**: ADIM 5 (`ID · Aksiyon · Sorumlu · Termin · Durum`), ADIM 6 (`Aksiyon ID ·
Kanıt · Tarih · Sorun`), ADIM 7 (`KPI · Önce · Hedef · Sonra · Sürdürme · Sonuç`), ADIM 8
(`Standart · Güncellendi? · Sorumlu/tarih · Yatay yayılım`) — Rev00 bunlara sırasıyla
4 · 4 · 4 · 2 gövde satırı vermiş. Sol kolon serbest tuval + ADIM 2 içinde bir alt tablo
(`Alt Problem · Etki · Öncelik · Kanıt`, satır 32–36). **Bu, formun "hangi boşluğa ne
girer" sorusuna kendi cevabıdır** ve Oturum B'nin başlangıç noktasıdır.

§11.3'e küçük bir düzeltme: satır 43'ün **sol yarısı** (`Hedef tarihi / takip sıklığı /
veri kaynağı:`) onay bandına değil ADIM 3'e aittir; sağ yarısı boştur. Band bölümü
(bloklar 7–42, onay 43–45) yapısal sözleşme olarak korunuyor, ama transkripsiyonda bu
etiketin ADIM 3'ün kuyruğu olduğu bilinmelidir.

### 12.5 Blok başına içerik kapasitesi — asıl çıktı

Sabitler, hepsi sevk edilmiş koddan okundu, tahmin değil:
`CHART_ROW_SPAN = 10` (`pareto`/`trend`/`distributionChart`) · giriş = 1 başlık satırı +
alan başına 1 satır (`fieldFormLines`, boş alanlar düşer) — sevk edilmiş yöntemlerde 3–6
alan, **medyan giriş = 6 satır**, yalın giriş = 4 satır · D-100: içerik satırı başına bir
sarılmış metin satırı · tuval genişliği 567.00 pt → `estimateCharsPerLine` 8 pt'de **128
karakter/satır** (9 pt'de 114, 10 pt'de 103).

**Tavan tablosu:**

| Blok | Tuval satırı | Tuval pt | Giriş (6 sat.) | Giriş (4 sat.) | Tam boy grafik? | Grafik + giriş |
|---|---|---|---|---|---|---|
| ADIM 1 | 13 | 169 | **2** | 3 | ✅ | 1 grafik + 0 giriş |
| ADIM 2 | 22 | 286 | **3** | 5 | ✅ | **1 grafik + 3 giriş** |
| ADIM 3 | 9 | 117 | **1** | 2 | ❌ (10 gerekir) | — |
| ADIM 4 | 17 | 221 | **2** | 4 | ✅ | **1 grafik + 1 giriş** |
| ADIM 5 | 6 | 78 | **1** | 1 | ❌ | — |
| ADIM 6 | 6 | 78 | **1** | 1 | ❌ | — |
| ADIM 7 | 6 | 78 | **1** | 1 | ❌ | — |
| ADIM 8 | 5 | 65 | **0** | 1 | ❌ | — |

**Sayfa sözleşmesinin söylediği sert gerçek:** 650 pt'yi sağ kolonda **beş** blok
paylaşıyor. `CHART_ROW_SPAN = 10` sabiti sağ kolonun dört izleme bloğuna **geometrik
olarak sığmaz** — ADIM 5/6/7 altı, ADIM 8 beş tuval satırı alır. "Her adıma tam boy
grafik" bu sayfada mümkün değildir; C seçeneği de bunu çözemedi, sadece görünür kıldı.
Oturum B'nin cevaplaması gereken soru bu yüzden "hangi yöntem" değil, **"sağ kolonun dört
bloğu için kısaltılmış görsel dili ne"** (5–7 satırlık KPI şeridi / durum çubuğu /
sparkline) — ya da `CHART_ROW_SPAN`'in blok başına parametreleşmesi.

### 12.6 Tuval oranları — Oturum B'nin doğrudan girdisi

Tuval genişliği her blokta 567.00 pt. Yükseklik değiştiği için **her bloğun kutu oranı
farklı**, ve bir görselin o kutuya oturup oturmadığını belirleyen budur:

| Blok | Tuval (G × Y) | Oran G:Y | Ne oturur |
|---|---|---|---|
| ADIM 1 | 567 × 169 | **3.36 : 1** | geniş şerit — 3×2 ızgara, akış şeridi |
| ADIM 2 | 567 × 286 | **1.98 : 1** | grafik + tablo, iki bölgeli yerleşim |
| ADIM 3 | 567 × 117 | **4.85 : 1** | üç bölgeli yatay şerit (D-38) |
| ADIM 4 | 567 × 221 | **2.57 : 1** | balık kılçığı / ağaç diyagramı |
| ADIM 5/6/7 | 567 × 78 | **7.27 : 1** | yalnız tablo |
| ADIM 8 | 567 × 65 | **8.72 : 1** | yalnız tablo |

Barış'ın oturum içinde verdiği 5N1K örneği (merkezî daire + altı yaprak) bu sayılarla
somut bir cevap alıyor: dairesel düzen ~1:1'dir, ADIM 1'in 3.36:1 kutusunda **alanın
%30'unu kullanır, %70'i boş kalır.** "Daire yerine dikdörtgen" içgüdüsü geometrik olarak
doğrudur — aynı kutudaki seçenekler:

| Yerleşim | Hücre | Oran |
|---|---|---|
| 6×1 | 94.50 × 169.00 pt | 0.56 |
| **3×2** | **189.00 × 84.50 pt** | **2.24** |
| 2×3 | 283.50 × 56.33 pt | 5.03 |
| 1×6 | 567.00 × 28.17 pt | 20.13 |

3×2 ızgara hem kutu oranına en yakın, hem hücre başına 84.50 pt ile 8 pt yazıda bir
başlık + 4–5 satır metin taşır. **Hangi görselin seçileceği Oturum B'nin kararıdır**;
burada kayda geçen yalnızca geometrik zarftır.

### 12.7 Bu oturumun KAPSAMADIĞI

- Şablon dosyası yazılmadı (`src/a3/templates/*`) — D-95 Faz 11, değişmedi. Bu oturumda
  **hiç kod yazılmadı**; ölçüm ve karar oturumuydu.
- Hücre stilleri, dolgular, kenarlıklar, yazı tipleri envanteri çıkarılmadı (§11.6'dan
  devreden açık iş). Varsayılan yazı tipi **Carlito 11** olarak ölçüldü (LibreOffice'in
  Calibri metrik eşleniği — MDW = 7 px varsayımı bu yüzden geçerli).
- Altı adım çalışma sayfası ve `Lists & Settings` analiz edilmedi — P-30, Oturum B.
- Arayüz/IA kararları — Oturum B. Yöntem plugin'i ekleme/silme — Oturum C. P-26 — Oturum D.

### 12.8 Bütçenin DÜZELTİLMESİ — esnek tahsis (D-158/D-159, §12.4–§12.6'yı geçersiz kılar)

Barış aynı oturumda iki düzeltme verdi; ikisi de bu oturumun sahip olmadığı alan bilgisiydi.

**1 — ADIM 2 ve ADIM 4 bilerek büyük.** "En çok giriş o alanlara giriliyor." §11.3'ün
%59.5'i bir tasarım kararıdır, §6'nın Template A'da eleştirdiği aşırı tahsis değil. §12.4'ün
çerçevesi (bu belgenin yazarınınki) yanıltıcıydı ve D-155 o çerçeveyle seçilmişti.

**2 — Üst ve alt çizgi hiç kaymamalı, ama adımlar arası alanlar bilgiye göre değişebilir.**
Bu, blok bütçesinin *cinsini* değiştirir: sabit bir şablon sabiti değil, **toplamı sabit bir
yerleşim-anı tahsisi**. Şablonun sakladığı şey artık bir yükseklik değil, bir **varsayılan**
ve bir **alt sınır**.

```
DEĞİŞMEZ   her kolon tam olarak 50 satır = 650.00 pt
           → blok bandının üst ve alt kenarı iki kolonda AYNI, kayma yapı gereği imkânsız
ESNEK      adımlar arası sınırlar içeriğe göre kayar; kolon toplamı asla değişmez
```

| Blok | Varsayılan | Alt sınır | pt | % | Rev00 % | Fark | Tuval | Tuval pt | Oran | Grafik? |
|---|---|---|---|---|---|---|---|---|---|---|
| ADIM 1 | **14** | 8 | 182 | 28.0 | 25.2 | +2.8 | 12 | 156 | 3.63 | ✅ |
| ADIM 2 | **28** | 20 | 364 | 56.0 | 59.5 | −3.5 | 26 | 338 | 1.68 | ✅ |
| ADIM 3 | **8** | 8 | 104 | 16.0 | 15.4 | +0.6 | 6 | 78 | 7.27 | ❌ |
| ADIM 4 | **20** | 14 | 260 | 40.0 | 39.1 | +0.9 | 18 | 234 | 2.42 | ✅ |
| ADIM 5 | **8** | 6 | 104 | 16.0 | 16.8 | −0.8 | 6 | 78 | 7.27 | ❌ |
| ADIM 6 | **8** | 6 | 104 | 16.0 | 17.5 | −1.5 | 6 | 78 | 7.27 | ❌ |
| ADIM 7 | **8** | 6 | 104 | 16.0 | 16.8 | −0.8 | 6 | 78 | 7.27 | ❌ |
| ADIM 8 | **6** | 5 | 78 | 12.0 | 9.8 | +2.2 | 4 | 52 | 10.90 | ❌ |

Sol 14+28+8 = 50 ✅ · Sağ 20+8+8+8+6 = 50 ✅
Sol alt sınırlar 37/50 → **13 satır esnek** · Sağ alt sınırlar 37/50 → **13 satır esnek**
(alt sınırlar D-160 ile gevşetildi: ADIM 1 → 12, ADIM 3 → 5)

**Kullanıcı ADIM 2'yi ADIM 3'ten alarak büyütebilir (D-160).** Karmaşık problemde gereken bu.
ADIM 2 en fazla **33 satır = 429 pt = %66**'ya çıkar — Rev00'ın kendi %59.5'inin üstüne.
ADIM 3'ün tabanı **5 satır (65 pt)**: kartuş + etiket + üç bölgeli 189 × 39 pt SMART şeridi.
**Küçülmek kaldırmak değildir** — D-11 ve `CLAUDE.md` ADIM 3'ü zorunlu kılıyor (Toyota'nın
8 adımını Imai'nin 7'sinden ayıran adım, ve pratikte sessizce atlanan adım), taban bunun
bekçisi. Tahsis **deterministik**: her blok satır talebi bildirir, boş satırlar karşılanmamış
talebe gider, tabanlar korunur, kolon toplamı 50'de sabit kalır. **AI yerleşim yoluna
girmez** — girseydi `CLAUDE.md`'nin "AI kapalıyken uygulama tam çalışır" kuralı ve D-97'nin
golden-file testleri anlamını kaybederdi. AI'ın buradaki gerçek işi, talep arzı aştığında
**neyin yoğunlaştırılacağını önermek** (mevcut öner-ve-Kabul et yolundan), sınırı kendisi
oynatmak değil. Hiçbir şey kaybolmaz: D-100 sığmayan girişi ek sayfaya taşır, kırpmaz.

Varsayılanlar artık Rev00'ın kendi oranlarının **her yerde 3.5 puan içinde**. D-155'in
%48'lik ADIM 2 kırpması geri alındı; kalan −3.5 puan bir denge yargısı değil, somut bir
içerik gereğidir (aşağıdaki D-159).

**ADIM 1'in üç zorunlu paneli (D-159).** Barış: gap analysis + problem statement (P-32
örneğindeki gibi) + **5N1K mutlaka**. 12 tuval satırına (156 pt × 567 pt) ölçülen oturma:

| Panel | Satır | Kutu |
|---|---|---|
| 5N1K şeridi | 4 (52 pt) | 6 hücre × 94.50 × 52.00 pt |
| Gap analizi | 8 (104 pt) | 283.50 × 104.00 pt |
| Problem statement | 8 (104 pt) | 283.50 × 104.00 pt (4 renk bandı, her biri 26 pt) |

**Tam oturuyor, boşluk yok.** ADIM 1'in varsayılanı bu yüzden 12'den 14 satıra çıktı. Üçünden
biri büyürse esnek tahsis ADIM 2 veya 3'ten satır almak zorundadır — sessizce yutacak pay yok.

**Değişmeyenler:** §12.1–§12.3'ün sayfa sözleşmesi (kenar boşlukları, kolonlar, katlama,
795.00 pt) bu düzeltmeden etkilenmez — esneklik yalnızca 650 pt'nin *içinde* çalışır.
Grafik alabilen bloklar yine ADIM 1, 2, 4; sağ kolonun dört izleme bloğu için P-31 açık.

---

## 13. Altı çalışma sayfası + `Lists & Settings` — Oturum B1 çıktısı, 2026-08-06

> D-149'un dört oturumundan **ikincisi**, iki alt oturuma bölündü (bütçe gerekçesi
> Barış'a soruldu, onay alındı — aşağıdaki `oturumlar/B-adim-anatomisi.md` notuna bkz.).
> **B1 — bu bölüm:** P-30'u kapatır, altı çalışma sayfasını + `Lists & Settings`'i çözer.
> **B2 — ayrı, temiz oturum:** blok görsel dili (§5.2), adım arayüzü (§5.3), esnek tahsis
> arayüzü (§5.4) — kendi başlangıç promptu `docs/oturumlar/B2-gorsel-dil-arayuz.md`.

**Yöntem:** §9/§12 ile aynı disiplin. `xl/worksheets/sheet{2..8}.xml` + `xl/sharedStrings.xml`
doğrudan okundu (sheet1 = `A3 Summary`, zaten §11/§12'de çözüldü). Parser gerçek dosya
açılmadan önce **8/8 sabit-örnek öz-testinden** geçti: zengin-metin (`<r><t>`) shared-string
birleştirme, aralık-dışı shared-string indeksi RAISE, `inlineStr` hücre, `dataValidation`
`formula1`'in tırnaklı-literal-liste ile aralık-referansı (`'Sayfa Adı'!$A$2:$A$9`) ayrımı,
bozuk XML RAISE, **0 satır ayrıştırma RAISE** (temiz değil, arıza), `mergeCell` aralığı.
Taranan öğe sayıları: 7 sayfa, 183 satır, 2257 hücre, 24 birleştirme, **15 `dataValidation`**.

### 13.0 Genel bulgu — form TEK yaşam-döngüsü tablosu tutuyor, uygulama adım-kapsamlı `Entry` kullanıyor

Bu, tek tek sayfalarda tekrar etmeden önce kayda geçmesi gereken çapraz-kesen bir bulgu.
Rev00'ın çalışma sayfaları PPS'i 8 ayrı adım olarak değil, **üç uzun, PDCA boyunca süren
tablo** olarak modelliyor:

- `Data Analysis` (sayfa 3) tek bir KPI-gözlem tablosu tutuyor, her satır bir `Phase`
  (**Baseline · Containment · Post-Action · Sustain**) etiketiyle işaretli — Adım 2'nin
  trend'i ile Adım 7'nin "post-action/sustain" izlemesi **aynı tabloda**, farklı satırlarda.
- `Action Plan & Containment Tracker` (sayfa 5) tek bir aksiyon tablosu tutuyor, her satır
  bir `Type` (**Containment · Corrective · Preventive · Standardization · Yokoten**)
  etiketiyle işaretli — bizim `containmentIca` (Adım 1), `actionItem` (Adım 6) ve Yokoten
  (Adım 8, henüz plugin yok) olarak ayırdığımız üç şey formda **tek tablo, tek şema**.
- `Root Cause Analysis` (sayfa 4) benzer şekilde hipotez üretimi, 5 Neden zincirleri ve
  doğrulama/onayı üç ayrı bant olarak tutuyor ama hepsi tek sayfada, tek `Cause ID` anahtarı
  üzerinden ilişkili.

**Bu bir tasarım hedefi değil, bir gözlemdir** (statü tablosu: bu sayfalar artık **ÖLÇÜLDÜ**,
ama `PPS_A3_Problem_Solving_Template_Rev00.xlsx`'in tasarım hedefi statüsü yalnızca `A3
Summary` sayfası içindir, D-150). `CLAUDE.md`'nin kendi ilkesi zaten bunu çözüyor: *"The
supplied company templates are 7-step; the app's model is 8-step. A template is a projection
of the model onto a sheet, never the other way round."* D-124 (bir izlenebilir düğüm = bir
`Entry`) ve D-116'nın referans mimarisi bu formun tek-tablo yaklaşımını **zaten** adım-kapsamlı
`Entry` + `references[]` ilişkisine çeviriyor — mimari değişmez. Değer, formun *hangi
alanları* ve *hangi sözlükleri* beklediğini bilmekte; yapısını kopyalamakta değil.

### 13.1 Sayfa sayfa veri modeli

| Sayfa | Uygulamadaki karşılığı | Alanlar (kısaltılmış) | Açılır liste sözlüğü | Not |
|---|---|---|---|---|
| **Problem Definition** | ADIM 1 (5W2H/Scope, Is/Is-Not) + ADIM 2 (Problem Breakdown) | 5W2H: Field·Entry·Evidence — What/Where/When-frequency/Who affected/How many/How much cost·risk. Is/Is-Not: Dimension·IS·IS NOT·Boundary (Product/Process step/Location/Time/Population). Breakdown: Segment·Measure·Baseline·Defects·Volume·Rate·Share·Priority·Selected?·Evidence·Owner·Notes (Product/Process/Shift/Machine/Supplier lot/Customer/Other) | `Priority`: Critical/High/Medium/Low · `Selected?`: Yes/No | Şipping edilmiş `fiveW2H`, `isIsNot`, `stratificationMatrix` alan setleriyle büyük ölçüde örtüşüyor — yeni alan yok, doğrulama. |
| **Data Analysis** | ADIM 2 `trend` (+ ADIM 7'nin sustain izlemesiyle aynı tablo, §13.0) | Date·KPI·Actual·Target·Unit·Phase·Product/Line·Source-Evidence·Defects·Volume·Rate·Comment | `Phase`: Baseline/Containment/Post-Action/Sustain | Bizim `trend` şeması `Phase` alanı taşımıyor — tek entry'nin yaşam boyu birden fazla fazı etiketleme ihtiyacı yok, çünkü biz fazı adım/round ile ayırıyoruz (D-58 `roundId`). Şema değişikliği önerilmiyor, yalnızca kayda geçti. |
| **Root Cause Analysis** | ADIM 4 (Fishbone, 5 Why, 3-Legged 5 Why) | Ishikawa: Cause ID·Category·Potential cause·Occurrence/Escape/Systemic·Evidence for/against·Test method/owner/due date·Result·Verification·Selected root?·Risk·Notes. 5 Why: Chain·Cause type·Problem·Why 1–5·Root cause statement·Evidence·Can switch on/off?·Verification·Cause ID·Owner. Onay: Cause ID·Verified root cause·Type·Evidence summary·Reproduction test·Result·**Confidence %**·Approver·Approval date·Decision·Linked action IDs·**Residual uncertainty**·**Customer relevance**·Notes | Category: **Man/Machine/Method/Material/Measurement/Environment/Management System (7)** · Occurrence/Escape/Systemic(/Direct/Contributing) · Verification: Not Tested/Planned/Verified/Rejected · Approval: Draft/Under Review/Approved/Rejected | **Doğrulama, gap değil:** 7 kategori sevk edilmiş `fishbone/categories.ts`'in `6M` setiyle (`man,machine,material,method,measurement,environment,management` — D-104'ün notu doğru: "6M" adı 7 öğeli) **birebir eşleşiyor**. Onay bandının `Confidence %`/`Residual uncertainty`/`Customer relevance` alanları hiçbir şipping edilmiş plugin'de yok — Oturum C adayı, burada yalnızca kayıt (D-124 uyarınca kapsam dışı). |
| **Action Plan & Containment Tracker** | ADIM 1 `containmentIca` + ADIM 6 `actionItem` (+ Yokoten, §13.0) | Action ID·Type·Action/countermeasure·Cause ID·Owner·Planned start·Due date·Actual finish·Status·Priority·**Days late**·**RAG**·Completion evidence·Effectiveness evidence·**Customer approval** | Type: Containment/Corrective/Preventive/Standardization/Yokoten · Status: Not Started/In Progress/Blocked/Complete/Cancelled · Priority: Critical/High/Medium/Low | `RAG` sütunu formda **hiç `dataValidation` almıyor** (elle serbest metin, seed değerleri hep "Green") — form bile bunu bağlamamış, biz de bağlamak zorunda değiliz ama D-153'ün `A3 Summary` başlık bandındaki **"Genel RAG"** alanı için sözlük ihtiyacı burada doğrulanıyor (§13.2). `Days late`/`Customer approval` şipping edilmiş `actionItem`'da yok — Oturum C adayı. |
| **Effectiveness Check** | ADIM 7 (henüz karşılığı olmayan "Sustainment Audits" hariç) | KPI Verification: KPI·Definition·Baseline·Target·Post-action·Sustain·Unit·Improvement %·Target met?·Verification window·Evidence URL·Conclusion. **Sustainment Audits** (yeni kavram): Audit date·Area/line·Standard checked·Sample size·Conforming·Nonconforming·Compliance %·Auditor·Finding·Reaction action ID·Next audit·Status | Target met?: Yes/No · Audit Status: Planned/Verified/Rejected | "Sustainment Audits" bandının şipping edilmiş hiçbir plugin'de karşılığı yok — periyodik denetim/izleme kavramı bizim tek-seferlik `checkSheet`'ten farklı. Oturum C adayı. |
| **Standardization, Yokoten & Lessons Learned** | ADIM 8 | Document Updates (**7 sabit satır**: PFMEA·Control Plan·Work Instruction·Inspection Standard·Training/Competence·Layered Process Audit·APQP/PPAP record — her biri Update required?/Doc ID/Current-New revision/Owner/Due-Completion date/Status/Approval/Evidence/Customer submission?). Yokoten: Site/line/product·Applicability·Risk reviewed·Action required·Owner·Due date·Status·Completion evidence·Effectiveness checked·Check date·Result·Approval·Notes. Lessons Learned (**8 sabit soru**): What went well? / What failed or was delayed? / What evidence changed our thinking? / What should be reused? / What should be avoided? / Coaching-capability lesson / Customer communication lesson / Final closure rationale | Update required?: Yes/No · Status: Not Started/In Progress/Blocked/Complete/Cancelled · Approval: Draft/Under Review/Approved/Rejected | Şipping edilmiş `pfmeaLinkage` tek belgeye odaklı; form **7 sabit belge türünü** ayrı ayrı izliyor — daha geniş. Yokoten'in kendi izleme tablosu ve 8 soruluk yapılandırılmış "lessons learned" checklist'i hiçbir şipping edilmiş plugin'de yok. Üçü de Oturum C adayı. |

### 13.2 Ortak sözlük — `Lists & Settings`

**Önemli mimari bulgu:** `Lists & Settings`'teki yedi sütun, sayfa 2–7'nin 15
`dataValidation`'ından **hiçbirine formülle bağlı değil** — hepsi kendi sayfasında tırnaklı
literal liste (`"Critical,High,Medium,Low"` gibi), `'Lists & Settings'!$A$2:$A$9` tarzı bir
aralık referansı **sıfır kez** görüldü (doğrulama: `grep <formula1>` sayfa 2–7'nin tamamında,
7 sonucun hepsi literal). Yani bu sayfa canlı bir veri kaynağı değil, **insan-okunur bir
sözlük/lejant** — her yerde tekrarlanan literal listelerin tek bir yerde özetlenmiş hali.

| Sözlük | Değerler | Nerede kullanılıyor |
|---|---|---|
| Status | Not Started · In Progress · Blocked · Complete · Cancelled | Action Plan, Root Cause (dolaylı), Standardization |
| Priority | Critical · High · Medium · Low | Problem Definition, Action Plan |
| **RAG** | Red · Amber · Green | Yalnızca `Lists & Settings`'te tanımlı; Action Plan'ın `RAG` sütunu **bağlanmamış** (§13.1) |
| Verification | Not Tested · Planned · Verified · Rejected | Root Cause Analysis, Effectiveness Check |
| Yes/No | Yes · No | Problem Definition, Root Cause, Standardization |
| Cause Type | Occurrence · Escape · Systemic · Direct · Contributing | Root Cause Analysis (5 öğeli hipotez seti; 5 Why alt-kümesi yalnız ilk 3'ünü kullanıyor) |
| Approval | Draft · Under Review · Approved · Rejected | Root Cause, Standardization |

`Guidance` sütunu (liste değil, beş serbest-metin kural) — kayda değer, coaching içeriğine
yakın: *"Yellow cells are user inputs; blue/gray cells are calculated or instructional." ·
"Dates use ISO display (yyyy-mm-dd)." · "Enter facts and evidence; avoid conclusions in the
problem statement." · "No macros are used. Formulas and validation remain auditable." ·
"Update PFMEA, Control Plan and work instructions when the verified cause affects risk
controls."* Sonuncusu `pfmeaLinkage`'ın referans rolüyle zaten örtüşüyor (D-125); üçüncüsü
Adım 1 coaching metnine eklenebilecek bir cümle (Oturum C/içerik işi, burada yalnızca kayıt).

### 13.3 Doğrulanan (gap değil)

- **Fishbone `6M` kategori seti Rev00'ın 7 kategorisiyle birebir eşleşiyor** (§13.1) — D-11/
  D-104 sağlam, herhangi bir düzeltme gerekmiyor.
- **`five-g-5n1k` şipping edilmiş plugin'i formda karşılığı olmayan bir alan seti taşıyor**
  (5G: Gemba/Gembutsu/Genjitsu/Genri/Gensoku) — Rev00'ın hiçbir sayfası 5G'yi adlandırmıyor.
  Bu bir hata değil: 5G, sevk edilmiş uygulamanın kendi `SPEC.md` §3.0 kararı (5W2H yerine),
  Rev00'ın kapsamadığı ayrı bir katkı. B2'nin 5N1K kararına (ayrı yeni format, bu oturumda
  Barış onayladı) etkisi yok, ama 5G'nin ADIM 1'in üç zorunlu panelinden (D-159) hiçbirine
  girmediği doğrulandı — B2'nin çözmesi gereken açık uç olarak kayda geçti.

### 13.4 Yeni yöntem adayları — Oturum C'nin kapsamı, burada yalnızca kayıt

D-149/§6'nın "plugin ekleme/silme Oturum C'dir" sınırı gereği aşağıdakiler **karar değil,
bulgu**:

1. ~~**Sustainment Audits** (ADIM 7) — periyodik denetim izleme, tek-seferlik `checkSheet`'ten
   farklı bir tekrarlı-kayıt şekli ister.~~ **BİTTİ — Oturum C4, 2026-08-17.**
   `src/methods/sustainmentAudit/` (`RowTableEditor`, D-115), D-183.
2. ~~**Sabit 7 belge türlü Document/System Updates izleyicisi** (ADIM 8) — şipping edilmiş
   `pfmeaLinkage` tek belgeye odaklı, form yedi türü (PFMEA, Control Plan, Work Instruction,
   Inspection Standard, Training/Competence, Layered Process Audit, APQP/PPAP) ayrı ayrı ister.~~
   **BİTTİ — Oturum C4, 2026-08-17.** `src/methods/documentUpdatesTracker/` (D-122'nin sabit-
   kategori deseni, yedi doküman türünün her biri kendi 9 alanlı `FieldFormValues` kaydını
   taşıyor), D-183.
3. ~~**Yokoten (yatay yayılım) izleyicisi** (ADIM 8) — hiçbir şipping edilmiş plugin
   karşılamıyor.~~ **BİTTİ — Oturum C4, 2026-08-17.** `src/methods/yokotenTracker/`
   (`RowTableEditor`, D-115), D-183.
4. ~~**8 soruluk yapılandırılmış Lessons Learned checklist'i** (ADIM 8) — şipping edilmiş hiçbir
   plugin bu sabit soru setini karşılamıyor.~~ **BİTTİ — Oturum C4, 2026-08-17.**
   `src/methods/lessonsLearned/` (`FieldFormEditor`, D-127), D-183.
5. **Root cause onay bandına `Confidence %` / `Residual uncertainty` / `Customer relevance`
   alanları** — mevcut root-cause plugin'lerinde yok.
6. **`actionItem`'a `Days late` (hesaplanan) / `Customer approval` alanları** — mevcut
   şemada yok.
7. **`Genel RAG` (D-153 başlık alanı) için sözlük** — Red/Amber/Green, §13.2'den doğrudan.

### 13.5 P-30 CAPANDI

Altı çalışma sayfası + `Lists & Settings` çözüldü — bu bölümün kendisi. `reference/README.md`
statüsü güncellendi (ANALİZ EDİLMEDİ → ÖLÇÜLDÜ).

### 13.6 B2'ye kalan — bu oturumun KAPSAMADIĞI

`docs/oturumlar/B-adim-anatomisi.md` §5.2 (blok görsel dili, palet çakışması dahil) · §5.3
(adım sayfası arayüzü) · §5.4 (esnek tahsis arayüzü). Barış'ın bu oturumda verdiği üç tasarım
kararı (renk bandı: `gapStatement`'ın 3 alanlı şemasına dokunmadan yalnızca render'a renk
bandı eklenir — Ultimate Goal alanı eklenmez; 5N1K: ayrı yeni format; esnek tahsis: ikisi
birden — varsayılan otomatik + manuel override) `DECISIONS.md`'ye D-162–D-164 olarak yazıldı;
B2 bunları yeniden sormadan girdi olarak alır.

---

## 14. Blok görsel dili, adım arayüzü, esnek tahsis arayüzü — Oturum B2 çıktısı, 2026-08-06

> D-149'un dört oturumundan ikincisinin ikinci yarısı. `docs/oturumlar/B2-gorsel-dil-arayuz.md`
> §5.2–§5.4'ü yürütür (= `B-adim-anatomisi.md`'nin özgün §5.2–§5.4'ü). Girdi: §12 (sayfa
> sözleşmesi) + §13 (B1'in altı çalışma sayfası bulgusu) + `reference/visual/`'daki iki görsel,
> ikisi de bu oturumda elle açıldı. **Kod YAZILMADI** — bu da bir tasarım/karar oturumu.

### 14.0 İş sırasında Barış'tan gelen ek girdi — kayda geçmesi gereken bir düzeltme

İşe başlarken sorulan üç açık sorudan sonra, ADIM 1 tasarlanırken Barış kendi elleriyle
işaretlediği bir ekran görüntüsü paylaştı (iki bölgeli bir taslak: sol "problemin net tanımı"
+ sağ "müşteri/güvenlik/kalite/teslimat/maliyet etkisi"). İki soru soruldu ve netleşti:

- **D-159'un tek-sütun geometrisi AÇILMADI.** Taslak yalnızca bir kavram notuydu, ADIM 1'in
  567 pt'lik tek sütununu ikiye bölme talebi değildi. §12.8'in "tam oturuyor, boşluk yok"
  ölçümü aynen geçerli.
- **Ama yeni bir içerik talebi gerçek:** "kalitenin sağlayacağı Pareto ve maliyet analizi
  (problemin yarattığı aylık/senelik mali kayıp)" ADIM 1'e **yeni, özel bir plugin** olarak
  girecek — mevcut ADIM 2 `pareto`'sunu referanslamak değil, D-132'nin "yanına ekle, mevcudu
  değiştirme" emsaliyle tutarlı bağımsız bir kart. Bu, D-163'ün 5N1K'ya verdiği cevapla aynı
  desen. Aşağıda §14.2'de adı **`problem-impact`** olarak geçiyor; tasarımı bu oturumun işi,
  inşası Oturum C'nin.

### 14.1 Genişletilmiş anlamsal palet — palet çakışmasının çözümü

`reference/README.md`'nin bloklayıcı uyarısı: `5N-1K.jpeg`'in altı ayırt edici rengi ile
LeanUK'ın dört anlamsal rengi (sarı/yeşil/mavi/kırmızı) aynı blokta (ADIM 1) yan yana geliyor.
İki seçenek soruldu — **Barış'ın kararı: nötrleştirme değil, genişletme.**

**Yöntem:** tek bir 9-10 renklik karma palet değil, **iki bağımsız, sıfır-örtüşmeli katman.**
Her katmanın kendi sabit anlamı var ve ikisi asla aynı hücrede/aynı görsel role rekabet etmiyor:

**Katman A — Hedef-durum paleti (LeanUK kökenli, D-162 ile 3 renge indi):**

| Renk | Anlam | Gösterge (ONAYLANDI 2026-08-16, v2) | Kullanım alanı |
|---|---|---|---|
| Yeşil | İdeal / hedef | `#8FBF4F` | `gapStatement` renk bandı (ideal), P-31'in ADIM 7 KPI şeridinde "hedefe ulaşıldı" |
| Mavi | Mevcut / actual | `#4A90D9` | `gapStatement` renk bandı (actual), ADIM 7 KPI şeridinde "şu anki değer" |
| Kırmızı | Problem / gap | `#E0342A` | `gapStatement` renk bandı (gap), ADIM 7 KPI şeridinde "hedefin altında/gerisinde" |

Sarı (LeanUK'ın "ultimate goal"ı) D-162 ile düştü — bugün hiçbir yerde iddia edilmiyor,
ama **rezerve**: D-153'ün "Genel RAG" alanı (Oturum C adayı, §13.4.7) Red/Amber/Green
istediğinde, Amber bu boşluğa oturur ve Kırmızı/Yeşil zaten Katman A ile aynı anlamı taşır —
o karar bu oturumun işi değil, yalnızca palet bu genişlemeye kapalı değil diye kayda geçiyor.

**Katman B — 5N1K kategori paleti (6 yeni renk, Katman A ile SIFIR örtüşme):**

| Soru | Renk | Gösterge (başlangıç) |
|---|---|---|
| Ne? | Amber/altın | `#C68A2E` |
| Neden? | Mor (= `--color-accent` / "Indelible", D-49) | `#5F4470` |
| Nasıl? | Çam yeşili-mavi (teal) | `#2F7A6E` |
| Kim? | Gül kurusu | `#8B3A5C` |
| Ne zaman? | Sienna/kahve | `#8A5A3B` |
| Nerede? | Arduvaz gri-mavi | `#556677` |

Kırmızı/yeşil/mavi bilerek Katman B'nin dışında tutuldu — 5N1K'nın hiçbir sorusu "problem"
ya da "ideal" değil, birini bu üç renkten birine boyamak sahte bir anlam bağı kurardı.
Neden'e Indelible moru verilmesi kasıtlı: D-49'un "tek kalın vurgu" markası, uygulamanın
kendi kimliğini basılı çıktıya taşıyan tek nokta oluyor.

**Katman B'nin uygulanma biçimi — yeni bir mekanizma GEREKMİYOR.** 5N1K'nın altı hücresi
D-102'nin `zones` mekanizmasıyla döşenir (§14.2), ama hücrelerin konumu ve kimliği **sabit**
(her zaman aynı sırada Ne/Neden/Nasıl/Kim/Ne zaman/Nerede — plugin'in kendi şeması bunu
garantiliyor). Sabit konumlu, içerikten bağımsız bir renk, D-101'in şablon stil tablosunda
zaten var olan mekanizmayla (`blockHeaderPlan`/`Do`/`Check`/`Act`'in statik `fillColor`'ı,
§'de görülen legacy şablon örneği) **birebir aynı şekilde** çözülür: altı hücrenin dar üst
şeridi (etiket çipi — LeanUK'ın iki-hücreli kartuş deseninin küçük ölçekte tekrarı) şablonun
kendi statik stil tablosunda önceden boyanır; `renderToA3` yalnızca metni (etiket + kullanıcı
cevabı) o önceden-boyalı hücrelere yazar. `A3TextLine`'a yeni bir renk alanı eklemeye gerek
yok — bu, Faz 11'in şablon dosyası yazılırken (D-95, kapsam dışı) uygulayacağı bir stil
kararı, dinamik bir render kararı değil.

**D-47 (LOCKED, PDCA marka renkleri: plan=kırmızı, do=sarı, check=camgöbeği, act=yeşil) ile
ilişki — çakışma değil, iki ayrı katman.** D-47'nin dört rengi blok **başlık çubuğunun**
(kartuşun dar hücresi, hangi PDCA fazına ait olduğunu gösterir) rengidir; Katman A/B içerik
**dolgusudur**. Kırmızı ve yeşilin iki sistemde de görünmesi kasıtlı bırakıldı çünkü anlamları
tematik olarak örtüşüyor (Plan↔Problem, Act↔İdeal/standardize-edilmiş-iyi-durum) — aynı hücrede
yan yana gelmedikleri sürece bu bir çakışma değil, bir yankı. Katman B'nin altı rengi bilerek
sarı ve camgöbeğini de dışladı, üç katman aynı sayfada bir arada dururken hiçbir rengin iki
farklı anlam taşımaması için.

**Not — bu tablo bir başlangıç noktasıdır, piksel-kesin bir tasarım geçişi değil.** Hex değerleri
"drafting office" estetiğine (D-49) uygun, ölçülü doygunlukta seçildi ve küçük hücrelerde beyaz
metinle kontrast taşıyacak koyulukta tutuldu; Faz 11 şablon dosyası yazılırken gerçek basılı
sayfada görsel olarak doğrulanmalı (D-135'in ekran/baskı kontrast hatası tam bu yüzden — renk
kararları koddan önce görülmeden kilitlenmemeli).

> ✅ **ADIM 1 ONAYLANDI — 2026-08-16 (Oturum B3, D-171'in döngüsü).** 2026-08-06'daki canlı
> doğrulama turu Katman A'nın ilk hex değerlerini gerçek referansla
> (`reference/visual/LeanUK_PPS_A3_worked_example.png`'in "1.1 Gap Analizi"/"1.2 Problem
> Statement" panelleri, D-172 ile yüksek çözünürlüğe güncellendi) yan yana koyunca üç somut
> fark bulmuştu: (1) Gap Analizi'nde İdeal/Mevcut çubukları arasında farkı gösteren bir
> braket+ok+değer balonu **yoktu** — referansta var; (2) dolgu renkleri koyuydu (beyaz metin
> gerektiriyordu) — referans açık tonlar + siyah metin kullanıyor; (3) Problem Statement
> bantları uç-uca bitişikti — referansta ayrık, yuvarlak köşeli, siyah çerçeveli kartlar.
> Maket bu üç bulguya göre güncellendi (Katman A yukarıdaki tabloda artık kesin değerleriyle
> duruyor, Gap Analizi'ne SVG braket/ok/balon eklendi, Problem Statement kartlara çevrildi) ve
> dört doğrulama turundan (taşma düzeltmesi dahil) sonra Barış tarafından onaylandı. D-165
> aynı oturumda bu kesin değerlerle güncellendi.

### 14.2 ADIM 1 — üç zorunlu panel + iki opsiyonel ek

Geometri D-159'dan değişmeden alınıyor: 12 tuval satırı (156 pt), 567 pt genişlik, sıfır pay.

**Zorunlu üçlü (değişmeden, D-159 LOCKED):**

1. **5N1K şeridi** — 4 satır (52 pt), `zones`: 6 eşit bölge (widthFraction 1/6 ≈ 0.1667),
   her biri 94.50 pt genişlik. Her `zone.lines`'ın ilk satırı kalın etiket ("NE?"), Katman B'nin
   sabit renkli başlık çipine oturur (§14.1); ikinci satırdan itibaren kullanıcının cevabı, siyah
   mürekkep/beyaz zemin. **Yeni plugin** (D-163 — `five-g-5n1k` değiştirilmez), alan seti
   `reference/visual/5N-1K.jpeg`'in kendi sırasıyla: `ne`/`neden`/`nasil`/`kim`/`neZaman`/`nerede`.
2. **Gap analizi** — 8 satır (104 pt), sol yarı (283.5 pt). `gapStatement`'ın ideal/actual
   değerlerinin bir karşılaştırma grafiği — mevcut `trend`/`trajectory-chart` imageKind'ı
   yeniden kullanılabilir (LeanUK'ın "1.1 Gap Analysis" bar grafiğiyle aynı rol: Current vs
   Ideal, Ultimate Goal düştüğü için iki çubuk, üç değil).
3. **Problem statement** — 8 satır (104 pt), sağ yarı (283.5 pt). `gapStatement`'ın aynı üç
   alanı (D-162), üç yatay renk bandı olarak — Katman A: ideal=yeşil, actual=mavi, gap=kırmızı.
   Bantların rengi de §14.1'in "sabit konum → statik şablon stili" mantığıyla çözülür: üç bant
   her zaman aynı sırada olduğu için renk şablonda sabitlenir, `renderToA3` yalnızca metni yazar.

   Gap analizi ve problem statement **aynı `gapStatement` entry'sinin iki farklı görselleştirmesi**
   — LeanUK'ın kendi "1.1 Gap Analysis" (grafik) + "1.2 Problem Statement" (renkli metin bandı)
   ikilisiyle birebir aynı desen. Tek entry, `zones` ile iki yan yana bölgeye yayılıyor.

**İki opsiyonel ek — zorunlu üçlünün DIŞINDA, kendi ayrı entry'leri:**

4. **5G** (`five-g-5n1k`, şipping edilmiş) — kullanıcı seçerse, normal bir ADIM 1 entry'si
   olarak eklenir. Zorunlu üçlünün 12 satırlık tam-dolu tuvalinde kendi garantili yeri yok;
   §14.7'nin esnek tahsis mekanizmasına tabi (ADIM 1 büyürse yer bulur, büyümezse D-100 gereği
   ek sayfaya gider — kırpılmaz, kaybolmaz).
5. **`problem-impact`** (§14.0'ın yeni plugin adayı, Oturum C'nin inşa edeceği) — Pareto grafiği
   (mevcut `pareto-chart` imageKind'ı **aynen** yeniden kullanılır, yeni bir ChartSpec/imageKind
   gerekmez) + sabit alanlı bir mali kayıp formu (`fieldForm`/`FieldFormEditor` D-127 substratı:
   aylık kayıp, senelik kayıp, birim/para cinsi, hesap notu). 5G ile aynı muameleyi görür: normal
   bir entry, garantili panel yok, esnek tahsis + appendix-overflow güvencesiyle korunur.

   Bu, D-124'ün mimarisiyle tutarlı: `pareto`'nun ADIM 2'deki entry'sini ADIM 1'de "göstermek"
   değil, ADIM 1'e ait **kendi** Pareto verisini tutan yeni ve bağımsız bir entry.

### 14.3 P-31 — sağ kolonun dört izleme bloğu

Soru tek bir cevap değil, blok içeriğine göre ikiye ayrılıyor — dördüne aynı "KPI şeridi"ni
zorla giydirmek, içeriğe yalan söylemek olurdu:

**ADIM 5/6/8 — tablo/log içeriği, YENİ MEKANİZMA GEREKMEZ.** §12.6'nın kendi notu zaten
doğru teşhis koymuştu: "yalnız tablo". ADIM 5'in (`countermeasure`, `errorProofingHierarchy`,
`impactEffortMatrix`, `trialPlan`, `costApproval`…), ADIM 6'nın (`actionItem`,
`icaPcaTransition`, `trainingCommunicationRecord`, `trialResultLog`,
`implementationIssuesLog`) ve ADIM 8'in (henüz plugin'i yok — §13.4'ün 7-belge-türü/Yokoten/
Lessons-Learned adayları, Oturum C) içeriği zaten satır satır kompakt metin. Tek eklenecek şey
D-41'in **zaten var olan** şekil-kodlu durum göstergesi (kare/üçgen/daire) — her satırın başına,
Katman A rengiyle (yeşil=tamam, kırmızı=bloke/gecikmiş, mavi=devam ediyor) boyanmış küçük bir
glif. Bu yeni bir render mekanizması değil, D-41'in metne satır-içi bir uygulanışı.

> ✅ **ADIM 5/6/8 ONAYLANDI — 2026-08-16 (Oturum B3, D-171'in döngüsü, tek turda, "maket ok").**
> Glif üç farklı gerçek içerik biçimine, tek tip zorlanmadan uygulandı: ADIM 5 bir
> `countermeasure` alan-formu girişi (`fieldFormLines`'ın gerçek çıktısı — başlık + 5 alan satırı
> zaten 78 pt'lik 6 satırlık tuvali dolduruyor, glif yalnızca başlık satırında); ADIM 6 bir
> `implementationIssuesLog` satır-tablosu (her satır kendi kaydı, glif satır başına, alan yalnızca
> iki değerli olduğu için kare/üçgen kullanıldı, üçüncü şekil zorlanmadı); ADIM 8 henüz plugin'i
> olmadığı için 52 pt'lik en dar tuvalde (4 satır, sayfanın en sıkısı) yalnızca geometrik bir
> okunabilirlik testi. Referans: LeanUK'ın kendi "Schedule Key" lejantı (Plan/Actual/Delay,
> desen+renk) — D-41'in "şekil taşır, renk pekiştirir" ilkesinin aynı dosyadaki emsali. Gerçek
> durum sözlükleri koddan okundu ve tek biçimli olmadığı bulundu (`countermeasure` 3 değerli,
> `implementationIssuesLog` 2 değerli, `actionItem`'ın hiç durum alanı yok) — bir kare/üçgen/daire
> eşleme kuralı bugün hiçbir yerde yazılı değil, **P-37**'ye kaydedildi, tasarlanmadı. Karar:
> **D-179**. Bu, D-171'in bu tur için önerdiği son blok — B3'ün blok blok doğrulama döngüsü
> burada kapanıyor.

**ADIM 7 — gerçek KPI-izleme içeriği, TEK yeni mekanizma.** B1'in kendi bulgusu (§13.1,
`Data Analysis` sayfası: KPI·Actual·Target·Phase) doğruluyor: bu blok gerçekten önce/hedef/
sonra verisi tutuyor ve bugün **hiçbir şipping edilmiş plugin'i yok** (registry taraması: Adım
7'ye kayıtlı tek şey `genericText`). CHART_ROW_SPAN=10'un buraya sığmaması (567×78 pt, 7.27:1)
gerçek bir engel, çünkü tam boy bir Pareto/Trend grafiği zaten geometrik olarak imkânsız.

Öneri: yeni bir `A3ImageKind` — **`"kpi-strip"`** — 78 pt'lik dar kutuya özel, yatay bir şerit:
her metrik için küçük bir "karo" (etiket + taban→hedef→sonuç üç değer + tek satırlık mini
gösterge — dolu/boş çubuk ya da üç noktalı ilerleme işareti), rengi Katman A (hedefe ulaşıldıysa
yeşil, devam ediyorsa mavi, hedefin gerisindeyse kırmızı). `ChartSpec`'e D-102/D-141'in zaten
kurduğu "tek kind, `spec.kind`'a göre çoğullaşan varyant" deseniyle bir `KpiStripChartSpec`
eklenir (`items: { label, baseline, target, actual, unit }[]`). **Bu, D-114'ün "dilim başına
tek mekanizma" disiplinine göre işaretlenmiş tek yeni mekanizma** — Adım 7'nin plugin'lerini
inşa edecek gelecekteki dilim (6d) bunu kendi tek-mekanizma bütçesi olarak almalı, distribution
chart'ın 6c'de aldığı rolün aynısı.

> ✅ **ADIM 7 ONAYLANDI — 2026-08-16 (Oturum B3, D-171'in döngüsü, tek turda).** Maket üç
> karo olarak çizildi — her biri bir dashed gri Önce/başlangıç çentiği, düz siyah Hedef/hedef
> çentiği+üçgeni, ve tek bir Katman A renkli Sonra/bugünkü-değer dolgusu (bullet-graph deseni).
> Katman A'nın üç durumu bilerek aynı maket içinde birlikte test edildi (Çapak Fire Oranı =
> mavi/devam ediyor, Kalıp Duruş Süresi = yeşil/hedefe ulaşıldı, Fire Maliyeti = kırmızı/hedefin
> gerisinde). İki gerçek referans, ikisi de bu turda ilk kez kullanıldı: Barış'ın imzaladığı
> EK-2905 dokümanının **dolu** ADIM 7 paneli — bu bölümün kendi "KPI · Önce · Hedef · Sonra ·
> Sürdürme · Sonuç" sütun adlarını (§12.4, o zaman yalnızca boş şablondan ölçülmüştü) gerçek
> verilerle doğruladı — ve LeanUK'ın kendi "Step 7 — Check Results" paneli, hedef-çizgili bar
> grafiğiyle ADIM 1'in onaylı Gap Analizi'yle aynı görsel dili konuşuyor; maketin bullet-graph
> seçimi doğrudan buradan geliyor. Barış maketi hiç düzeltme istemeden onayladı. Bir gerçek
> şema boşluğu bulundu ve düzeltilmedi — Sürdürme/Sonuç, yukarıdaki `KpiStripChartSpec`
> taslağında yok ama her iki gerçek referansta da var; maket ikisini karo alt satırına gömülü
> küçük metin olarak gösterdi, gerçek düzeltme (yeni alanlar) **P-36**'ya kaydedildi. Karar:
> **D-177**.

> ✅ **`kpi-strip` İNŞA EDİLDİ — Oturum C3, 2026-08-17.** `A3ImageKind = "kpi-strip"` +
> `KpiStripChartSpec` (P-36'nın Sürdürme/Sonuç düzeltmesi ilk yazımda gömülü) + Adım 7'nin ilk
> gerçek plugin'i (`src/methods/kpiStrip/`). Açık soru (durum rengini ne belirler?) kodlamadan
> önce Barış'a soruldu — **Seçenek A** seçildi: her KPI kaleminin kendi ayrık
> `status: onTarget | inProgress | behind` alanı var, kullanıcı Editor'de elle seçer; hiçbir
> yön (`lowerIsBetter`/`higherIsBetter`) bilgisi eklenmedi, P-37/D-180'in dört plugin'iyle aynı
> "hesaplanmamış durum" ilkesi beşinci kez uygulandı. Görsel, Recharts değil ham SVG olarak
> yazıldı (`KpiStripChart.tsx`) — bullet-graph'ın çentik+üçgen deseni doğrudan bir Recharts
> primitive'ine karşılık gelmiyor, ve açık `viewBox`'lı SVG D-105/D-113'ün `ResponsiveContainer`
> tehlikesini konu dışı bırakıyor. `CHART_ROW_SPAN = 6` bilinçli tercih: mevcut şablonun Adım 7
> bloğu (P37:AB54, 18 satır) çok daha fazlasına sığar, ama gelecekteki 8-adım şablonunun Adım 7
> tuvali yalnızca 78 pt/6 satır (§12.4/D-156) — Pareto/Trend'in `10`'u burada kullanılsaydı bugün
> sığar, Faz 11 şablon değişince sessizce kırılırdı. `rasterize.ts`'e dokunulmadı (jenerik
> `rendererMap[slot.kind]` dispatch, doğrulandı). TDD: schema/Editor/renderToA3 + kendi
> `xlsxSurvival.test.ts`'i (`distributionChart`'ınkiyle aynı desen — kendi `imageKind`'ını
> kaydettiği için `problem-impact`'in paylaşılan-renderer testinden farklı, yeni kaydın gerçek
> registry üzerinden uçtan uca çalıştığını kanıtlıyor), 19 yeni test. TR/EN i18n anahtarları
> birlikte eklendi.

### 14.4 ADIM 2 / 3 / 4 blok görsel dili

**ADIM 3 — zaten tasarlanmış, dokunulmadı.** D-38 (LOCKED) üç-bölgeli yatay şerit olarak
tamamen tanımlı ve `smartTarget` plugin'i zaten bu deseni uyguluyor (zones A/B/C, `trajectory-chart`
imageKind'ı). Bu oturum yalnızca doğruluyor: D-160'ın esnek taban (5 satır/65 pt) küçülmesinde
bile üç bölge orantılı küçülür, `placeZones.ts`'in yüzde-tabanlı `widthFraction`'ı buna zaten
izin veriyor — geometri değişmedi, yalnızca toplam yükseklik esnek.

> ✅ **ADIM 3 ONAYLANDI — 2026-08-16 (Oturum B3, D-171'in döngüsü, tek turda, "maket ok").**
> Yeniden tasarım değil hızlı doğrulama — maket `renderToA3.ts`'in gerçek bölge genişlikleriyle
> (181.44 / 226.80 / 158.76 pt, A/B/C) ve `TrajectoryChart.tsx`'in gerçek bar/çizgi renkleriyle
> (Kraft baseline, Indelible target, Danger "Bugün" çizgisi — Katman A/B'nin dışında üçüncü
> bağımsız bir renk kaydı, D-165/D-174'ün kuralı üçüncü kez doğrulandı) 567×78 pt varsayılan
> tuvalde çizildi ve düzenli/yalın okundu. Referans: LeanUK'ın "Step 4 — Target Setting" paneli
> (metin+grafik+grafik yatay şerit grameri). Sahne devam ediyor: baseline/target ADIM 1'in Gap
> Analizi'yle, "Bugün" noktası ADIM 7'nin Sonra değeriyle, taahhüt satırının tarih/sorumlusu
> EK-2905'in gerçek alanlarıyla aynı. Karar: **D-178**.

**ADIM 2 — en kalabalık blok, görsel dili değil ARAYÜZÜ asıl sorun (§14.6'ya bakınız).**
Tuval 567×338 pt (26 satır varsayılan), oran 1.68:1, grafik alıyor (Pareto/Trend/
distribution-chart, hepsi mevcut `A3ImageKind`'lar). On yöntem + generic burada toplanıyor —
görsel dil zaten tutarlı (hepsi ya `lines` ya `image`+`lines` üretiyor, D-99/D-102'nin ortak
sözleşmesi altında); asıl "düzensizlik" riski arayüz tarafında (§14.6).

**ONAYLANDI — Oturum B3, 2026-08-16 (D-174).** D-171'in döngüsü bir grafik girişi (Pareto) +
bir tablo girişi (Katmanlama Matrisi) birlikte gerçek 567×338 pt tuvalde denendi ve Barış
tarafından onaylandı. Üç somut karar kesinleşti: (1) **girişler dikey istiflenir, yan yana
bölünmez** — `place.ts` her girişe kendi tam-genişlik satır-payını ayırır (D-102), bu yüzden
maket bir üstte grafik (10 satır/130 pt, sabit `CHART_ROW_SPAN`) bir altta tablo (kalan 16
satır/208 pt) gösterir; bu, ilk oturumun yanlış varsayımı olan yan-yana bölünmenin düzeltmesi.
(2) **Pareto'nun bar/çizgi rengi Katman A/B'nin dışında, üçüncü bağımsız bir çift** —
`--steel`/`--graphite` (D-49'un token'ları) kullanıldı, `#4A90D9`/`#8FBF4F`/`#E0342A`'ya
(Katman A) ya da 5N1K'nın altı rengine (Katman B) hiç dokunulmadı; D-165'in "hiçbir renk iki
anlam taşımasın" ilkesi veri-görselleştirme bağlamına da genişletildi. (3) **tablo altındaki
boş alan kasıtlıdır** — D-158'in esnek taban modeli bir bloğu zorla doldurmaz, az girişli bir
ADIM 2 kendi tuvalinin tamamını kullanmak zorunda değildir. Referans: LeanUK'ın "Step 3 —
Problem Analysis & Breakdown" bölümünün kendi Pareto paneli ("2. Daily run time breakdown") —
çerçeveli beyaz panel + alt çizili numaralı başlık + lejant konvansiyonu doğrudan onaylandı.

**ADIM 4 — aynı desen, biraz daha az kalabalık.** Tuval 567×234 pt (18 satır varsayılan), oran
2.42:1. ~~`fishbone-diagram` imageKind'ı balık kılçığı/ağaç diyagramlarını (`fishbone`, `faultTree`,
`whyWhyTree`) zaten karşılıyor~~ **DÜZELTME (Oturum B3, TUR 3) — bu yanlıştı.** Kod okunduğunda
yalnızca `fishbone` gerçekten `image: {kind: "fishbone-diagram", ...}` üretiyor;
`renderFaultTreeToA3.ts` ve `renderWhyWhyTreeToA3.ts` **ikisi de** yalnızca girintili düz
`lines` üretiyor (`shared/nodeTree.ts`'in `treeLines`'ı), hiçbir imageKind kullanmıyor.
`causeEffectMatrix`/`pfmeaLinkage`/`comparativeAnalysis`/`fiveWhy`/`hypothesisVerification` de
düz `lines`. Bir ağaç/fishbone GİBİ görünen tek şey bugün gerçekten `fishbone` — diğer ikisi
(`faultTree`, `whyWhyTree`) kendi diyagram render'larını hiç almadı. Detay ve gerekçe: aşağıdaki
ONAYLANDI notu + P-35.

**ONAYLANDI — Oturum B3, 2026-08-16 (D-175), üç turda.** D-171'in döngüsü bir metin girişi
(5 Neden) + bir diyagram girişi (Fishbone, 6M) birlikte gerçek 567×234 pt tuvalde denendi.
**TUR 1** `layout.ts`'in gerçek koordinat mantığını birebir yansıtan bir maketti — omurgadan
kategoriye **dikey** dallar, kategori etiketinden **omurgaya daha uzak** konumlanan neden
kutuları (klasik Ishikawa'nın tersi, hem LeanUK'ın hem de sonradan gelen bir referansın
aksine). **TUR 2**'de Barış kendi çektiği bir referans fotoğraf paylaştı (klasik
İnsan/Makina/Malzeme/Metot balık kılçığı — 45° diyagonal dallar, kutusuz ok uçlu neden
"kaburgaları", sağ uçta ayrı bir etki kutusu) ve maket bu desene göre yeniden çizilip onaylandı
("bu sefer güzel olmuş"). **TUR 3**'te Barış 4.1'in (5 Neden) düz metin satırları olarak
kaldığını, 4.2'nin (Fishbone) aldığı görsel tasarım özenini görmediğini belirtti — panel 4.2'nin
ok/kutu diliyle tutarlı yatay bir zincire çevrildi, İÇERİĞİ de ADIM 1/2'nin genel problemini
tekrar etmek yerine 4.2'nin kendi "Gözü 3 parting line aşınması" nedenine inecek şekilde
değiştirildi — iki panel artık tek bir soruşturma gibi okunuyor, iki paralel restatement değil.
Dört somut karar kesinleşti: (1) **girişler dikey istiflenir** (D-102) ama fishbone'un
`renderFishboneToA3.ts`'i imajına `rowSpan` **vermiyor** — Pareto/Trend'in sabit
`CHART_ROW_SPAN=10`'unun aksine `place.ts` ona bloktaki kalan bütün satırları veriyor, bu yüzden
metin girişi diyagramdan **önce** sıralanmak zorunda, aksi hâlde ikinci giriş sıfır satır bulup
sessizce ek sayfaya düşer. (2) **fishbone'un görsel dili klasik diyagonal Ishikawa** — kategori
kutusu dalın en dışında, nedenler kutusuz düz metin + ok, altı kategori aynı sırada (6M, D-104
LOCKED, bu bir stil kararı). (3) **nedenler hâlâ renk/durum kodu taşımıyor** —
`FishboneCauseSchema`'da (D-103) durum alanı yok, D-165'in "hiçbir renk icat etme" disiplini
korundu. (4) **5 Neden paneli artık kendi görsel diline sahip** — yatay ok-zinciri (kaynak
neden → Why 1 → … → Why 4/kök neden), Why 4 kutusu kalın çerçeveyle vurgulanmış (renk değil).
Referans: LeanUK'ın "6. Direct Cause Investigation" paneli + Barış'ın kendi fotoğrafı (repoya
kaydedilmedi, jenerik öğretim örneği).

**Aynı turda, ayrı ve daha büyük bir bulgu: gerçek EK-2905 dokümanının kendi ADIM 4'ü.** Barış
`reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.pdf`'nin (kendisinin "Kontrol
Eden" olarak imzaladığı, tamamlanmış gerçek bir PPS) kendi Kök Neden Analizi panelini paylaştı.
Yapısı fishbone değil — dört alt-problem (ADIM 2'nin kendi Pareto kategorileriyle birebir aynı)
her biri birden çok paralel Neden-zincirine ayrılıyor, bazı zincirler kendi içinde tekrar
dallanıyor, her zincir ✓ (araştırıldı, kontrol altında) ya da ❌+KN{N} (doğrulanmış kök neden,
ADIM 5'in aksiyon tablosuna besleniyor) ile bitiyor — birebir uygulamanın `whyWhyTree` yöntemi
(çoklu dallanmaya izin veren düz `parentId` listesi). Kod okunduğunda üç somut boşluk çıktı,
üçü de P-35'e kaydedildi: whyWhyTree'nin hiç diyagram render'ı yok (yalnızca `lines`); şemada
✓/❌+KN terminal durumu için alan yok; kök neden düğümü bir entry değil bir ağacın içindeki tek
bir yaprak, ve D-124'ün "bir entry = bir izlenebilir düğüm" mimarisi düğüm-seviyesi referansı
desteklemiyor. **Fishbone'un onaylanan görsel dili bu bulgudan etkilenmiyor** — ikisi de gerçek,
bağımsız yöntemler; whyWhyTree'nin diyagramı ayrı, iyi tanımlanmış bir gelecek iş (Oturum C/D).

**Oturum C5 (2026-08-17): iki boşluk BİTTİ, üçüncüsü mimari karara bağlandı, inşası ertelendi
(D-184/D-185).** `WhyWhyTreeDiagram.tsx` — Fishbone'un React Flow deseninin birebir izleyicisi
ama kendi geometrisiyle: derinliğe göre sütun (`x = depth × 220`), yapraklar `flattenTree`'nin
derinlik-ilk sırasında ardışık satıra, iç düğümler çocuklarının satır ortalamasına (hafif bir
Reingold–Tilford), tek bir kök-etiket düğümü solda, gerçek EK-2905 panelinin tekrarlayan
zincir-ortası dallanmasını (bkz. yukarıdaki bulgu) test eden bir PROBE'la doğrulandı
(`layout.test.ts`). ✓/❌+KN{N} artık `WhyWhyNodeSchema`'nın opsiyonel `outcome` alanı — KN numarası
D-71 uyarınca **saklanmıyor**, `confirmedRootCauseNumbers` tarafından görüntüleme zamanında
türetiliyor. `renderWhyWhyTreeToA3.ts` Fishbone'u birebir izliyor: `rowSpan` yok — §12.5'in "1
grafik + 1 giriş" tavanı zaten tek bir diyagrama göre boyutlanmış, ve gerçek imzalı form
whyWhyTree'yi Adım 4'ün *tek* diyagramı olarak kullanıyor, Fishbone'la yan yana değil. Üçüncü
boşluk (düğüm-seviyesi referans) `AskUserQuestion` ile Barış'a soruldu — Seçenek A (D-116'yı
`targetNodeId?`ile genişletme) seçildi, ama **inşası bu dilimde YAPILMADI**: D-114'ün
dilim-başına-tek-mekanizma bütçesi zaten diyagrama harcanmıştı, ikinci bir mekanizma aynı
oturumda başlatılmaz. Karar D-185'te kayıtlı, inşası **P-39**.

**Onaylanan fishbone görsel dili `layout.ts`'in gerçek ürettiğinden üç noktada ayrılıyor** — bu
artık maket tercihi değil, ileride yazılacak somut bir kod işi: **P-34**'e kaydedildi (dal yönü
dikeyden diyagonale, neden konumu omurgadan-uzaktan kategoriye-yakına, yeni bir `effect`
düğümü). B3 kod yazmıyor; bu, `layout.ts`'e dokunacak ilk fırsatın işi.

### 14.5 "Düzenli ve yalın" — sekiz blok ortak grameri

LeanUK'tan (yapısı değil, yalnızca görselliği — D-150) alınıp sekiz bloğa **aynen** uygulanacak
beş unsur, her biri zaten var olan bir mekanizmaya bağlanıyor, yeni bir şey icat etmiyor:

| Unsur | Nerede yaşıyor | Durum |
|---|---|---|
| İki hücreli kartuş çubuğu (dar `ADIM N` + geniş başlık) | Şablonun statik blok başlığı hücreleri | Zaten var (legacy şablonda `blockHeaderPlan` vb.) — Rev00 tabanlı yeni şablon aynı deseni miras alır |
| Sınırlı anlamsal palet | §14.1 Katman A + Katman B | Bu oturumun çıktısı |
| Çerçeveli beyaz panel grafikler | `A3ImageRequest`/`renderImage` | Zaten var (D-102) — stil kararı (kenarlık) Faz 11'in şablon stil tablosuna yazılır |
| Numaralı alt paneller (`1.1`, `1.2`…) | Her panelin ilk satırı | Yeni kural: her panel/zone'un `lines[0]` kalın ve `"{ADIM}.{panel sırası} {başlık}"` biçiminde — örn. `"1.1 5N1K"`, `"1.2 Gap Analizi"` |
| Bilinçli boşluk | D-158'in esnek taban modeli | Zaten var — bir blok tabanına indiğinde geri kalan alan başka bloğa gider, hiçbir blok zorla doldurulmaz |

### 14.6 §5.2 — Adım sayfası arayüzü

**BİTTİ — Oturum C6, 2026-08-18 (D-187).** Bu bölümün geri kalanı tasarım kaydı olarak kalıyor;
mekanizma `src/methods/types.ts`/`registry.ts`/`MethodBand.tsx`'te koda döküldü.

**Sorunun boyutu, ölçüldü (registry taraması, tahmin değil — C6'da yeniden sayıldı, §5.2'nin
kendi tarihi eskimişti):**

| Adım | Kayıtlı yöntem sayısı (generic hariç) |
|---|---|
| 1 | 9 (`five-n1k`/`problem-impact` C2'de şipping edildi) |
| 2 | 10 — en kalabalık, P-31'in kendi tespiti doğru |
| 3 | 1 (`smartTarget`) |
| 4 | 9 |
| 5 | 7 |
| 6 | 5 |
| 7 | 2 (`kpiStrip`, `sustainmentAudit` — C3/C4'te şipping edildi, B2'de 0'dı) |
| 8 | 3 (`documentUpdatesTracker`, `yokotenTracker`, `lessonsLearned` — C4'te şipping edildi, B2'de 0'dı) |

`MethodBand.tsx` B2'de (kod okundu, o oturumda değiştirilmedi) `getMethodsForStep`'in
döndürdüğü listeyi **tek, eşit ağırlıklı, sarmalanan bir kart grid'i** olarak basıyordu —
sıralama yok, "önerilen" yok. Bu tam olarak ANAYASA.md'nin G6 deseni: on bloklu bir adım
sayfası, hiçbir faz "kullanıcı bu ekranda ne görür, hangisi varsayılan" sorusunu sormamıştı.

**Karar (şipping edildi): `MethodPlugin`'e opsiyonel bir alan — `tier?: "recommended" | "more"`.**
Belirtilmeyen plugin'ler `"more"` sayılır (geriye dönük uyumlu, migration gerektirmez — D-51'in
loose-schema felsefesiyle aynı ruh, ama bu kez TS tipinde). `MethodBand` iki bölüme ayrıldı:

- **Önerilen** — büyük kartlar, adım sayfası açılır açılmaz görünür, boş adımda varsayılan yol.
- **Diğer yöntemler** — küçük, daraltılmış bir `Button`/`aria-expanded` disclosure ("+ N diğer
  format"), bir tık uzakta ama ilk bakışta görünmez. `getMethodsForStep`'in sırası değişmedi;
  yalnızca render iki gruba bölündü. Boş "diğer" listesi (tüm yöntemler önerilen ise) disclosure'ı
  hiç render etmiyor.

**Önerilen atamaları (D-169'un editoryal kararı, C6'da kodlandı — Adım 4 hariç değişmedi):**

| Adım | Önerilen | Gerekçe |
|---|---|---|
| 1 | `gapStatement`, `fiveN1K`, `fiveW2H` | D-159'un zorunlu üçlüsü + genel problem çerçevesi |
| 2 | `stratificationMatrix`, `categoryBreakdown`, `pareto`, `trend` | D-132'nin kendi ayrımı: stratifikasyon + kategori + iki temel grafik |
| 3 | `smartTarget` | Tek yöntem, D-12/D-11 zorunlu |
| 4 | `fishbone`, `fiveWhy`, `whyWhyTree` | D-11'in kanonik TBP çerçevesi + D-176/P-35'in gerçek kanıtı (EK-2905'in imzalı ADIM 4 paneli bir Why-Why ağacı) — C6'da `AskUserQuestion` Seçenek B: hiçbiri çıkarılmadı, whyWhyTree üçüncü önerilen olarak eklendi |
| 5 | `countermeasure`, `weightedDecisionMatrix` | Kök karşı-önlem listesi + önceliklendirme |
| 6 | `actionItem` | Uygulama takibinin omurgası |
| 7 | `kpiStrip`, `sustainmentAudit` | C3/C4'te şipping edilen ikisi de — "diğer" boş kalır |
| 8 | `documentUpdatesTracker`, `yokotenTracker`, `lessonsLearned` | C4'te şipping edilen üçü de — "diğer" boş kalır |

**Varsayılan yol:** boş bir adıma girildiğinde, "Önerilen" bölümündeki kartlar doğrudan görünür
(mevcut `Button` birincil varyantı); "Diğer yöntemler" daraltılmış kalır. Format seçimi
mekanizması değişmedi — kullanıcı hâlâ bir kart seçip `EntryEditorDialog`'u açıyor (D-63'ün "tek
eylem, tek isim" ilkesi korunuyor); değişen yalnızca hangi kartların ilk bakışta görünür olduğu.

### 14.7 §5.3 — Esnek tahsis arayüzü

D-164: otomatik + manuel, ikisi birden. Etkileşim:

- **Otomatik (varsayılan, her zaman çalışır):** her blok kendi entry'lerinin toplam satır
  talebini bildirir (D-158'in mekanizması); talep 50'yi aşınca sınırlar D-160'ın tabanlarına
  kadar kayar. Kullanıcı hiçbir şey yapmadan çalışır — §14.2'nin 5G/`problem-impact` gibi
  opsiyonel entry'leri de bu mekanizmaya girer.
- **Manuel override:** blok sınırında küçük bir sürükle-tutamaç (`RightPanel`'in A3 önizlemesinde,
  D-133'ün zoom/pan kontrolleriyle aynı etkileşim katmanı) veya adım başlığında bir "büyüt/küçült"
  kontrolü. Kullanıcı bir bloğu elle bir değere **sabitlediğinde** (`pinned` bayrağı), o değer
  otomatik çözücünün girdisi değil **kısıtı** olur — çözücü kalan bloşları bu sabit değerin
  etrafında yeniden dağıtır, yine D-160'ın tabanlarını asla ihlal etmeden.
- **"Tabana dayandı" göstergesi (D-160'ın sorduğu soru):** blok tabanındayken kartuş çubuğunda
  küçük bir rozet/araç ipucu ("bu blok en küçük boyutunda"); büyütme tutamacı bu durumda devre
  dışı görünür (disabled, tıklanamaz) ama daraltma hep açık kalır — kullanıcı bir bloğu tabanın
  altına asla indiremez, D-160'ın "ADIM 3 sıfıra inemez" güvencesi arayüzde de görünür kılınıyor.
- **Sabitlemeyi geri alma:** her `pinned` blokta bir "otomatiğe döndür" kontrolü — kaldırıldığında
  blok yeniden içerik talebine göre nefes almaya başlar.
- **Taşma her zaman görünür:** bir blok sabitlenmiş/tabanında olsa bile, sığmayan entry D-100
  gereği ek sayfaya gider — arayüz bunu sessiz bırakmaz, entry'nin "birincil sayfada değil, ek
  sayfada" olduğunu `EntryRow`'da mevcut `a3Visibility` göstergesiyle (Faz 6'dan beri var) işaretler.

### 14.8 Bu oturumun kapsamadığı — Oturum C'ye / gelecek dilimlere kalan

- ~~`problem-impact` plugin'inin inşası (§14.2) — Oturum C.~~ **BİTTİ — Oturum C2, 2026-08-16.**
  `src/methods/problemImpact/`, D-181.
- ~~5N1K plugin'inin inşası (§14.2, D-163) — Oturum C / Faz 11.~~ **BİTTİ — Oturum C2, 2026-08-16.**
  `src/methods/fiveN1K/`, D-181.
- ~~`kpi-strip` `A3ImageKind`'ının + Adım 7 plugin'lerinin inşası (§14.3) — 6d'nin tek-mekanizma
  bütçesi.~~ **BİTTİ — Oturum C3, 2026-08-17.** `src/methods/kpiStrip/`, C3'ün kendisi.
- ~~Adım 8'in belge/Yokoten/Lessons-Learned plugin'leri (§13.4, §14.6) — Oturum C.~~
  **BİTTİ — Oturum C4, 2026-08-17.** `src/methods/documentUpdatesTracker/`,
  `src/methods/yokotenTracker/`, `src/methods/lessonsLearned/`; ayrıca Adım 7'nin
  `src/methods/sustainmentAudit/`'i (§13.4 madde 1). D-183.
- ~~whyWhyTree diyagramı + terminal-durum alanı (P-35'in ilk iki boşluğu) — Oturum C5.~~
  **BİTTİ — Oturum C5, 2026-08-17.** `src/methods/whyWhyTree/{layout,outcome,
  WhyWhyTreeDiagram}.ts(x)`, D-184. P-35'in üçüncü boşluğu (düğüm-seviyesi referans) karara
  bağlandı ama inşa edilmedi — D-185, **P-39**.
- ~~`MethodPlugin.tier` alanının ve iki-bölümlü `MethodBand` arayüzünün kodu (§14.6) — kod
  YAZILMADI, yalnızca tasarlandı.~~ **BİTTİ — Oturum C6, 2026-08-18.** `src/methods/types.ts`
  (`tier?` alanı), 19 plugin dosyası (`tier: "recommended"`), `MethodBand.tsx` (iki bölüm +
  disclosure), D-187. §2.4'ün açık sorusu (`AskUserQuestion`): Adım 4'e whyWhyTree üçüncü
  önerilen olarak eklendi (Seçenek B).
- ~~Esnek tahsisin sürükle-tutamaç UI'ının kodu (§14.7) — aynı şekilde tasarım, kod değil.~~
  **D-186 (2026-08-18): C6'dan Faz 11'e ertelendi, P-40.** Hedefi henüz yok — `budget.ts`
  bugün yalnızca `farplas-7step-tr`'nin statik satır aralığını okuyor, D-158/D-160'ın
  varsayılan/taban/çözücü modeli Rev00 tabanlı 8-adım şablonuna göre tasarlandı ve o şablon
  (D-95/D-157) henüz yok.
- Şablon dosyasının kendisi (`src/a3/templates/*`) — D-95, Faz 11, değişmedi.
- **P-39 (yeni, D-185)**: `EntryReference`'a opsiyonel `targetNodeId?: string` eklenerek
  düğüm-seviyesi adresleme — `findOrphanedReferences`/`findReferencesTo`/
  `listReferenceableEntries` düğüm varlığını da bilmeli, `EntryReferenceField` düğüm listelemeyi
  öğrenmeli. Henüz planlanmadı.
