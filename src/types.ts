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


export type FormatHandler<Options = never> = {
  options: Options
  decoder: (buffer: Buffer, options?: Options) => PixelData | never
}

export interface FormatHandlers {
  png: FormatHandler<{ checkCRC?: boolean; skipRescale?: boolean }>
  jpg: FormatHandler<{ formatAsRGBA?: boolean }>
  jpeg: FormatHandler<{ formatAsRGBA?: boolean }>
  gif: FormatHandler<{ frame?: number }>
  webp: FormatHandler<{}>
}

export type PixeliftOptions<F extends SupportedFormat> = { format: F } & FormatHandlers[F]['options']
