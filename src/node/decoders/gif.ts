import { type GifBinary, GifReader } from 'omggif'
import type { PixelData } from '../../types.ts'

export default function decode(buffer: GifBinary, frame: number = 0): PixelData {
  const reader = new GifReader(buffer)
  if (frame >= reader.numFrames()) {
    throw new Error(`Frame index out of bounds: ${frame}`)
  }
  const data = new Uint8ClampedArray(reader.width * reader.height * 4)
  reader.decodeAndBlitFrameBGRA(frame, data)
  for (let i = 0; i < data.length; i += 4) {
    const temp = data[i]
    data[i] = data[i + 2]
    data[i + 2] = temp
  }
  return {
    data,
    width: reader.width,
    height: reader.height,
    channels: 4 // Always 4 (RGBA) after conversion
  }
}