# CLAUDE.md — working rules for this repo

## What this is

A cross-platform desktop app (macOS + Windows) that guides users through the 8-step
Toyota Practical Problem Solving method and exports a standard landscape A3 report as
`.xlsx`. Full scope lives in `SPEC.md`. Read it before any non-trivial task.

Users are automotive quality and process engineers working under IATF 16949. They know
the terminology. Write the UI for them, not for a beginner.

## Decisions already made — do not relitigate without asking

- **Stack:** Tauri v2 + React 19 + TypeScript (strict) + Vite. Excel writing happens in
  Rust via `rust_xlsxwriter`.
- **WYSIWYG:** the A3 preview and the Excel export both consume one `A3LayoutDescriptor`
  produced by a single pure function. Never write layout logic twice. Never write layout
  logic in Rust — Rust only serializes the descriptor.
- **Charts:** rendered in the frontend, exported as PNG, embedded into Excel as images.
  Not native Excel chart objects.
- **Persistence:** `.ppsx` zip container, local only. No server, no accounts, no cloud.
- **Method plugins:** every PPS method is a plugin with `{ id, step, schema, Editor,
  renderToA3, readiness }`. Adding a method must never require touching the step page,
  the preview, or the exporter.
- **The supplied company templates are 7-step; the app's model is 8-step.** A template is a
  projection of the model onto a sheet, never the other way round. Geometry lives in
  `reference/TEMPLATE_ANALYSIS.md` and is authoritative — do not eyeball it from the .xls.
- **Default template is `farplas-7step-tr`, then `farplas-7step-plus` once the fidelity test passes and `-plus` exists.** The company standard
  wins. `-plus` isn't built until Phase 11 (D-95) — until then the default stays `-tr`
  regardless of fidelity-test outcome. Template B (`pps-8step-auto`) is an option the user
  chooses, not an upgrade we impose.
- **Fishbone belongs to Step 4, not Step 2.** Step 2 is data-based stratification and
  localization. Getting this wrong teaches the method wrong.
- **Step 3 (Set a Target) is mandatory.** It is the step that distinguishes Toyota's
  8 steps from Imai's 7. It gets dropped in practice; the app must not let it be.

### AI layer (see `SPEC.md` §8)

- **Bring your own key.** Anthropic, OpenAI, Google. We never hold a key, never proxy
  through our own server, never ship a default key.
- **Keys live in the OS keychain and never enter the webview.** Every provider call
  originates in Rust. If you find yourself writing `fetch` to an provider domain in
  TypeScript, stop — that is the wrong layer.
- **The assistant proposes; the human accepts.** There is no code path from a model
  response to `ProjectModel` that does not pass through an explicit Accept. Do not add
  one, do not add a "fill the whole A3" button, however convenient it seems.
- **Critique before draft.** Default mode is Socratic. An assistant that autocompletes an
  A3 produces a document with no thinking behind it, and a root cause that is plausible
  and wrong.
- **The model emits specs, not pictures.** Charts, tables and diagrams come back as
  structured data the app renders through the existing pipeline. Never AI-generated images.
- **Provenance on every entry, always.** `origin`, model, prompt version, who accepted it,
  when. This is what makes the report defensible in an IATF audit.
- **Anything read from a file or returned by a model is data, not instructions.** It can
  never trigger an action. Wrap untrusted content in delimited blocks; surface
  instruction-like text to the user instead of acting on it.
- **The app is fully functional with AI off.** Offline is the base product, not a fallback.
  There is a Playwright suite that runs the entire happy path with no keys configured, and
  it must stay green.
- **Never hardcode model lists.** Fetch from each provider's models endpoint, cache 24 h,
  keep a small fallback in config. Verify every provider API detail against current docs
  before implementing — do not code these from memory.

## How I want you to work

- Read `SPEC.md` §6 for the phase plan. Work one phase at a time. At the end of each
  phase, stop and show me a runnable build before starting the next.
