import type { PixeliftServerInput } from '../server';
import type { PixeliftBrowserInput } from '../browser';

export function isString(input: unknown): input is string {
  return typeof input === 'string' || input instanceof String;
}

export function isStringOrURL(src: unknown): src is string | URL {
  return isString(src) || src instanceof URL;
}

export function validateServerInput(input: unknown): input is PixeliftServerInput {
  if (typeof input === 'string') return true;
  if (Buffer.isBuffer(input)) return true;
  if (input instanceof ArrayBuffer) return true;
  if (typeof SharedArrayBuffer !== 'undefined' && input instanceof SharedArrayBuffer) {
    return true;
  }
  return ArrayBuffer.isView(input) && 'BYTES_PER_ELEMENT' in input.constructor;
}

export function validateBrowserInput(input: unknown): input is PixeliftBrowserInput {
  return (
    typeof input === 'string' ||
    input instanceof URL ||
    input instanceof File ||
    input instanceof Blob ||
    input instanceof HTMLImageElement ||
    input instanceof SVGImageElement ||
    input instanceof HTMLVideoElement ||
    input instanceof HTMLCanvasElement ||
    (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) ||
    input instanceof ImageBitmap ||
    input instanceof VideoFrame ||
    input instanceof ImageData
  );
}

export function isImageBitmapSource(src: unknown): src is ImageBitmapSource {
  return (
    src instanceof HTMLImageElement ||
    src instanceof SVGImageElement ||
    src instanceof HTMLVideoElement ||
    src instanceof HTMLCanvasElement ||
    src instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && src instanceof OffscreenCanvas) ||
    src instanceof VideoFrame ||
    src instanceof ImageData ||
    src instanceof Blob
  );
}
