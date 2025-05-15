import type { CommonDecoderOptions } from '../types';

/**
 * The raw inputs you can receive in worker or browser contexts.
 */
export type RawWorkerInput =
  | string
  | URL
  | Blob
  | BufferSource
  | ReadableStream<Uint8Array>
  | Response;

/**
 * Anything that can be transferred back from a worker once decoded.
 */
export type TransferableDecodedInput =
  | ImageBitmap
  | ImageData
  | VideoFrame
  | OffscreenCanvas;

/**
 * Any DOM element source you’d like to support.
 */
export type DOMSource =
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement
  | SVGElement;

/**
 * All inputs that your worker can accept (raw or already‑decoded).
 */
export type WorkerCompatibleInput = RawWorkerInput | TransferableDecodedInput;

/**
 * All inputs you support in the browser.
 */
export type BrowserInput = WorkerCompatibleInput | DOMSource;

/**
 * Inputs that represent encoded data (so they need decoding).
 */
export type EncodedBrowserInput = RawWorkerInput | DOMSource;

/**
 * Inputs that are already in a decoded, transferable form.
 */
export type DecodedBrowserInput = TransferableDecodedInput;

/**
 * Shared options for Canvas/WebCodecs.
 */
export interface CanvasRenderingContextOptions {
  imageSmoothingEnabled?: boolean;
  imageSmoothingQuality?: ImageSmoothingQuality;
}

/**
 * Options for ImageBitmap decoding in workers.
 */
export interface WebCodecsOptions extends ImageDecodeOptions {
  quality?: number;
}

/**
 * Options for OffscreenCanvas decoding in workers.
 */
export interface OffscreenCanvasOptions
  extends ImageBitmapOptions,
    CanvasRenderingContextOptions {
  quality?: number;
}

/**
 * The base options your browser‑side decoders all share.
 */
export interface BrowserDecoderOptions extends CommonDecoderOptions {
  type?: string;
}

/**
 * Specific decoder flavors for the browser.
 */
export interface WebCodecsDecoderOptions extends BrowserDecoderOptions {
  decoder: 'webCodecs';
  options?: WebCodecsOptions;
}

export interface OffscreenCanvasDecoderOptions extends BrowserDecoderOptions {
  decoder: 'offscreenCanvas';
  options?: OffscreenCanvasOptions;
}

/**
 * The full union of allowed decoder options in the browser.
 */
export type BrowserOptions =
  | WebCodecsDecoderOptions
  | OffscreenCanvasDecoderOptions
  | (BrowserDecoderOptions & { decoder?: never; options?: never });
