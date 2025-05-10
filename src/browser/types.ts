import type { DecoderOptions } from '../types';

export interface BrowserOptions extends DecoderOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  /** Output image type, e.g., 'image/png', 'image/jpeg'. Defaults to 'image/png'. */
  type?: string;
  /** Quality for 'image/jpeg' or 'image/webp' (0 to 1). Defaults to browser default. */
  quality?: number;
  /** For HTMLVideoElement input, specifies the time (in seconds) of the frame to capture. */
  frameAt?: number;
}

// string | URL | HTMLOrSVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | VideoFrame | Blob | ImageData
export type BrowserInput = string | URL | ImageBitmapSource;
