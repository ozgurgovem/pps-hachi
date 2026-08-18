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
- **The reference format is `reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx`** (D-150,
  2026-08-05). It is natively 8-step, two-column, foldable exactly in half (495 | 9.75 | 495 pt,
  the gutter column is literally named `KAT`), and a real blank cell grid rather than a canvas.
  **Build against it.** Geometry as delivered: `TEMPLATE_ANALYSIS.md` §11. **The page contract
  the app actually builds to is §12** (D-154/D-155/D-156, Oturum A): 0.32 in margins, 24 body
  columns of 47.25 pt + the 9.75 pt `KAT` divider = 1143.75 pt, 795.00 pt of rows, fold centre
  exact, 100 % fit. §11's two gaps are both closed — A3 fit (D-152 → D-154) and whether Farplas
  approves the form (P-29 → D-157: it does).
  **Transcription trap (D-154):** `A3Template.charWidth` takes the *visible-character* value
  (8.285714), never the OOXML stored `width` (7.83203125). The two differ by 5 px per column;
  copying the stored value makes the sheet 90 pt too wide and the A3 fit fails silently.
- **The supplied company templates are 7-step; the app's model is 8-step.** A template is a
  projection of the model onto a sheet, never the other way round. Geometry lives in
  `reference/TEMPLATE_ANALYSIS.md` and is authoritative — do not eyeball it from the .xls.
  §3 (the Farplas `.xls` forms) is now the record of the *existing* company form, not the
  design target; §10 is evidence only; §11 is the reference format as delivered;
  **§12 is the page contract we build to.**
- **Default template moves to the Rev00-based 8-step template once Phase 11 builds it** (D-157,
  P-29 closed: Rev00 *is* the form Farplas approves, so D-10's own adoption argument now points
  at it). `farplas-7step-tr` is demoted to a legacy-compatibility template — it stays in the
  registry so existing 7-step A3s open and export, but new projects don't start on it. Nothing
  changes operationally until Phase 11: per D-95, `-tr` is still the only template that exists.
  Template B (`pps-8step-auto`) is an option the user chooses, not an upgrade we impose.
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
- **Session launch prompts live in `docs/oturumlar/`, not in chat.** D-149's four
  interface sessions each get a file there; the chat copy drifts from the repo silently
  (a prompt written 2026-08-05 named a reference file that was renamed 20 minutes later,
  and a stale prompt fails quietly — the agent looks for a missing file and moves on).
  Every such prompt opens with a step that verifies the files it names actually exist.
- **The Block Visual Verification Loop — the standard method for every A3 block/panel,
  established 2026-08-06 during Oturum B2's ADIM 1 work, Barış confirmed it should run
  for every remaining step.** Prose decisions about "what a block looks like" are not
  trustworthy on their own — D-165's first-draft palette read fine in text and was wrong
  in three concrete ways the moment Barış saw it rendered next to the real reference. The
  loop:
  1. Pull the block's geometry and content decisions from `TEMPLATE_ANALYSIS.md` (§12.8's
     pt measurements, the relevant `§14`+ subsection, the governing D-numbers).
  2. Build a static HTML/CSS mockup at the **real pt→px scale** (a CSS variable, e.g.
     `--pt: 1.6px`, multiplied everywhere — never eyeballed) with **real example content**
     (a plausible Farplas/automotive-quality scenario, never lorem).
  3. Embed the actual reference crop (`reference/visual/*`) **in the same page**, cropped
     tight to the specific sub-panel being compared — side-by-side beats "trust my
     description." Verify the source's actual pixel dimensions first
     (`sips -g pixelWidth -g pixelHeight`) — a blurry source silently produces a
     misleading comparison and this cost a round-trip once already.
  4. Publish as one Claude Artifact.
  5. Barış reviews and gives **concrete, visual** feedback — an annotated screenshot beats
     a paragraph of description, and is welcome in exactly that form.
  6. Republish the **same file path** (keeps the same URL) with the fix.
  7. Once approved, the finalized concrete values (hex, pt offsets, exact treatment) get
     written into `TEMPLATE_ANALYSIS.md`/`DECISIONS.md` **immediately** — the artifact is
     disposable scratch, the docs are the record.
  8. Move to the next block.

  Operating notes: **one block (or tightly related pair) per clean session** — eight
  blocks each potentially taking 2+ feedback rounds is Anayasa G1/G4 territory if
  crammed into one sitting. Prefer **one cumulative artifact that grows block by block**
  (redeploy the same file, append the next section) over one throwaway artifact per
  block — the end state is a full-sheet preview, which is itself a useful pre-Phase-11
  sanity check nothing else provides. Write the confirmed decision to the docs the moment
  it's confirmed, not batched at session end, so a budget cutoff mid-loop never loses
  approved work.

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

**The printed A3 has its own bar: it must read as orderly and spare.** Barış set this
2026-08-05 against the Lean Enterprise UK worked example (P-32) — one visual language
across all eight blocks, panels aligned, nothing floating, no block overloaded. Two
things already enforce it structurally rather than by discipline: every panel snaps to a
cell boundary (D-102 `zones` quantises `widthFraction` to whole columns), and D-156's
capacity ceiling makes overfilling a block geometrically impossible. What is *not*
enforced is consistency between blocks — eight blocks each inventing their own visual
language is the real threat to this bar, and it is Oturum B's job.

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

Phase: 6 of 12 (slice 6c of D-114's five; 6d–6e remain)
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
Phase 6 entry gates (P-19, P-21): CLOSED 2026-08-03, see D-110–D-113. The Rust toolchain was
  reachable all along (a missing `PATH` entry, not a missing install — D-110); running `cargo
  test` for the first time found a real merge-overlap defect between static template merges and
  D-102 zones, fixed generically in `buildA3Layout.ts` (D-111), and a fixture realism gap in
  `scripts/gen-a3-fixture.ts` that the strengthened xlsx image-count test then caught for real
  (D-112). Rasterizing in a real Chromium found a third capture hazard beneath D-105's two —
  viewport culling of an off-screen host positioned at a large negative offset — fixed in
  `rasterize.ts` by mounting on-screen inside a zero-size `overflow: hidden` wrapper (D-113).
Phase 6a (Steps 1–2's remaining ten methods): DONE 2026-08-03, per D-114's approved five-slice
  split — 6a only, no new subsystem. `src/methods/shared/rowTable.ts` + `RowTableEditor.tsx`
  (D-115): a generic "row list, caller-configured columns" substrate extracted before the
  second repetition, mirroring Phase 5's `whyChain.ts`/`WhyChainEditor.tsx` shared-editor shape.
  Ten new plugins under `src/methods/`, each following Phase 5's file shape (`index.ts`/
  `schema.ts`/`Editor.tsx`/`renderToA3.ts` + a schema test, an Editor test and a renderToA3
  test): `gapStatement`, `fiveW2H`, `problemTypeClassifier` (fixed-field forms, Step 1);
  `tpmLossTaxonomy` (SPEC §3.0's SQDCM→TPM correction, a fixed seven-category grid, not a row
  table — D-122); `vocComplaint`, `containmentIca` (Step 1, wrap `RowTableEditor`);
  `stratificationMatrix` (Step 2, wraps `RowTableEditor`, gained an implied `count` column not
  named in SPEC.md — D-121), `checkSheet`, `processFlowSipoc` (Step 2, wrap `RowTableEditor`);
  `msaGageRr` (Step 2, fixed-field form). Row-table fields are uniformly `string`-typed,
  including PPM and tally counts — D-120. `getMethodsForStep` now returns more methods per step
  for Steps 1 and 2; `WorkspaceScreen.test.tsx`'s existing scoped queries (Phase 5's D-102
  test-scoping lesson) needed no changes — already scoped to a specific method card / used
  `getAllByRole` with a length check rather than an exact count. TR/EN i18n keys added together
  for every new method and for the shared `methods.rowTable.addRow`/`removeRow` labels.
  `npm test` 379/379 (103 files), `npm run lint` clean (the one pre-existing ThemeProvider
  warning), `npm run build` green (same pre-existing chunk-size warning as Phase 3/4/5).
  `cargo test` 89/89, `cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check`
  both clean — Rust untouched by 6a, as expected (TS-only method plugins). Not yet committed
  to git.
