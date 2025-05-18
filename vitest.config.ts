import { defineConfig } from 'vitest/config';
import SnapshotLastSequencer from './test/fixtures/snapshot-last-sequencer';

export default defineConfig({
  test: {
    globals: true,
    sequence: {
      sequencer: SnapshotLastSequencer
    },
    workspace: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['**/*.test.ts', '**/*.universal.test.ts'],
          exclude: ['**/browser/**/*.test.ts'],
          benchmark: {
            include: ['**/server/**/*.bench.ts'],
            exclude: ['**/browser/**/*.bench.ts']
          }
        }
      },
      {
        test: {
          name: 'browser',
          include: ['**/browser/**/*.test.ts', '**/*.universal.test.ts'],
          exclude: ['**/server/**/*.test.ts', '**/decode-consistency.test.ts'],
          benchmark: {
            include: ['**/browser/**/*.bench.ts'],
            exclude: ['**/server/**/*.bench.ts']
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
    ]
  }
});
