# PPS Hachi (八)

A cross-platform desktop app (macOS + Windows) that guides quality and process engineers
through the 8-step Toyota Practical Problem Solving method and exports a standard
landscape A3 report as `.xlsx`. Full scope lives in [`SPEC.md`](./SPEC.md); working rules
and decisions already made live in [`CLAUDE.md`](./CLAUDE.md) and
[`DECISIONS.md`](./DECISIONS.md).

This repository is currently a **Phase 0 scaffold** — no product UI yet, see "Current
state" in `CLAUDE.md`.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 20 (LTS) | `npm` ships with it |
| [Rust](https://www.rust-lang.org/tools/install) | stable, via [rustup](https://rustup.rs) | Tauri's Rust side is built with the stable toolchain |
| Platform SDK | see below | required to compile the native shell |

**macOS** — install the Xcode Command Line Tools:

```bash
xcode-select --install
```

**Windows** — install:
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (the "Desktop development with C++" workload)
- [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) — preinstalled on
  most current Windows, install manually otherwise

**Installing Rust:**

```bash
# rustup.rs is the standard installer on every platform
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

On macOS you can also use Homebrew, but `rustup` is a **keg-only** formula there — it
won't be added to `PATH` automatically:

```bash
brew install rustup
echo 'export PATH="/opt/homebrew/opt/rustup/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
rustup-init -y --default-toolchain stable   # or: rustup toolchain install stable
```

## Clone → run

```bash
git clone git@github.com:ozgurgovem/pps-hachi.git
cd pps-hachi
npm install
npm run tauri dev
```

This opens the app window on your current platform. First run compiles the Rust side,
which takes longer than subsequent runs.

## Build an installer

```bash
npm run tauri build
```

Produces, per D-32 (`DECISIONS.md`):
- **macOS**: a `.dmg` under `src-tauri/target/release/bundle/dmg/`
- **Windows**: an NSIS `.exe` (per-user install, no admin required) under
  `src-tauri/target/release/bundle/nsis/` — **no `.msi` is produced**, that target was
  dropped deliberately

Builds are unsigned at this stage; signing is a later, isolated step (`SPEC.md` §5).

## Checks

```bash
npm run lint             # ESLint (bans `any`, `@ts-ignore`; enforces the src/domain
                          # and src/a3 purity boundary)
npx tsc --noEmit          # TypeScript strict type-check
npm test                  # Vitest
cd src-tauri && cargo check && cargo test && cargo clippy -- -D warnings
```

All of the above run in CI (`.github/workflows/ci.yml`) on `macos-latest` and
`windows-latest`.

## Project layout

See §2.1 of [`docs/01_ORIENTATION_REVIEW.md`](./docs/01_ORIENTATION_REVIEW.md) for the
full directory layout and the reasoning behind it. The short version: `src/domain/` and
`src/a3/` are pure TypeScript — no React, no Tauri, no i18next — so the A3 layout engine
stays testable and Rust never grows layout logic of its own.

## Recommended IDE setup

[VS Code](https://code.visualstudio.com/) +
[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) +
[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
