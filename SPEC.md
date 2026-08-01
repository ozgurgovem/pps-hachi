# PPS A3 Studio — Functional & Technical Specification

> Save this file at the repo root as `SPEC.md`. It is the single source of truth for scope.
> `CLAUDE.md` holds the working rules. This file holds *what to build*.

---

## 0. Product in one paragraph

A cross-platform desktop application (macOS + Windows) that guides a user through the
8-step Toyota Practical Problem Solving (PPS) method and produces a standard,
landscape, single-page A3 report in Excel format. The app is a *coach*, not a form:
at every step it explains what the step is for, offers the correct standard method for
that step, opens a purpose-built editor for the chosen method, and refuses to let the
user skip the thinking. At any moment the user can see a live, pixel-accurate preview of
the A3 sheet, and export it to `.xlsx` with one click.

An optional AI assistant sits alongside the method. The user connects their own API keys
for Anthropic, OpenAI and Google in Settings, picks a model when creating a project, and
that assistant coaches, critiques, reads their data files and photos, drafts structured
content, and helps lay the A3 out well. It is a second pair of eyes on the engineer's
thinking, never a substitute for it. The full app works with no AI configured at all —
see §8.

**Target user:** quality / process engineers in automotive manufacturing (IATF 16949
context). They know PPS terminology. They do not want a wizard that talks down to them,
but they do want the method discipline enforced and the formatting done for them.

---

## 1. The method — non-negotiable domain model

### 1.1 The 8 steps (Toyota PPS / Toyota Business Practice), mapped to PDCA

| # | Step (EN) | Step (TR) | PDCA | Purpose — the question the step answers |
|---|-----------|-----------|------|------------------------------------------|
| 1 | Clarify the Problem | Problemi Netleştir | Plan | What is the gap between the ideal/standard and reality? |
| 2 | Break Down the Problem | Problemi Parçalara Ayır / Mevcut Durum Analizi | Plan | Where exactly, in what form, how often does the problem occur? Which slice do we attack first? |
| 3 | Set a Target | Hedef Belirle | Plan | What, how much, by when — measurably? |
| 4 | Root Cause Analysis | Kök Neden Analizi | Plan | Why does it happen, and can we prove it? |
| 5 | Develop Countermeasures | Karşı Önlem Geliştir | Plan→Do | What will we change, and why this option over the alternatives? |
| 6 | Implement (See Countermeasures Through) | Uygulama | Do | Who does what, by when, and was it actually done? |
| 7 | Monitor Process and Results | Sonuçları Kontrol Et | Check | Did the KPI move? Was the countermeasure executed as designed? |
| 8 | Standardize and Share (Yokoten) | Standardizasyon ve Yaygınlaştırma | Act | How do we lock it in and spread it? |

**Critical detail the app must get right:** Step 3 (Set a Target) is what distinguishes
the Toyota 8-step model from Imai's 7-step Kaizen model. It is frequently dropped in
practice. The app must make it a first-class, mandatory step.

**Second critical detail:** the fishbone / Ishikawa diagram belongs to **Step 4 (root
cause)**, not Step 2. Step 2 is about *stratifying and localizing* the problem with data
(Pareto, is/is-not, trend, gemba observation) to find the *point of cause*. Only then
does Step 4 ask *why*. If the app offers fishbone in Step 2 it teaches the method wrong.
Enforce this separation in the method library.

### 1.2 Step gate rules (the app coaches, it does not merely collect)

Each step has a `readiness` evaluation. Failing a rule shows a non-blocking amber
advisory in the step header; the user can proceed but the A3 preview marks the step
"provisional". Rules:

- **S1:** gap must be quantified (a number + unit + baseline period). A problem
  statement with no number is flagged.
- **S2:** at least one data-based entry (Pareto / trend / check sheet / stratification)
  must exist. A step-2 built only from opinion is flagged. Also flag if no
  point-of-cause is nominated.
- **S3:** target must be SMART — the form has explicit fields for metric, baseline,
  target value, unit, and due date, and all must be filled.
- **S4:** flag if no root cause has `verified = true`. Flag if any 5-Why chain
  terminates on a person ("operator made a mistake") — that is a symptom, not a root
  cause; require a systemic factor.
- **S5:** flag if any countermeasure is not linked to at least one verified root cause.
  Flag if the countermeasure sits at the bottom of the error-proofing hierarchy
  (training/procedure only) without a documented reason why prevention was not feasible.
- **S6:** flag any action with no owner or no due date.
- **S7:** flag if the result is recorded but the *process confirmation* (was it executed
  as designed?) is empty. If the target was not met, the app offers a one-click
  "Return to Step 4" that creates a new analysis round while preserving history.
- **S8:** flag if no document (SOP / PFMEA / Control Plan / work instruction) is marked
  as updated, and flag if the yokoten / read-across table is empty.

### 1.3 Method library per step

Every method is a plugin with its own editor UI, its own data schema, and its own
renderer into the A3 grid. This is the core extensibility mechanism.

**Step 1 — Clarify the Problem**
- Gap Statement (Ideal / Actual / Gap) — *default*
- 5W2H (What, Where, When, Who, Which, How, How much)
- Problem type classifier (below standard / raise the standard / inconsistent performance)
- SQDCM business-impact tagger (Safety, Quality, Delivery, Cost, Morale) with severity
- Voice of Customer / complaint record (customer, claim no., part no., PPM, date)
- Containment / Interim Containment Action (ICA) — *automotive; include effectiveness check, start date, exit criteria*
- Defect photo board with annotation (arrows, circles, callouts)

