import { defineConfig } from 'vitest/config';
import SnapshotLastSequencer from './test/fixtures/snapshot-last-sequencer';

export default defineConfig({
  test: {
    globals: true,
    isolate: false,
    sequence: { sequencer: SnapshotLastSequencer },
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: [
            'test/server/**/*.test.ts',
            'test/**/*.server.test.ts',
            'test/**/*.universal.test.ts'
          ],
          benchmark: {
            include: ['test/server/**/*.bench.ts']
            //   include: ['test/server/unit/**/*.bench.ts'],
            //   exclude: ['test/server/integration/**/*.bench.ts']
          }
        }
      },
      {
        extends: true,
        test: {
          name: 'browser',
          environment: 'happy‑dom',
          setupFiles: ['test/setup.ts'],
          include: [
            'test/browser/**/*.test.ts',
            'test/**/*.browser.test.ts',
            'test/**/*.universal.test.ts'
          ],
          benchmark: {
            include: ['test/browser/**/*.bench.ts']
            //   include: ['test/browser/unit/**/*.bench.ts'],
            //   exclude: ['test/browser/integration/**/*.bench.ts']
          },
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
          }
        }
      }
    ]
  }
});
