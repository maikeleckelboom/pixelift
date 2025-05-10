import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { convertToBlobUsingCanvas } from './decoder/canvas';

async function blobFromString(input: string | URL, options?: BrowserOptions) {
  const url = new URL(input.toString(), location.origin).toString();

  let res: Response;

  try {
    res = await fetch(url, {
      mode: 'cors',
      headers: options?.headers,
      signal: options?.signal
    });
  } catch (error: unknown) {
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

export async function toBlob(input: BrowserInput, options?: BrowserOptions): Promise<Blob> {
  if (isStringOrURL(input)) {
    return blobFromString(input, options);
  }

  if (input instanceof Blob) {
    return input;
  }

  if (input instanceof HTMLCanvasElement) {
    return new Promise((resolve, reject) => {
      input.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(createError.runtimeError('HTMLCanvasElement.toBlob() failed.'));
        }
      });
    });
  }

  if (input instanceof OffscreenCanvas) {
    return new Promise((resolve, reject) => {
      input.convertToBlob().then(
        (blob) => resolve(blob),
        () => reject(createError.runtimeError('OffscreenCanvas.convertToBlob() failed.'))
      );
    });
  }

  return await convertToBlobUsingCanvas(input);
}
