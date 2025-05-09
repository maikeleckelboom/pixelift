import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { getOffscreenCanvasContext, rasterizeToBlob } from './decoder/canvas';

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

  if (input instanceof ImageBitmap) {
    const ctx = getOffscreenCanvasContext(input.width, input.height);
    ctx.drawImage(input, 0, 0);
    return ctx.canvas.convertToBlob();
  }

  if (
    input instanceof ImageBitmap ||
    input instanceof ImageData ||
    input instanceof HTMLImageElement ||
    input instanceof SVGImageElement ||
    input instanceof HTMLVideoElement ||
    input instanceof VideoFrame
  ) {
    return rasterizeToBlob(input, options);
  }

  throw createError.invalidInput(
    'Valid image source (URL, Blob, Canvas, ImageBitmap, ImageData, VideoFrame, or MediaElement)',
    typeof input
  );
}
