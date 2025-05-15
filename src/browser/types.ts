import type { DecoderOptions } from '../types';

export interface BrowserOptions
  extends DecoderOptions,
    ImageEncodeOptions,
    ImageDecodeOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  targetTime?: number;
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: ImageSmoothingQuality;
  resizeQuality?: ResizeQuality;
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
