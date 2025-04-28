import { defineWorkspace } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineWorkspace([
  {
    test: {
      ...baseConfig.test,
      name: 'server',
      environment: 'node',
      include: ['**/*.server.test.ts', '**/*.test.ts'],
      exclude: ['**/*.browser.test.ts']
    }
  },
  {
    test: {
      ...baseConfig.test,
      name: 'browser',
      include: ['**/*.browser.test.ts', '**/*.test.ts'],
      exclude: ['**/*.server.test.ts'],
      testTimeout: 120_000,
      browser: {
        provider: 'playwright',
        connectTimeout: 120_000,
        enabled: true,
        headless: true,
        screenshotFailures: false,
        instances: [{ browser: 'webkit' }, { browser: 'chromium' }, { browser: 'firefox' }]
      }
    }
  }
]);
