// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';       // ← import the object
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  // 1. Base JS rules
  js.configs.recommended,

  // 2. TypeScript strict rules
  ...tseslint.configs.strict,

  // 3. Prettier overrides (turn off style conflicts)
  prettier,

  // 4. Ignored files (flat config replaces .eslintignore)
  {
    ignores: [
      'dist/',
      '**/*.d.ts',
      'coverage/',
      'node_modules/',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs'
    ]
  },

  // 5. Global language options & parser
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        ...globals.es2024
      }
    }
  },

  // 6. File-specific rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  }
]);
