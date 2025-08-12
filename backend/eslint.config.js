// This is an ESLint configuration file for a TypeScript backend project.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

// Robust solution to get __dirname in ES modules.
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
    // Ignore directories globally
    {
        ignores: ['dist/', 'node_modules/', '.env', 'vite.config.ts'],
    },

    {
        // Apply this setting to all .ts files
        files: ['src/**/*.ts'],

        // We inherit the recommended settings
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            // Prettier should always come last to override other style rules..
            prettierConfig,
        ],

        plugins: {
            '@typescript-eslint': tseslint.plugin,
            prettier: pluginPrettier,
        },

        // Language and environment options
        languageOptions: {
            // We use the TypeScript parser
            parser: tseslint.parser,

            // Parser-specific options
            parserOptions: {
                // Enables more powerful rules that require type information
                project: true,
                tsconfigRootDir: __dirname,
            },

            // We define the global variables available in the environment
            globals: {
                ...globals.node, // Node.js global variables (process, console, etc.)
            },
        },

        // Custom rules or rules to override inherited ones
        rules: {
            // Prettier's Rule: Displays formatting errors as ESLint errors.
            'prettier/prettier': 'error',

            // Disable rules that are not necessary or are too strict
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-namespace': 'off',

            // Enable important rules for backend robustness
            '@typescript-eslint/no-floating-promises': 'error',

            // I can add more custom rules here.
            'prefer-const': 'error',
        },
    }
);