**Step 2 — Break Down the Problem / Mevcut Durum Analizi**
- Stratification matrix (by line / shift / machine / cavity / operator / supplier / date / product)
- Pareto chart (with cumulative % line and 80% cut)
- Trend / run chart (time series with target line and event markers)
- Check sheet / tally sheet
- Is / Is-Not analysis (Kepner-Tregoe grid)
- Process flow / SIPOC
- Spaghetti diagram (image upload + annotation)
- Value Stream Map (image upload + annotation)
- Histogram / scatter / box plot
- Gemba observation log (date, place, observer, what was seen, photos)
- Measurement system sanity check (is the data trustworthy? MSA / Gage R&R note)
- **Point of Cause (POC) nomination** — mandatory output of this step

**Step 3 — Set a Target**
- SMART target card (metric, baseline, target, unit, deadline, owner)
- Target-line chart (baseline → target trajectory)
- Stakeholder alignment note

**Step 4 — Root Cause Analysis**
- Ishikawa / Fishbone — selectable category sets: 4M (Man, Machine, Material, Method),
  5M1E (+ Measurement, Environment), 6M, 8P (service)
- 5 Why (linear chain)
- **3-Legged 5 Why** (Occurrence / Detection / Systemic-Management) — *the automotive standard; make this the recommended default for customer complaints*
- Why-Why logic tree (branching)
- Fault Tree Analysis (FTA) with AND/OR gates
- Cause & Effect (X-Y) matrix
- PFMEA linkage (reference the failure mode, current O/D ratings)
- **Hypothesis verification table** — for each candidate cause: verification method,
  evidence, verdict (confirmed / rejected / inconclusive). A cause is only promoted to
  "root cause" when `verified = true`.
- Comparative analysis (good part vs bad part / good line vs bad line)

**Step 5 — Develop Countermeasures**
- Countermeasure list, each linked to one or more verified root causes
- **Error-proofing hierarchy selector** (strongest → weakest): Eliminate → Substitute →
  Prevent (poka-yoke) → Detect → Warn → Procedure/Training. Display the strength
  visually; nudge the user upward.
- Impact / Effort matrix (2×2, drag-and-drop)
- Weighted decision matrix (Pugh) for comparing options
- Side-effect / risk assessment of the countermeasure itself
- Trial plan (scope, duration, sample size, acceptance criteria)
- Cost & approval fields

**Step 6 — Implementation**
- Action plan table / Gantt (action, owner, start, due, status %, evidence)
- ICA → PCA transition tracker (when does the interim action get removed?)
- Trial result log
- Training & communication record
- Before / After photo pairs
- Implementation issues log

**Step 7 — Monitor Process and Results**
- Result KPI chart: baseline / target / actual over time
- Before–Target–After comparison card
- **Process confirmation audit** (was the countermeasure executed as designed? date,
  auditor, findings) — separate from result confirmation; both required
- Statistical confirmation (capability Cp/Cpk, p-chart, defect rate)
- Realized cost-benefit
- Verdict: target met / partially met / not met → if not met, "Return to Step 4" loop

**Step 8 — Standardize and Share**
- Document update checklist: Work Standard/SOP, PFMEA, Control Plan, Work Instruction,
  Checklist, Training Matrix, Drawing, Maintenance Plan, Inspection Standard — each with
  document no., revision, date, owner, status
- Sustain plan (audit type, frequency, owner, LPA linkage)
- **Yokoten / read-across matrix** — similar line/process/product/plant, applicability,
  owner, target date, status
- Lessons learned entry (for a searchable knowledge base)
- Open items / next problem
- Closure & sign-off (prepared by, reviewed by, approved by, date)

---

## 2. Application structure

### 2.1 Launch screen

The first thing the user sees. It carries the product identity.

- Application name and logo, presented with confidence — this is the screen that makes
  the app feel like a product rather than an internal tool.
- Two primary actions, given equal visual weight and placed beside the identity, not
  below it: **New PPS Project** and **Open Existing Project**.
- Recent projects list: title, part/customer, owner, current step (as a compact 8-segment
  progress indicator), last modified, and a thumbnail of the A3.
- Secondary: import `.ppsx`, settings, language toggle (TR / EN), about.
- One orchestrated entrance animation on first paint. Respect `prefers-reduced-motion`.

**Name candidates** (pick one and commit; register it in `CLAUDE.md`):
`A3 Studio` · `Gemba` · `Hachi` (八 — eight) · `PPS Forge` · `Kaizen A3`

**Visual direction — read this before designing anything.**
Ground the identity in the subject's own world: the engineering drawing office and the
shop floor. Think drafting vernacular — a fine measured grid, hairline rules, revision
stamps, tolerance callouts, section markers, a plotter-pen quality to line work, and a
utility monospace face for data and part numbers paired with a characterful display face
for the identity. The A3 sheet itself is the hero object; the UI is the drafting table
around it.

Explicitly avoid the three looks that current AI-generated design defaults to:
(1) cream `#F4F1EA` background + high-contrast serif + terracotta `#D97757` accent;
(2) near-black background with one acid-green or vermilion accent;
(3) broadsheet layout with hairline rules, zero border-radius, dense newspaper columns.
Before writing CSS, produce a token plan — 4–6 named hex values, three type roles
(display / body / data-mono), a layout concept, and one signature element — then
critique it against the above and revise anything that reads as a default. Spend
boldness in one place only; keep everything else quiet.

Quality floor, unannounced: full keyboard navigation, visible focus rings, WCAG AA
contrast, reduced-motion respected, light and dark themes.

### 2.2 Project workspace

Three-region layout:

- **Left rail** — the 8 steps as a vertical stepper. Each shows: number, name,
  completion state (empty / in progress / complete / flagged), and entry count. Click to
  jump; the method does not force linear navigation, but jumping ahead from an empty
  step shows a gentle advisory.
