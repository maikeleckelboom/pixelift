import { describe, expect, it } from 'vitest'
import { getPixels } from '../src/node/pixels.ts'
import fs from 'node:fs'

describe('Browser Environment', () => {
  it('should run in a browser environment', () => {
    expect(window).toBeDefined()
  })
})
