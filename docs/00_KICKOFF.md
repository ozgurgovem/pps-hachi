# How to start this in Claude Code

## Setup, before you type anything

Put the documents on disk in the repo. Do **not** attach them to the chat — attached files
live only in that one conversation, and you will be starting a fresh session for each
phase. `CLAUDE.md` is auto-loaded every session only when it sits at the project root.

```
pps-a3-studio/
├── CLAUDE.md                    ← root, auto-loaded every session
├── SPEC.md
├── DECISIONS.md                 ← Claude Code creates this in message 1
├── docs/
│   └── 00_KICKOFF.md            ← this file; for you, not for the model
└── reference/
    ├── TEMPLATE_ANALYSIS.md
    ├── PPS_A3_Format_TR.xls
    └── PPS_A3_Format_ENG.xls
```

```bash
mkdir -p pps-a3-studio/{docs,reference} && cd pps-a3-studio
git init
# copy the files into place as above
code .
```

Then open Claude Code in the VS Code terminal (`claude`) or the extension.

Two things matter more than the prompt itself:

1. **`CLAUDE.md` is loaded automatically every session.** That is where the rules that
   must never be forgotten belong. `SPEC.md` and `TEMPLATE_ANALYSIS.md` are read on demand.
2. **Do not ask for the whole app in one message.** An app this size will drift badly if
   you try. Work phase by phase, per `SPEC.md` §6, and start a fresh session for each
   phase so context stays clean.

---

## Message 1 — orientation (paste this first)

Copy everything between the fences.

```
Read these four documents in full before responding, in this order:

1. CLAUDE.md — the working rules. These persist across every session; treat them
   as constraints, not suggestions.
2. SPEC.md — the full scope.
3. reference/TEMPLATE_ANALYSIS.md — the reverse-engineered geometry of the company's
   existing A3 form. Authoritative for anything touching the sheet.
4. docs/00_KICKOFF.md — the phase plan we'll work through together.

Then verify rather than trust. TEMPLATE_ANALYSIS.md came from a separate analysis
and I want it checked before we build on it. Open reference/PPS_A3_Format_TR.xls
and reference/PPS_A3_Format_ENG.xls yourself. They're legacy BIFF8, so openpyxl
can't read them directly — convert with `soffice --headless --convert-to xlsx`
first, or use xlrd if you only need values.

Confirm or correct, and tell me which: the column widths and row heights, the 46
merged ranges, the block map with its point heights and column percentages, the
PDCA header fill colours, the print setup, and the loss-type category mismatch
between the TR and ENG files. Write any correction into the analysis document
itself and summarise what changed.

Then give me three things and stop:

1. Everything across these documents that is contradictory, underspecified, or
   that you think is a bad call. Be blunt. I would rather fix the spec now than
   the code later.
2. Your proposed repository structure — folders, key modules, and the exact
   signatures of the method plugin interface and of buildA3Layout().
3. The Phase 0 task list.

Also create DECISIONS.md, seeded with the decisions already locked in CLAUDE.md,
so we have somewhere to record changes from here on.

Do not write any application code yet. The app still has no name — raise that
before we reach Phase 1.
```

Two things in that prompt are deliberate. The verification step exists because the analysis
was done by someone else and should not be built on unchecked — an arithmetic error in the
column split was already caught once this way. And the no-code rule exists because in a
project this size, whatever gets written in the first reply sets the architecture before
you have seen it.

---

## Message 2 — Phase 0

> Execute Phase 0 from `SPEC.md` §6. Tauri v2 scaffold with React 19, TypeScript strict,
> Vite, Tailwind v4, Vitest, and a GitHub Actions workflow that builds on both macOS and
> Windows. Nothing else — no product UI yet.
>
> Done means: I clone this repo fresh, run the documented commands, and a window opens on
> both platforms. Write those commands in `README.md`. Then show me the diff summary and
> stop.

---

## Message 3 — Phase 1, the design pass

Design is where a generic result is most likely, so make this a two-step exchange rather
than one instruction.

> Phase 1 is the design system. Before any CSS, give me a design plan only:
>
> - A palette of 4–6 named hex values with a one-line rationale each
> - Three typeface roles — display, body, and a data/mono face for part numbers and
>   measurements — with the actual families you would use and why
> - The layout concept for the launch screen and the workspace, as short prose plus
>   ASCII wireframes
> - One signature element the app will be remembered by
>
> Read the visual direction in `SPEC.md` §2.1 first. Ground it in the drawing office and
> the shop floor — drafting vernacular, measured grids, revision stamps, plotter line
> work. Then critique your own plan: for each choice, tell me whether you would have
> arrived at it for any generic B2B desktop app. Revise anything where the answer is yes,
> and tell me what you changed.
>
> No code in this message.

Then, once you like the plan:

> Good — build it. Tokens, type scale, primitives, dark and light, and a `/gallery` route
> that renders every component so I can review them together. Follow the approved plan
> exactly; derive every colour and type value from the tokens.

---

## Message 4 — Phase 2 onward

