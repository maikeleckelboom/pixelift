import type { GifBinary } from 'omggif'
import type { BufferLike } from 'jpeg-js'

export interface PixelData {
  width: number
  height: number
  data: Uint8ClampedArray
  channels: 3 | 4
}

export type NodeImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif';
export type BrowserImageFormat = 'png' | 'jpeg' | 'jpg' | 'gif' | 'webp';
export type SupportedFormat =
  | Extract<NodeImageFormat, BrowserImageFormat>
  | Exclude<BrowserImageFormat, NodeImageFormat>;

export type NodeInput = string | BufferLike | GifBinary
export type BrowserInput = string | URL | File | ImageBitmapSource

type PixeliftImpl<T> = (input: T) => Promise<PixelData>
export type Pixelift = PixeliftImpl<NodeInput> | PixeliftImpl<BrowserInput>

export type PixeliftOptions =
  | { format: 'png', checkCRC?: boolean; skipRescale?: boolean }
  | { format: 'jpeg' | 'jpg'; formatAsRGBA?: boolean }
  | { format: 'gif'; frame?: number }
  | { format: 'webp' }
  | { format?: undefined };