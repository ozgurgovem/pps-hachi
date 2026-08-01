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
- **Default template is `farplas-7step-tr`, then `farplas-7step-plus` once the fidelity test passes.** The company standard wins. Template B
  (`pps-8step-auto`) is an option the user chooses, not an upgrade we impose.
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

Phase: 1 of 12
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
