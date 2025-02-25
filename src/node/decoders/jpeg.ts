import { type BufferLike, decode as decodeJPEG } from 'jpeg-js'
import type { PixelData } from '../../types.ts'

export default function decode(buffer: BufferLike, options?: { formatAsRGBA: true }): PixelData {
  const { formatAsRGBA = true } = options ?? {}

  const { data, width, height } = decodeJPEG(buffer, {
    useTArray: true,
    formatAsRGBA
  })

  return {
    data: new Uint8ClampedArray(data),
    width,
    height,
    channels: formatAsRGBA ? 4 : 3
  }
}
