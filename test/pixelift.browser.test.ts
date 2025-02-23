import { describe, expect, it } from 'vitest'
import { pixelift } from '../src'

describe('Browser Environment', () => {
  it('should run in a browser environment', () => {
    expect(window).toBeDefined()
  })

  it('decodes PNG correctly', async () => {
    const pixels = await pixelift(
      'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'
    )
    expect(pixels.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('handles 3-channel JPG', async () => {
    const pixels = await pixelift(
      'https://upload.wikimedia.org/wikipedia/commons/d/df/Close_wing_Basking_of_Athyma_perius_%28Linnaeus%2C_1758%29_-_Common_Sergeant_%284%29_WLB.jpg'
    )
    expect(pixels.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes GIF correctly', async () => {
    const pixels = await pixelift(
      'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif'
    )
    expect(pixels.filter(Boolean).length).toBeGreaterThan(0)
  })

  it('decodes WebP correctly', async () => {
    const pixels = await pixelift(
      'https://upload.wikimedia.org/wikipedia/commons/b/bc/Free-Instagram.webp'
    )
    expect(pixels.filter(Boolean).length).toBeGreaterThan(0)
  })
})
