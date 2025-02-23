import { isNode } from './shared/env'
import type { PixelData, Pixelift } from './types'

export async function pixelift(...args: Parameters<Pixelift>): Promise<PixelData> {
  if (isNode) {
    const { pixelift: nodeImpl } = await import('./node/pixelift')
    return nodeImpl(...(args as Parameters<typeof nodeImpl>))
  } else {
    const { pixelift: browserImpl } = await import('./browser/pixelift')
    return browserImpl(...(args as Parameters<typeof browserImpl>))
  }
}

export { convertToArgbIntArray } from './shared/conversion'
export * from './types'
