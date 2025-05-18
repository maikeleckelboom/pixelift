import { isStringOrURL } from '../shared/guards';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { isArrayBuffer } from './guards';
import { blobFromReadableStream } from './blob/stream';
import { blobFromRemoteResource } from './blob/fetch';
import { blobFromImageBitmap } from './blob/bitmap';
import { blobFromCanvas } from './blob/canvas';
import { blobFromArrayBuffer } from './blob/buffer';

export function createArrayBuffer(data: BufferSource): ArrayBuffer {
  return isArrayBuffer(data)
    ? data
    : (data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
      ) as ArrayBuffer);
}

function typeOfInput(input: unknown | undefined) {
  return input?.constructor?.name || typeof input || 'unknown';
}

export async function toBlob(input: BrowserInput, options?: BrowserOptions): Promise<Blob> {
  if (isStringOrURL(input)) {
    return blobFromRemoteResource(input, options);
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return blobFromArrayBuffer(input, options);
  }

  if (
    (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) ||
    (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement)
  ) {
    return blobFromCanvas(input, options);
  }

  if (input instanceof ReadableStream) {
    return blobFromReadableStream(input, options);
  }

  if (input instanceof Response) {
    if (!input.body) {
      throw createError.runtimeError('Response body unavailable');
    }
    return input.blob();
  }

  if (input instanceof SVGElement) {
    return new Blob([input.outerHTML], { type: 'image/svg+xml' });
  }

  if (input instanceof HTMLImageElement || input instanceof HTMLVideoElement) {
    validateMediaElementReady(input);
    const bitmap = await createImageBitmap(input);
    try {
      return await blobFromImageBitmap(bitmap, options);
    } finally {
      bitmap.close();
    }
  }

  if (typeof VideoFrame !== 'undefined' && input instanceof VideoFrame) {
    const bitmap = await createImageBitmap(input);
    try {
      return await blobFromImageBitmap(bitmap, options);
    } finally {
      bitmap.close();
      input.close();
    }
  }

  throw createError.invalidInput('Blob', typeOfInput(input));
}

function validateMediaElementReady(element: HTMLImageElement | HTMLVideoElement): void {
  if (element instanceof HTMLImageElement && !element.complete) {
    throw createError.runtimeError('Image element not fully loaded');
  }

  if (
    element instanceof HTMLVideoElement &&
    element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    throw createError.runtimeError('Video element not ready for frame capture');
  }
}
