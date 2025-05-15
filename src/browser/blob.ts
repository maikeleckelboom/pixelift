import { isAbortError, isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { imageBitmapOptions } from './decoder/canvas/options';
import { createCanvasAndContext } from './decoder/canvas/utils';

/**
 * Convert an ImageBitmap into a Blob via OffscreenCanvas or <canvas>.
 */
async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const { width, height } = bitmap;
  const [canvas, context] = createCanvasAndContext(width, height, options);
  context.drawImage(bitmap, 0, 0, width, height);
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({
      type: options?.type,
      quality: options?.options?.quality
    });
  } else {
    return new Promise((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(createError.runtimeError('Failed to convert <canvas> to Blob')),
        options?.type,
        options?.options?.quality
      );
    });
  }
}

/**
 * Fetch a resource from a string/URL and return its Blob.
 */
async function blobFromString(
  input: string | URL,
  options?: BrowserOptions
): Promise<Blob> {
  const base =
    typeof location !== 'undefined' && location.origin
      ? location.origin
      : typeof self.location !== 'undefined'
        ? self.location.href
        : undefined;

  const url = new URL(input.toString(), base).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      mode: options?.mode ?? 'cors',
      headers: options?.headers,
      signal: options?.signal,
      credentials: options?.credentials
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw createError.aborted();
    }
    throw createError.networkError(`Unable to fetch "${url}"`, { cause: err });
  }

  if (!res.ok) {
    throw createError.fetchFailed(url, res.status, res.statusText);
  }

  return res.blob();
}

/**
 * Wrap an ArrayBuffer or TypedArray into a Blob.
 */
function blobFromArrayBuffer(
  input: ArrayBuffer | ArrayBufferView,
  options?: BrowserOptions
): Blob {
  if (input instanceof ArrayBuffer) {
    return new Blob([input], { type: options?.type });
  } else {
    const { buffer, byteOffset, byteLength } = input;
    const slicedBuffer = buffer.slice(byteOffset, byteOffset + byteLength);
    return new Blob([slicedBuffer], { type: options?.type });
  }
}

/**
 * Convert DOM <canvas> into Blob.
 */
export function blobFromCanvas(
  input: HTMLCanvasElement,
  options?: BrowserOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    input.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(createError.runtimeError('Failed to convert <canvas> to Blob')),
      options?.type,
      options?.options?.quality
    );
  });
}

/**
 * Input-to-Blob converter.
 * Works in both the main thread (DOM) and Web Workers.
 */
export async function toBlob(input: BrowserInput, options?: BrowserOptions): Promise<Blob> {
  // String | URL
  if (isStringOrURL(input)) {
    return blobFromString(input, options);
  }

  // BufferSource → Blob
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return blobFromArrayBuffer(input, options);
  }

  //  Blob → ...
  if (input instanceof Blob) {
    return input;
  }

  // VideoFrame → Blob
  if (typeof VideoFrame !== 'undefined' && input instanceof VideoFrame) {
    const bitmap = await createImageBitmap(input);
    return blobFromImageBitmap(bitmap, options);
  }

  // OffscreenCanvas → Blob
  if (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) {
    return input.convertToBlob({
      type: options?.type,
      quality: options?.options?.quality
    });
  }

  // ImageData → OffscreenCanvas → Blob
  if (typeof ImageData !== 'undefined' && input instanceof ImageData) {
    const { width, height } = input;
    const [canvas, context] = createCanvasAndContext(width, height, options);
    context.putImageData(input, 0, 0);
    return canvas.convertToBlob({
      type: options?.type,
      quality: options?.options?.quality
    });
  }

  /* DOM Main Thread */

  // HTMLImageElement, HTMLVideoElement → Bitmap →→ Blob
  if (
    (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement)
  ) {
    if (input instanceof HTMLImageElement && !input.complete) {
      throw createError.runtimeError('ImageElement is not fully loaded yet');
    }
    if (
      input instanceof HTMLVideoElement &&
      input.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      throw createError.runtimeError('Video element not ready for frame capture');
    }

    const bitmap = await createImageBitmap(input, imageBitmapOptions(options));
    return blobFromImageBitmap(bitmap, options);
  }

  // HTMLCanvasElement → Blob
  if (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) {
    return blobFromCanvas(input, options);
  }

  // SVGElement → Blob
  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    return new Blob([input.outerHTML], { type: 'image/svg+xml' });
  }

  // ImageBitmap → Blob (Worker & Main Thread)
  if (input instanceof ImageBitmap) {
    return blobFromImageBitmap(input, options);
  }

  // ReadableStream → Response →→ Blob
  // ReadableStream → Blob
  if (typeof ReadableStream !== 'undefined' && input instanceof ReadableStream) {
    const reader = input.getReader();
    const chunks: Uint8Array[] = [];
    let abortHandler: (() => void) | undefined;

    try {
      if (options?.signal) {
        abortHandler = () => {
          reader.cancel().catch(() => {});
        };
        options.signal.addEventListener('abort', abortHandler);
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return new Blob(chunks, { type: options?.type });
    } catch (err) {
      if (isAbortError(err)) {
        throw createError.aborted();
      }
      throw createError.runtimeError('Failed to convert stream to Blob', { cause: err });
    } finally {
      if (abortHandler && options?.signal) {
        options.signal.removeEventListener('abort', abortHandler);
      }
      reader.releaseLock();
    }
  }

  // Response → Blob
  if (typeof Response !== 'undefined' && input instanceof Response) {
    if (!input.body) {
      throw createError.invalidInput('Response has no body', 'No body stream');
    }
    return input.blob();
  }

  throw createError.invalidInput('Unsupported input type', typeof input);
}
