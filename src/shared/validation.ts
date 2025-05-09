import type { ServerInput } from '../server';
import type { BrowserInput } from '../browser';
import {
  PIXELIFT_BROWSER_DECODERS,
  PIXELIFT_SERVER_DECODERS,
  type PixeliftDecoder
} from './constants';

export function isStringOrURL(input: unknown): input is string | URL {
  return typeof input === 'string' || input instanceof URL;
}

export function validateServerInput(input: unknown): input is ServerInput {
  if (isStringOrURL(input)) return true;
  if (Buffer.isBuffer(input)) return true;
  if (input instanceof ArrayBuffer) return true;
  return ArrayBuffer.isView(input);
}

export function validateBrowserInput(input: unknown): input is BrowserInput {
  return (
    typeof input === 'string' ||
    input instanceof URL ||
    input instanceof File ||
    input instanceof Blob ||
    input instanceof HTMLImageElement ||
    input instanceof SVGImageElement ||
    input instanceof HTMLVideoElement ||
    input instanceof HTMLCanvasElement ||
    input instanceof OffscreenCanvas ||
    input instanceof ImageBitmap ||
    input instanceof VideoFrame ||
    input instanceof ImageData ||
    (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer) ||
    (ArrayBuffer.isView(input) && 'BYTES_PER_ELEMENT' in input.constructor)
  );
}

export function validateDecoder(
  decoder: string | undefined,
  isServer: boolean
): decoder is PixeliftDecoder {
  if (!decoder) return true;

  const decoderList = Array.from(
    isServer ? PIXELIFT_SERVER_DECODERS : PIXELIFT_BROWSER_DECODERS
  );

  return decoderList.includes(decoder as PixeliftDecoder);
}
