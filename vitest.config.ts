import { defineConfig, type UserConfigExport } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  test: {
    alias: viteConfig.resolve?.alias ?? {},
    testTimeout: 30000,
    workspace: [
      {
        ...viteConfig,

        test: {
          globals: true,
          name: 'browser',
          include: ['test/browser/**', 'test/shared/**'],
          exclude: ['**/__screenshots__/**', '**/__snapshots__/**'],
          environment: 'browser',
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: 'playwright',
            viewport: {
              width: 1280,
              height: 720
            },
            instances: [
              { browser: 'chromium' }
              // { browser: 'firefox' },
              // { browser: 'webkit' },
            ]
          }
        }
      },
      {
        ...viteConfig,

        test: {
          globals: true,
          name: 'server',
          include: ['test/server/**', 'test/shared/**'],
          exclude: ['**/__screenshots__/**', '**/__snapshots__/**'],
          environment: 'node'
        }
      }
    ]
  }
} satisfies UserConfigExport);
