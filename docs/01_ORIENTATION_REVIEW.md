# Orientation review — 2026-08-01

Response to `docs/00_KICKOFF.md` Message 1. Three parts: what is contradictory or wrong
across the four documents, the proposed repository structure with exact interface
signatures, and the Phase 0 task list.

Source verification of `reference/TEMPLATE_ANALYSIS.md` against the `.xls` workbooks
**could not be performed** — the files are not on disk. What was done instead is an
internal-consistency audit, recorded as §9 of that document. Summary in §1.1 below.

---

## 1. Contradictory, underspecified, or a bad call

Ordered by how expensive they get if we find them in the code instead of here.

### 1.1 Geometry — three arithmetic errors, one of them load-bearing

Full working in `reference/TEMPLATE_ANALYSIS.md` §9. Headlines:

- **The 1747.5 pt column budget does not exist.** Template A's own block map sums to
  **1657.5 pt** (left) and **1627.5 pt** (right). Template B is built to 1747.5 in both
  columns, so B is **90 pt taller than A** and the §7 claim that both "print identically
  and feel like the same family" is false. Template B geometry is blocked until this is
  resolved against the `.xls` (D-27).
- **§6b's "420 pt / 570 pt" contradicts the block map's 390 / 540**, and the wrong pair is
  copied into `SPEC.md` §3.0. The argument survives; the numbers do not.
- **TR left column is 215.50, not 215.24.**
- **The loss-type TR/ENG mismatch is unresolved and internally contradictory.** §6 item 9
  says TR has 8 categories (maintenance split into *Bağımsız* / *Profesyonel Bakım*); §4
  allocates `U3:AA3`, which is exactly 7 cells. The TR sheet cannot hold 8 categories in
  that range. This is precisely the item the verification brief asked about.

Everything else checked out: both column sums, the 59/41 split, the 1958 pt content height,
the 41 % print scale, all seven block heights, and the count of 46 merged ranges.

### 1.2 The preview is honest about the screen and silent about the paper

This is the biggest trap in the spec and it is currently invisible.

`SPEC.md` §3.2 specifies the preview at **1 pt = 1 px at 100 % zoom**. The sheet prints at
**~41 % scale**. So body text set at 14 pt looks comfortable in the preview and lands at
**5.7 pt on paper**. `TEMPLATE_ANALYSIS.md` §3 already says this outright — *"a trap for an
app that generates text"* — but §9's acceptance test is *"the sheet is visually identical
to what the in-app preview showed."* That test **passes on a document nobody can read.**

The warning specified ("warn when a block is filling with prose rather than graphics") is
necessary but not sufficient, because it is advisory and fires on density, not legibility.

**Recommendation:** the preview needs a second mode — *Print preview*, rendered at the
actual fit-to-page scale — and the acceptance test in §9 should be run in that mode. One
toggle, and it turns an invisible failure into a visible one. Decide before Phase 4, since
it changes what `HtmlA3Renderer` has to accept.

### 1.3 The plugin `readiness` signature cannot express half the gate rules

`CLAUDE.md` defines a plugin as `{ id, step, schema, Editor, renderToA3, readiness }`. But
`SPEC.md` §1.2's rules are mostly **cross-entry and cross-step**:

- S5 — *"flag if any countermeasure is not linked to at least one verified root cause"* —
  spans Step 5 and Step 4.
- S2 — *"flag if no point-of-cause is nominated"* — is a property of the *step*, not of any
  one entry.
- S8 — *"flag if the read-across table is empty"* — likewise.

A `readiness(payload)` that only sees its own entry can never evaluate these. This needs
**two layers**, and it is cheaper to design now than to retrofit: a plugin-local
`readiness` over its own payload, plus a step-level rule that receives the whole
`ProjectModel`. Signatures for both are in §2.3.

### 1.4 "Byte-level xlsx regression test" is not achievable as written

`CLAUDE.md` asks for it. `rust_xlsxwriter` writes a creation timestamp into `docProps`, and
zip entry ordering and compression levels can shift between crate versions. A byte-level
assertion will go red on a dependency bump and teach us to ignore it — the worst outcome
for a regression test.

**Recommendation:** unzip both, normalize the volatile fields (timestamps, app version),
and compare the XML parts structurally. Same protection, no false alarms. Recorded as P-08.

### 1.5 `.ppsx` forward-compatibility is asserted but not designed

*"An older `.ppsx` must always open"* (`CLAUDE.md`) is a hard rule. But `Entry.payload` is
`unknown`, validated by the plugin's own schema — so parsing a project file requires the
**method registry**, and a file containing a `methodId` this build does not know cannot be
validated at all.