Phase 6b (cross-step reference subsystem + ten methods): DONE 2026-08-04, per D-114's 6b
  scope. Scope was re-derived from `SPEC.md` §1.3 line by line against Phases 5/6a rather
  than from the slice sketch, which surfaced D-123: the Step 4 PFMEA linkage holds **no**
  `Entry.references[]` — a PFMEA is an external controlled document and §4.2 houses those in
  `meta.linkedRecords[]` — so it counts as one of Step 4's five *plain* methods, and the
  fifth reference-bearing method is Step 6's action plan. That is the only reading under
  which both of D-114's own counts hold. Two design questions went to Barış before any code
  (D-123 scope, D-124 granularity); both answers are what shipped.
  **New subsystem — the first since D-102, and it touches the already-shipped `Entry` type.**
  `src/domain/model/reference.ts`: `EntryReference` (`{ role, targetEntryId }`, loose per
  D-51) plus `REFERENCE_ROLES` — `pointOfCause`/`rootCause`/`countermeasure` from §4.2, plus
  `containment` as a fourth constant added with no schema change and no migration (D-126,
  D-116's loose-`role` design paying off). `Entry.references?` is optional and omitted rather
  than `[]` (D-128), so every pre-6b `.ppsx` parses unchanged and serializes identically.
  `src/domain/selectors/findOrphanedReferences.ts` (new dir): `findOrphanedReferences`,
  `findReferencesTo`, `listReferenceableEntries` — all derived, nothing stored, nothing
  checked at load (D-117 + D-59's read-only-open promise). Deleting a referenced entry is
  permitted, leaves the referrer untouched and dangling, and undo resolves it again with no
  compensating logic — proven end to end through the real store in
  `entryReferences.integration.test.tsx`. Commands: `buildAddEntryCommand`/
  `buildUpdateEntryCommand` gained `references`; an update that omits it leaves existing
  references alone, one that passes `[]` clears the key.
  UI: the picker is **generic shell UI**, not plugin UI (D-125) — `MethodPlugin` gained
  `referenceRoles: { role, labelKey, emptyKey, fromSteps, multiple }[]`, and
  `EntryEditorDialog` renders one `src/app/routes/workspace/EntryReferenceField.tsx` per
  declared role beside the title field. No method's `Editor` touches references (its props
  are payload-only and references sit outside `payload`). Built from Phase 1 primitives —
  filter `Input` + a listbox of buttons — rather than a combobox dependency. A dangling
  reference is shown as missing and stays unlinkable-by-hand, never silently dropped.
  Picking dispatches `entry.update` directly rather than through D-84's coalescing.
  D-124's granularity call: one traceable node = one `Entry`, so the countermeasure "list",
  the action plan "table" and the ICA→PCA tracker are one entry per record — the entries band
  is the list §1.3 names. Forced by references living on the `Entry`: §1.2 S5/S6 are
  per-countermeasure and per-action rules that a union of links cannot answer.
  Two new shared substrates, both extracted before their second repetition (D-127):
  `src/methods/shared/fieldForm.ts` + `FieldFormEditor.tsx` (one record, fixed fields — reuses
  `rowTable`'s `RowFieldType` rather than restating it) and `shared/nodeTree.ts` +
  `NodeTreeEditor.tsx` (branching `parentId` list, flat storage with edges derived at render
  time per D-71). 6a's four hand-rolled fixed-field editors are deliberately not retrofitted
  (P-23).
  Ten new plugins, each following Phase 5/6a's file shape plus a schema, Editor and
  renderToA3 test: `pointOfCause` (Step 2, the chain's origin — a target, never a referrer);
  `whyWhyTree`, `faultTree`, `causeEffectMatrix`, `pfmeaLinkage`, `comparativeAnalysis`
  (Step 4, plain); `hypothesisVerification` (Step 4, `pointOfCause` role); `countermeasure`
  (Step 5, `rootCause` role, multi-valued); `actionItem` (Step 6, `countermeasure` role);
  `icaPcaTransition` (Step 6, the only two-role method). `causeEffectMatrix` is the one
  method that computes on its own fields, which D-120 explicitly anticipated: values stay
  string-typed in the schema and `score.ts` parses at render time, so a blank cell stays
  unscored rather than becoming a zero that out-ranks a genuinely low score.
  `registry.test.ts` gained five cross-registry assertions, including one for a silent
  failure class no plugin's own tests can see: a role pointing at a step with no method to
  target renders a picker that says "nothing to link to" forever.
  D-129 extends the D-62 fixture corpus rather than adding a fifth file: `fully-populated.ppsx`
  now carries a Step 5 countermeasure with two `rootCause` references, one resolving and one
  **permanently dangling**. That is what turns D-117's "a `.ppsx` with a dangling reference
  must still open" from an in-memory assertion into one observed through the real Rust writer
  and reader — and it makes a future load-time integrity check fail loudly instead of quietly
  breaking D-59. Only `fully-populated.ppsx` changed on regeneration; the other three are
  byte-identical, as the deterministic writer should give.
  Known scope gaps, documented not dropped: the action plan's **Gantt** half (P-22 — a new
  `ChartSpec` variant, and D-114 caps a slice at one new mechanism); 6a's four editors not
  migrated (P-23). The countermeasure deliberately carries no error-proofing level — §1.3
  makes the hierarchy selector its own method, which is 6c's.
  Verification note: every test that passed on first run was mutation-checked before being
  trusted, per Anayasa §3b's "'temiz' en tehlikeli çıktıdır" — drop the create-mode
  `references` wiring → 2 integration tests fail; disable the orphan predicate → 4 fail;
  replay the fixture round-trip against the pre-6b binary → 2 fail.
  `npm test` 543/543 (140 files), `npm run lint` clean (the one pre-existing ThemeProvider
  warning), `npm run build` green (same pre-existing chunk-size warning as Phase 3/4/5/6a).
  `cargo test` 89/89, `cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check`
  all clean — Rust untouched by 6b, as expected.
Post-6b real-app walkthrough: 2026-08-04, Barış walked the picker and chart export in the
  real Tauri webview for the first time this session (`npm run tauri dev` needed D-62's second
  binary given a `default-run` key, src-tauri/Cargo.toml — `cargo run` cannot pick between two
  binaries unassisted; CI never caught this since `tauri build` has no such ambiguity).
  **P-24 CLOSED**, both halves — the picker, D-124's one-entry-per-record granularity, D-117's
  dangling-reference display and undo all confirmed correct against real use; Barış explicitly
  preferred the one-entry-per-record shape over a free-form alternative. Two real UI bugs found
  and fixed: **D-130** — `DialogContent` (`src/ui/Dialog.tsx`, Phase 1/D-49) had no height cap;
  Fishbone's growing cause list was the first content ever tall enough to push the Title and
  Save/Cancel off-screen with no scrollbar to reach them — fixed with `max-h-[85vh]` and a
  scrolling body, title/description `shrink-0`. **D-131** — `RightPanel`'s fixed 320px could
  not show a real ~1394pt-wide A3 sheet at a readable size; gained a widen/narrow toggle
  (`w-[70vw]`), orthogonal to the pre-existing collapse toggle, Barış's choice over a
  drag-resizable panel or a wider fixed default (AskUserQuestion).
  **P-21 partially re-opened**: page setup confirmed correct (A3 landscape) and 3 embedded
  images confirmed non-blank and correctly anchored to Steps 2/3/4 by drawing-XML cell range —
  but only 3 of the 4 expected chart images are present. **P-25 (new, open)**: the Step 2 block
  holds two image-bearing entries (Pareto + Trend), both primary, both with their text on the
  sheet, but only one embedded image — not an appendix-overflow case (the workbook has exactly
  one worksheet). Not root-caused; candidate suspects by proximity are `src/a3/layout/place.ts`'s
  per-block image-row-span reservation (D-102) and the merge-overlap area D-111 touched, but
  this needs a PROBE test against the real two-entry case, not a guess.
  **D-132 (new Step 2 method, `category-breakdown`)**: Barış's walkthrough also surfaced a real
  methodology question — his team's own practice runs 5M (Man/Machine/Material/Method/
  Measurement) *stratification* in Step 2, pure 5-Why in Step 4, distinct from D-11's canonical-
  TBP framing (Fishbone-in-Step-4-as-cause-hypothesis-generator) the app currently teaches in
  its Step 2/4 coaching copy. Both are legitimate, real industry practices; D-11 stays LOCKED
  (Fishbone unchanged, Step 4 only) and a new, independent Step 2 method is added instead of
  reversing it — `SPEC.md` §1.3 now names it. Fixed 5M list, `RowTableEditor` with a
  `select`-typed category column (no diagram, no `categorySet` flexibility — YAGNI, see D-132).
  `npm test` 561/561 (144 files), `npm run lint` clean, `npm run build` green. `cargo test`
  89/89, `cargo clippy` and `cargo fmt` clean (`Cargo.toml`'s `default-run` is metadata-only;
  Rust otherwise untouched).
**D-133 (pop-out A3 preview window, superseding D-131)**: 2026-08-04, same-session follow-up —
  Barış tried D-131's `w-[70vw]` widen and it still could not show a real A3 sheet at a readable
  size (bigger box, no zoom/fit). New route `src/app/routes/a3PreviewWindow/` opens a real Tauri
  `WebviewWindow` (label `a3-preview`) with its own least-privilege capability file
  (`src-tauri/capabilities/a3-preview.json` — never gets `dialog:default`/`opener:default`) and
  its own zoom/pan/fit-to-window controls (`zoomMath.ts`, pure functions — mouse wheel zooms at
  the cursor, left/middle-button drag pans, Fit to Window applies automatically only on the
  first descriptor a freshly opened window receives). `RightPanel`'s in-panel widen/narrow
  toggle is removed, replaced by a single "Open in new window" button; the in-panel preview
  itself (with Export A3) stays as the quick/at-a-glance option.
  Cross-window architecture: a second `WebviewWindow` is a fully separate JS runtime with no
  shared Zustand store, so `RightPanel` pushes the **already-built** `A3LayoutDescriptor`
  (never the raw `ProjectModel`) via `emitTo` whenever it rebuilds one — the preview window
  needs zero knowledge of `src/methods`/the plugin registry and never re-runs D-102's
  rasterization pass a second time, it just feeds the descriptor straight into the unmodified
  `HtmlA3Renderer` (D-94's dumb-renderer contract untouched). A ready handshake
  (`A3_PREVIEW_READY_EVENT`, preview → main, broadcast rather than targeted since the preview
  window has no reliable way to learn the main window's real label) closes a real race:
  `new WebviewWindow(...)` creates the window asynchronously, so a push sent immediately after
  opening it can arrive before that window's own `listen()` is registered and be silently lost.
  Verified, not just reasoned: `window.test.ts` asserts the listen-before-emit ordering directly
  (mocking `@tauri-apps/api/webviewWindow`/`event`); `zoomMath.test.ts` asserts the zoom-at-
  cursor math's actual claim — the content pixel under the cursor stays under the cursor through
  a zoom — plus fit-to-window, clamping, and centering, 17 tests total, no DOM needed since it's
  pure math. `cargo check` confirms both capability JSON files are schema-valid.
  Also opened **P-26** (not investigated, explicitly deferred by Barış): the exported A3 mixes
  Turkish template labels with English method-content text, and some content doesn't land
  inside its intended block. Two likely separate defect classes — i18n (every `renderToA3`
  hardcodes English export labels, D-43) and layout/alignment (template geometry) — neither
  triaged this session; flagged for whichever future phase actually takes Turkish export and
  visual fidelity seriously.
  `npm test` 592/592 (147 files), `npm run lint` clean, `npm run build` green. `cargo check`/
  `cargo test` (89/89)/`cargo clippy`/`cargo fmt` all clean — capability JSON is the only Rust-
  adjacent change.
**D-134 (permission fix, same day)**: Barış actually clicked "Open in new window" and nothing
  happened. `default.json` had the wrong permission — `core:window:allow-create` gates a command
  (`plugin:window|create`) this code never calls; the real calls need
  `core:webview:allow-create-webview-window` (window construction) and `core:window:allow-set-focus`
  (focusing an existing one), neither covered by `core:default`. Every gate that ran, including
  `cargo check`, passed anyway — the capability file was schema-*valid*, just semantically wrong,
  and nothing short of a human clicking the real button exercises the actual `invoke()` call
  against a real ACL. Fixed both permissions, wrapped every Tauri call in `openOrFocusA3PreviewWindow`/
  `pushDescriptorToPreviewWindow` in `try`/`catch` (a `void`-called async function's rejection was
  vanishing as an unhandled rejection with zero visible symptom), and simplified `a3-preview.json`
  to just `core:default` (D-133's explicit `core:event:*` grants there were already redundant).
  3 regression tests added (rejected `getByLabel`/`setFocus`/`emitTo` no longer escape silently),
  mutation-verified.
**D-135 (unreadable A3 text in dark theme, same day)**: with the window actually open, Barış
  reported the gray text on the white sheet as unreadable. 11 of the template's 15 cell styles
  (`entryContent`, `bodyCell`, `title`, `fieldLabel`, …) declare no `font.color`; those cells
  inherited the app's theme-aware `--color-ink` (near-white in dark mode) onto the sheet's
  hardcoded white background. Fixed with one line at `HtmlA3Renderer`'s render root
  (`color: "#000000"`, matching `background: "#ffffff"`'s existing non-theme-aware treatment) —
  an inline color on any cell (the four PDCA headers) always wins over this, so nothing that was
  already correct changed. 2 regression tests added, mutation-verified.
  `npm test` 597/597 (147 files), `npm run lint` clean, `npm run build` green, `cargo test`
  (89/89)/`cargo clippy`/`cargo fmt` clean (Rust untouched by this fix). Not yet committed to git.
**P-25 CLOSED (D-136, 2026-08-05)**: root-cause session for "Step 2 block with two chart entries
  (Pareto + Trend) embeds only one image." Ruled out both named suspects with real, non-mocked
  evidence at every layer: a permanent PROBE test (`src/a3/p25TwoImageEntries.probe.test.ts`)
  proves `place.ts`/`buildA3Layout`'s per-block image-row-span math (D-102) produces 2 correct,
  non-colliding anchors for the real Pareto+Trend two-entry case; a temporary Playwright harness
  (D-113's own practice, deleted after use) drove the real registry's real charts through real
  `html-to-image` in a real cached Chromium — both rasterized every run; a temporary Rust probe
  (also deleted) fed those real PNG bytes through the real `write_a3_workbook` — `drawing1.xml`
  came back with exactly 2 correctly-anchored `<xdr:pic>` elements. Everything reachable without
  a live macOS Tauri window (WKWebView, not Chromium) checks out. Fixed instead, in
  `src/a3/render/rasterize.ts`: `rasterizePendingImages` ran every pending chart's off-screen
  render + layout-settle + capture **concurrently** and silently dropped a per-slot failure with
  zero trace (no log, no descriptor field) — now sequential (one slot fully finishes before the
  next starts) and a failure is `console.error`-logged with the entry id and image kind, same
  discipline D-134 already established for a vanishing rejection one layer over. This targets the
  one piece of the pipeline D-105/D-113 already proved fragile in the real WKWebView twice before,
  now under untested concurrent load — **not a confirmed fix of the exact WKWebView failure**,
  which this environment cannot reproduce; re-open if a future real-webview walkthrough still
  drops an image. 2 new regression tests (no-interleaving, failure-is-logged), both run RED
  against the pre-fix code before the fix and GREEN after.
  `npm test` 601/601 (148 files), `npm run lint` clean, `npm run build` green, `cargo test`
  (89/89)/`cargo clippy`/`cargo fmt` clean (Rust untouched by this fix). Not yet committed to git.
Phase 6c (Step 2's distribution chart + Steps 5–6's remaining plain methods): DONE 2026-08-05,
  per D-114's 6c scope. Scope was re-derived from `SPEC.md` §1.3 line by line against 6a/6b/
  Phase 5 rather than from the slice sketch (D-123's own method, applied a second time) —
  `countermeasure/fields.ts`'s Phase 6b comment had already named the exact resulting list,
  which confirmed the derivation rather than driving it (D-137). Two real design tensions
  surfaced before any code: whether the action plan's Gantt half belongs in this slice
  (D-138 — deferred to its own future slice, since it would be a second new mechanism
  competing with the distribution chart for D-114's one-per-slice cap; closes the "6c" half
  of P-22's own note) and two reference/scope judgment calls (D-139, D-140), both put to
  Barış via AskUserQuestion before implementation, per `CLAUDE.md`'s own "write a short plan
  and let me approve it" rule.
  **New Step 2 mechanism (the one D-114 allows this slice):** `src/methods/chartSpec.ts`
  gained `HistogramChartSpec`/`ScatterChartSpec`/`BoxPlotChartSpec`; `src/a3/methodContract.ts`
  gained one new `A3ImageKind` (`distribution-chart`) shared by all three, dispatched by
  `spec.kind` inside `distributionChart/DistributionChart.tsx` — the same one-kind-many-
  variants shape `ChartSpec` already used for Pareto/Trend/Trajectory (D-102, D-141).
  `distributionChart/stats.ts` computes histogram bins (Sturges' rule default) and box-plot
  quartiles (Tukey's hinges) at render time from `string`-typed raw sample values, mirroring
  `causeEffectMatrix/score.ts`'s D-120 posture; the box plot itself renders as a stacked
  invisible-base + visible Bar with `ReferenceLine`s for median/min/max rather than Recharts'
  `ErrorBar`, deliberately the simpler of two viable approaches on the one layer already
  proven fragile three times (D-105/D-107/D-111/D-113/D-136). Verified against the real
  pipeline per this phase's own instruction, not read-only: `distributionChart/xlsxSurvival.test.ts`
  proves the D-102 two-call `buildA3Layout` survival pattern, and a new permanent PROBE test
  (`src/a3/distributionChartThreeImageEntries.probe.test.ts`) proves the real registry places
  **three** simultaneous Step 2 chart images (Pareto + Trend + distribution) at distinct,
  non-colliding anchors with zero overflow warnings — a concurrency case one entry larger
  than any prior session had exercised (`p25TwoImageEntries.probe.test.ts`'s two).
  **Nine new plain methods**, each following 6a/6b's file shape (`index.ts`/`schema.ts`/
  `Editor.tsx`/`renderToA3.ts` + a schema, Editor and renderToA3 test): Step 5 —
  `errorProofingHierarchy` (fixed-field form with a shape-coded strength bar, D-41; references
  a Step 5 countermeasure — the registry's first same-step reference, D-139),
  `impactEffortMatrix` (scored list + computed quadrant rather than a literal drag-and-drop
  2×2, D-142 — deferred as **P-27**), `weightedDecisionMatrix`/Pugh (structurally
  `causeEffectMatrix` renamed, with its own local `score.ts` rather than touching 6b's
  shipped file — P-23's precedent applied again), `sideEffectRiskAssessment` (also
  same-step-references a countermeasure, D-139), `trialPlan`, `costApproval` (a standalone
  plugin rather than fields added to `countermeasure`'s already-shipped schema, D-140);
  Step 6 — `trialResultLog`, `trainingCommunicationRecord`, `implementationIssuesLog`
  (all three `RowTableEditor`-based, D-115). `registry.test.ts`'s reference-role invariants
  were extended, not just re-asserted: "is declared by exactly N methods" now counts six
  (was five), and the "never points a role at the declaring method's own step alone"
  invariant now names `error-proofing-hierarchy`/`side-effect-risk-assessment` as documented
  exceptions instead of silently breaking for the four 6b referrers it still holds for.
  **Found and fixed while closing this phase's own quality gate, out of 6c's scope but
  blocking an honest green gate (D-143):** `listenForPreviewReady` (`a3PreviewWindow/window.ts`,
  shipped in D-133) was the one Tauri call in that file D-134's same-day audit didn't reach —
  unlike its two siblings, it had no try/catch, so `RightPanel`'s mount effect calling it
  without `await`/`.catch` let a rejected `listen()` (no Tauri runtime in any test
  environment) escape as a genuinely unhandled promise rejection. Every prior session's
  `npm test N/N` line was a true test count and a false "green" claim — `npm test`'s process
  exit code has been 1 since D-133, never checked underneath the printed summary. Fixed with
  the same try/catch + no-op-fallback pattern D-134 already used; one regression test added.
  Deferred, not silently dropped, mid-session: Barış supplied `reference/PPS_A3_Format_Examp_FINAL.xlsx`
  (an 8-step, 3-column candidate A3 template) partway through this session; evaluating it
  (geometry re-analysis, resolving the 3-column-vs-2-column-folded-in-half question, possibly
  comparing against a 2-column global-standard reference) was deliberately pushed to its own
  clean session — it is a template-layer decision (`src/a3/templates/*`, `reference/
  TEMPLATE_ANALYSIS.md`, intersects D-08/D-09/D-10/D-35's LOCKED decisions) with no
  architectural coupling to this slice's method-plugin work (D-03 keeps layout and content
  separate), and mixing it into 6c's context would have been Anayasa Madde 4/D-24's "one work
  unit, one clean session" violated mid-flight.
  `npm test` 718/718 (183 files, up from 601/601 at 148 — 117 new tests, D-143's regression
  included), **exit code 0** — the first session this gate is verified actually clean rather
  than merely printed clean (D-143). `npm run lint` clean (the one pre-existing `ThemeProvider`
  warning). `npm run build` green (same pre-existing chunk-size warning). `cargo test` 89/89,
  `cargo clippy --all-targets -- -D warnings` and `cargo fmt -- check` all clean — Rust
  untouched by 6c, as expected. Not yet committed to git.
**Oturum A — page contract (D-149's first of four): DONE 2026-08-05.** No code written; a
  measurement-and-decision session. `reference/TEMPLATE_ANALYSIS.md` §12 is the deliverable.
  Parser self-tested 20/20 on fixed inline samples before the real file was opened (§9's own
  method), including the §9.2 range-record bug as an explicit case. Produced: (1) the A3-exact
  grid closing D-152 — 0.32 in margins chosen on a *hardware* constraint (D-146's 5 pt sits
  inside most A3 lasers' ~5 mm unprintable border and would be clipped), width gained by
  widening the 24 body columns 41.25 → 47.25 pt with the `KAT` divider untouched, printed
  margins equal to within 0.0155 mm, fold centre exact, fit scale 100 % so D-146's 1:1 and
  D-40's 8 pt floor both survive (D-154); (2) the block budget, Barış choosing "targeted
  correction" over literal fidelity — ADIM 2 59.5 → 48 %, ADIM 3 15.4 → 22 %, ADIM 8 9.8 → 14 %
  (D-155); (3) the per-block capacity ceiling table, every constant read from shipped code
  rather than estimated (D-156). Two findings worth carrying: the OOXML stored-width vs
  visible-character unit trap, which silently breaks the A3 fit if transcribed wrong (D-154),
  and the fact that five blocks sharing the right column's 650 pt makes the shipped
  `CHART_ROW_SPAN = 10` geometrically impossible there — P-31, Oturum B's to answer.
  Also closed: P-29 (Rev00 *is* the approved Farplas form → D-157 moves D-10's default).
**Oturum B1 — six working sheets + `Lists & Settings` (D-149's second of four, first
  half): DONE 2026-08-06.** No code written. Oturum B split into B1/B2 at its own opening
  budget check (D-161, Barış approved via AskUserQuestion) — B2 (`docs/oturumlar/
  B2-gorsel-dil-arayuz.md`) covers §5.2–§5.4 (block visual language, step-page interface,
  elastic-allocation interface) in its own clean session. `reference/TEMPLATE_ANALYSIS.md`
  §13 is this session's deliverable, closing P-30. A hand-rolled OOXML reader (no openpyxl
  in this environment — raw `sheetN.xml`/`sharedStrings.xml`, same method as §9/§12) passed
  an 8/8 fixed-sample selftest before the real file was opened, then scanned all 7 remaining
  sheets: 183 rows, 2257 cells, 24 merges, 15 `dataValidation` elements. Two findings worth
  carrying: (1) the six working sheets model PPS as **three PDCA-long lifecycle tables**
  (a KPI-trend table tagged by `Phase`, one unified action table tagged by `Type`, a
  root-cause hypothesis→verification chain) rather than 8 step-scoped forms — confirms
  rather than threatens the app's `Entry`+`references[]` architecture (D-116/D-124), since
  `CLAUDE.md`'s own "template is a projection of the model, never the reverse" already
  covers this; (2) `Lists & Settings` is a static human-readable legend, not a live formula
  source — verified directly (all 15 `dataValidation` `formula1`s are literal comma lists;
  zero range references to it exist anywhere in the workbook). Confirmed, not a gap: the
  shipped fishbone `6M` category set matches Rev00's own 7-item Ishikawa category list
  exactly. Seven new-method candidates surfaced for **Oturum C** (not decided here):
  Sustainment Audits, a 7-fixed-document tracker, a Yokoten tracker, an 8-question Lessons
  Learned checklist, three new root-cause-verification fields, two new `actionItem` fields,
  and confirmation that D-153's "Genel RAG" header field needs a Red/Amber/Green vocabulary
  nothing currently provides. While answering Oturum B's own three open design questions
  (asked once, up front, per the session prompt's own §9), Barış made three decisions now
  binding for B2: the problem-statement panel stays `gapStatement`'s already-shipped 3 fields
  with no schema change (D-162), ADIM 1's 5N1K panel is a new plugin rather than a reuse of
  the shipped `five-g-5n1k` — which was also found to carry a different field set than the
  reference visual (D-163), and elastic allocation is automatic-by-default plus a manual
  override (D-164). `reference/README.md`'s status table updated (six sheets: ANALİZ
  EDİLMEDİ → ÖLÇÜLDÜ).
**Oturum B2 — block visual language, step-page interface, elastic-allocation interface
  (D-149's second of four, second half): DONE 2026-08-06.** No code written.
  `reference/TEMPLATE_ANALYSIS.md` §14 is this session's deliverable. Two `AskUserQuestion`
  rounds up front (per the session prompt's §9) resolved the palette collision (D-165:
  extend, not neutralise — two zero-overlap colour layers, goal-state green/blue/red plus
  six new 5N1K-category hues, realised as static template cell styles rather than a new
  dynamic colour field) and P-31 (D-167: not one blanket mechanism — ADIM 5/6/8 need none,
  reusing D-41's shape-coded status markers inline; only ADIM 7 gets a new `A3ImageKind`,
  `kpi-strip`, because the registry scan run this session found Step 7 has zero dedicated
  plugins today and genuinely needs a compact before/target/actual visual). Mid-session,
  Barış shared a hand-annotated screenshot proposing a two-column ADIM 1 with a Pareto +
  monthly/yearly cost-impact panel; a direct opinion plus a second `AskUserQuestion` round
  confirmed D-159's single-column, zero-slack geometry stays locked (the sketch was a
  concept note) while the cost-impact content becomes a new, independent Step 1 plugin
  (`problem-impact`, D-166) — treated the same as 5G: an optional entry subject to elastic
  allocation and D-100's appendix guarantee, not a guaranteed panel. ADIM 2/3/4 needed no
  new mechanism (D-168, verified by reading the real registry — every method already
  conforms to D-99/D-102's shared `A3BlockContent` contract); ADIM 3 in particular is fully
  covered by the already-shipped `smartTarget` plugin (D-38). The step-page picker itself
  is the surface `MethodBand.tsx` (read, unmodified) never designed — Anayasa's own G6
  pattern, textbook: a registry census run this session found Step 2 carries 10 dedicated
  methods and Step 4 carries 9, all rendered as one flat, equal-weight card grid. D-169
  adds an optional `MethodPlugin.tier?: "recommended" | "more"` field and a two-section
  `MethodBand` (backward compatible, unset = `"more"`), with a starting — not frozen —
  editorial "recommended" set per step. D-170 answers D-160's own open question (how a user
  sees a block at its floor) concretely: a `pinned` per-block row-count override the solver
  treats as a constraint, a floor badge/disabled grow-handle, a reset-to-automatic control,
  and D-100's existing `a3Visibility` indicator as the overflow signal. `reference/README.md`'s
  palette-collision warning is marked resolved, pointing at D-165/§14.1. Not yet committed
  to git.
**Oturum B3 — block-by-block visual verification (D-149's second of four, third part):
DONE 2026-08-16.** No app code touched — a design/verification session per
D-171's own loop. **ADIM 1 CLOSED**: the v2 mockup from B2's live verification round (lighter
Layer A fills `#8FBF4F`/`#4A90D9`/`#E0342A`, SVG gap bracket/arrow/callout, separated rounded
Problem Statement cards) was reviewed and approved by Barış — `TEMPLATE_ANALYSIS.md` §14.1's
⚠️ note is resolved and its Layer A table now carries the confirmed values, D-165 updated to
match. **ADIM 2 opened, tur 1, awaiting review**: mocked up as two entries stacked vertically
inside the 567×338 pt canvas (26 rows, D-158/D-159's current default) — a Pareto chart
("2.1", mold-cavity breakdown of the same çapak/flash-defect scenario ADIM 1 established,
n=52 over 6 weeks) and a Stratification Matrix table ("2.2", shift-level breakdown whose
%4,2 total ties back to ADIM 1's own headline figure). Vertical stacking was a deliberate
correction of an initial side-by-side assumption — `place.ts` reserves each entry's own
full-width row-span (D-102's real mechanism), it does not split a canvas into columns, so
the mockup now matches what the app actually does rather than an arbitrary layout guess.
The Pareto's bar/line colours were deliberately drawn from the app's own `--steel`/`--graphite`
tokens rather than reusing any Layer A or Layer B hue, keeping D-165's "no colour carries two
meanings" rule intact for a data-viz context neither layer was meant to cover. Reference crop
is a fresh, newly-cropped panel from `LeanUK_PPS_A3_worked_example.png`'s "Step 3 — Problem
Analysis & Breakdown" section (its own Pareto-shaped panel, "2. Daily run time breakdown") —
the first time this session's crop tooling (Pillow, `sips` unavailable for arbitrary offsets)
was used instead of a carried-over crop. **ADIM 2 CLOSED same session** — Barış reviewed the artifact and approved it in tur 1, no
changes requested. D-174 confirms the two findings the mockup was built to test: entries
stack vertically inside a block canvas (D-102's real `place.ts` mechanism — the mockup was
corrected from an initial wrong side-by-side assumption before Barış ever saw it), and the
Pareto's colours stay in a third register untouched by either D-165 palette layer. Cumulative
artifact redeployed to the same URL
(`https://claude.ai/code/artifact/b1ae2136-9785-4985-b7a3-587663d38466`) with both blocks
marked approved. `TEMPLATE_ANALYSIS.md` §14.4 and `DECISIONS.md` D-174 written, committed,
pushed. Two blocks closed in one session is already at D-171's own "one or two per session"
ceiling — next block (ADIM 4) deliberately deferred to a fresh session rather than continuing
here, per B3's own budget warning (Anayasa Madde 1/G1).

**ADIM 4 (fresh session, same day): CLOSED, three rounds** — D-175. TUR 1 mocked
`layout.ts`'s actual (vertical-branch) fishbone geometry as-is; TUR 2 redrew it after Barış
shared his own reference photo of a classic diagonal Human/Machine/Material/Method fishbone
(45° branches, box-free arrow-tipped cause "ribs", a separate terminal effect box) — approved
("bu sefer güzel olmuş"); TUR 3 fixed a real gap Barış caught (the 5-Why panel next to it was
still unstyled plain text) by giving it its own horizontal arrow-chain visual language tied to
one specific fishbone cause, and closed with approval. The same round surfaced a second, larger
finding outside the mockup's own scope: Barış shared the real, signed
`reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.pdf`, whose own Root Cause
Analysis panel is a branching Why-Why tree (matching `whyWhyTree`, not `fishbone`) — and
`whyWhyTree` has no diagram renderer at all, only plain indented lines. Recorded as D-176/P-35
(three concrete gaps: no diagram component, no terminal-outcome field for ✓/❌+KN{N}, and a
node-vs-entry reference-architecture mismatch), explicitly not designed out this session per
Barış's own call. `layout.ts`'s own three deltas from the approved visual (branch angle, cause
position, missing effect node) filed separately as P-34, a small mechanical fix for whichever
session next touches that file.

**ADIM 7 (new clean session): CLOSED, one round** — D-177. `kpi-strip` (P-31/D-167) had zero
shipped plugins to draw from, the most abstract design in the whole loop, so before mocking
anything this session cropped two real references for the first time: Barış's own signed
EK-2905 document's *filled* ADIM 7 panel (confirming §12.4's Rev00-derived column names —
`KPI · Önce · Hedef · Sonra · Sürdürme · Sonuç` — against real data, not just a blank template)
and LeanUK's own "Step 7 — Check Results" panel, whose target-line bar chart supplied the
bullet-graph grammar the mockup used, reusing ADIM 1's own approved Gap Analizi visual language
rather than inventing a new one. Three tiles tested Layer A's three states together (green/
blue/red) on one canvas; Fire Oranı reused ADIM 1's own %4,2→%1,0 figures for scene continuity.
Approved with no revision ("senin önerdiğin yapı uygun gözüküyor, bu şekilde devam edelim").
Found, not fixed: D-167's drafted `KpiStripChartSpec` shape has no field for Sürdürme/Sonuç,
both real columns in both references — P-36.

**ADIM 3 (same session): CLOSED, one round, fastest of the four** — D-178. Deliberately not a
redesign — D-38 was already LOCKED and `smartTarget` already shipped from Phase 5 — just a
verification that the three-zone strip (181.44/226.80/158.76 pt, read straight from
`renderToA3.ts`) still reads as "düzenli ve yalın" at real scale. `TrajectoryChart.tsx`'s real
Kraft/Indelible/Danger colours carried through unchanged — a third colour register untouched by
either Layer A or Layer B, the same "no colour means two things" rule confirmed a third time
this session. Continuity: baseline/target = ADIM 1's own figures, the chart's "Bugün" point =
ADIM 7's Sonra value, the commitment line's date/owner = EK-2905's real fields. Barış approved
in two words ("maket ok").

**ADIM 5/6/8 (same session): CLOSED, one round, the last block in D-171's suggested order** —
D-179. P-31's other half: no new mechanism, just D-41's already-LOCKED shape-coded status glyph
(square/triangle/circle, colour as reinforcement, never colour alone) applied inline — but to
three genuinely different content shapes rather than one pattern forced onto all three. ADIM 5
mocked a single `countermeasure` field-form entry (`fieldFormLines`'s real output already fills
the whole 78 pt/6-row default canvas by itself — a second entry would be dishonest to how
`place.ts` actually allocates rows, D-100 sends the overflow to elastic growth or an appendix
instead), glyph on the title line only since the *entry* carries the status. ADIM 6 mocked two
`implementationIssuesLog` rows (each line already is one record via `rowTableLines`), glyph per
row, using only two shapes because that field is genuinely two-valued (open/resolved) — no
third shape forced in. ADIM 8 has no shipped plugin yet, so its 52 pt/4-row canvas (the page's
tightest) got one placeholder line purely to confirm the geometry holds. Reference: LeanUK's own
"Schedule Key" legend (Plan/Actual/Delay, pattern *and* colour) — direct precedent for D-41's
rule inside the same source file this project already treats as its visual-language anchor.
Approved in two words again ("maket ok"). Found, not fixed: `countermeasure` (3-valued),
`implementationIssuesLog` (2-valued), and `actionItem` (no status field at all, only a free-text
`percentComplete`) have no documented shape/colour mapping anywhere in code — P-37.

**B3 is now fully closed — all eight ADIM blocks visually verified and approved.** Every round
redeployed the same cumulative artifact
(`https://claude.ai/code/artifact/b1ae2136-9785-4985-b7a3-587663d38466`), and every approval was
written into `TEMPLATE_ANALYSIS.md` §14 and `DECISIONS.md` (D-165 v2/D-174/D-175/D-177/D-178/
D-179) and committed+pushed the same session it was confirmed, per D-171's own rule that the
artifact is disposable scratch and the docs are the record. Three findings crossed outside B3's
own scope and were deliberately not designed out here — P-35 (`whyWhyTree` has no diagram),
P-36 (`KpiStripChartSpec` missing Sürdürme/Sonuç), P-37 (no status→shape/colour mapping for
D-41) — all filed for **Oturum C**, D-149's fourth and last planned session, whose own job is
the plugin construction §14.8 already lists (`problem-impact`, 5N1K, `kpi-strip`'s real
plugins, Step 8's document/Yokoten/Lessons-Learned candidates) plus these three newly-surfaced
gaps.

**Oturum C — C1 (D-149's fourth and last part, first code slice): DONE 2026-08-16.** Per
`docs/oturumlar/C-yontem-plugin-insasi.md` §3, Barış chose **C1 only** this session (of six
proposed slices, C1–C6) — the lowest-risk one, no new mechanism, existing code extended. C2–C6
(problem-impact/5N1K, `kpi-strip`, ADIM 8's design turn, `whyWhyTree`'s diagram, the tier/
drag-handle UI) remain undone, per the session prompt's own budget warning against attempting
all six in one sitting.
**P-37 CLOSED, 4 of 5** (D-180): D-41's shape-coded status glyph (■/●/▲, D-165's Layer A colour
as reinforcement) wired into `countermeasure`/`icaPcaTransition`/`costApproval`/
`implementationIssuesLog`'s `renderToA3.ts`. `A3TextLine` gained an optional `tone` field —
additive, not a new mechanism, since each wrapped content line already gets its own cell/
styleId and Rust's `styles.rs` already reads `font.color` generically; six new template style
entries, zero new Rust code. New shared `src/methods/shared/statusGlyph.ts`. `actionItem`
deliberately stays unmarked (Barış's call, AskUserQuestion) — no discrete status vocabulary
exists to map from; re-open if one is ever added.
**P-34 CLOSED** (D-180): `fishbone/layout.ts`'s three geometry corrections against D-175's
approved visual — diagonal branch offset, causes repositioned strictly between the spine and
their category (fraction-interpolated), and a new terminal `"effect"` node at the spine's far
end. The effect node's label is the block's real problem statement on export
(`FishboneImageSpec`, `renderFishboneToA3.ts` now sends `{ payload, effectLabel: entry.title }`)
and an i18n placeholder in the interactive Editor, which has no entry title to give it. Not
re-verified against the D-175 mockup pixel-for-pixel this session (no new B3-style visual round
run) — if a future visual pass finds the constants read wrong at real scale, adjust the
constants, the interpolation shape itself is sound.
**B1 §13.4 candidate 5 done, candidate 6 partial** (D-180): `hypothesisVerification` gained
`confidencePercent`/`residualUncertainty`/`customerRelevance` (labeled export segment, separate
from the unlabeled candidate/method/evidence triad); `actionItem` gained `customerApproval`
(select, defaults to `"pending"` like every other select field in this codebase). **"Days
late" deliberately not built** — computed relative to today's date, which conflicts with
`renderToA3` needing to stay pure/deterministic (golden-file tests assume no `Date.now()`);
filed as **P-38**, needs an explicit `asOf` threaded through the export pipeline.
**Found and fixed one layer over C1's own scope:** `RowTableEditor.tsx` read `row[column.key]`
with no fallback — a row persisted before a column was added to it (exactly what candidate 5
just did to `hypothesisVerification`) has that key genuinely `undefined` at runtime
(`Entry.payload` is never Zod-validated on load, D-52). One-line `?? ""` fix, project-wide,
mirroring the guard `fieldForm.ts`'s equivalent already had.
Three real judgment calls went to Barış via `AskUserQuestion` before any code, per this file's
own "write a short plan and let me approve it" rule: shape+colour vs. shape-only for P-37
(chose shape+colour), `actionItem`'s glyph treatment (chose: skip, no vocabulary to map),
Days-late's determinism conflict (chose: defer to P-38, not an Editor-only compute). All three
recommended options were the ones chosen.
`npm test` 752/752 (185 files, up from 718/718 at 183 — 34 new tests), exit code 0 (confirmed,
not just printed — D-143's own lesson). `npm run lint` clean (the one pre-existing
`ThemeProvider` warning). `npm run build` green (same pre-existing chunk-size warning).
`cargo test` 89/89, `cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check` all
clean. `scripts/gen-a3-fixture.ts` re-run since the template's style table changed (only
`fishbone` appears in the fixture and only via opaque `spec`/text unaffected by P-34's geometry
or spec-shape change) — the regenerated fixture diff is a pure 69-line addition (the same six
new styles the TS snapshot gained), nothing else moved. Not yet committed to git.

**Oturum C — C2 (D-149's fourth and last part, second code slice): DONE 2026-08-16.** Per
`docs/oturumlar/C2-problem-impact-5n1k.md`, Barış's own choice of C2 next after C1's close.
Two new Step 1 plugins, zero new mechanisms — both field lists and geometries were already
settled in Oturum B2 (§14.2, D-163/D-166), so this was a build turn, not a design turn; no
`AskUserQuestion` round was needed mid-session.
`src/methods/fiveN1K/` (D-163): a fresh plugin, `five-g-5n1k` untouched — field set `ne`/
`neden`/`nasil`/`kim`/`neZaman`/`nerede`, matching `reference/visual/5N-1K.jpeg`'s own order.
`renderToA3` returns six equal-width (`1/6`) `A3ContentZone`s (D-102's zones mechanism,
`smartTarget` was the first user, this the second) — each zone's first line the bold question
label ("NE?", "NEDEN?", …), the second line the user's trimmed answer when non-blank. Carries
no entry title (the reference image has none, and the 4-row canvas has no spare row) while
keeping the standard two-parameter `renderToA3` shape anyway, uniform arity across every
plugin, via a scoped `eslint-disable-next-line @typescript-eslint/no-unused-vars` — the one
prior precedent for that pattern is `A3PreviewWindow.tsx`.
`src/methods/problemImpact/` (D-166, §14.2 item 5): its own independent Pareto category data
(same shape as `pareto/schema.ts`, per D-124 never a display of Step 2's `pareto` entry) plus
a four-field financial-loss form (`monthlyLoss`/`yearlyLoss`/`currencyUnit`/`calculationNote`,
`shared/fieldForm.ts`'s substrate, D-127). `renderToA3` emits title + loss-form lines, then a
`pareto-chart` image built the same way `pareto/renderToA3.ts` builds its own. Declares no
`imageKind`/`renderImage` of its own — `paretoMethod` already registers that renderer and
`getA3ImageRendererMap()` resolves by kind string across the whole registry, so a second
registration would be dead weight; proven, not just reasoned, by a dedicated
`xlsxSurvival.test.ts` that builds through the real registry and confirms the shared renderer
still resolves. `Editor.tsx` duplicates `pareto/Editor.tsx`'s small category-list JSX inline
rather than extracting a shared substrate, per this slice's zero-new-mechanism budget.
Both registered in `src/methods/registry.ts`; TR/EN i18n keys added together. One test-design
lesson recorded in D-181: a multi-character `user.type()` against a controlled input whose
`onChange` is a bare mock (no re-render feeding the value back) does not accumulate — fixed
with a single-keystroke assertion, the same pattern `costApproval/Editor.test.tsx` already
used. `TEMPLATE_ANALYSIS.md` §14.8 marks both line items done.
`npm test` 775/775 (192 files, up from 752/752 at 185 — 23 new tests), exit code 0 (checked).
`npm run lint` clean (the one pre-existing `ThemeProvider` warning). `npm run build` green
(same pre-existing chunk-size warning). `cargo test` 89/89, `cargo clippy --all-targets -- -D
warnings` and `cargo fmt -- --check` all clean — Rust untouched, as expected; the fixture
regenerator was not re-run since neither the template's style table nor any registered
`imageKind` changed.

**Oturum C — C3 (D-149's fourth and last part, third code slice): DONE 2026-08-17.** Per
`docs/oturumlar/C3-kpi-strip.md`, C3's own tag as "this slice's tek yeni mekanizma" (D-114) —
the `kpi-strip` `A3ImageKind` + `KpiStripChartSpec` + ADIM 7's first real plugin (Step 7 had
none before this, only `genericText`). Unlike C1/C2, this slice carried one real open design
question (§2.2: what decides a KPI tile's Layer A colour?), asked via `AskUserQuestion` before
any code — **Option A**: each `KpiStripItem` carries its own manually-set
`status: "onTarget" | "inProgress" | "behind"`, the same never-computed posture P-37/D-180
already established for four other plugins; no `direction` field was added, since D-167/D-177
never called for one. `src/a3/methodContract.ts` gains `"kpi-strip"`; `src/methods/chartSpec.ts`
gains `KpiStripItem`/`KpiStripChartSpec` with P-36's `sustain?`/`result?` fix embedded at first
write, not patched later. `src/methods/kpiStrip/`: `baseline`/`target`/`actual` stay
`number`-typed like `pareto`'s `count` (drives the chart directly, nothing derived at render
time); `KpiStripChart.tsx` is hand-built SVG, not a Recharts composition — a bullet graph's
dashed-tick/solid-tick+triangle marks have no direct Recharts primitive, and an explicit
`viewBox` sidesteps the `ResponsiveContainer` capture hazard (D-105/D-113) structurally;
`CHART_ROW_SPAN = 6`, deliberately conservative — the *shipped* `farplas-7step-tr` ADIM 7 block
has 18 rows to spare, but the future Rev00-based 8-step template's own ADIM 7 canvas is only
78 pt/6 rows (§12.4/D-156), and Pareto/Trend's `10` would fit today while silently breaking the
moment Phase 11 switches the default template. `src/a3/render/rasterize.ts` needed zero
changes — confirmed at session start and again after: `rendererMap[slot.kind]` was already a
generic string-keyed dispatch. Registered in `src/methods/registry.ts`; TR/EN i18n keys added
together. TDD: schema/Editor/renderToA3 tests plus a dedicated `xlsxSurvival.test.ts` — unlike
`problem-impact` (C2), which reuses `paretoMethod`'s renderer, `kpi-strip` registers its own
`imageKind`/`renderImage`, so this test is the one proving the new registration resolves
end-to-end through the real registry. `TEMPLATE_ANALYSIS.md` §14.3/§14.8 and `DECISIONS.md`
P-31/P-36 marked closed.
`npm test` 794/794 (196 files, up from 775/775 at 192 — 19 new tests), exit code 0 (checked).
`npm run lint` clean (the one pre-existing `ThemeProvider` warning). `npm run build` green
(same pre-existing chunk-size warning). `cargo test` 89/89, `cargo clippy --all-targets -- -D
warnings` and `cargo fmt -- --check` all clean — Rust untouched, as expected (the rasterizer
stays kind-agnostic and the xlsx writer embeds PNGs with no awareness of `kind` strings at
all, confirmed by grep). `scripts/gen-a3-fixture.ts` was not re-run — it exercises no Step 7
entry, so its checked-in fixture is unaffected regardless of the new `imageKind`.

**Oturum C — C4 (D-149's fourth and last part, fourth code slice): DONE 2026-08-17.** Per
`docs/oturumlar/C4-adim8.md`, B1's §13.4 remaining four candidates — `sustainment-audit`
(ADIM 7) plus `document-updates-tracker`/`yokoten-tracker`/`lessons-learned` (ADIM 8), zero
new mechanisms, all straight applications of the existing `rowTable`(D-115)/`fieldForm`(D-127)
substrates. §2.2's three small questions went to Barış via `AskUserQuestion` before any code,
all three recommended options confirmed: none of the four take a reference role this round (no
clean `fromSteps` target — add when real use demands it, YAGNI); `sustainment-audit` is Step 7
(matching §13.1's Effectiveness Check page, distinct from `kpi-strip`'s one-off KPI tile);
P-37's status glyph (D-180) is deliberately **not** applied to any of the four this round —
several of their Status/Approval vocabularies are 4–5 valued, which doesn't map cleanly onto
D-41's three shapes, and mapping them would have been a real design call exceeding this slice's
"zero new mechanism" budget — noted on P-37 for a future revisit. `sustainmentAudit`
(`RowTableEditor`) mirrors `checkSheet` — 12 columns transcribed verbatim from §13.1.
`documentUpdatesTracker` extends D-122's fixed-category pattern (`tpmLossTaxonomy`) one layer
richer: each of seven fixed document types carries the same nine-field `FieldFormValues`
record rather than a two-field tag; `renderToA3` drops a document type's whole sub-section when
every field is blank. `yokotenTracker` (`RowTableEditor`) transcribes 13 columns literally —
only the two fields §13.1 explicitly marks "(Yes/No)" got a Yes/No select, the superficially
similar `riskReviewed`/`actionRequired`/`effectivenessChecked` stayed plain text (transcription,
not invention). `lessonsLearned` (`FieldFormEditor`) is eight fixed `textarea`/`wide` fields.
New shared substrate `shared/documentStatusOptions.ts` — extracted *before* the second
repetition (`documentUpdatesTracker` and `yokotenTracker` both draw `Status`/`Approval` from
§13.2's identical `Lists & Settings` dictionary), `YES_NO_OPTIONS` deliberately orders `"no"`
before `"yes"` since `emptyFieldFormValues` defaults a select to its first option and a fresh
row presuming "yes" would be the wrong default. All four registered in
`src/methods/registry.ts`; TR/EN i18n keys added together, including the three new shared
dictionaries (`methods.documentStatus.*`/`methods.documentApproval.*`/`methods.yesNo.*`, flat
under `methods.*` matching `methods.rowTable.*`'s existing convention). `TEMPLATE_ANALYSIS.md`
§13.4/§14.8 and `DECISIONS.md` D-183 record it; P-37 amended with a follow-up note.
`npm test` 824/824 (208 files, up from 794/794 at 196 — 30 new tests), exit code 0 (checked via
a separate logfile + `echo $?`, not piped through `tail`, per D-143's own lesson). `npm run
lint` clean (the one pre-existing `ThemeProvider` warning). `npm run build` green (same
pre-existing chunk-size warning). `cargo test` 89/89, `cargo clippy --all-targets -- -D
warnings` and `cargo fmt -- --check` all clean — Rust untouched, as expected. Not yet
committed to git.

**Oturum C — C5 (D-149's fourth and last part, fifth code slice): DONE 2026-08-17.** Per
`docs/oturumlar/C5-whywhytree-diyagram.md`, P-35's three gaps in `whyWhyTree` — no diagram, no
terminal-outcome field, and a node-vs-entry reference-architecture mismatch. Before any code,
this session opened `reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.pdf`'s
real ADIM 4 panel directly (P-35's own instruction, not just D-176's summary) — confirming four
top-level sub-problems fanning into parallel Why-chains with repeated mid-chain branching, every
leaf ending ✓ or ❌+KN{N}. Two of the three gaps are mechanical and shipped this slice (D-184,
this session's one D-114-budgeted mechanism): `whyWhyTree/layout.ts`'s `computeWhyWhyTreeLayout`
— a depth-column/leaf-row scheme (unlike Fishbone's fixed-category spine, this tree has no
bounded shape to hand-tune constants against) — feeds a new `WhyWhyTreeDiagram.tsx` (React Flow,
Fishbone's D-102/D-103 pattern: one implementation, live in the Editor and rasterized for
export, plain default nodes, no new colour language) registered under a new `A3ImageKind`,
`"why-why-diagram"`. `WhyWhyNodeSchema` gained an optional, loose `outcome` field (not
`z.enum`, D-51/D-116's own reasoning); KN{N} numbering is derived at render time from
`flattenTree`'s own depth-first order (`confirmedRootCauseNumbers`), never stored, per D-71's
"two representations, no precedence rule" trap — the same discipline Fishbone's `effectLabel`
already established (P-34). `renderWhyWhyTreeToA3.ts` now mirrors `renderFishboneToA3.ts`
exactly (`lines: [title]` + `image`, no `rowSpan`) — `TEMPLATE_ANALYSIS.md` §12.5 already sizes
ADIM 4's block for "1 grafik + 1 giriş," the slot Fishbone already fills, and the real signed
form uses the why-why tree as Step 4's sole diagram, never stacked with Fishbone. The third gap
— a confirmed root cause is one leaf inside a single entry, but D-124 (LOCKED) means
`references[]` can only link at the whole-entry level — is a real architectural question
(`C-yontem-plugin-insasi.md` §3's own flag: "the one sub-task crossing D-28's architecture
threshold"), put to Barış via `AskUserQuestion` with three genuine options and no recommendation
baked in. **Barış chose Option A** — extend `EntryReference` (D-116) with an optional
`targetNodeId?: string` — over Option B (extract a confirmed root cause into its own entry,
which would have split the tree's integrity across two representations, D-71's own trap again)
and Option C (leave references entry-level, cheapest, status quo). Per the question's own
framing and D-114's one-mechanism-per-slice budget (already spent on the diagram), **the
decision is recorded (D-185) but implementation is deferred to its own future slice — P-39** —
it would touch `findOrphanedReferences`/`findReferencesTo`/`listReferenceableEntries` (currently
entry-only) and `EntryReferenceField` (currently an entry picker), none of which this session
touched. `src/a3/render/rasterize.ts` and `registry.ts`'s `getA3ImageRendererMap` needed zero
changes — reverified (not assumed) as already fully generic over `A3ImageKind`.
`TEMPLATE_ANALYSIS.md` §14.4/§14.8 and `DECISIONS.md` D-184/D-185 record it; P-35 marked closed
2 of 3, P-39 filed for the third.
`npm test` 853/853 (211 files, up from 824/824 at 208 — 29 new tests), exit code 0 (checked via
a separate logfile + `echo $?`, not piped through `tail`). `npm run lint` clean (the one
pre-existing `ThemeProvider` warning). `npm run build` green (same pre-existing chunk-size
warning). `cargo test` 89/89, `cargo clippy --all-targets -- -D warnings` and `cargo fmt --
check` all clean — Rust untouched, as expected (the new `A3ImageKind` is TS-only).
`scripts/gen-a3-fixture.ts` was not re-run — it exercises `fishbone` for Step 4, never
`whyWhyTree`, so the checked-in fixture is unaffected. Not yet committed to git.

**Oturum C — C6 (D-149's fourth and last part, sixth and last code slice): DONE 2026-08-18.**
Per `docs/oturumlar/C6-tier-methodband.md`, narrowed by D-186 (found while scoping this
session's own prompt, before any code) to `MethodPlugin.tier` + two-section `MethodBand`
only — D-170's elastic-allocation drag-handle UI has no template to attach to yet
(`src/a3/layout/budget.ts` reads a static row range, D-158/D-160's whole model targets the
not-yet-built Rev00 `pps-8step-auto` template) and was deferred whole to Phase 11, filed as
**P-40**. `src/methods/types.ts` gains an additive `tier?: "recommended" | "more"` field
(unset = `"more"`, same posture as `referenceRoles`/D-116, no migration). 19 of the registry's
plugins got `tier: "recommended"` per D-169's own table (Steps 1/2/3/5/6/7/8 unchanged from
B2's original assignment); `genericText` deliberately never gets one. **§2.4's open question**
— D-169's Step 4 table (`fishbone`+`fiveWhy`) sat LOCKED against D-176/P-35's real evidence
(the signed EK-2905 form's ADIM 4 panel is a Why-Why tree, not a fishbone) — went to Barış via
`AskUserQuestion` before any code, three options presented with no recommendation. **Barış
chose Option B**: `whyWhyTree` added as a third recommended method alongside `fishbone`/
`fiveWhy`, nothing removed. `MethodBand.tsx`: `getMethodsForStep`'s order is preserved,
filtered (not resorted) into "Recommended" (always visible) and "Other methods" (a
`Button variant="ghost"`/`aria-expanded` disclosure, `CoachBand.tsx`'s own toggle pattern
reused rather than reinvented, defaulting collapsed, rendering nothing when empty). i18n:
`workspace.methodBand.otherMethods.{show,hide}` added TR+EN together. **Two existing test
helpers broke and were fixed** — `WorkspaceScreen.test.tsx`'s `addGenericTextEntry` (named in
the C6 prompt) and `entryReferences.integration.test.tsx`'s `addEntry` (not named, found only
by running the full suite) both queried a method card directly by text; since the methods they
target now sit in the collapsed "more" group, both now expand the disclosure first if
collapsed, idempotently, before locating the card.
**Mid-session, Barış raised two related but out-of-scope methodological points in chat**:
whether Fishbone's individual detected causes should each get their own linked 5-Why
drill-down, and whether a Step-4 workflow that skips Fishbone entirely (pure branching 5-Why,
matching EK-2905's real practice) should be first-class rather than an implicit possibility two
independent plugins happen to allow. Both acknowledged, neither designed or built — D-186 had
already narrowed this slice to `tier`/`MethodBand`, and both raise a real new
cross-plugin-linking mechanism plus a re-litigation of D-11's LOCKED Step-4 framing. Filed as
**P-41** rather than silently dropped or silently expanded into scope.
`npm test` 864/864 (212 files, up from 853/853 at 211 — 11 new tests: `MethodBand.test.tsx`'s
8 plus `registry.test.ts`'s 3 tier-default assertions), exit code 0 (checked via a separate
logfile + `echo $?`, not piped through `tail`). `npm run lint` clean (the one pre-existing
`ThemeProvider` warning). `npm run build` green (same pre-existing chunk-size warning) — hit
and fixed one `exactOptionalPropertyTypes` violation in the new test file and one
`noUncheckedIndexedAccess` complaint in `registry.test.ts` (typed the per-step lookup table
over the exact `StepId` union instead of `Record<number, ...>`). `cargo test` 89/89,
`cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check` all clean — Rust
untouched, as expected (`tier` is TS-only). `scripts/gen-a3-fixture.ts` was not re-run — `tier`
affects only which cards `MethodBand` shows, never the descriptor or the template's style
table. **D-149's Oturum C leg is now fully closed — C1 through C6 all shipped.** Only Oturum D
(P-26, i18n + block alignment) remains unwritten.

**Oturum D — D1 (i18n export labels, D-149's own follow-on): DONE 2026-08-18.** Per
`docs/oturumlar/D1-i18n-ihracat-etiketleri.md`, closing P-26's i18n half. D1's own mandated
first step (§2.3 — verify the prompt's own inventory before coding) found the prior session's
scan had undercounted by roughly 2× — its regex couldn't see a hardcoded label inside a
template literal starting with `${…}` or an all-caps 2-letter word like `"NE?"`. A deeper
sweep found 15 more touch points beyond the original 15: `causeEffectMatrix`,
`comparativeAnalysis`, `weightedDecisionMatrix`, `msaGageRr`, `problemTypeClassifier`,
`isIsNot`, `tpmLossTaxonomy`, `faultTree`, `fiveWhy`, `fiveG5N1K`, `fiveW2H`, `gapStatement`,
`smartTarget`, `threeLeggedFiveWhy`, `fiveN1K` — real total **29 method directories**, plus
`shared/whyChain.ts` and two chart components (`kpiStrip/KpiStripChart.tsx`'s known Turkish
hardcode, D-182/P-36, and a newly-found one in `distributionChart/DistributionChart.tsx`'s
box-plot view). Both the scope correction and the prompt's mandated Option A/B question went
to Barış together via one `AskUserQuestion` round before further code: **Option B** (real
bilingual export, not a Turkish-only translation pass) and **do the full grown scope in one
session** rather than subdividing. `A3EntrySummary` (`src/a3/methodContract.ts`) gained an
optional `language?: "tr" | "en"` field plus a `resolveA3Language` helper defaulting unset to
`"en"` — additive, D-128-style, so no pre-existing test fixture broke by default.
`buildA3Layout.ts`/`layout/place.ts` (the only two production sites building an
`A3EntrySummary`) forward `project.meta.language`. `shared/fieldForm.ts`'s `exportLabel`
became `Record<A3Language, string>`; every touched directory's bilingual dictionary sourced
its Turkish value from that field's own already-shipped editor `labelKey` translation, not a
fresh re-translation. A third, structurally different bug was found and deliberately **not**
fixed here — `fishbone/FishboneDiagram.tsx`'s category labels resolve against the editor's
active i18next UI language rather than `project.meta.language` (a dynamic mis-source, not a
static string) — filed as **P-42** per Barış's own call. `npm test` 898/898 (212 files, up
from 864/864 — 34 new tests), exit code 0 (checked via a separate logfile + `echo $?`, not
piped through `tail`). `npm run lint` clean (the one pre-existing `ThemeProvider` warning).
`npm run build` green (same pre-existing chunk-size warning). `cargo test` 89/89,
`cargo clippy --all-targets -- -D warnings` and `cargo fmt -- --check` all clean — Rust
untouched, as expected. `scripts/gen-a3-fixture.ts` was re-run since `smartTarget` is one of
its five real methods and its fixture project is `language: "tr"` — the regenerated
`a3-layout-descriptor.json` diff is exactly the one line the commitment line produces.
Only D2 (P-26's layout/alignment half, kök nedeni henüz bulunmadı) remains unwritten.
Not yet committed to git.
