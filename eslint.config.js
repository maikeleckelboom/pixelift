import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.strict,
  prettier,
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
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
]);
