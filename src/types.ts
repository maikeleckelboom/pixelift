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
export type ImageFormat =
  | Extract<NodeImageFormat, BrowserImageFormat>
  | Exclude<BrowserImageFormat, NodeImageFormat>;

export type NodeInput = string | BufferLike | GifBinary
export type BrowserInput = string | URL | File | ImageBitmapSource

type PixeliftImpl<T> = (input: T) => Promise<PixelData>

export type Pixelift = PixeliftImpl<NodeInput> | PixeliftImpl<BrowserInput>

export type BrowserOptions = {
  colorSpace?: PredefinedColorSpace;
  premultiplyAlpha?: PremultiplyAlpha;
  colorSpaceConversion?: 'none' | 'default';
}

export type NodeFormatHandler<Options = never> = {
  options: Options
  decoder: (buffer: Buffer, options?: Options) => PixelData | never
}

export interface NodeFormatHandlers {
  png: NodeFormatHandler<{ checkCRC?: boolean; skipRescale?: boolean }>
  jpg: NodeFormatHandler<{ formatAsRGBA?: boolean }>
  jpeg: NodeFormatHandler<{ formatAsRGBA?: boolean }>
  gif: NodeFormatHandler<{ frame?: number }>
  webp: NodeFormatHandler<{}>
}

export type PixeliftOptions<F extends ImageFormat> = { format: F } & NodeFormatHandlers[F]['options']