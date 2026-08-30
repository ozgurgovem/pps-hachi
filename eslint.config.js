import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// src/domain and src/a3 must stay pure (§2.1 of docs/01_ORIENTATION_REVIEW.md):
// no React, no Tauri, no i18next. This is what keeps buildA3Layout golden-testable
// and keeps layout logic out of Rust.
//
// D-94: src/a3/render/** is carved out of this boundary. It renders an
// already-computed A3LayoutDescriptor to CSS Grid — the frontend analogue of
// D-04's "Rust is a dumb serializer of the descriptor," so it needs React the
// same way the Rust xlsx writer needs rust_xlsxwriter. The invariant this
// boundary actually protects is "no layout DECISIONS outside buildA3Layout,"
// not "no React under src/a3" — HtmlA3Renderer must map the descriptor 1:1
// onto markup, never compute placement, budget, or overflow itself.
const pureModuleBoundary = {
  files: ['src/domain/**/*.{ts,tsx}', 'src/a3/**/*.{ts,tsx}'],
  ignores: ['src/a3/render/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'react', message: 'src/domain and src/a3 must stay pure — no React.' },
          { name: 'react-dom', message: 'src/domain and src/a3 must stay pure — no React.' },
          { name: 'i18next', message: 'src/domain and src/a3 must stay pure — no i18next.' },
          {
            name: 'react-i18next',
            message: 'src/domain and src/a3 must stay pure — no i18next.',
          },
        ],
        patterns: [
          {
            group: ['@tauri-apps/*'],
            message: 'src/domain and src/a3 must stay pure — no Tauri.',
          },
        ],
      },
    ],
  },
}

// D-57: migration functions may not import the current model schema from
// src/domain/model — a migration typed against the live schema silently
// changes meaning every time that schema is edited later. Scoped to
// production code only: a *test* importing the live schema/CURRENT_SCHEMA_VERSION
// is the point (D-62's contiguity test checks the real registry against the
// real current version), and a broken test on a schema change is exactly the
// loud signal this rule exists to get instead of a silent one.
const migrationsModelBoundary = {
  files: ['src/domain/migrations/**/*.{ts,tsx}'],
  ignores: ['src/domain/migrations/**/*.test.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/model', '**/model/*'],
            message:
              'Migrations may not import the current model schema (D-57) — embed a frozen copy of whatever shape this migration depends on instead.',
          },
        ],
      },
    ],
  },
}

// Faz 8 Dilim 3 (D-20): `e2e/**` specs run under WebdriverIO's mocha
// framework (`mochaOpts: { ui: "bdd" }`) — describe/it/before/after are
// injected as real globals by the mocha test runner at run time, not
// imported, and the specs also use Node's fs/os/path directly (the wdio
// process itself, not the webview). `**/*.{ts,tsx}`'s own block below sets
// `globals.browser` project-wide; this block adds mocha+node on top for this
// one directory rather than narrowing the base set for everyone else.
const e2eGlobals = {
  files: ['e2e/**/*.{ts,tsx}'],
  languageOptions: {
    globals: { ...globals.mocha, ...globals.node },
  },
}

export default tseslint.config(
  { ignores: ['dist', 'src-tauri/target'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // D-22: TypeScript strict, no `any`, no `@ts-ignore`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  pureModuleBoundary,
  migrationsModelBoundary,
  e2eGlobals,
)
