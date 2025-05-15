import { isAbortError, isStringOrURL } from '../shared/validation';
import type { BrowserInput, OffscreenCanvasDecoderOptions } from './types';
import { createError } from '../shared/error';
import { imageBitmapOptions } from './decoder/canvas/options';
import { createCanvasAndContext } from './decoder/canvas/utils';

async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: OffscreenCanvasDecoderOptions
): Promise<Blob> {
  const { width, height } = bitmap;
  const [canvas, ctx] = createCanvasAndContext(width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return await canvas.convertToBlob({
    type: options?.type,
    quality: options?.options?.quality
  });
}

async function blobFromString(
  input: string | URL,
  options?: OffscreenCanvasDecoderOptions
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
    if (isAbortError(error)) {
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

export async function toBlob(
  input: BrowserInput,
  options?: OffscreenCanvasDecoderOptions
): Promise<Blob> {
  if (isStringOrURL(input)) {
    return blobFromString(input, options);
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return new Blob([input], { type: options?.type });
  }

  if (input instanceof HTMLImageElement || input instanceof HTMLVideoElement) {
    const imageBitmap = await createImageBitmap(input, imageBitmapOptions(options));
    return blobFromImageBitmap(imageBitmap, options);
  }

  if (input instanceof SVGImageElement || input instanceof SVGElement) {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(input);
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  if (input instanceof Blob) {
    return input;
  }

  throw createError.invalidInput('Unsupported input type', typeof input);
}