- **Center** — the active step page.
- **Right panel** — collapsible, with two tabs:
  - **A3 Preview** — live thumbnail with "expand to full preview", and a badge when the
    current step's content overflows its cell budget.
  - **Assistant** — the AI conversation for this project, scoped to the active step. Only
    present when AI is configured and enabled (§8). When it is not, the panel shows the
    Preview tab alone with no empty AI affordance.

**Every step page has the same three bands:**

1. **Coach band** (collapsible, remembers state per step): what this step is for, what
   "good" looks like, the two or three most common failure modes at this step, and a
   worked micro-example. Written in the app's voice — plain, specific, no filler. Content
   is data, stored in `src/content/coaching/{tr,en}/step-N.md`, not hardcoded in
   components.
2. **Method band**: the method picker for this step. Cards showing method name, a
   one-line "use this when…", and a small preview of its output shape. Selecting a method
   opens its dedicated editor.
3. **Entries band**: the list of entries the user has created for this step, reorderable
   by drag, each with edit / duplicate / delete, and an A3 visibility control.

### 2.3 Multiple entries — the key requirement

Steps 2, 4, 5, 6, 7 and 8 accept an unlimited number of entries. Steps 1 and 3 accept
multiple entries too, but default to one.

Because the A3 is a single page, every entry carries an **A3 visibility** setting:

- `primary` — rendered inside the A3 sheet's step block
- `appendix` — omitted from the A3 sheet, rendered on a numbered appendix worksheet in
  the exported workbook, and referenced from the A3 block as "see Appendix A-3"
- `hidden` — kept in the project, excluded from all export

The A3 block for each step has a fixed cell budget. When the sum of `primary` entries
exceeds the budget, the preview shows an overflow warning with a one-click "move oldest
to appendix" fix. The export must never silently truncate content.

---

## 3. The A3 sheet

### 3.0 Templates — read `reference/TEMPLATE_ANALYSIS.md` first

The user supplied two real templates (`PPS_A3_Format_ENG.xls`, `PPS_A3_Format_TR.xls`).
They have been reverse-engineered to the cell in `reference/TEMPLATE_ANALYSIS.md`, which is
authoritative for all geometry. Two things follow that change the rest of this spec:

**The supplied templates are 7-step, not 8.** They merge "develop countermeasures" and
"implement" into one block. The app's `ProjectModel` stays 8-step regardless; a template is
a *projection* of the model onto a sheet. Never collapse the model to fit a template.

**Templates are data.** Four ship at launch — `farplas-7step-tr`, `farplas-7step-en`,
`farplas-7step-plus` (seven printed blocks, eight disciplines, via sub-bands inside the
STEP 5 box) and `pps-8step-auto` (the extended automotive variant, Template B). Default is
`farplas-7step-tr` until the fidelity test passes, then `farplas-7step-plus`. The user picks
one per project and can switch later without losing content. See the analysis document §6b,
§7 and §8; the `A3Template` type is defined in §8.

The block count on the sheet and the step count in the method are **separate decisions**.
The model is always eight steps. `farplas-7step-plus` exists because merging app-steps 5
and 6 has a measurable cost — in the supplied form the combined block gets 390 pt while
results get 540 pt, so deciding and doing together occupy less space than checking — and
sub-bands fix that without asking the organisation to re-approve its form.

Two corrections to §1.3 that come from the supplied files:

- Replace the SQDCM impact tagger in Step 1 with the **TPM loss taxonomy** the templates
  already use: Work Safety, Cost, Productivity, Quality, Maintenance, Human Resources,
  Environment. It is what the company reports against.
- Promote **5G + 5N1K** (Gemba, Gembutsu, Genjitsu, Genri, Gensoku / Ne, Nerede, Nasıl, Ne
  zaman, Ne kadar, Kim) to the recommended default method for Step 1. The supplied
  `Problem Tanımlama Formu` is stronger than the generic 5W2H card and should replace it as
  the default.

Also port: the **Work Plan** Gantt strip in the header, the **benefit / cost / B-C ratio**
footer with its € gain categories from `Onay formu` (model it as a first-class
`BenefitCase` on the project), and the **problem intake form** as the New Project dialog.

### 3.1 Fallback layout sketch — superseded by the analysis document

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Title │ Part/Product │ Customer │ Dept/Plant │ Owner │ Team │ Opened │    │
│         Rev │ Status │ Doc No.                                                    │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│ 1. CLARIFY THE PROBLEM        (Plan)   │ 5. COUNTERMEASURES            (Plan/Do) │
│    background, gap, impact, ICA        │    root-cause → action, strength, owner │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ 2. BREAK DOWN / CURRENT CONDITION      │ 6. IMPLEMENTATION                  (Do) │
│    Pareto, trend, stratification,      │    action plan / Gantt, before-after    │
│    gemba, point of cause               │                                         │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ 3. TARGET                              │ 7. RESULTS & CONFIRMATION       (Check) │
│    metric, baseline → target, by when  │    KPI chart, process confirmation      │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ 4. ROOT CAUSE ANALYSIS                 │ 8. STANDARDIZE & YOKOTEN          (Act) │
│    fishbone / 3-legged 5-why,          │    doc updates, sustain plan,           │
│    verification table                  │    read-across, lessons learned         │
├────────────────────────────────────────┴─────────────────────────────────────────┤
│ FOOTER: Prepared by │ Reviewed by │ Approved by │ Dates │ Signatures              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**CORRECTED 2026-08-01 against the source files.** The company form is **not** weighted:
B:O = 256.41 units, P:AB = 259.48 -> **49.7 % / 50.3 %**, the right column marginally the
wider. The 59/41 figure previously stated here came from a parser bug in the analysis; see
`reference/TEMPLATE_ANALYSIS.md` §9.2.

The *principle* — that understanding the problem deserves more of the page than solving it —
is still worth honouring, but it must be introduced as our own choice in `pps-8step-auto`,
never as a description of the company form. **Build `farplas-7step-*` to the balanced
split.**

