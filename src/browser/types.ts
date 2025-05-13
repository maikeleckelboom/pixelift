import type { DecoderOptions } from '../types';

export interface BrowserOptions
  extends DecoderOptions,
    ImageEncodeOptions,
    ImageDecodeOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  width?: number;
  height?: number;
  targetTime?: number;
  debug?: boolean;
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: ImageSmoothingQuality;
}

export type BrowserInput =
  | string
  | URL
  | Blob
  | File
  | ArrayBuffer
  | ArrayBufferView
  | ReadableStream<Uint8Array>
  | HTMLOrSVGImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | ImageBitmap
  | OffscreenCanvas
  | VideoFrame;
