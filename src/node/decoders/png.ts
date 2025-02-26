import { PNG } from 'pngjs'
import type { NodeFormatHandlers, PixelData } from '../../types.ts'

export default function decode(buffer: Buffer, options?: NodeFormatHandlers['png']['options']): PixelData {
  const png = PNG.sync.read(buffer, options)
  return {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height,
    channels: png.alpha ? 4 : 3
  }
}