Three cases are unspecified and they are different problems:
1. Known method, **older payload version** → needs per-plugin payload migrations.
2. **Unknown method** (removed, or from a newer build) → degrade to a read-only opaque
   entry that round-trips untouched, or refuse the file?
3. Older **schemaVersion** on `ProjectModel` itself → the migration chain in §4.3.

Only (3) is mentioned. (2) is the one that silently loses user data if we get it wrong —
an entry we cannot parse but silently drop is deleted on the next save. Recorded as P-05;
the registry signature in §2.3 reserves a slot for it.

### 1.6 Step 3 is "mandatory" and also non-blocking

`CLAUDE.md`: *"Step 3 is mandatory … the app must not let it be [dropped]."*
`SPEC.md` §1.2: *"Failing a rule shows a **non-blocking** amber advisory; the user can
proceed."*

Both cannot be true. Right now nothing enforces the one decision the document says
distinguishes this method from Imai's. Either S3 is a blocking gate (on export, most
likely — not on navigation), or `CLAUDE.md` is overstating and should be softened. This is
a product call, not an engineering one. Recorded as P-02.

### 1.7 Three templates or four, and who ships the default

- `SPEC.md` §3.0 and `TEMPLATE_ANALYSIS.md` §8: **four** templates ship.
- `SPEC.md` §6 Phase 11 done-condition: switching between **"all three"** preserves entries.
- No phase delivers **`farplas-7step-plus`** — yet `CLAUDE.md` makes it the default once the
  Phase 4 fidelity test passes. Phase 11 lists only `farplas-7step-en` and `pps-8step-auto`.

So the app's eventual default template currently has no delivery phase. Recorded as
P-03 / P-04.

### 1.8 "The same pixels" is not what the chart pipeline delivers

`SPEC.md` §3.2: *"Charts are rendered once in the frontend, exported to PNG at 2× or 3×
scale … This guarantees the chart in the preview and the chart in the file are the same
pixels."*

They are the same **content**, not the same pixels: the preview renders at CSS px, the
export rasterizes at 2–3× into an Excel anchor sized from the descriptor, and the sheet
then scales to ~41 %. The architecture is right; the guarantee is overstated, and it
matters because it is the sentence someone will quote when the chart label turns out
illegible on paper. Same fix as §1.2 — judge charts in print preview.

Related: the **< 3 s export budget for 20 images** (§3.3) does not say whether frontend
chart rendering and PNG encoding are inside the budget. They are the dominant cost and they
are not in Rust. Needs to be stated before it becomes a benchmark argument.

### 1.9 Redaction is reversible in the session and unspecified on disk

`SPEC.md` §8.11: redaction runs Rust-side before transmission; a **session-scoped** token
map restores real names when the response comes back, and *"the map never leaves the
machine."*

But an accepted proposal becomes an `Entry` in `ProjectModel` and is written to the
`.ppsx`. If what gets stored is the token, reopening the project next week shows
"Customer A" forever and the map is gone. If what gets stored is the real name, that is
correct — but it has to be said, because it is the opposite of what "session-scoped"
implies. Recorded as P-06.

### 1.10 Smaller things, worth a line each

- **`StepState.readiness` is declared on the model and annotated "derived, not stored".** If
  `ProjectModel` is a Zod schema (D-22) it will serialize. Keep it out of the schema and
  compute it in a selector.
- **`Provenance.editDistance: 0..1`** has no definition. Levenshtein over what — a JSON
  serialization? Normalized by which length? Across a structured payload this is not
  obvious, and an undefined metric is decoration. Define it or drop it.
- **Undo/redo (100-deep) + autosave (30 s) + history snapshots (last 20)** are three
  overlapping mechanisms with no stated interaction. Does undo cross an autosave? Does
  restoring a snapshot clear the undo stack? Cheap to answer now.
- **The SQLite recent-projects index** is a second source of truth for project metadata and
  will go stale when a file is moved or renamed outside the app. Needs a staleness rule
  (verify on launch, mark missing rather than delete).
- **React Flow → PNG for the A3 is materially harder than Recharts → PNG.** React Flow
  renders interactive DOM/SVG with transforms; getting a deterministic, correctly-cropped
  raster is a real task. Phase 5 assumes it works. Flagging it as the likeliest schedule
  risk in that phase.
- **`ai-log.jsonl` inside the `.ppsx`** travels with the file when the report is emailed,
  carrying model, prompt version, token counts and **cost**. Sending internal spend data
  out with a customer-facing report is a disclosure nobody asked for. Strip on share-export
  or make inclusion opt-in. Recorded as P-07.
