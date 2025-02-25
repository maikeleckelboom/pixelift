import { describe, expect, it } from 'vitest'
import { pixelift } from '../src/browser'

const externalUrls = {
  png: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png',
  jpg: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Close_wing_Basking_of_Athyma_perius_%28Linnaeus%2C_1758%29_-_Common_Sergeant_%284%29_WLB.jpg',
  gif: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif',
  webp: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Free-Instagram.webp'
} as const

describe('Browser Environment', () => {
  it('should run in a browser environment', () => {
    expect(window).toBeDefined()
  })

  it('decodes PNG correctly', async () => {
    const url = new URL('./assets/test.png', import.meta.url)
    const { data, width, height, channels } = await pixelift(url)
    expect(width).toBeDefined()
    expect(height).toBeDefined()
    expect(channels).toBe(4)
    expect(data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('handles 3-channel JPG', async () => {
    const url = new URL('./assets/test.jpg', import.meta.url)
    const { data, width, height, channels } = await pixelift(url)
    expect(width).toBeDefined()
    expect(height).toBeDefined()
    expect(channels).toBe(4)
    expect(data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes GIF correctly', async () => {
    const url = new URL('./assets/test.gif', import.meta.url)
    const { data, width, height, channels } = await pixelift(url)
    expect(width).toBeDefined()
    expect(height).toBeDefined()
    expect(channels).toBe(4)
    expect(data.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes WebP correctly', async () => {
    const url = new URL('./assets/test.webp', import.meta.url)
    const { data, width, height, channels } = await pixelift(url)
    expect(width).toBeDefined()
    expect(height).toBeDefined()
    expect(channels).toBe(4)
    expect(data.filter(Boolean).length).toBeGreaterThan(0)
  })
})
