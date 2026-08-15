import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      /* This is a plain-JSX codebase with no runtime PropTypes anywhere, so
         this rule only ever fires — it produced 325 of 350 errors and drowned
         out the real ones. Prop contracts belong in TypeScript, which is the
         actual fix; until then the rule is pure noise. */
      'react/prop-types': 'off',

      /* React 18 only passes `fetchpriority` through to the DOM in lowercase.
         The camelCase `fetchPriority` the rule wants is React 19's spelling —
         on 18 it logs "React does not recognize the fetchPriority prop" and is
         the wrong thing to write. Revisit when upgrading to React 19. */
      'react/no-unknown-property': ['error', { ignore: ['fetchpriority'] }],
    },
  },
]
