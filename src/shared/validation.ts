import type { ServerInput } from '../server';
import type { BrowserInput } from '../browser';
import type { DecodedBrowserInput, EncodedBrowserInput } from '../browser/types';

export function isStringOrURL(input: unknown): input is string | URL {
  return typeof input === 'string' || input instanceof URL;
}

export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function isMediaElement(
  input: unknown
): input is HTMLImageElement | HTMLVideoElement | HTMLCanvasElement {
  return (
    (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement)
  );
}

export function isRawData(input: unknown): input is string | URL | Blob | BufferSource {
  return (
    isStringOrURL(input) ||
    input instanceof Blob ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input)
  );
}

export function isRenderableGraphic(
  input: unknown
): input is HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | SVGElement {
  return (
    isMediaElement(input) ||
    (typeof SVGElement !== 'undefined' && input instanceof SVGElement)
  );
}

// Covers string, URL, Blob, BufferSource, HTMLImageElement, HTMLVideoElement, HTMLCanvasElement, SVGElement
export function isEncodedInput(input: unknown): input is EncodedBrowserInput {
  return (
    isRawData(input) ||
    isRenderableGraphic(input) ||
    (typeof ReadableStream !== 'undefined' && input instanceof ReadableStream) ||
    (typeof Response !== 'undefined' && input instanceof Response)
  );
}

// Covers ImageBitmap | ImageData | VideoFrame | OffscreenCanvas
export function isDecodedInput(input: unknown): input is DecodedBrowserInput {
  return (
    (typeof ImageBitmap !== 'undefined' && input instanceof ImageBitmap) ||
    (typeof ImageData !== 'undefined' && input instanceof ImageData) ||
    (typeof VideoFrame !== 'undefined' && input instanceof VideoFrame) ||
    (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas)
  );
}

// Covers RawWorkerInput | TransferableDecodedInput | DOMSource
export function validateBrowserInput(input: unknown): input is BrowserInput {
  return isEncodedInput(input) || isDecodedInput(input);
}

export function validateServerInput(input: unknown): input is ServerInput {
  return (
    isStringOrURL(input) ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input)
  );
}