One phase per session, same shape each time:

> Execute Phase N from `SPEC.md` §6. Plan first, show me the plan, wait for my go-ahead,
> then implement with tests. When it builds and the tests pass, show me a summary and
> stop. Update `DECISIONS.md` with anything architectural you decided along the way.

**Phase 4 deserves extra care** — it is the phase everything else depends on:

> Phase 4 is the A3 descriptor, the HTML preview, and the xlsx export. This is the
> architectural spine, so build it in this order and show me each piece:
>
> 1. The `A3LayoutDescriptor` type and `buildA3Layout()` as a pure function, with unit
>    tests and a golden-file snapshot
> 2. `HtmlA3Renderer` — React, CSS Grid, 1pt = 1px at 100% zoom
> 3. `XlsxA3Writer` in Rust — a dumb serializer of the descriptor with zero layout logic
> 4. A round-trip test: a fixture project with text, one photo and one chart PNG, exported
>    and then re-read with `calamine` to assert cell values, merges, image anchors and
>    print setup
>
> Then export a real file, open it, and tell me honestly whether the sheet matches the
> preview. If it does not, fix it before moving on. Do not tell me it works without
> having opened the file.

---

## Phases 8–10 — the AI layer

Do these **after** the app is complete and useful without AI. If you build the assistant
first you will end up with a chat wrapper that happens to export Excel, which is a
different and worse product.

**Phase 8 — foundation.** Security is the whole job here, so start with it:

> Phase 8 from `SPEC.md` §6 — the AI foundation. Read `SPEC.md` §8.1 through §8.5 first.
>
> Before writing code, look up the current API documentation for Anthropic, OpenAI and
> Google — endpoints, auth headers, streaming format, structured output mechanism, models
> endpoint, and image/PDF input format. Do not write these from memory; they change. Put
> what you find in `docs/PROVIDER_APIS.md` with links and the date you checked.
>
> Then build, in this order:
>
> 1. The `LlmProvider` trait and `ProviderId`, with a mock adapter and its tests
> 2. Keychain storage via the `keyring` crate, plus a log scrubber and a test asserting a
>    known key string appears in no log, no config file, no crash report and no `.ppsx`
> 3. The three real adapters, each with `list_models` and `test_connection`
> 4. The Settings → AI providers tab
> 5. Streaming chat panel in the right rail, over Tauri channels
>
> Rule I will check: no API key ever reaches the webview, and no provider call originates
> in TypeScript. Show me how you enforced that, not just that you did.

**Phase 9 — structured generation:**

> Phase 9 from `SPEC.md` §6. Read §8.6 through §8.9 and §8.11 first.
>
> The core of this phase is that AI output is a *proposal*, never a write. Build the
> proposal → Accept / Edit & Accept / Reject flow before you build any prompt, and make it
> structurally impossible for a model response to reach `ProjectModel` any other way. I
> want to see that enforcement in the type system where possible.
>
> Then: Zod → JSON Schema conversion, the per-provider structured output paths, the
> versioned prompt library under `src/ai/prompts/`, Rust-side file ingestion with the
> attachment review sheet, and the redaction layer with its reversible local token map.
>
> Start the prompt library with step 2 (Pareto from an uploaded xlsx) and step 4 (3-legged
> 5 Why critique). Those two prove the hardest paths — data extraction and Socratic
> critique. The other steps follow the same shape once those work.

**Phase 10 — review and layout:**

> Phase 10 from `SPEC.md` §6. Read §8.10.
>
> The placement optimizer returns a diff against the current `A3LayoutDescriptor`, shown
> side by side, applied only on Accept, never deleting content — only moving it to
> appendix or hidden. Protected tokens (numbers, dates, part numbers, owners) must survive
> condensation exactly; write a test that proves it with a deliberately dense project.
>
> Then the mock-auditor review pass and TR↔EN translation, and the cost meter.

---

## Prompts worth keeping in your pocket

When it starts drifting:

> Stop. Re-read `CLAUDE.md` and the relevant section of `SPEC.md`, then tell me where the
> current code has drifted from them before you write anything else.

When it over-delivers:

> That is more than I asked for. Show me only the part that Phase N actually requires and
> tell me what you would cut.

When working anywhere near the AI layer:

> Before this change, tell me: can any model output reach `ProjectModel` without a human
> Accept? Can any API key reach the webview? Can content from an uploaded file cause an
> action rather than just being read? If the answer to any of those is yes, fix that first.

When something feels wrong but you cannot name it:

> Review this as if you were a senior engineer inheriting it. What would worry you? Give
> me the three things most likely to cause pain in three months.

Before the end of every session:

> Update `DECISIONS.md` and the "Current state" block at the bottom of `CLAUDE.md`, then
> summarise where we are in two sentences.

---

## A note on models

Do this in Claude Code with Opus for the architecture and design phases (Messages 1, 3,
and Phase 4), and switch to Sonnet for the high-volume implementation phases where the
plan is already settled. `/model` switches mid-session.