Blocks are colour-coded by PDCA phase with a restrained, low-saturation palette that
survives monochrome printing.

**This diagram is superseded.** The real geometry is in `reference/TEMPLATE_ANALYSIS.md`
§3 — exact column widths, row heights, merged ranges, fills, fonts and print setup for the
supplied templates. Build from that, not from this sketch. The sketch survives only as an
illustration of the PDCA weighting principle — which the real templates, as verified against
the source files, do **not** honour: their split is 49.7 % / 50.3 %.

One property of the real template the app must handle: its content is ~1958 pt tall against
**813.5 pt** of printable height (margins verified at 6 / 6 / 5 / 5 mm), so Excel scales it
to about **41.5 %**. The grid was sized for
pasted screenshots and charts. Body text at 14 pt lands at roughly **5.8 pt** on paper — which is why type is sized from a
printed-legibility floor rather than inherited from the template (`DECISIONS.md` D-40). **Warn
the user when a block is filling with prose rather than graphics** — it will pass every
validation and be unreadable when printed.

### 3.2 WYSIWYG architecture — the most important technical decision

The in-app preview and the Excel export **must not** be two independent implementations.
They diverge within a week if they are.

```
ProjectModel (Zod schema, the only source of truth)
        │
        ▼
  buildA3Layout(project, template) ──▶ A3LayoutDescriptor
        │                              a pure, serializable description of the sheet:
        │                              grid (rows × cols with widths/heights in points),
        │                              blocks, merged ranges, cell values, styles,
        │                              image placements (anchor + size), page setup
        ├──────────────┬──────────────────────────────┐
        ▼              ▼                              ▼
  HtmlA3Renderer   XlsxA3Writer                 PdfA3Exporter
  (React, CSS      (Rust, rust_xlsxwriter)      (print pipeline)
   Grid, 1pt = 1px
   at 100% zoom)
```

Rules:
- `buildA3Layout` is pure and lives in shared TypeScript. It is unit-tested.
- The descriptor is serialized to JSON and passed to Rust for export. The Rust side
  contains **zero layout logic** — it is a dumb serializer of the descriptor.
- A golden-file test asserts descriptor stability across refactors.
- Charts are rendered once in the frontend (Recharts or visx), exported to PNG at
  2× or 3× scale, and embedded into the Excel as images. This guarantees the chart in
  the preview and the chart in the file are the same pixels. Do not attempt to rebuild
  charts with native Excel chart objects — that path guarantees divergence.

### 3.3 Excel export

- One workbook. Sheet 1 = `A3` (landscape, fit to one page, correct margins, print area
  and print titles set, header/footer with doc no. and page). Sheets 2..n = appendices,
  one per `appendix` entry. Final sheet = `Data` (a flat, machine-readable dump of the
  project for downstream analysis).
- Embedded images: defect photos, annotated screenshots, chart PNGs, fishbone renders,
  logos — anchored and sized to their descriptor placement, not floating.
- Freeze panes off, gridlines off, zoom 70% on open.
- Cell-level protection optional (a setting): lock the A3 sheet structure, leave
  designated fields editable.
- Filename default: `A3_{projectCode}_{shortTitle}_{rev}_{yyyymmdd}.xlsx`.
- Export performance: **the "20 images" figure is superseded.** Two of the five real company
  A3s carry 83 and 92 drawing objects (`docs/02_REAL_WORLD_FINDINGS.md` §2.5). Re-derive the
  budget in Phase 4 and state explicitly whether frontend chart rendering and PNG encoding
  are inside it. See `DECISIONS.md` P-13.

Also ship: PDF export (same descriptor), PNG export of the A3 sheet, and `.ppsx` project
export for sharing.

---

## 4. Data model & persistence

### 4.1 Project file format — `.ppsx`

A zip container. Portable, emailable, keeps images with the project, no database
dependency for sharing:

```
project.ppsx
├── manifest.json          schema version, app version, id, created, modified
├── project.json           the full ProjectModel
├── assets/
│   ├── img_{uuid}.png     originals
│   └── thumb_{uuid}.webp  cached thumbnails
├── charts/
│   └── chart_{uuid}.png   rendered chart images
└── history/
    └── {iso}.json         autosave snapshots (rolling, keep last 20)
```

### 4.2 Model sketch

```ts
type ProjectModel = {
  id: string
  schemaVersion: number
  meta: {
    title: string; projectCode: string; revision: string
    partNumber?: string; partName?: string; customer?: string
    plant?: string; department?: string; line?: string
    owner: Person; team: Person[]
    status: 'draft' | 'active' | 'on-hold' | 'closed'
    openedAt: string; closedAt?: string
    language: 'tr' | 'en'
    linkedRecords?: { type: '8D' | 'NCR' | 'CAR' | 'PFMEA' | 'ControlPlan'; ref: string }[]
    ai: {
      enabled: boolean
      providerId?: 'anthropic' | 'openai' | 'google'
      modelId?: string           // resolved at project creation, stored for provenance
      redaction: RedactionPolicy // see §8.11
    }
  }
  steps: { [K in StepId]: StepState }
  templateId: string
  signOff: { preparedBy?: SignOff; reviewedBy?: SignOff; approvedBy?: SignOff }
  rounds: Round[]          // step-7 failure → step-4 loop history
}

type StepState = {
  entries: Entry[]
  notes?: string
  readiness: ReadinessResult   // derived, not stored
}

type Entry = {
  id: string
  methodId: MethodId           // e.g. 'pareto', 'fishbone-4m', 'five-why-3leg'
  title: string
  order: number
  a3Visibility: 'primary' | 'appendix' | 'hidden'
  payload: unknown             // validated by the method plugin's Zod schema
  images: ImageRef[]
  createdAt: string; updatedAt: string
  author?: string
  provenance: Provenance       // see §8.13 — required, never optional
}

type Provenance = {
  origin: 'human' | 'ai-accepted' | 'ai-edited'
  model?: { providerId: string; modelId: string; promptVersion: string }
  generatedAt?: string
  acceptedBy?: string
  acceptedAt?: string
  editDistance?: number        // how much the human changed it, 0..1
}
```

