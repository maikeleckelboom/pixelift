import { type ParserOptions, PNG } from 'pngjs'
import type { PixelData } from '../../types.ts'

export default function decode(buffer: Buffer, options?: ParserOptions): PixelData {
  const png = PNG.sync.read(buffer, options)
  return {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height,
    channels: png.alpha ? 4 : 3
  }
}