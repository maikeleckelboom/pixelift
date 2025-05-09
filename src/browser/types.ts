import type { DecoderOptions } from '../types';

export interface BrowserOptions extends DecoderOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
}

// string | URL | HTMLOrSVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | VideoFrame | Blob | ImageData
export type BrowserInput = string | URL | ImageBitmapSource;
