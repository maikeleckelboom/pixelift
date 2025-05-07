import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    testTimeout: 60_000,
    teardownTimeout: 30_000
  }
});
