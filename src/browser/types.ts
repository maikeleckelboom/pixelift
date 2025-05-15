import type { DecoderOptions } from '../types';

export interface BrowserOptions
  extends DecoderOptions,
    ImageEncodeOptions,
    ImageDecodeOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  targetTime?: number;
}

export type BrowserInput =
  | string
  | URL
  | Blob
  | BufferSource
  | HTMLImageElement
  | SVGImageElement
  | HTMLVideoElement
  | ImageBitmap
  | VideoFrame;
