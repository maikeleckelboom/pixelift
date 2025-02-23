import { pixelift } from '../src'
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('Node Environment', () => {
  it('should run in a node environment', () => {
    expect(global).toBeDefined()
  })

  it('decodes PNG correctly', async () => {
    const buffer = fs.readFileSync('./assets/test.png')
    const pixels = await pixelift(buffer)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('handles 3-channel JPEG', async () => {
    const pixels = await pixelift('./assets/test.jpg')
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes GIF correctly', async () => {
    const buffer = fs.readFileSync('./assets/test.gif')
    const pixels = await pixelift(buffer)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(1000)
  })

  it('throws error for unsupported format', async () => {
    const buffer = fs.readFileSync('./assets/test.webp')
    await expect(pixelift(buffer)).rejects.toThrowError(
      'WebP format is not supported in the Node environment'
    )
  })
})