- **New-project AI step needs an offline path.** §8.5 shows only providers "with a working
  connection", which requires a live call. §8.5 covers opening a project offline but not
  creating one. Small gap, easy fix.

---

## 2. Proposed repository structure

### 2.1 Layout

```
pps-hachi/
├── CLAUDE.md                       auto-loaded every session
├── SPEC.md
├── DECISIONS.md
├── README.md                       Phase 0 deliverable: clone → run, both platforms
├── docs/
│   ├── 00_KICKOFF.md
│   ├── 01_ORIENTATION_REVIEW.md    this file
│   └── PROVIDER_APIS.md            Phase 8: looked-up API facts + date checked
├── reference/
│   ├── TEMPLATE_ANALYSIS.md        + §9 arithmetic audit
│   ├── PPS_A3_Format_TR.xls        ← MISSING
│   └── PPS_A3_Format_ENG.xls       ← MISSING
│
├── src/                            frontend (React 19 + TS strict)
│   ├── main.tsx
│   ├── app/                        routes, providers, error boundaries
│   │   ├── routes/                 launch · workspace · settings · gallery
│   │   └── shell/                  left rail · center · right panel
│   ├── domain/                     ← pure. no React, no Tauri, no i18next.
│   │   ├── model/                  Zod schemas; ProjectModel, Entry, Provenance
│   │   ├── migrations/             schemaVersion N → N+1, one file each
│   │   ├── readiness/              step-level rules S1–S8
│   │   ├── traceability/           problem → cause → countermeasure → standard
│   │   └── benefit/                BenefitCase, B/C ratio (Onay formu)
│   ├── a3/                         ← the architectural spine
│   │   ├── descriptor.ts           A3LayoutDescriptor types
│   │   ├── buildA3Layout.ts        the pure function
│   │   ├── layout/                 measure · place · overflow · budget
│   │   ├── templates/              farplas-7step-tr | -en | -plus | pps-8step-auto
│   │   └── render/                 HtmlA3Renderer (React, CSS Grid)
│   ├── methods/                    ← plugins, one directory each
│   │   ├── registry.ts
│   │   ├── types.ts                MethodPlugin and friends
│   │   └── step-1/five-g-five-n-one-k/   { index.ts · schema.ts · Editor.tsx
│   │       …                                · renderToA3.ts · readiness.ts
│   │                                        · migrations.ts · *.test.ts }
│   ├── charts/                     Recharts specs → React → PNG (2×/3×)
│   ├── diagrams/                   React Flow: fishbone · why-tree · FTA
│   ├── ai/                         ← TS side only. NEVER calls a provider.
│   │   ├── client.ts               invoke() wrappers over Tauri commands
│   │   ├── proposal/               Proposal type + Accept/Edit/Reject flow
│   │   └── prompts/{step}/{methodId}.{version}.md
│   ├── state/                      Zustand + immer; command-pattern undo stack
│   ├── i18n/                       i18next; locales/{tr,en}/*.json
│   ├── content/coaching/{tr,en}/step-N.md
│   └── ui/                         tokens · primitives (Radix, styled to tokens)
│
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── commands/               the only IPC surface
│   │   ├── xlsx/                   descriptor → workbook. ZERO layout logic.
│   │   ├── ppsx/                   zip container read/write, history snapshots
│   │   ├── images/                 resize · thumbnail · EXIF strip
│   │   ├── ingest/                 calamine · pdf · docx — summarize before send
│   │   ├── ai/                     LlmProvider trait + 3 adapters + keychain
│   │   └── logging/                scrubber at the sink, not at call sites
│   └── tauri.conf.json
│
├── tests/
│   ├── golden/                     A3LayoutDescriptor snapshots
│   ├── fixtures/                   projects incl. a deliberately-bad one, TR data
│   └── e2e/                        Playwright; offline suite must stay green
└── .github/workflows/ci.yml        macOS + Windows
```

**The one rule that keeps this honest:** `src/domain/` and `src/a3/` import nothing from
React, Tauri, i18next, or the filesystem. If they stay pure, `buildA3Layout` is trivially
golden-testable and the Rust side can never grow layout logic by accident.

### 2.2 `buildA3Layout()`

