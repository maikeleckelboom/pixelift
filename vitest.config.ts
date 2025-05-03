import { defineConfig } from 'vitest/config';
import { resolve } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 0
  }
});