Cross-step references are first-class: a countermeasure holds `rootCauseIds[]`; a root
cause holds `pointOfCauseId`; an action holds `countermeasureId`. The app renders these
as a traceability view ("show me the chain from problem to standard") and warns on
orphans. This traceability chain is what an IATF auditor asks for, and no generic A3
tool provides it — make it a headline feature.

### 4.3 Behaviour

- Autosave every 30 s and on every step navigation; visible "saved · 14:32" indicator.
- Undo / redo across the whole project (command pattern, 100-deep).
- Crash recovery from the newest history snapshot.
- Schema migrations on open: never fail to open an older project; migrate and inform.
- A local project library (SQLite index) so the launch screen's recent list works
  without opening every file.

---

## 5. Technical stack

**Recommended: Tauri v2 + React 19 + TypeScript.** Tauri v2 has been the default for new
cross-platform desktop projects since it went stable, and the reasons apply here: a ~5–10 MB
installer versus Electron's 100 MB+ matters for distribution over a corporate network, and
30–60 MB idle RAM matters for an app engineers leave open all day next to CAD and ERP
clients. The Rust backend is also where the fast, correct Excel writer lives.

```
Shell            Tauri v2 (macOS universal .dmg, Windows NSIS .exe only — no .msi, D-32)
Frontend         React 19 + TypeScript (strict) + Vite
Styling          Tailwind v4 + a custom token layer (no default theme)
Components       Radix primitives, styled to the token system — not an off-the-shelf look
State            Zustand + immer, Zod for all schema validation
Charts           Recharts (or visx if more control is needed), PNG export via canvas
Diagrams         React Flow for fishbone / why-tree / FTA node editors
Drag & drop      dnd-kit
Images           Rust-side sharp-equivalent (`image` crate) for resize/thumbnail
Excel            rust_xlsxwriter (Rust backend) — images, merges, print setup, formats
PDF              Tauri print pipeline from the same descriptor
i18n             i18next, TR + EN, all strings externalized from day one
Testing          Vitest (unit), Playwright (e2e), cargo test (Rust), golden-file tests
                 for the A3 descriptor and a byte-level xlsx regression test
Updates          tauri-plugin-updater

AI transport     Rust: reqwest + tokio, streaming via Tauri channels. All provider calls
                 originate in Rust. No provider SDK in the frontend, ever.
Key storage      Rust `keyring` crate → macOS Keychain / Windows Credential Manager
File ingestion   calamine (xlsx/csv), pdf-extract or pdfium (pdf), image crate (resize,
                 EXIF strip) — all Rust-side, all before anything reaches a provider
Token counting   provider-native counting endpoints where available, tiktoken-rs fallback
```

**Fallback:** if Rust-side Excel generation stalls the project, switch to Electron +
`ExcelJS`. Decide by the end of Phase 4 and record the decision in `CLAUDE.md`. Do not
carry both.

**Signing:** macOS requires an Apple Developer ID and notarization; Windows requires a
code-signing certificate (EV recommended to avoid SmartScreen warnings). Structure the CI
so unsigned local builds work from day one and signing is a late, isolated step.

---

## 6. Build phases

Ship something runnable at the end of every phase. Do not build the whole thing then test.

| Phase | Deliverable | Done when |
|-------|-------------|-----------|
| 0 | Repo, Tauri v2 scaffold, CI, both platforms build and launch | A window opens on macOS and Windows from a clean clone |
| 1 | Design system: tokens, type scale, components, dark/light | A component gallery route renders every primitive |
| 2 | Launch screen + project create/open/save `.ppsx` + recent list | A project survives quit and reopen with all fields intact |
| 3 | Workspace shell, 8-step navigation, coach band, entry CRUD, autosave, undo | User can create and reorder entries in all 8 steps with a generic text method |
| 4 | **A3 descriptor + HTML preview + xlsx export + the `farplas-7step-tr` template** | A project round-trips to `.xlsx`, and a **fidelity test** renders both the export and the original `PPS_A3_Format_TR.xls` to PDF and diffs the images — grid, merges, fills, fonts and print setup must be indistinguishable |
| 5 | Method plugins wave 1: **5G + 5N1K** (Step 1 default), Pareto, Trend, Is/Is-Not, SMART Target, Fishbone, 5-Why, 3-Legged 5-Why | Each has an editor, a Zod schema, and an A3 renderer |
| 6 | Method plugins wave 2: everything remaining in §1.3 | Method registry complete |
| 7 | Coaching content, readiness rules, traceability view, step-7→4 loop, appendix overflow | All gate rules fire correctly against a deliberately-bad test project |
| 8 | **AI foundation**: provider abstraction, keychain storage, Settings tab, connection test, model discovery, streaming chat panel, provenance plumbing | All three providers answer a trivial prompt through the same interface; keys are provably absent from disk, logs and the webview |
| 9 | **AI structured generation**: `generateStructured` per provider, per-step prompt library, proposal→accept/edit/reject flow, file & image ingestion, redaction layer | The assistant can propose a valid Pareto entry from an uploaded xlsx and the user can accept it into the project with correct provenance |
| 10 | **AI review & layout**: A3 placement optimizer, condensation to cell budget, mock-auditor review, TR↔EN translation, cost meter | Assistant rewrites an overflowing A3 into budget without losing meaning, and flags a weak root cause on a deliberately-bad project |
| 11 | Remaining templates (`farplas-7step-en`, `pps-8step-auto`), template switching, `BenefitCase` and the `Onay formu` calculator | Switching a project between all three templates preserves every entry and warns before anything moves to an appendix |
| 12 | Polish, i18n TR/EN complete, PDF/PNG export, packaging, signing, auto-update | Signed installers for both platforms |

