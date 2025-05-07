import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    testTimeout: 7500 // 7.5 seconds
  }
});
