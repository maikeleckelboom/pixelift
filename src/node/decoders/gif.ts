import { type GifBinary, GifReader } from 'omggif'
import type { FormatHandlers, PixelData } from '../../types.ts'

export default function decode(buffer: GifBinary, options?: FormatHandlers['gif']['options']): PixelData {
  const reader = new GifReader(buffer)
  const { frame = 0 } = options ?? {}
  if (frame >= reader.numFrames()) {
    throw new Error(`Frame index out of bounds: ${frame}`)
  }
  const data = new Uint8ClampedArray(reader.width * reader.height * 4)
  reader.decodeAndBlitFrameBGRA(frame, data)
  const view = new DataView(data.buffer)
  for (let i = 0; i < data.length; i += 4) {
    const temp = view.getUint32(i, true)
    view.setUint32(i, (temp & 0xff00ff00) | ((temp & 0xff) << 16) | ((temp >> 16) & 0xff), true)
  }
  return {
    data,
    width: reader.width,
    height: reader.height,
    channels: 4 // Always 4 (RGBA) after conversion
  }
}