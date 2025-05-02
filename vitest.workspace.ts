import { defineWorkspace } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineWorkspace([
  {
    test: {
      ...baseConfig.test,
      name: 'server',
      environment: 'node',
      include: ['**/*.server.test.ts', '**/*.test.ts'],
      exclude: ['**/*.browser.test.ts'],
      benchmark: {
        exclude: ['**/*.browser.bench.ts']
      }
    }
  },
  {
    test: {
      ...baseConfig.test,
      name: 'browser',
      include: ['**/*.browser.test.ts'],
      exclude: ['**/*.server.test.ts'],
      browser: {
        provider: 'playwright',
        enabled: true,
        headless: true,
        screenshotFailures: false,
        instances: [
          { browser: 'chromium' },
          { browser: 'firefox' },
          { browser: 'webkit' }
        ]
      },
      benchmark: {
        include: ['**/*.browser.bench.ts']
      }
    }
  }
]);
