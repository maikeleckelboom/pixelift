import { convertToBlobOptions, imageBitmapOptions } from './options';
import { createVideoFrameBitmap } from './video/utils';
import { createCanvasAndContext, setImageSmoothingSettings } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import { isWebWorker } from '../../../shared/env';
import { isImageData, isStringOrURL } from '../../../shared/validation';

import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';

class BitmapResource {
  private bitmaps: ImageBitmap[] = [];

  track(bmp: ImageBitmap) {
    this.bitmaps.push(bmp);
  }

  closeAll() {
    this.bitmaps.forEach((bmp) => {
      try {
        bmp.close();
      } catch {
        /* */
      }
    });
    this.bitmaps = [];
  }
}

export function isSupported(): boolean {
  return typeof OffscreenCanvas === 'function' && typeof createImageBitmap === 'function';
}

/**
 * Resize an ImageData object via a temporary canvas to the target dimensions.
 * @param input The source ImageData.
 * @param width The target width.
 * @param height The target height.
 * @param options Optional BrowserOptions controlling smoothing.
 * @returns A new ImageData object at the specified dimensions.
 */
function resizeImageDataViaCanvas(
  input: ImageData,
  width: number,
  height: number,
  options?: BrowserOptions
): ImageData {
  const [tempCanvas, tempCtx] = createCanvasAndContext(input.width, input.height);
  tempCtx.putImageData(input, 0, 0);

  const [, targetCtx] = createCanvasAndContext(width, height, options);
  setImageSmoothingSettings(targetCtx, options);
  targetCtx.drawImage(tempCanvas, 0, 0, width, height);

  return targetCtx.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
}

/**
 * Draws a source ImageData or ImageBitmap into a canvas at the specified size,
 * performing resize for ImageData via the dedicated helper to ensure correct dimensions.
 * @param source The ImageData or ImageBitmap to draw.
 * @param width The target canvas width.
 * @param height The target canvas height.
 * @param options Optional BrowserOptions controlling smoothing.
 * @returns An object containing the canvas and its 2D context.
 */
function drawToCanvas(
  source: ImageBitmap | ImageData,
  width: number,
  height: number,
  options?: BrowserOptions
) {
  if (source instanceof ImageData) {
    // If resizing is needed, use the precise canvas-based resize helper
    if (source.width !== width || source.height !== height) {
      const resized = resizeImageDataViaCanvas(source, width, height, options);
      return createCanvasAndContextFromImageData(resized, options);
    }
    return createCanvasAndContextFromImageData(source, options);
  }

  // For ImageBitmap, draw directly and optionally apply smoothing
  const [canvas, ctx] = createCanvasAndContext(width, height, options);
  if (source.width !== width || source.height !== height) {
    setImageSmoothingSettings(ctx, options);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, ctx };
}

/**
 * Helper to produce canvas and context from ImageData without extra drawImage calls.
 */
function createCanvasAndContextFromImageData(
  imageData: ImageData,
  options?: BrowserOptions
) {
  const [canvas, ctx] = createCanvasAndContext(imageData.width, imageData.height, options);
  ctx.putImageData(imageData, 0, 0);
  return { canvas, ctx };
}

