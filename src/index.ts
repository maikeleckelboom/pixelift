import { isNode } from './shared/env'
import type { PixelData, Pixelift } from './types'

export async function pixelift(...args: Parameters<Pixelift>): Promise<PixelData> {
  if (isNode()) {
    const { pixelift: nodeImpl } = await import('./node')
    return nodeImpl(...(args as Parameters<typeof nodeImpl>))
  } else {
    const { pixelift: browserImpl } = await import('./browser')
    return browserImpl(...(args as Parameters<typeof browserImpl>))
  }
}

export type { PixelData, Pixelift }
export { PixeliftError, FormatError, NetworkError } from './shared/error'
export { convertToArgbIntArray, convertToUint8ClampedArray } from './shared/conversion'
