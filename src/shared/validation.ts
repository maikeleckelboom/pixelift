import type { ServerInput } from '../server';
import type { BrowserInput } from '../browser';

export function validateServerInput(input: unknown): input is ServerInput {
  if (isStringOrURL(input)) return true;
  if (Buffer.isBuffer(input)) return true;
  if (input instanceof ArrayBuffer) return true;
  return ArrayBuffer.isView(input);
}

export function validateBrowserInput(input: unknown): input is BrowserInput {
  return (
    isStringOrURL(input) ||
    input instanceof ArrayBuffer ||
    input instanceof ReadableStream ||
    input instanceof Blob ||
    input instanceof HTMLImageElement ||
    input instanceof SVGImageElement ||
    input instanceof HTMLVideoElement ||
    input instanceof HTMLCanvasElement ||
    input instanceof OffscreenCanvas ||
    input instanceof ImageBitmap ||
    input instanceof ImageData ||
    input instanceof VideoFrame
  );
}

export function isImageData(input: unknown): input is ImageData {
  return (
    typeof input === 'object' &&
    input !== null &&
    'data' in input &&
    'width' in input &&
    'height' in input
  );
}

export function isStringOrURL(input: unknown): input is string | URL {
  return typeof input === 'string' || input instanceof URL;
}

export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}
