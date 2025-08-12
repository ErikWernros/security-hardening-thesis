import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import pluginReact from 'eslint-plugin-react';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      pluginReact.configs.flat.recommended,
      prettierConfig

    ],
    plugins: {
      react: pluginReact,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: pluginPrettier,
    },
    languageOptions: {
      // We use the TypeScript parser
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module', // Allows the use of import/export
      globals: {
        ...globals.browser, // Add global browser variables (window, document, etc.)
      },
      parserOptions: {
        // Enable JSX syntax parsing for React
        ecmaFeatures: {
          jsx: true,
        },
        // Specifies the TypeScript project so that the TS parser can resolve types
        project: ['./tsconfig.app.json'],
      },
    },
    // Plugin-specific configuration (e.g. for eslint-plugin-react)
    settings: {
      react: {
        version: 'detect', // ESLint will automatically detect the React version (React 19.x in my case)
      },
    },
    // Custom rules or to override inherited rules
    rules: {
      // Disable these rules as with React 17+ and the new JSX Transform they are no longer needed
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Specific 'react-refresh' rule to ensure Vite's HMR
      // 'warn' is enough to not break the build if there's a small problem
      'react-refresh/only-export-components': 'off',
      //'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Reglas de React Hooks
      ...reactHooks.configs.recommended.rules,

      // New Prettier rule: Display Prettier errors as ESLint errors.
      'prettier/prettier': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          'prefer': 'type-imports',
          'fixStyle': 'inline-type-imports'
        }
      ]
    },
  },
])