Phases 8–10 are additive. Everything before them must remain fully functional with AI
switched off, and that stays true after them — verified by a Playwright suite that runs
the whole happy path with no keys configured.

---

## 7. Explicit non-goals for v1

Say no to these now so they do not creep in:

- No cloud sync, no accounts, no server. Local files only.
- No real-time multi-user collaboration.
- No mobile app (Tauri v2 could target it later; not now).
- No ERP / MES / QMS integration (design the `Data` sheet and `.ppsx` so it is possible later).
- No 8D report generation (v2 candidate — the data model already supports it).
- No hosted AI. The app never proxies through our own server and we never hold a key.
  Bring-your-own-key only. If that changes it is a business decision, not an engineering one.
- No local/offline models in v1 (Ollama and friends are a natural v2 — keep the provider
  interface clean enough that adding one is a single adapter).
- No AI agent that acts autonomously on the project. Every AI output is a proposal a human
  accepts. There is no "let it fill the whole A3" button and there will not be one.

---

## 8. AI assistant layer

### 8.1 Principles — read these before designing anything in this section

**The assistant coaches; the engineer decides.** PPS works because a team goes to the
gemba, looks at the actual process, and thinks. An AI that fills in the A3 produces a
beautiful document and zero learning, and the root cause it invents will be plausible and
wrong. So the assistant's default posture is Socratic: it asks, challenges, points at
gaps, and offers options with trade-offs. Drafting is available but is always the second
move, never the first.

**Nothing enters the project without a human accepting it.** The assistant emits
*proposals*. A proposal renders in the panel with Accept / Edit & Accept / Reject. Only
Accept writes to `ProjectModel`. There is no path from a model response to project state
that skips a human. This is a hard architectural rule, not a UX preference.

**Provenance is mandatory.** An IATF auditor asking "how did you establish this root
cause?" must not receive "the AI wrote it". Every entry records whether it came from a
human, was AI-proposed and accepted as-is, or was AI-proposed and edited — with model,
date and who accepted it (§8.13).

**The app is fully functional with no AI.** Offline-first is not a fallback mode, it is
the base product. AI is a layer on top that can be switched off per install, per project,
or mid-project.

**The user's data is the user's.** This is automotive manufacturing data — customer
names, part numbers, defect rates, supplier issues. Some of it is contractually
confidential. The app is explicit about what leaves the machine, offers redaction, and
never sends anything the user has not consented to.

### 8.2 Provider abstraction

One interface. Three adapters. Feature code never knows which provider it is talking to.

```rust
// Rust side — the only place provider APIs are touched
trait LlmProvider {
    fn id(&self) -> ProviderId;                       // anthropic | openai | google
    async fn list_models(&self) -> Result<Vec<ModelInfo>>;
    async fn test_connection(&self) -> Result<ConnectionStatus>;
    async fn complete(&self, req: CompletionRequest, tx: Channel<StreamEvent>) -> Result<CompletionMeta>;
    async fn complete_structured(&self, req: StructuredRequest) -> Result<serde_json::Value>;
    fn capabilities(&self) -> Capabilities;           // vision, pdf_native, json_schema,
                                                      // caching, max_context, cost_per_mtok
}
```

```ts
// TS side — what features actually call
const proposal = await ai.propose({
  step: 4,
  methodId: 'five-why-3leg',
  schema: FiveWhy3LegSchema,        // Zod, converted to JSON Schema for the provider
  context: buildStepContext(project, 4),
  attachments: [...],
  mode: 'critique' | 'draft' | 'extract' | 'review',
})
```

Adapter notes — **verify all of this against current provider docs before implementing,
do not code from memory, these APIs move fast**:

| | Anthropic | OpenAI | Google |
|---|---|---|---|
| Endpoint | Messages API | Responses / Chat Completions | `generateContent` |
| Structured output | tool use with an input schema | JSON Schema structured outputs | `responseSchema` |
| Vision | base64 or URL image blocks | image content parts | `inlineData` parts |
| Native PDF | yes | yes | yes |
| Streaming | SSE | SSE | SSE |
| Caching | prompt caching | prompt caching | context caching |

**Do not hardcode model lists.** Call each provider's models endpoint at connection time,
cache the result for 24 h, and keep a small fallback list in config. Hardcoded model IDs
go stale within months and produce confusing failures.

Capability differences are handled by the adapter, not by feature code. If a selected
model cannot do vision, the adapter reports it and the UI disables image attachment with
a clear reason — it does not silently drop the image.

### 8.3 API keys and security

This is the part that is easy to get wrong and expensive to get wrong.

- Keys are stored in the **OS keychain** via the Rust `keyring` crate — macOS Keychain,
  Windows Credential Manager. Never in `localStorage`, never in a JSON config file, never
  in the `.ppsx`, never in an env var written to disk.
- **Keys never cross into the webview.** The frontend calls `invoke('ai_complete', …)`;
  Rust reads the key from the keychain, makes the HTTPS call, and streams results back
  over a Tauri channel. A key that never enters the renderer cannot be exfiltrated by
  anything running in the renderer.
- Consequently the Tauri CSP does not need `connect-src` entries for provider domains.
  Keep it locked down.
- The UI shows a key as `sk-ant-…4f2a` after saving and can never display it in full
  again. Re-entry replaces; there is no "reveal".
