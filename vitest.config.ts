import { defineConfig } from 'vitest/config';
import SnapshotLastSequencer from './test/fixtures/snapshot-last-sequencer';

export default defineConfig({
  test: {
    globals: true,
    sequence: {
      sequencer: SnapshotLastSequencer,
      shuffle: false,
      concurrent: false
    },
    workspace: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['**/*.test.ts', '**/server/**/*.test.ts'],
          exclude: ['**/browser/**/*.test.ts', '**/decode-consistency.test.ts'],
          benchmark: {
            exclude: ['**/browser/**/*.bench.ts'],
            include: ['**/server/**/*.bench.ts']
          }
        }
      },
      {
        test: {
          name: 'browser',
          include: ['**/browser/**/*.test.ts'],
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
              { browser: 'chromium' },
              { browser: 'firefox' },
              { browser: 'webkit' }
            ]
          }
        }
      },
      {
        test: {
          name: 'snapshot-consistency',
          include: ['**/decode-consistency.test.ts'],
          environment: 'node'
        }
      }
    ]
  },
  server: {
    fs: {
      strict: false
    }
  }
});
