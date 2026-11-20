import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Data fetching and socket setup legitimately set state from effects.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/contexts/**/*.jsx'],
    rules: {
      // Context files intentionally co-locate the provider component and its hook.
      'react-refresh/only-export-components': 'off',
    },
  },
])
