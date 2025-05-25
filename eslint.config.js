import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  eslint.configs.recommended,
  ...tslint.configs.strict,
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
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
]);
