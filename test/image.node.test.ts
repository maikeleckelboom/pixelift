import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { decodeGIFFrame, getPixels } from '../src/node/pixels.ts'

describe('Node Environment', () => {
  it('should run in a node environment', () => {
    expect(global).toBeDefined()
  })

  it('decodes PNG correctly', async () => {
    const buffer = fs.readFileSync('./assets/test.png')
    const pixels = await getPixels(buffer)
    expect(pixels.channels).toBe(4)
    expect(pixels.width).toBeGreaterThan(0)
  })

  it('handles 3-channel JPEG', async () => {
    const pixels = await getPixels('./assets/test.jpg')
    expect(pixels.channels).toBe(3)
  })

  it('decodes GIF correctly', async () => {
    const buffer = fs.readFileSync('./assets/test.gif')
    const pixels = await getPixels(buffer)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(1000)
    expect(pixels.channels).toBe(4)
    expect(pixels.width).toBeGreaterThan(0)
  })
})
