import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { convertToBlobUsingCanvas } from './decoder/canvas';
import { imageBitmapOptions, convertToBlobOptions } from './decoder/canvas/options';
import { createCanvasContext } from './decoder/canvas/utils';

async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const [canvas] = createCanvasContext(bitmap.width, bitmap.height);
  return canvas.convertToBlob(convertToBlobOptions(options));
}

async function blobFromVideoFrame(
  frame: VideoFrame,
  options?: BrowserOptions
): Promise<Blob> {
  const bitmap = await createImageBitmap(frame, imageBitmapOptions(options));
  try {
    return await blobFromImageBitmap(bitmap, options);
  } finally {
    bitmap.close();
  }
}

async function blobFromString(
  input: string | URL,
  options?: BrowserOptions
): Promise<Blob> {
  const url = new URL(input.toString(), location.origin).toString();
  let res: Response;
  try {
    res = await fetch(url, {
      mode: 'cors',
      headers: options?.headers,
      signal: options?.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createError.aborted();
    }
    throw createError.networkError(`Unable to fetch from "${url}".`, {
      cause: error
    });
  }
  if (!res.ok) {
    throw createError.fetchFailed(url, res.status, res.statusText);
  }
  return res.blob();
}

async function htmlCanvasToBlob(
  canvas: HTMLCanvasElement,
  options?: BrowserOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              createError.runtimeError('Failed to convert HTMLCanvasElement to Blob.')
            ),
      options?.type,
      options?.quality
    );
  });
}

export async function toBlob(input: BrowserInput, options?: BrowserOptions): Promise<Blob> {
  if (isStringOrURL(input)) {
    return blobFromString(input, options);
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return new Blob([input], { type: options?.type });
  }

  if (input instanceof ReadableStream) {
    return new Response(input as ReadableStream<Uint8Array>).blob();
  }

  if (input instanceof Blob) {
    return input;
  }

  if (input instanceof Response) {
    return input.blob();
  }

  if (input instanceof HTMLCanvasElement) {
    return htmlCanvasToBlob(input, options);
  }

  if (input instanceof OffscreenCanvas) {
    return input.convertToBlob(convertToBlobOptions(options));
  }

  if (input instanceof ImageBitmap) {
    return blobFromImageBitmap(input, options);
  }

  if (input instanceof VideoFrame) {
    return blobFromVideoFrame(input, options);
  }

  return convertToBlobUsingCanvas(input, options);
}
