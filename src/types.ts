import type { GifOptions } from 'omggif';
import type { PNGOptions } from 'pngjs';
import type { SharpInput, SharpOptions } from 'sharp';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace?: string;
}

export type BufferLike = Buffer | Uint8Array | ArrayLike<number> | Iterable<number> | ArrayBuffer;

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface BrowserOptions {
  /**
   * Color space conversion
   * Default: 'none'
   */
  colorSpace?: PredefinedColorSpace;
  /**
   * Premultiply alpha channel
   * Default: false
   */
  premultiplyAlpha?: PremultiplyAlpha;
  /**
   * Color space conversion
   * Default: 'default'
   */
  colorSpaceConversion?: 'none' | 'default';
  /**
   * Indicates frequent reads
   * Default: false
   */
  willReadFrequently?: boolean;
  /**
   * Indicates alpha channel presence
   * Default: false
   */
  alpha?: boolean;
}

export interface JPEGOptions {
  /**
   * Affects color interpretation (YCbCr → RGB conversion)
   * Default: false
   */
  colorTransform?: boolean;
  /**
   * Changes channel count (3 → 4 channels)
   * Default: true (RGBA)
   */
  formatAsRGBA?: boolean;
}

export interface GIFOptions extends GifOptions {
  frame?: number;
}

export interface DecoderDependencyOptionsMap {
  'jpeg-js': JPEGOptions;
  'pngjs': PNGOptions;
  'omggif': GIFOptions;
  'sharp': SharpOptions;
}

export type NodeDecoders = keyof DecoderDependencyOptionsMap;

export interface NodeOptions<D extends NodeDecoders = NodeDecoders> {
  decoder?: D;
  options?: DecoderDependencyOptionsMap[D];
}

export type BrowserInput = string | URL | File | ImageBitmapSource

export type NodeInput = SharpInput

export interface Pixelift {
  // Browser signature
  (input: BrowserInput, options?: BrowserOptions): Promise<PixelData>;

  // Node signature with generic decoder
  <D extends NodeDecoders = NodeDecoders>(
    input: NodeInput,
    options?: NodeOptions<D>,
  ): Promise<PixelData>;
}
