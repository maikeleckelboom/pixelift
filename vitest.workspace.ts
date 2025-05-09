import { defineWorkspace } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineWorkspace([
  {
    test: {
      ...baseConfig.test,
      name: 'server',
      environment: 'node',
      include: ['**/*.test.ts', '**/*.server.test.ts', '**/server/**/*.test.ts'],
      exclude: ['**/*.browser.test.ts', '**/browser/**/*.test.ts'],
      benchmark: {
        exclude: ['**/*.browser.bench.ts', '**/browser/**/*.bench.ts']
      }
    }
  },
  {
    test: {
      ...baseConfig.test,
      name: 'browser',
      include: ['**/*.browser.test.ts', '**/browser/**/*.test.ts'],
      exclude: ['**/*.server.test.ts', '**/server/**/*.test.ts'],
      benchmark: {
        include: ['**/*.browser.bench.ts', '**/browser/**/*.bench.ts']
      },
      browser: {
        provider: 'playwright',
        enabled: true,
        headless: true,
        screenshotFailures: false,
        instances: [
          { browser: 'chromium' }
          // { browser: 'firefox' },
          // { browser: 'webkit' }
        ]
      }
    }
  }
]);