- Keys are redacted from logs, crash reports and error messages by a scrubber applied at
  the logging sink, not by hoping call sites remember.
- "Test connection" makes the smallest possible real request and reports latency, the
  resolved model list, and any billing/quota error verbatim.
- On uninstall, offer to remove keychain entries.

### 8.4 Settings → AI providers

A tab in Application Settings. One card per provider:

- Provider name, connection state (Not connected / Connected / Error with the actual
  message), API key field (masked, paste-friendly), **Test connection**, **Remove key**.
- Model selector populated from the live model list, plus a **default model** for new
  projects and an optional **fast model** used for cheap background work like
  condensation and translation.
- A link to where that provider issues keys.
- Per-provider data-handling note stating, plainly, that requests go directly from this
  machine to that provider and are subject to that provider's retention policy — with a
  link. Do not paraphrase provider policies in our own words; link to them.

Below the cards, global AI settings:

- Master **Enable AI assistance** switch (off by default on a fresh install).
- **Redaction policy** (§8.11): off / mask customer names / mask customer + part numbers /
  custom term list. Live preview showing a sample request before and after redaction.
- **Monthly spend cap** and current usage, with the behaviour at the cap (warn / block).
- **Attachment policy**: max file size, whether photos are downscaled before sending
  (default yes, 1568 px long edge), whether EXIF is stripped (default yes).

### 8.5 Choosing a model per project

The New Project dialog has an AI step: enable or skip, choose provider, choose model,
choose redaction policy. Only providers with a working connection appear; the rest show
"configure in Settings" and link there.

The choice is stored in `meta.ai` and can be changed mid-project from the project header.
Changing it does not rewrite existing provenance — an entry generated by one model keeps
that attribution forever.

If a project is opened on a machine where the recorded provider is not configured, the
project opens normally in offline mode with a single non-blocking notice.

### 8.6 What the assistant does at each step

The assistant is always scoped to the active step and receives the project's cross-step
context. Four modes, selectable in the panel and defaulted per step:

**Critique** (default) · **Draft** · **Extract** (pull structure out of an attachment) ·
**Review** (mock auditor)

| Step | What good assistance looks like here |
|---|---|
| 1 | Is the gap quantified? Is a solution smuggled into the problem statement ("we need a new fixture" is not a problem)? Fill 5W2H holes. Extract customer, part, PPM and dates from an uploaded complaint or 8D document. Suggest containment options and their exit criteria. |
| 2 | Read the uploaded production/quality data and propose stratification dimensions worth testing. Generate Pareto and trend specs from real columns. Name the vital few. Ask the uncomfortable question: is this measurement system trustworthy? Challenge a point-of-cause nominated without data. |
| 3 | Turn a vague target into SMART. Sanity-check it against the baseline — a 90% reduction in four weeks with no capital gets challenged, not congratulated. |
| 4 | Seed fishbone branches by 4M from the actual process description, not generic examples. Test each Why link for causality rather than correlation. Detect the "operator made a mistake" dead end and push for the systemic factor. Propose a concrete verification method and evidence type for every hypothesis. For customer complaints, insist on all three legs — occurrence, detection, systemic. |
| 5 | Propose countermeasures per verified root cause, classify each on the error-proofing hierarchy, and say plainly when a proposal is weak. Predict side effects. Populate an impact/effort matrix with reasoning, not vibes. |
| 6 | Draft the action plan from the accepted countermeasures. Flag missing owners and dates. Draft the ICA removal criteria. |
| 7 | Analyse before/after data, run the appropriate check, and give an honest verdict on whether the target was met. If not met, say which root cause is most likely to have been wrong and what to re-examine in step 4. |
| 8 | Propose which documents need updating based on what actually changed. Propose read-across candidates from the project's own context — other lines, cavities, part families, plants. Draft the lessons-learned entry in language a future searcher would use. |

Cross-cutting: **A3 layout optimization** (§8.10), **TR↔EN translation** of any field or
the whole report, and **final review** — a pass over the finished A3 in the voice of a
customer quality auditor, listing what would be questioned.

### 8.7 Structured output contract

Free text is for the chat panel. Anything destined for the project is structured.

- Every method plugin already owns a Zod schema. Convert it to JSON Schema and hand it to
  the provider's native structured-output mechanism. Never parse prose into fields.
- Validate the response against the Zod schema on return. On failure, retry once with the
  validation errors appended; on second failure, surface the raw response to the user as
  text and do not write anything.
- Prompts are versioned files under `src/ai/prompts/{step}/{methodId}.{version}.md`, not
  string literals in components. The version string goes into provenance so a bad prompt
  can be traced later.
- Each prompt file declares its mode, its required context slices, and its output schema
  reference in front-matter.

### 8.8 Charts, tables and diagrams — the model emits a spec, not a picture

The AI must **not** generate images. It emits data and the app renders.

- **Charts** → a `ChartSpec` (type, series, axes, labels, target line, annotations). The
  app renders it with the same Recharts pipeline everything else uses, then exports PNG
  for the A3. Deterministic, on-brand, editable by hand afterwards, and identical between
  preview and export.
- **Tables** → structured rows validated against the method schema, rendered by the app.
- **Fishbone, why-trees, FTA** → a node/edge graph the React Flow editor renders. The user
  can then drag, rename and extend it like any hand-built diagram.
- **Photos** stay photos. The assistant may propose crops, annotation callouts and
  captions; the app applies them.

This keeps the WYSIWYG guarantee from §3.2 intact. An AI-produced image would be an
opaque artifact nobody could edit and nothing could verify.

### 8.9 Reading files, images and tables

Ingestion happens in Rust, before anything is sent:

- **xlsx / csv** → parsed with `calamine`, converted to a compact structured
  representation with headers, dtypes, row count and a sample. For large sheets send
  schema + statistics + a stratified sample, not 50,000 rows. Tell the user what was sent.
