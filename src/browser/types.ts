import type { DecoderOptions } from '../types';

export type WorkerCompatibleInput =
  | string
  | URL
  | Blob
  | BufferSource
  | VideoFrame
  | ImageBitmap
  | ImageData;

export type HTMLMediaElement = HTMLImageElement | HTMLVideoElement;

export type BrowserInput = WorkerCompatibleInput | HTMLMediaElement;

export type WebCodecsOptions = ImageEncodeOptions & ImageDecodeOptions;

export interface OffscreenCanvasOptions extends ImageBitmapOptions, ImageEncodeOptions {
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: ImageSmoothingQuality;
}

export type BrowserDecoder = 'webCodecs' | 'offscreenCanvas';

type DecoderOptionsMap = {
  webCodecs: WebCodecsOptions;
  offscreenCanvas: OffscreenCanvasOptions;
};

export interface BrowserOptions<D extends BrowserDecoder = BrowserDecoder>
  extends DecoderOptions {
  type?: string;
  decoder?: D;
  options?: DecoderOptionsMap[D];
}