```ts
// src/a3/buildA3Layout.ts

/**
 * Pure. Deterministic. Same inputs → byte-identical descriptor, always.
 * No Date.now(), no crypto.randomUUID(), no Intl default locale, no OS lookups.
 * This is what makes the golden-file test meaningful.
 */
export function buildA3Layout(
  project: ProjectModel,
  template: A3Template,
  registry: MethodRegistry,
  options?: BuildA3LayoutOptions,
): A3LayoutResult

export interface BuildA3LayoutOptions {
  /** Which language the *sheet* renders in. Independent of the UI language. */
  readonly locale?: Locale                    // default: project.meta.language
  /** Step-7 → Step-4 loop: which analysis round to render. */
  readonly round?: number                     // default: latest
  /** Emit appendix worksheets for `a3Visibility: 'appendix'` entries. */
  readonly includeAppendices?: boolean        // default: true
  /** Resolves ImageRef → intrinsic pixel dimensions. Injected, never read from disk. */
  readonly assets?: AssetResolver
}

export interface A3LayoutResult {
  readonly descriptor: A3LayoutDescriptor
  /** Overflow, orphaned cross-references, prose-density warnings. Never throws. */
  readonly diagnostics: readonly LayoutDiagnostic[]
}

/** Serializable to JSON and handed to Rust unchanged. */
export interface A3LayoutDescriptor {
  readonly schemaVersion: number
  readonly templateId: string
  readonly pageSetup: PageSetup            // A3 · landscape · fit 1×1 · margins · print area
  readonly grid: {
    readonly columns: readonly { key: string; widthUnits: number }[]
    readonly rows: readonly { index: number; heightPt: number }[]
  }
  readonly sheets: readonly SheetDescriptor[]   // [0] = 'A3', then appendices, then 'Data'
  readonly styles: readonly NamedStyle[]        // referenced by index; never inlined
}

export interface SheetDescriptor {
  readonly name: string
  readonly cells: readonly CellDescriptor[]     // { ref, value, styleIndex }
  readonly merges: readonly string[]            // "B2:AB2"
  readonly images: readonly ImagePlacement[]    // anchored + sized. never floating.
  readonly pageSetup: PageSetup
}

export type LayoutDiagnostic =
  | { kind: 'block-overflow';  step: StepId; budgetPt: number; requiredPt: number
    ; entryIds: readonly EntryId[] }
  | { kind: 'prose-density';   step: StepId; ratio: number       // text : graphics
    ; effectivePointSize: number }                                // ← §1.2
  | { kind: 'orphan-reference'; from: EntryId; missing: EntryId }
  | { kind: 'unknown-method';  entryId: EntryId; methodId: string }
```

Two properties worth stating explicitly, because they are what the design buys us:

- **`diagnostics` never throws and never truncates.** Overflow is reported, not silently
  fixed. §2.3's `SPEC.md` rule — *"the export must never silently truncate content"* — is
  enforced by the type: there is no code path that drops an entry.
- **`styles` is a table referenced by index.** Keeps the JSON handed to Rust small, and
  makes the golden file readable in a diff.

### 2.3 The method plugin interface

```ts
// src/methods/types.ts

export type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type MethodId = string & { readonly __brand: 'MethodId' }
export type Locale = 'tr' | 'en'

export interface MethodPlugin<S extends z.ZodTypeAny = z.ZodTypeAny> {
  readonly id: MethodId
  readonly step: StepId
  /** Source of truth for the payload type. TS type is z.infer<S>, never hand-written. */
  readonly schema: S
  readonly payloadVersion: number
  /** i18next keys. Never literals — D-23. */
  readonly labelKey: string
  readonly useWhenKey: string
  readonly defaultPayload: () => z.infer<S>

  readonly Editor: React.ComponentType<MethodEditorProps<z.infer<S>>>

  /** Pure. Returns DATA, not JSX — Rust has to consume this too. */
  readonly renderToA3: (ctx: A3RenderContext<z.infer<S>>) => A3BlockFragment

  /** Entry-local checks only. Cross-step rules live in domain/readiness — §1.3. */
  readonly readiness: (payload: z.infer<S>, ctx: ReadinessContext) => readonly Finding[]

  /** Payload migrations, oldest first. Required by "an older .ppsx must always open". */
  readonly migrations?: readonly PayloadMigration[]
}

export interface MethodEditorProps<P> {
  readonly value: P
  /** Immutable update — never mutate `value`. */
  readonly onChange: (next: P) => void
  readonly entry: EntryMeta
  readonly project: ProjectModel          // read-only; for cross-references
  readonly disabled?: boolean
}

/**
 * A plugin knows nothing about sheet coordinates. It describes its content in
 * block-local terms and states how much room it wants; buildA3Layout places it.
 * This is what makes "adding a method never touches the exporter" true.
 */
export interface A3RenderContext<P> {
  readonly payload: P
  readonly entry: EntryMeta
  readonly budget: BlockBudget            // { widthUnits, heightPt, columnKeys }
  readonly locale: Locale
  readonly t: (key: string, vars?: Record<string, string | number>) => string
  readonly assets: AssetResolver          // ImageRef → intrinsic px, no I/O
}

export interface A3BlockFragment {
  readonly minHeightPt: number
  readonly preferredHeightPt: number
  readonly rows: readonly FragmentRow[]   // cells: span, text runs, style token
  readonly images: readonly FragmentImage[]
  /** Content is moved to an appendix on overflow. It is never dropped. */
  readonly overflow: 'appendix' | 'must-fit'
}

export interface ReadinessContext {
  readonly step: StepId
  readonly locale: Locale
  readonly t: TFunction
}

export interface Finding {
  readonly ruleId: string                 // 'S3.target-not-smart'
  readonly severity: 'advisory' | 'blocking'   // ← P-02 lands here
  readonly messageKey: string
  readonly fixHintKey?: string
}

/** The second readiness layer — sees the whole project. §1.3. */
export type StepRule = (project: ProjectModel, step: StepId) => readonly Finding[]

export interface MethodRegistry {
  get(id: MethodId): MethodPlugin | undefined
  forStep(step: StepId): readonly MethodPlugin[]
  /** Unknown methods round-trip as opaque, read-only entries — P-05. */
  isKnown(id: string): boolean
}
```