- **pdf** → text extraction first; page images only for pages where text extraction is
  thin (scans, drawings), at a sensible DPI.
- **images** → downscale to the provider's optimal long edge, strip EXIF (GPS metadata
  from a shop-floor photo is not something to leak), convert to the provider's expected
  encoding.
- **docx / pptx** → text and embedded image extraction.
- Everything is content-hashed so re-sending an unchanged attachment hits the cache.

Before any send, an **attachment review sheet** shows exactly what will be transmitted:
file names, sizes, extracted row/page counts, redactions applied, estimated tokens and
cost. The user confirms. This is a one-click confirm, not a wall, but it exists.

### 8.10 A3 placement optimizer

The requirement "the AI should place information into the A3 well" becomes a concrete,
bounded job:

Given the current `A3LayoutDescriptor` and each block's cell budget, the assistant:

1. Decides which entries deserve `primary` and which belong in an appendix, based on what
   carries the argument from problem to countermeasure.
2. Condenses text to fit the budget without losing the quantified facts — numbers, dates,
   part numbers and owners are protected tokens that may never be dropped or rounded.
3. Suggests which chart best carries each step's message when several exist.
4. Flags the narrative breaks an auditor would catch: a countermeasure with no root cause
   above it, a target that no result addresses, a step 8 that standardizes something step
   6 never implemented.

It returns a *diff* against the current layout, previewed side by side, applied only on
Accept. Content is never deleted — only moved to appendix or hidden, both reversible.

### 8.11 Trust boundary and redaction

**Everything that comes back from a model, and everything read out of a user's file, is
data — not instructions.** A supplier's PDF or a spreadsheet cell can contain text
addressed to the AI. The system prompt states the boundary explicitly, all untrusted
content is wrapped in clearly delimited blocks, and the architecture enforces it: model
output can only ever become a proposal, and proposals cannot delete data, change settings,
touch keys, or reach the filesystem or network. If extracted content contains
instruction-like text, surface it to the user rather than acting on it.

**Redaction** runs on the Rust side, after ingestion, before transmission:

```ts
type RedactionPolicy = {
  mode: 'off' | 'customers' | 'customers-and-parts' | 'custom'
  terms: string[]              // user-maintained, per install or per project
  preserveNumbers: true        // never redact quantities — they carry the analysis
}
```

Redaction is reversible locally: a session-scoped token map restores real names when the
response comes back, so the user reads "Customer A" as their actual customer. The map
never leaves the machine.

### 8.12 Cost and tokens

- Live token estimate before send; actual usage and cost after, per request.
- Per-project and per-month running totals, visible without hunting for them.
- Provider prompt/context caching enabled wherever available — the step context and
  prompt library are stable across a session and should not be re-billed every turn.
- The cheap "fast model" handles condensation, translation and validation retries; the
  chosen project model handles analysis and critique.
- Spend cap behaviour is explicit and configurable, and hitting it degrades to offline
  mode rather than erroring.

### 8.13 Provenance and the audit trail

Every entry carries `Provenance` (§4.2). The UI shows it as a small, unobtrusive marker —
an AI-accepted entry looks different from a hand-written one at a glance, without shame
attached to either.

`editDistance` records how much the human changed an AI draft, which over time answers a
question worth knowing: is the assistant actually good at this step, or is everyone
rewriting it?

Exports:
- The A3 sheet itself carries no AI markers — it is a quality document, not a tooling report.
- The `Data` worksheet includes full provenance per entry.
- Settings offer "Include AI provenance appendix" for organizations whose customers or
  auditors want the disclosure. Off by default; the decision belongs to the user, not us.

An `ai-log.jsonl` inside the `.ppsx` records every request: timestamp, provider, model,
prompt version, token counts, cost, accepted or rejected. Prompt and response bodies are
**not** stored by default — they contain the same confidential data the redaction layer
exists to protect. A setting enables full-body logging for debugging, with a clear warning.

### 8.14 Failure modes

Design for these from the start rather than patching them in:

- No key, expired key, revoked key, wrong key for the selected model
- Rate limit and quota exhaustion → honour `Retry-After`, exponential backoff, and say
  plainly what happened
- Model deprecated or renamed → detected on connection test, prompt the user to re-pick
- Network offline, corporate proxy, TLS interception → detect and give an actionable
  message, and support an HTTPS proxy setting because many plants have one
- Context window exceeded → reduce context slices in a defined priority order and tell the
  user what was dropped, never silently truncate
- Stream interrupted mid-response → partial content is discarded, not half-written into a
  proposal
- Provider returns confidently wrong structured data → schema validation catches shape,
  and the accept step catches meaning. Both layers exist because both fail differently.

Every one of these degrades to a working offline app. None of them may lose user data.

---

## 9. Acceptance test — the one that matters

A quality engineer opens the app, creates a project for a real defect, works through all
eight steps using at least three different methods per step where applicable, uploads six
photos and generates two Pareto charts, hits Export, and opens the resulting `.xlsx` in
Excel on a different machine. The A3 sheet prints on one landscape A3 page, every image
and chart is present and correctly placed, nothing overflows, nothing is clipped, and the
sheet is visually identical to what the in-app preview showed.

If that passes, the product works.

**Second acceptance test, for the AI layer.** The same engineer connects one provider,
starts a new project with it, uploads a real production data spreadsheet and four defect
photos, and works through the eight steps with the assistant in Critique mode. At every
step the assistant challenges something the engineer had not considered, and at no point
does content reach the project without the engineer pressing Accept. The engineer then
disconnects the network mid-project. The app keeps working, the project saves and exports
correctly, and nothing is lost. Reopening the same project on a machine with no API keys
configured shows the full report with correct provenance markers.

If both pass, ship it.
