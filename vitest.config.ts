import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'node:path';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: path.resolve(__dirname, 'src'),
      projects: [path.resolve(__dirname, 'tsconfig.json')],
      loose: true,
      ignoreConfigErrors: true
    })
  ],
  test: {
    alias: {
      '@': path.resolve(__dirname, 'src')
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
