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
