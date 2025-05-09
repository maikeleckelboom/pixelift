import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';

async function blobFromString(input: string | URL, options?: BrowserOptions) {
  const url = new URL(input.toString(), location.origin).toString();
  let res: Response;

  try {
    res = await fetch(url, { mode: 'cors', headers: options?.headers });
  } catch (error: unknown) {
    throw createError.networkError(`Network error: Unable to fetch from "${url}".`, {
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
    return new Promise((resolve, reject) =>
      input.toBlob((blob) =>
        blob
          ? resolve(blob)
          : reject(createError.invalidInput('valid URL or Blob', input.constructor.name))
      )
    );
  }

  if (input instanceof OffscreenCanvas) {
    return input.convertToBlob();
  }

  // todo: handle VideoFrame, HTMLVideoElement, ImageBitmap, ImageData

  throw createError.invalidInput(
    'string | URL | HTMLImageElement | SVGImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas | VideoFrame | Blob | ImageData',
    typeof input
  );
}