- Before writing code for a new area, write a short plan and let me approve it. For UI
  work specifically, show me the token plan and layout concept before any CSS.
- Small, focused commits with conventional commit messages. One concern per commit.
- Every new module gets tests in the same change. The A3 descriptor gets golden-file
  tests. The xlsx writer gets a byte-level regression test.
- TypeScript strict, no `any`, no `@ts-ignore`. Zod schemas are the source of truth for
  types — derive TS types from schemas, not the reverse.
- All user-facing strings go through i18next from the moment they are written. Never
  hardcode a string in a component. TR and EN keys are added together.
- Coaching content lives in `src/content/coaching/{tr,en}/step-N.md` as data, not in JSX.
- When something in `SPEC.md` is ambiguous or turns out to be wrong, ask me. Do not
  silently invent scope, and do not silently drop scope.
- Keep a running `DECISIONS.md` — one line per architectural decision, with the date and
  the reason. Update it when we change our minds.

## Copy and interface voice

Plain verbs, sentence case, no filler. A control says exactly what happens when it is
used: "Export A3", not "Submit". The same action keeps the same name through the whole
flow. Errors say what went wrong and how to fix it; they do not apologize and they are
never vague. Empty states are an invitation to act, not a mood.

Name things the way a plant engineer names them. "Point of cause", "containment action",
"read-across" — not "issue location", "temporary fix", "share with others".

## Quality floor — never announce it, always meet it

Keyboard navigable end to end, visible focus rings, WCAG AA contrast, reduced motion
respected, light and dark themes, no layout shift on load, no unhandled promise
rejections, no console noise in production builds.

## Things that will break if you are careless

- Excel print setup (page size A3, landscape, fit to one page, margins, print area).
  Verify by actually opening the file, not by trusting the writer.
- Image anchoring in xlsx — anchor and size to the descriptor placement, never floating.
- Path handling across macOS and Windows. Use Tauri's path APIs, never string
  concatenation.
- Schema migrations. An older `.ppsx` must always open.
- Turkish characters (ı, İ, ğ, ş, ç, ö, ü) in filenames, cell values, and sort order.
  Use locale-aware comparison. This will be tested with real Turkish data.
- API keys leaking into logs, crash reports, error strings, or the `.ppsx`. Scrub at the
  logging sink, not at call sites. Write a test that asserts a known key string appears
  nowhere in any produced artifact.
- EXIF data on shop-floor photos. Strip it before sending anything to a provider.
- Sending a whole 50,000-row spreadsheet to a model. Summarize and sample in Rust first,
  and show the user what is actually being transmitted.
- Silently truncating context when the window is exceeded. Drop slices in a defined
  priority order and tell the user what was dropped.

## Current state

Phase: 5 of 12
Stack decision (Tauri vs Electron fallback): Tauri v2, revisit only if Phase 4 stalls
App name: **PPS Hachi** (八 — eight). Repo `pps-hachi`. Set 2026-08-01, see DECISIONS.md D-29.
AI layer: specified, not started. Phases 8–10.
Templates: two company .xls files analysed; see reference/TEMPLATE_ANALYSIS.md
Template geometry: VERIFIED 2026-08-01 against both .xls files. Five errors found and
  corrected in place — the largest was the column widths: the real split is 49.7/50.3, NOT
  59/41. SPEC.md §3.0/§3.1/§3.3 were corrected to match. TEMPLATE_ANALYSIS.md §3 is now
  authoritative for everything §9.1 lists; §9.8 lists what is still unchecked.
Real-world evidence: five completed company A3s were analysed — they are canvases, not
  spreadsheets (see docs/02_REAL_WORLD_FINDINGS.md). Type is sized from a printed-legibility
  floor, not inherited from the template (D-40). Template B geometry stays blocked (D-27).
