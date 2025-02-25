import { pixelift } from '../src/node'
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('Node Environment', () => {
  it('should run in a node environment', () => {
    expect(global).toBeDefined()
  })

  it('decodes PNG correctly', async () => {
    const buffer = fs.readFileSync('./test/assets/test.png')
    const pixels = await pixelift(buffer)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('handles 3-channel JPEG', async () => {
    const pixels = await pixelift('./test/assets/test.jpg', { format: 'jpg', formatAsRGBA: false })
    expect(pixels.channels).toBe(3)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('handles 4-channel JPEG', async () => {
    const pixels = await pixelift('./test/assets/test.jpg', { format: 'jpg', formatAsRGBA: true })
    expect(pixels.channels).toBe(4)
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes GIF correctly', async () => {
    const buffer = fs.readFileSync('./test/assets/test.gif')
    const pixels = await pixelift(buffer, { format: 'gif', frame: 2 })
    expect(pixels.data.filter(Boolean).length).toBeGreaterThan(1000)
  })

  // it('decodes webp correctly', async () => {
  //   const buffer = fs.readFileSync('./test/assets/test.webp')
  //   const pixels = await pixelift(buffer)
  //   expect(pixels.data.filter(Boolean).length).toBeGreaterThan(0)
  // })
})
