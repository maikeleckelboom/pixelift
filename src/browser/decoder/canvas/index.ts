import { convertToBlobOptions, imageBitmapOptions } from './options';
import { createVideoFrameBitmap } from './video/utils';
import { createCanvasAndContext } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import { isWebWorker } from '../../../shared/env';
import { isStringOrURL } from '../../../shared/validation';

import type { PixelData } from '../../../types';
import type { BrowserInput, BrowserOptions } from '../../types';

class TrackedBitmaps {
  private tracked: ImageBitmap[] = [];

  track(bmp: ImageBitmap) {
    this.tracked.push(bmp);
  }

  closeAll() {
    this.tracked.forEach((bmp) => {
      try {
        bmp.close();
      } catch {
        /* ignore */
      }
    });
    this.tracked = [];
  }
}

export function isSupported(): boolean {
  return typeof OffscreenCanvas === 'function' && typeof createImageBitmap === 'function';
}

async function getBitmap(
  input: BrowserInput,
  opts: BrowserOptions | undefined,
  resources: TrackedBitmaps
): Promise<ImageBitmap> {
  const decodeOpts = imageBitmapOptions(opts);
  if (input instanceof ImageBitmap) {
    try {
      const newBmp = await createImageBitmap(input, decodeOpts);
      resources.track(newBmp);
      return newBmp;
    } catch (e) {
      throw createError.decodingFailed('ImageBitmap', 'Invalid ImageBitmap', e);
    }
  }
  if (input instanceof VideoFrame) {
    try {
      const bitmap = await createImageBitmap(input, decodeOpts);
      resources.track(bitmap);
      return bitmap;
    } finally {
      input.close();
    }
  }

  if (input instanceof HTMLImageElement) {
    const bitmap = await createImageBitmap(input, decodeOpts);
    resources.track(bitmap);
    return bitmap;
  }

  if (input instanceof HTMLVideoElement) {
    return createVideoFrameBitmap(input, opts);
  }

  if (isStringOrURL(input)) {
    const blob = await toBlob(input, opts);
    return loadBitmapFromBlob(blob, opts, resources);
  }

  if (input instanceof Blob) {
    return loadBitmapFromBlob(input, opts, resources);
  }

  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    const blob = new Blob([input], { type: opts?.type });
    return loadBitmapFromBlob(blob, opts, resources);
  }

  throw createError.invalidInput(
    'Unsupported input type for canvas decoder',
    input?.constructor?.name || typeof input
  );
}

async function loadBitmapFromBlob(
  blob: Blob,
  opts: BrowserOptions | undefined,
  resources: TrackedBitmaps
): Promise<ImageBitmap> {
  const decodeOpts = imageBitmapOptions(opts);

  try {
    const bmp = await createImageBitmap(blob, decodeOpts);
    resources.track(bmp);
    return bmp;
  } catch (err) {
    if (isWebWorker()) {
      throw createError.decodingFailed(
        'new Image()',
        'is not supported in Web Workers',
        err
      );
    }

    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await img.decode();
      const bmp = await createImageBitmap(img, decodeOpts);
      resources.track(bmp);
      return bmp;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const resources = new TrackedBitmaps();
  try {
    const bitmap = await getBitmap(input, options, resources);
    const [canvas, context] = createCanvasAndContext(bitmap.width, bitmap.height);
    context.drawImage(bitmap, 0, 0);
    const img = context.getImageData(0, 0, canvas.width, canvas.height, {
      colorSpace: 'srgb'
    });
    return {
      data: img.data,
      width: img.width,
      height: img.height
    };
  } finally {
    resources.closeAll();
  }
}

export async function convertToBlobUsingCanvas(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<Blob> {
  const resources = new TrackedBitmaps();
  try {
    const { width, height } = await getBitmap(input, options, resources);
    const [canvas] = createCanvasAndContext(width, height);
    const blob = await canvas.convertToBlob(convertToBlobOptions(options));
    if (!blob) {
      throw createError.runtimeError('Canvas conversion to Blob failed');
    }
    return blob;
  } finally {
    resources.closeAll();
  }
}