**Why `renderToA3` returns data and not JSX:** the same fragment is consumed by
`HtmlA3Renderer` *and* serialized to Rust for the xlsx writer. A JSX return type would make
D-03 unimplementable — the export would need its own renderer, and we would be back to two
layout implementations.

---

## 3. Phase 0 task list

**Done when:** a fresh clone, following only the commands written in `README.md`, opens a
window on macOS **and** Windows. No product UI.

**Blocked first:** put `PPS_A3_Format_TR.xls` and `PPS_A3_Format_ENG.xls` in `reference/`
and settle the application name (P-01). Neither blocks the scaffold, both block Phase 1.

| # | Task | Done when |
|---|---|---|
| 0.1 | `git init` in `pps-hachi/`; `.gitignore` for `node_modules`, `target`, `dist`, `.DS_Store`. **Settle the bundle identifier (P-09) before 0.2** — it is baked into macOS keychain ACLs and Windows upgrade codes | `git status` clean on a fresh clone |
| 0.2 | Tauri v2 scaffold — `src-tauri` with a minimal `lib.rs`, `tauri.conf.json`, locked CSP with **no** provider domains (D-14) | `cargo check` passes |
| 0.3 | Vite + React 19 + TypeScript **strict** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); ESLint rule banning `any` and `@ts-ignore` (D-22) | `tsc --noEmit` and lint pass on an empty app |
| 0.4 | Tailwind v4 with an **empty custom token layer** and the default theme disabled — no colours yet, that is Phase 1 (kickoff Message 3) | Build succeeds; no default palette reachable |
| 0.5 | Vitest + one trivial passing test; `cargo test` wired with one trivial Rust test | `npm test` and `cargo test` both green |
| 0.6 | i18next installed, `tr` + `en` bundles present, one key used by the window title — proves the pipeline from line one (D-23) | Window title comes from a key, not a literal |
| 0.7 | Directory skeleton from §2.1 with `.gitkeep`s, plus a lint boundary rule: `src/domain` and `src/a3` may not import React, Tauri, or i18next | Lint fails on a deliberate violating import |
| 0.8 | `README.md` — prerequisites (Node, Rust toolchain, platform SDKs) and the exact clone → run commands for both platforms | A second machine can follow it without asking |
| 0.9 | `.github/workflows/ci.yml` — matrix `macos-latest` + `windows-latest`; install, `tsc`, lint, `npm test`, `cargo test`, `cargo clippy`, `tauri build` (unsigned) | Both legs green on the first push |
| 0.10 | Confirm unsigned local builds work on both platforms; signing stays a late, isolated step (`SPEC.md` §5) | `.dmg` and `.msi` produced by CI as artifacts |
| 0.11 | Update `DECISIONS.md` and the "Current state" block in `CLAUDE.md` | Phase reads 1 of 12 |

**Deliberately not in Phase 0:** any product UI, the design tokens, `A3LayoutDescriptor`,
any method plugin, anything AI. Task 0.4 sets up the token *layer* and leaves it empty on
purpose — the palette is a Phase 1 design decision that the kickoff wants reviewed before
any CSS exists.