Phase 0 scaffold: DONE 2026-08-02, per docs/01_ORIENTATION_REVIEW.md §3 tasks 0.1–0.11.
  Tauri v2 + React 19 + TS strict + Vite, Tailwind v4 (empty token layer), i18next (tr/en),
  ESLint (bans `any`/`@ts-ignore`, enforces the src/domain + src/a3 purity boundary),
  Vitest + cargo test both green, directory skeleton from §2.1 in place. No product UI.
  Repo: github.com/ozgurgovem/pps-hachi (private). CI: .github/workflows/ci.yml,
  macos-latest + windows-latest — see D-46/D-44 for why it's a plain build+upload-artifact
  step rather than tauri-action.
Known open gap: P-12 (do admin-free NSIS per-user installs actually run under Farplas's
  AppLocker/WDAC policy?) could NOT be closed from this environment — it needs a real
  corporate Windows machine. Do not treat Windows distribution as de-risked until that's
  walked.
Phase 1 design system: DONE 2026-08-02, reviewed by Barış at `/gallery` — no issues, palette
  approved. See D-49 for the full token/typography/primitive list and the two accent-color
  revisions an independent aesthetic review forced before any code was written. Token layer
  in src/index.css is no longer empty. Primitives live in src/ui/*, all tests green
  (`npm test`, 14/14), `npm run lint` clean (one pre-existing Fast Refresh warning on
  ThemeProvider, not an error), `npm run build` green. Not yet committed to git.
Phase 2 (launch screen + create/open/save `.ppsx` + recent list): DONE 2026-08-02, implemented
  against the D-51–D-62 plan, then hardened by an independent Opus security review requested
  before starting Phase 3. Six implementation-level decisions filled in while building — see
  D-63 (import/open collapsed into one control), D-64 (explicit absolute-path entry rejection
  — the `zip` crate normalizes rather than rejects on its own), D-65 (recent-list cache shape,
  no thumbnail until Phase 4), D-66 (D-57's migration import boundary exempts test files),
  D-67 (bounded-read enforcement never trusts the zip's declared entry size, read/write name-
  safety unified) and D-68 (atomic-write temp file no longer follows symlinks, cleaned up on
  rename failure too, parent directory fsync'd on Unix) — D-67/D-68 fixed a zip-bomb bypass
  and a symlink-follow the review found by running actual PoCs, not just reading the code.
  Rust: `src-tauri/src/ppsx/{atomic,archive,manifest,recent_index,commands}.rs` — zip
  container read/write with path-traversal/absolute/symlink rejection, entry/size caps
  enforced against actual bytes read, atomic writes safe against a pre-planted symlink,
  D-54 manifest/project id+schemaVersion routing check, JSON recent index.
  `cargo test` 50/50 (48 lib + 2 integration), `cargo clippy --all-targets -- -D warnings`
  and `cargo fmt -- --check` both clean.
  Domain: `src/domain/model/*` (loose Zod schemas per D-51, `payload: z.unknown()` per D-52,
  no `readiness` field per D-53), `src/domain/migrations/*` (empty registry, chain-contiguity
  test, `runMigrations`, ESLint boundary per D-57/D-66). Fixture corpus in `fixtures/ppsx/`
  (generated by `cargo run --bin gen_ppsx_fixtures`, D-62), validated from both the Rust and
  TS sides.
  UI: `src/app/routes/launch/*` (LaunchScreen, recent list, create/open flows) and
  `src/app/routes/project/ProjectPlaceholder.tsx` (post-open confirmation stub — the real
  workspace shipped in Phase 3 and replaced this file). Built with Phase 1's `src/ui/*`
  primitives; `StepTick` used for recent-list and placeholder progress.
  Deferred, not silently dropped: `SPEC.md` §2.1's secondary row (settings, about, language
  toggle) — not named in this phase's scope and settings has no domain model yet.
  `npm test` 93/93 (24 files), `npm run lint` clean (the one pre-existing ThemeProvider Fast
  Refresh warning, not an error), `npm run build` green. Not yet committed to git.
Phase 3 (workspace shell, 8-step navigation, coach band, entry CRUD, autosave, undo): DONE
  2026-08-02, implemented against a Sonnet-authored plan for the workspace UI plus D-69–D-90,
  the latter drafted then sent to an independent Opus review (state management shape,
  undo/autosave/history interaction — the three-mechanism overlap `docs/01_ORIENTATION_REVIEW.md`
  §1.10 had flagged unanswered since Phase 0) before implementation, the same process Phase 2's
  persistence design went through. The review's most important finding wasn't in the Phase 3
  draft at all: `otherEntries` round-tripping was already silently broken in shipped Phase 2
  code (D-79, same failure shape as D-51 one layer lower) — fixed as part of this phase.
  State: `src/state/` — Zustand, no immer (D-69); `src/domain/commands/` holds the pure
  `applyCommand`/`invertCommand` reducer and command builders, the only code path allowed to
  mutate `ProjectModel` (D-70); `order`-vs-array-position resolved (D-71); autosave via a
  `revision`-counter dirty check, single in-flight guard, 5 s navigation-save coalescing,
  read-only hard gate, flush-on-close (D-72); four-state save indicator (D-73); history
  snapshots are a Rust-side sidecar in app-local-data-dir, never inside the `.ppsx` (D-74,
  corrects `SPEC.md` §4.1) — manual rollback, not crash recovery, since D-56 already makes the
  live file crash-safe (D-75); restoring one runs the same migrate+Zod+id-check pipeline as
  opening a file (D-76); `ppsx_write` takes an optimistic-concurrency `expectedModifiedMs` and
  refuses on conflict (D-77); write-side size caps mirror the read-side ones (D-78); text edits
  write to the store every keystroke, only the undo command coalesces (~600 ms) (D-84).
  Rust additions: `src-tauri/src/ppsx/history.rs` (sidecar snapshot read/write/prune/list) and
  `history_list`/`history_save`/`history_read` commands; `archive.rs` gained
  `file_modified_ms`, `expected_modified_ms` compare-and-swap, and write-side `Limits`
  enforcement (D-77/D-78). Self-caught immediately after writing it, before any external
  review: `project_id` (= `manifest.id`, untrusted per D-06) went into `history_dir` with no
  path-component validation — a crafted `.ppsx` could have written snapshot content to an
  attacker-chosen path outside `app_local_data_dir` on the first autosave tick. Fixed same
  session (D-91), same failure shape as D-64/D-67 one module over.
  Post-implementation security review (independent Opus pass, scoped to `history.rs` +
  `archive.rs`'s Phase 3 additions, mirroring Phase 2's D-67/D-68 review): verified D-91's
  fix empirically (holds on macOS), found its blocklist had the same host-OS-dependent gap
  D-67 once found in the zip-entry checker — fixed as an allowlist (D-92). Also fixed a
  write/read entry-name asymmetry and an uncapped entry-name length, both the "write
  succeeds, read then permanently refuses" shape D-78 exists to close (D-93). Two findings
  documented rather than fixed — D-77's compare-and-swap only checks mtime, defeated by any
  mtime-preserving writer or coarse filesystem timestamp granularity (P-15), and a TOCTOU
  window between that check and the atomic rename (P-16) — both real but bounded (never
  worse than Phase 2's prior 100%-of-the-time clobber), both crossing the IPC boundary or
  needing an `atomic_write` primitive change to close properly, revisit when Phase 4's
  larger payloads make them load-bearing. Verdict: shipped as-is, no CRITICAL/HIGH findings.
  `cargo test` 75/75 (73 lib + 2 integration), `cargo clippy --all-targets -- -D warnings`
  and `cargo fmt -- --check` both clean.
  Domain: `src/domain/commands/*` (commands, reducer, builders, `normalizeProject`).
  `src/methods/` (new, sibling of `src/domain/` since `Editor` is a React component and can't
  live inside the domain purity boundary): a payload-type-erased plugin registry (D-82) with
  one plugin this phase, `generic-text`, usable on all 8 steps.
  UI: `src/app/routes/workspace/*` replaces `src/app/routes/project/ProjectPlaceholder.tsx` —
  `WorkspaceScreen` → `WorkspaceShell` (left rail / center / right panel), `StepStepper`
  (empty/inProgress only this phase, D-85), `StepPage` (coach/method/entries bands per step),
  `CoachBand` (reads `src/content/coaching/{tr,en}/step-N.md`, all 16 written this phase),
  `MethodBand` + `EntryEditorDialog` (create via one dispatch, edit via live coalesced
  dispatch), `EntriesBand` + `EntryRow` (CRUD, `@dnd-kit` drag *and* Move-up/-down buttons —
  both dispatch the same `entries.reorder` command, D-86 — plus the P-05 read-only placeholder
  for an unrecognized `methodId`, D-89), `RightPanel` (Preview stub; Assistant tab gated on
  `meta.ai.enabled`, never true this phase).
  Deferred, not silently dropped: the history restore-picker UI (writing/restoring is
  implemented and tested; nothing in Phase 3's three-band spec calls for browsing snapshots —
  D-75); `complete`/`flagged` step states (need Phase 7's gate rules — D-85).
  `npm test` 182/182 (36 files, including a full happy-path integration test creating and
  reordering entries across all 8 steps), `npm run lint` clean (the one pre-existing
  ThemeProvider warning), `npm run build` green (one non-blocking chunk-size warning — code-
  splitting is a Phase 12 polish candidate, not a Phase 3 blocker). Not yet committed to git.
Phase 4 (A3 descriptor + HTML preview + xlsx export + `farplas-7step-tr`): DONE 2026-08-02,
  architecture designed directly by this session per D-28's own routing (Opus for this phase,
  no separate implementer hand-off) — D-94–D-101 record the design decisions, TDD throughout.
  Only `farplas-7step-tr` ships this phase; `-plus`/`-en`/`pps-8step-auto` move to Phase 11
  (D-95, closes P-03/P-04) — the D-10 default-template switch stays on `-tr` through Phase 10
  regardless of fidelity-test outcome until `-plus` actually exists.
  `src/a3/`: `descriptor.ts` (`A3LayoutDescriptor` — plain, JSON-serializable, no functions/
  `Date`/`Map`), `methodContract.ts` (pure `A3EntryRenderer` contract — the seam that lets
  `buildA3Layout` stay React-free while `MethodPlugin` gains `renderToA3`, D-99), `cellRef.ts`
  (A1-notation parsing), `buildA3Layout.ts` (the pure function — deterministic, no
  `Date.now()`/`crypto.randomUUID()`/locale defaults; golden-file + property tests), `layout/`
  (`budget.ts`, `measure.ts` — D-40's authored-font-floor math and the documented Excel-
  column-width→pt approximation, `place.ts` — one wrapped line per content row, whole-entry
  drop on overflow, `overflow.ts`), `templates/farplas-7step-tr.ts` (full geometry transcribed
  from `TEMPLATE_ANALYSIS.md` §3/§9 — 29 columns, 62 rows, all 46 source merges, PDCA block
  fills, header/footer fields; D-96: the three approval footer cells stay label-only, no
  distinct value cell exists in the source form), `render/HtmlA3Renderer.tsx` (D-34 screen/
  print modes via CSS Grid — carved out of the domain/a3 ESLint purity boundary, D-94, since
  it's the frontend analogue of D-04's "dumb serializer," never itself a layout decision).
  Never-truncate guarantee (SPEC.md §2.3, D-100): an entry that overflows its block's budget
  is dropped from the A3 sheet but always lands in an appendix sheet, same as one the user
  marked `appendix` by hand — tested directly (`buildA3Layout.test.ts` and the Rust fidelity
  suite both exercise this).
  `src-tauri/src/xlsx/`: `descriptor.rs` (serde mirror of the TS descriptor, `camelCase`),
  `cell_ref.rs`, `styles.rs` (builds a `rust_xlsxwriter::Format` cache from the descriptor's
  own style table), `writer.rs` (`write_a3_workbook` — D-04: zero layout logic, every value
  written already existed on the descriptor; column widths pass through to
  `set_column_width` in native Excel character units untouched, D-101). New deps:
  `rust_xlsxwriter` 0.97.0, `base64` 0.23.0, `calamine` 0.36.1 (dev-only, round-trip reading).
  `src-tauri/src/commands/xlsx.rs`: `xlsx_export` Tauri command, registered in `lib.rs`.
  P-08 (byte-level regression unachievable) resolved as a normalized structural comparison
  (D-97): `src-tauri/tests/xlsx.rs` writes a real, checked-in descriptor fixture
  (`src-tauri/tests/fixtures/a3-layout-descriptor.json`, generated by
  `scripts/gen-a3-fixture.ts` from the real `buildA3Layout` — never hand-written, D-62's
  fixture philosophy) and verifies cell values + merge counts via `calamine` plus print
  setup/fonts/PDCA fills/embedded-image presence via direct zip/XML inspection. This is an
  automated gate, not the literal SPEC.md §6 PDF-diff (no LibreOffice-headless pipeline in
  this environment) — a one-time manual open-side-by-side check is still owed before Phase 4
  is called visually done. P-13 (export perf budget) resolved as D-98: ≤5 s for up to 100
  images, no benchmark built yet (flagged, not dropped).
  UI: `src/app/routes/workspace/a3Preview.ts` (composition root wiring `getA3RendererMap()`
  into `buildA3Layout`) and `xlsxIpc.ts`; `RightPanel`'s Preview tab now renders the live
  `HtmlA3Renderer` for the open project with a screen/print toggle and an "Export A3" button
  (native save dialog → `xlsx_export`). Three Phase 3 tests needed re-scoping to `within(main)`
  since the live preview now legitimately duplicates entry text elsewhere on screen — not a
  regression, the tests were querying the whole document when they meant the entries band.
  Known scope gaps, documented not dropped: cell-edge border fidelity is per-style, not per-
  physical-edge (P-17 — the source form's medium-outer/thick-P-divider/thin-inner distinction
  isn't reproduced exactly); team-roster/work-plan-Gantt/loss-taxonomy/BenefitCase values stay
  unbound pending their own data models (P-18); Phase 4 does not yet ingest `Entry.images` —
  `buildA3Layout`'s `images` option accepts pre-encoded placements from its caller, proven by
  the Rust fidelity test, but no UI wires a photo upload into it yet.
  `npm test` 205/205 (41 files), `npm run lint` clean (the one pre-existing ThemeProvider
  warning), `npm run build` green (same pre-existing chunk-size warning as Phase 3).
  `cargo test` 89/89 (80 lib + 2 `.ppsx`-fixture integration + 7 xlsx-fidelity integration),
  `cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check` both clean.
  Not yet committed to git.
Phase 5 (method plugins wave 1 — 5G+5N1K, Pareto, Trend, Is/Is-Not, SMART Target, Fishbone,
  5-Why, 3-Legged 5-Why): DONE 2026-08-03, per SPEC.md §6's Phase 5 row. Two open design
  questions were resolved with Barış's sign-off before any implementation (per CLAUDE.md's
  "before writing code for a new area, write a short plan and let me approve it") — D-102
  (how a method contributes a chart/diagram image to its block) and D-103/D-104 (Fishbone's
  data shape and its 6M/8P category labels, neither defined in SPEC.md). Pareto and Fishbone
  were built first as the two reference implementations proving the chart-image and
  graph/diagram-image patterns; the remaining six were built against the now-settled pattern.
  Model-routing note: D-28's own routing asked for Opus on this design work plus Pareto/
  Fishbone, then Sonnet for the rest — this session ran entirely on Sonnet 5 (no mid-session
  model switch is possible), and Barış chose to proceed on Sonnet 5 throughout rather than
  pause, so all eight methods were designed and built on Sonnet 5 — flagged in D-102.
  `src/a3/methodContract.ts`: `A3BlockContent` gained `image?: A3ImageRequest` (a chart/
  diagram consuming `rowSpan` content rows in the existing vertical text-line stack) and
  `zones?: readonly A3ContentZone[]` (a horizontal partition of one reserved row-span into
  text/image sub-regions — generic, not hardcoded to any step; D-38's Step 3 three-zone strip
  is simply the first user). `src/a3/layout/place.ts` gained image-row-span reservation using
  the block's *real* per-row heights (not a flat scalar — Step 2's block ends on a 93.75 pt
  row, Step 3's is one 153.75 pt row); `src/a3/layout/placeZones.ts` (new) snaps each zone's
  `widthFraction` to whole-column boundaries and lays zones out horizontally. `buildA3Layout`'s
  return type changed from `A3LayoutDescriptor` to `{ descriptor, pendingImages }` — a
  Phase-4-code-touching change, flagged in D-102 — discovered in the same block-iteration pass
  that produces the descriptor, so geometry can never disagree between the two. The composition
  root (`src/app/routes/workspace/a3Preview.ts`) calls `buildA3Layout` once with no images,
  rasterizes each pending slot's spec to PNG off-screen (new `src/a3/render/rasterize.ts`, a
  D-94-style purity-boundary carve-out using `html-to-image` — one capture path for both
  Recharts' pure-SVG output and React Flow's mixed DOM/SVG output), then calls `buildA3Layout`
  again with the bytes — the final, fully-baked descriptor both `HtmlA3Renderer` and the Rust
  writer consume unchanged. `RightPanel.tsx`'s descriptor build moved from a synchronous
  `useMemo` to an effect with a `cancelled` guard, since the second pass is genuinely async, and
  gained a `loading` state alongside `ok`/`error`. Which React node renders a given
  `A3ImageKind` is dependency-injected the same way `renderToA3` already is (D-99): `MethodPlugin`
  gained optional `imageKind`/`renderImage` fields, and `src/methods/registry.ts`'s new
  `getA3ImageRendererMap()` assembles the map `rasterize.ts` receives as a parameter.
  New deps: `recharts`, `@xyflow/react`, `html-to-image`.
  Eight new plugins under `src/methods/` (`fiveG5N1K`, `pareto`, `fishbone`, `trend`,
  `isIsNot`, `smartTarget`, `fiveWhy`, `threeLeggedFiveWhy`), each following `genericText`'s
  file shape (`index.ts`/`schema.ts`/`Editor.tsx`/`renderToA3.ts`) plus a schema test, an
  Editor test and a renderToA3 test — none of which `genericText` itself had (Phase 3
  predates that explicit requirement); `src/methods/shared/` (new) holds `whyChain.ts` and
  `WhyChainEditor.tsx`, shared by `fiveWhy` and `threeLeggedFiveWhy`'s three parallel legs,
  and `src/methods/chartSpec.ts` holds the discriminated `ChartSpec` union (`ParetoChartSpec`/
  `TrendChartSpec`/`TrajectoryChartSpec`) Pareto/Trend/SMART Target's charts and the AI layer's
  future spec-emission (SPEC.md §8.8) are meant to converge on. Fishbone's Zod schema stores a
  fixed, algorithmically-positioned category spine (never persisted, never draggable) plus
  freeform React-Flow-shaped cause nodes (`{id, categoryId, parentCauseId?, text, position?}`,
  one level of sub-cause nesting); edges are always *derived* from `categoryId`/`parentCauseId`
  at render time, never stored, per D-71's lesson about two representations of one relationship
  with no precedence rule. `getMethodsForStep` now returns more than one plugin for Steps 1
  (`generic-text` + `five-g-5n1k`), 2 (+ `pareto`, `trend`, `is-is-not`), 3 (+ `smart-target`)
  and 4 (+ `fishbone`, `five-why`, `three-legged-five-why`) for the first time — this exposed
  and fixed a real pre-existing test-scoping bug in `WorkspaceScreen.test.tsx` (queries for the
  single "Add entry" button/"Free text" card were ambiguous the moment a step legitimately
  offered a second method or already had an entry; both fixed to scope to the method band's own
  section / assert every "Add entry" button, not silently narrowed to keep the old query passing).
  Pareto/Trend/SMART Target's chart survival into the xlsx export is proven two ways: a
  dedicated `xlsxSurvival.test.ts` per method (TypeScript, exercising the real plugin through
  `buildA3Layout`'s two-call pattern with a synthetic PNG standing in for a rasterized chart —
  the same "prove the pipeline, not pixel content" philosophy D-97 already established) and by
  extending `scripts/gen-a3-fixture.ts` to use the real method registry (`getA3RendererMap()`)
  with Pareto/Trend/SMART Target/Fishbone entries instead of a hand-rolled fake renderer map —
  the checked-in `a3-layout-descriptor.json` fixture now carries 5 embedded images (was 1), and
  `src-tauri/tests/xlsx.rs`'s image test was strengthened from "at least one" to an exact
  per-image media count. Known scope gaps, documented not dropped: an image-bearing entry
  dropped to an appendix loses its image there — for SMART Target specifically (whose
  `renderToA3` always returns empty `lines`) this means the appendix entry is completely
  blank, not just missing its chart (P-20); Fishbone's editor manages top-level cause add/
  remove/reposition only — the schema supports one level of sub-cause nesting but the UI for
  "add as a sub-cause of X" is out of scope this phase, not silently dropped.
  Post-implementation architecture review (independent Opus pass, 2026-08-03, requested before
  starting Phase 6 — same practice as Phases 2 and 3, and warranted here because D-102 was both
  a brand-new mechanism and a change to already-shipped Phase 4 code, designed end-to-end on
  Sonnet rather than the Opus D-28 asks for on architecture). Ran probe tests against the real
  functions rather than reading code. Found five defects, all reproduced before being fixed —
  D-105 through D-109. The headline one (D-105): `rasterize.ts` captured the off-screen host
  before React had committed to it, so **every exported chart and diagram would have been a
  blank PNG** — measured, not theorized (`innerHTML` is `""` immediately after `render()` and
  after one microtask; it only populates a macrotask later), and structurally invisible to the
  test suite because `rasterize.test.ts` mocks `html-to-image`. Fixed with `flushSync` + a
  layout-settle yield, and structurally by giving every chart an **explicit pixel box**
  (`A3ImageSize` → `renderImage(spec, size)`) instead of Recharts' `ResponsiveContainer`, plus
  `isAnimationActive={false}` on every series. Also fixed: a zero-height image slot anchored
  outside its own block (D-106), silent loss of surplus zones when a block has fewer columns
  than zones (D-107 — the exact SPEC.md §2.3 truncation D-100 exists to prevent, sitting in the
  *generic* mechanism), a completely blank appendix sheet for zone-only entries like the
  mandatory SMART Target (D-108), and `Promise.all` letting one failed chart destroy the whole
  preview (D-109). Nine regression tests added, each verified to fail against the unfixed code.
  `npm test` 296/296 (71 files), `npm run lint` clean (the one pre-existing ThemeProvider
  warning), `npm run build` green (same pre-existing chunk-size warning as Phase 3/4, larger
  now with Recharts/React Flow). `cargo test`/`cargo clippy --all-targets -- -D warnings`/
  `cargo fmt -- --check` could **not** be run this session — this environment's shell has no
  Rust toolchain installed at all (`cargo`/`rustc` not found), a hard environment gap rather
  than a result — see DECISIONS.md P-19. The `xlsx.rs` diff itself is small and mechanical
  (verified by reading, not execution); Barış should run the three cargo commands locally
  before treating Phase 5's Rust side as verified rather than merely read.
  **Still owed, and deliberately not claimed as done:** D-105's fix restores a *correct*
  capture path, but no chart has ever been rasterized in a real browser or Tauri webview in any
  session — jsdom cannot produce a PNG. The one thing that would actually confirm charts export
  correctly is opening the app, adding a Pareto entry and exporting (P-21).
