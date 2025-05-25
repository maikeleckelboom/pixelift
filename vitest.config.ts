import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '@': './src',
      '@test': './test'
    },
    workspace: [
      {
        test: {
          globals: true,
          name: 'browser',
          include: ['test/browser/**', 'test/shared/**'],
          environment: 'browser',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              { browser: 'chromium' }
              // { browser: 'firefox' },
              // { browser: 'webkit' },
            ]
          }
        }
      },
      {
        test: {
          globals: true,
          name: 'server',
          include: ['test/server/**', 'test/shared/**'],
          environment: 'node'
        }
      }
    ]
  }
});
