import { defineWorkspace } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineWorkspace([
  {
    test: {
      ...baseConfig.test,
      name: 'node',
      environment: 'node',
      include: [
        'test/node/**/*.{test,spec}.ts',
        'test/**/*.test.ts',
      ],
    },
  },
  {
    test: {
      ...baseConfig.test,
      name: 'browser',
      include: [
        'test/browser/**/*.{test,spec}.ts',
        'test/**/*.test.ts',
      ],
      browser: {
        provider: 'playwright',
        enabled: true,
        headless: true,
        screenshotFailures: false,
        instances: [
          { browser: 'chromium' },
          { browser: 'webkit' },
          { browser: 'firefox', headless: false },
        ],
      },
    },
  },
]);
