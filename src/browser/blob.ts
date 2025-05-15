import { isAbortError, isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { imageBitmapOptions } from './decoder/canvas/options';
import { createCanvasAndContext } from './decoder/canvas/utils';

async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: BrowserOptions<'offscreenCanvas' | 'webCodecs'>
): Promise<Blob> {
  const { width, height } = bitmap;
  const [canvas, ctx] = createCanvasAndContext(width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blobResult = await canvas.convertToBlob({ type: options?.type });
  if (!blobResult) throw createError.runtimeError('Failed to convert ImageBitmap to Blob.');
  return blobResult;
}

async function blobFromImageData(
  imageData: ImageData,
  options?: BrowserOptions
): Promise<Blob> {
  const { width, height } = imageData;
  const [canvas, context] = createCanvasAndContext(width, height);
  context.putImageData(imageData, 0, 0);
  return canvas.convertToBlob({ type: options?.type });
}

async function blobFromVideoFrame(
  frame: VideoFrame,
  options?: BrowserOptions
): Promise<Blob> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(frame, imageBitmapOptions(options));
    return await blobFromImageBitmap(bitmap, options);
  } finally {
    if (bitmap) bitmap.close();
    frame.close();
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

export async function toBlob(input: BrowserInput, options?: BrowserOptions): Promise<Blob> {
  if (isStringOrURL(input)) {
    return blobFromString(input, options);
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return new Blob([input], { type: options?.type });
  }

  if (input instanceof VideoFrame) {
    return blobFromVideoFrame(input, options);
  }

  if (input instanceof ImageBitmap) {
    return blobFromImageBitmap(input, options);
  }

  if (input instanceof HTMLImageElement || input instanceof HTMLVideoElement) {
    const imageBitmap = await createImageBitmap(input, imageBitmapOptions(options));
    return blobFromImageBitmap(imageBitmap, options);
  }

  if (input instanceof SVGImageElement) {
    return new Blob([input.outerHTML], { type: 'image/svg+xml' });
  }

  if (input instanceof Blob) {
    return input;
  }

  if (input instanceof ImageData) {
    return blobFromImageData(input, options);
  }

  throw createError.invalidInput('Unsupported input type', typeof input);
}
