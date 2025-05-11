import type { DecoderOptions } from '../types';

type ImageDecoderOptions = ImageEncodeOptions & ImageDecodeOptions;

export interface BrowserOptions extends DecoderOptions, ImageDecoderOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  frameAt?: number;
  // width?: number;
  // height?: number;
}

// string | URL | HTMLOrSVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | VideoFrame | Blob | ImageData
export type BrowserInput = string | URL | Blob | ImageData | CanvasImageSource;