async function getBitmap(
  input: BrowserInput,
  opts: BrowserOptions | undefined,
  resources: BitmapResource
): Promise<ImageBitmap> {
  const resizeOpts = imageBitmapOptions(opts);

  if (input instanceof ImageBitmap) {
    const targetW = resizeOpts.resizeWidth ?? input.width;
    const targetH = resizeOpts.resizeHeight ?? input.height;
    if (targetW !== input.width || targetH !== input.height) {
      const bmp = await createImageBitmap(input, resizeOpts);
      resources.track(bmp);
      return bmp;
    }
    return input;
  }

  if (input instanceof VideoFrame) {
    try {
      const bitmap = await createImageBitmap(input, resizeOpts);
      resources.track(bitmap);
      return bitmap;
    } finally {
      input.close();
    }
  }

  if (isWebWorker()) {
    if (input instanceof OffscreenCanvas) {
      const bitmap = await createImageBitmap(input, resizeOpts);
      resources.track(bitmap);
      return bitmap;
    }
  }

  let bitmap: ImageBitmap;
  if (input instanceof Blob) {
    bitmap = await loadBitmapFromBlob(input, opts, resources);
  } else if (isStringOrURL(input)) {
    const blob = await toBlob(input, opts);
    bitmap = await loadBitmapFromBlob(blob, opts, resources);
  } else if (
    input instanceof HTMLImageElement ||
    input instanceof HTMLCanvasElement ||
    input instanceof OffscreenCanvas
  ) {
    bitmap = await createImageBitmap(input, resizeOpts);
  } else if (input instanceof HTMLVideoElement) {
    bitmap = await createVideoFrameBitmap(input, opts);
  } else {
    throw createError.invalidInput(
      'Unsupported input type for canvas decoder',
      typeof input
    );
  }

  resources.track(bitmap);
  return bitmap;
}

async function loadBitmapFromBlob(
  blob: Blob,
  opts: BrowserOptions | undefined,
  resources: BitmapResource
): Promise<ImageBitmap> {
  try {
    const bmp = await createImageBitmap(blob, imageBitmapOptions(opts));
    resources.track(bmp);
    return bmp;
  } catch (err) {
    if (isWebWorker()) {
      throw createError.decodingFailed(
        blob.type,
        'WebWorker Blob decoding requires createImageBitmap support',
        err
      );
    }
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const bmp = await createImageBitmap(img, imageBitmapOptions(opts));
      resources.track(bmp);
      return bmp;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Decode browser input into standardized RGBA pixel data.
 * @param input The source: ImageData, Blob, URL, etc.
 * @param options Processing options including target width/height and smoothing.
 * @returns Promise resolving to PixelData with .data, .width, .height.
 */
export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const resources = new BitmapResource();
  try {
    if (options?.debug) console.log('Canvas decoder debug');
    if (isImageData(input)) {
      const w = options?.width ?? input.width;
      const h = options?.height ?? input.height;
      if (w === input.width && h === input.height) {
        return { data: input.data, width: w, height: h };
      }
      const { ctx } = drawToCanvas(input, w, h, options);
      const img = ctx.getImageData(0, 0, w, h, { colorSpace: 'srgb' });
      return { data: img.data, width: w, height: h };
    }

    const bmp = await getBitmap(input, options, resources);
    const w = options?.width ?? bmp.width;
    const h = options?.height ?? bmp.height;
    const { ctx } = drawToCanvas(bmp, w, h, options);
    const img = ctx.getImageData(0, 0, w, h, { colorSpace: 'srgb' });
    return { data: img.data, width: w, height: h };
  } finally {
    resources.closeAll();
  }
}

/**
 * Convert browser input to a Blob via canvas rendering.
 * @param input The source: ImageData, Blob, URL, etc.
 * @param options Options for sizing and Blob format.
 * @returns Promise resolving to the generated Blob.
 */
export async function convertToBlobUsingCanvas(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<Blob> {
  const resources = new BitmapResource();
  try {
    let canvas;

    if (isImageData(input)) {
      const w = options?.width ?? input.width;
      const h = options?.height ?? input.height;
      canvas = drawToCanvas(input, w, h, options).canvas;
    } else {
      const bmp = await getBitmap(input, options, resources);
      const w = options?.width ?? bmp.width;
      const h = options?.height ?? bmp.height;
      canvas = drawToCanvas(bmp, w, h, options).canvas;
    }

    const blob = await canvas.convertToBlob(convertToBlobOptions(options));
    if (!blob) throw createError.runtimeError('Canvas → Blob conversion failed');
    return blob;
  } finally {
    resources.closeAll();
  }
}
