import type { PixelData } from '../../../types';
import type { BrowserOptions } from '../../types';
import { CANVAS_2D_OPTIONS, imageBitmapOptions, convertToBlobOptions } from './options';
import { createError } from '../../../shared/error';
import { createVideoFrameBitmap } from './video/utils';
import { toBlob } from '../../blob';
import { CANVAS_VIDEO_MIME_MAP } from '../../../shared/constants';

export function isSupported(type: unknown): boolean {
  return (
    !Object.values(CANVAS_VIDEO_MIME_MAP).some((mime) => type === mime) &&
    'OffscreenCanvas' in window &&
    typeof OffscreenCanvas === 'function' &&
    typeof createImageBitmap === 'function'
  );
}

async function createImageFromBlob(
  input: Blob,
  options?: BrowserOptions
): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(input, imageBitmapOptions(options));
  } catch {
    const temporaryUrl = URL.createObjectURL(input);
    try {
      const image = new Image();
      image.src = temporaryUrl;
      await image.decode();
      return createImageBitmap(image, imageBitmapOptions(options));
    } finally {
      URL.revokeObjectURL(temporaryUrl);
    }
  }
}

function setImageSmoothingSettings(context: OffscreenCanvasRenderingContext2D): void {
  context.imageSmoothingEnabled = false;
  context.imageSmoothingQuality = 'low';
}

export async function decode(
  input: Blob | ImageBitmap,
  options?: BrowserOptions
): Promise<PixelData> {
  let bitmapToProcess: ImageBitmap;
  let shouldCloseBitmapInternally = false;

  if (input instanceof ImageBitmap) {
    bitmapToProcess = input;
  } else {
    bitmapToProcess = await createImageFromBlob(input, options);
    shouldCloseBitmapInternally = true;
  }

  try {
    const { width, height } = bitmapToProcess;
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', CANVAS_2D_OPTIONS);
    if (!context)
      throw createError.runtimeError('Failed to obtain 2D context for decoding');
    setImageSmoothingSettings(context);
    context.drawImage(bitmapToProcess, 0, 0);
    return context.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
  } finally {
    if (shouldCloseBitmapInternally) {
      bitmapToProcess.close();
    }
  }
}

/**
 *
 * @param input - HTMLVideoElement | HTMLOrSVGImageElement | ImageBitmap | VideoFrame | ImageData
 * @param options
 */
export async function convertToBlobUsingCanvas(
  input:
    | string
    | URL
    | ImageData
    | HTMLOrSVGImageElement
    | HTMLVideoElement
    | OffscreenCanvas
    | ImageBitmap
    | VideoFrame,
  options?: BrowserOptions
): Promise<Blob> {
  let createdBitmap: ImageBitmap | undefined;
  let inputVideoFrame: VideoFrame | undefined;

  try {
    if (input instanceof ImageData) {
      const w = options?.width ?? input.width;
      const h = options?.height ?? input.height;
      const canvas = new OffscreenCanvas(w, h);
      const context = canvas.getContext('2d', CANVAS_2D_OPTIONS);
      if (!context) {
        throw createError.runtimeError('Failed to obtain 2D context for conversion');
      }
      setImageSmoothingSettings(context);
      context.putImageData(input, 0, 0);
      return canvas.convertToBlob(convertToBlobOptions(options));
    }

    let bitmapToDraw: ImageBitmap;
    if (input instanceof ImageBitmap) {
      bitmapToDraw = input;
    } else {
      if (input instanceof VideoFrame) {
        inputVideoFrame = input;
        createdBitmap = await createImageBitmap(
          inputVideoFrame,
          imageBitmapOptions(options)
        );
      } else if (
        input instanceof HTMLVideoElement &&
        typeof options?.targetTime === 'number'
      ) {
        createdBitmap = await createVideoFrameBitmap(input, options.targetTime);
      } else if (input instanceof SVGElement || input instanceof HTMLImageElement) {
        createdBitmap = await createImageBitmap(input, imageBitmapOptions(options));
      } else {
        createdBitmap = await createImageFromBlob(await toBlob(input, options), options);
      }
      bitmapToDraw = createdBitmap;
    }

    const canvas = new OffscreenCanvas(bitmapToDraw.width, bitmapToDraw.height);
    const context = canvas.getContext('2d', CANVAS_2D_OPTIONS);
    if (!context) {
      throw createError.runtimeError('Failed to obtain 2D context for conversion');
    }
    setImageSmoothingSettings(context);
    context.drawImage(bitmapToDraw, 0, 0);
    return canvas.convertToBlob(convertToBlobOptions(options));
  } finally {
    createdBitmap?.close();
    inputVideoFrame?.close();
  }
}
