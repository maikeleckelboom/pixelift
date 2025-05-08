import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    testTimeout: 60_000,
    teardownTimeout: 30_000
  },
  server: {
    fs: {
      strict: false,
      allow: ['./test/browser/unit', './test/__fixtures__', './node_modules/ws']
    }
  }
});
