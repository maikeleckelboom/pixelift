import { isStringOrURL } from '../shared/validation';
import type { BrowserInput, BrowserOptions } from './types';
import { createError } from '../shared/error';
import { convertToBlobUsingCanvas } from './decoder/canvas';
import { convertToBlobOptions, imageBitmapOptions } from './decoder/canvas/options';
import { createCanvasAndContext } from './decoder/canvas/utils';

async function blobFromImageBitmap(
  bitmap: ImageBitmap,
  options?: BrowserOptions
): Promise<Blob> {
  const targetWidth = options?.width ?? bitmap.width;
  const targetHeight = options?.height ?? bitmap.height;
  const [canvas, ctx] = createCanvasAndContext(targetWidth, targetHeight);
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  const blobResult = await canvas.convertToBlob(convertToBlobOptions(options));
  if (!blobResult) throw createError.runtimeError('Failed to convert ImageBitmap to Blob.');
  return blobResult;
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
    const blobResult = await input.convertToBlob(convertToBlobOptions(options));
    if (!blobResult)
      throw createError.runtimeError('Failed to convert OffscreenCanvas to Blob.');
    return blobResult;
  }

  if (input instanceof ImageBitmap) {
    return blobFromImageBitmap(input, options);
  }

  if (input instanceof VideoFrame) {
    return blobFromVideoFrame(input, options);
  }

  return convertToBlobUsingCanvas(input, options);
}
