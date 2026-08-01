import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// src/domain and src/a3 must stay pure (§2.1 of docs/01_ORIENTATION_REVIEW.md):
// no React, no Tauri, no i18next. This is what keeps buildA3Layout golden-testable
// and keeps layout logic out of Rust.
const pureModuleBoundary = {
  files: ['src/domain/**/*.{ts,tsx}', 'src/a3/**/*.{ts,tsx}'],
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
)
