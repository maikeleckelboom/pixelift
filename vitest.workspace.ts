import { defineWorkspace } from 'vitest/config'
import baseConfig from './vitest.config'

export default defineWorkspace([
  {
    test: {
      ...baseConfig.test,
      name: 'node',
      environment: 'node',
      include: [
        'test/*.node.{test,spec}.ts',
        'test/node/**/*.{test,spec}.ts',
        'test/**/*.node.{test,spec}.ts'
      ]
    }
  },
  {
    test: {
      ...baseConfig.test,
      name: 'browser',
      environment: 'happy-dom',
      include: [
        'test/*.browser.{test,spec}.ts',
        'test/browser/**/*.{test,spec}.ts',
        'test/**/*.browser.{test,spec}.ts'
      ],
      browser: {
        enabled: true,
        headless: true,
        provider: 'playwright',
        instances: [{ browser: 'chromium' }],
        screenshotFailures: false
      }
    }
  }
])
