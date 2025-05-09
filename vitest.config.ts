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
          exclude: ['**/browser/**/*.test.ts', '**/cross-platform-validity.test.ts'],
          benchmark: {
            exclude: ['**/browser/**/*.bench.ts']
          }
        }
      },
      {
        test: {
          name: 'browser',
          include: ['**/browser/**/*.test.ts'],
          exclude: [
            '**/*.server.test.ts',
            '**/server/**/*.test.ts',
            '**/cross-platform-validity.test.ts'
          ],
          benchmark: {
            include: ['**/browser/**/*.bench.ts']
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
      },
      {
        test: {
          name: 'cross-platform-validity',
          include: ['**/cross-platform-validity.test.ts'],
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
