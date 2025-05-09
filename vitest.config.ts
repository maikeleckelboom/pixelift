import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    pool: 'threads',
    testTimeout: 60_000,
    teardownTimeout: 30_000
  },
  server: {
    fs: {
      strict: false
      // allow: ['./test/browser/unit', './test/fixtures', './node_modules/ws']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
