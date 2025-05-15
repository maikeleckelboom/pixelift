import type { CommonDecoderOptions } from '../types';

// 1) Raw (encoded-only) inputs you might fetch or send to a worker:
export type RawWorkerInput = string | URL | Blob | BufferSource;

// 2) Transferable decoded inputs (pixel buffers):
export type TransferableDecodedInput =
  | ImageBitmap
  | ImageData
  | VideoFrame
  | OffscreenCanvas;

// 3) DOM-only sources (not transferable):
export type DOMSource =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | SVGElement;

// 4) Everything you can pass to a worker:
export type WorkerCompatibleInput = RawWorkerInput | TransferableDecodedInput;

// 5) Everything you accept in-browser:
export type BrowserInput = WorkerCompatibleInput | DOMSource;

// 7) Undecoded inputs (sources not yet pixel buffers):
export type EncodedBrowserInput = RawWorkerInput | DOMSource;

// 8) Decoded inputs (transferable pixel buffers):
export type DecodedBrowserInput = TransferableDecodedInput;

export interface WebCodecsOptions extends ImageDecodeOptions {
  quality?: number;
}

export interface CanvasRenderingContextOptions {
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: ImageSmoothingQuality;
}

export interface OffscreenCanvasOptions
  extends ImageBitmapOptions,
    CanvasRenderingContextOptions {
  quality?: number;
}

export interface BrowserDecoderOptions extends CommonDecoderOptions {
  type?: string;
}

export interface WebCodecsDecoderOptions extends BrowserDecoderOptions {
  decoder: 'webCodecs';
  options?: WebCodecsOptions;
}

export interface OffscreenCanvasDecoderOptions extends BrowserDecoderOptions {
  decoder: 'offscreenCanvas';
  options?: OffscreenCanvasOptions;
}

export type BrowserOptions = BrowserDecoderOptions &
  (
    | WebCodecsDecoderOptions
    | OffscreenCanvasOptions
    | {
        decoder?: never;
        options?: never;
      }
  );
