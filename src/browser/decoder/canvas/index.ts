import { imageBitmapOptions } from './options';
import { createCanvasAndContext } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import { isStringOrURL } from '../../../shared/validation';
import type { PixelData } from '../../../types';
import type {
  BrowserInput,
  DecodedBrowserInput,
  EncodedBrowserInput,
  OffscreenCanvasDecoderOptions
} from '../../types';
import { isWorker } from '../../../shared/env';

/**
 * Tracks ImageBitmap instances for cleanup.
 */
export class TrackedBitmaps {
  private list: ImageBitmap[] = [];

  track(bmp: ImageBitmap) {
    this.list.push(bmp);
  }

  closeAll() {
    this.list.forEach((bmp) => {
      try {
        bmp.close();
      } catch {
        // Ignore errors when closing bitmaps
        // This can happen if the bitmap is already closed or invalid
      }
    });
    this.list = [];
  }
}

/** True for actual pixel buffers / transferables. */
function isDecodedInput(input: BrowserInput): input is DecodedBrowserInput {
  return (
    input instanceof ImageBitmap ||
    input instanceof ImageData ||
    input instanceof VideoFrame ||
    (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas)
  );
}

function isUndecodedInput(input: BrowserInput): input is EncodedBrowserInput {
  return (
    typeof input === 'string' ||
    input instanceof URL ||
    input instanceof Blob ||
    // covers ArrayBuffer and all TypedArrays / DataViews:
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input) ||
    (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) ||
    (typeof SVGElement !== 'undefined' && input instanceof SVGElement)
  );
}

async function loadBitmapFromBlob(
  blob: Blob,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: TrackedBitmaps
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);

  try {
    const bitmap = await createImageBitmap(blob, opts);
    resources.track(bitmap);
    return bitmap;
  } catch (err) {
    if (isWorker()) {
      throw createError.decodingFailed('Blob', 'createImageBitmap failed in worker', err);
    }
    // Main-thread fallback
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      await img.decode();
      const bmp = await createImageBitmap(img, opts);
      resources.track(bmp);
      return bmp;
    } catch (e) {
      throw createError.decodingFailed(
        'Blob (ImageElement fallback)',
        'Failed to decode blob via ImageElement',
        e
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function createBitmapFromEncodedInput(
  input: EncodedBrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: TrackedBitmaps
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);
  if (
    (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== 'undefined' && input instanceof HTMLVideoElement) ||
    (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement)
  ) {
    const bmp = await createImageBitmap(input, opts);
    resources.track(bmp);
    return bmp;
  }

  if (typeof OffscreenCanvas !== 'undefined' && input instanceof OffscreenCanvas) {
    const bmp = input.transferToImageBitmap();
    resources.track(bmp);
    return bmp;
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    const blob = new Blob([new XMLSerializer().serializeToString(input)], {
      type: 'image/svg+xml'
    });
    return loadBitmapFromBlob(blob, options, resources);
  }

  if (
    isStringOrURL(input) ||
    input instanceof Blob ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input)
  ) {
    const blob = await toBlob(input, options);
    return loadBitmapFromBlob(blob, options, resources);
  }

  throw createError.invalidInput('unsupported encoded input', typeof input);
}

async function getBitmapFromDecoded(
  input: DecodedBrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: TrackedBitmaps
): Promise<ImageBitmap> {
  try {
    const bitmap = await createImageBitmap(input, imageBitmapOptions(options));
    resources.track(bitmap);
    if (input instanceof VideoFrame) input.close();
    return bitmap;
  } catch (error) {
    throw createError.decodingFailed(
      input.constructor.name,
      `createImageBitmap failed for ${input.constructor.name}`,
      error
    );
  }
}

/**
 * Canvas-based decoder (sRGB only).
 */
export async function decode(
  input: EncodedBrowserInput,
  options?: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  const resources = new TrackedBitmaps();
  try {
    let bitmap: ImageBitmap;
    if (isUndecodedInput(input)) {
      bitmap = await createBitmapFromEncodedInput(input, options, resources);
    } else if (isDecodedInput(input)) {
      bitmap = await getBitmapFromDecoded(input, options, resources);
    } else {
      throw createError.invalidInput('unsupported input', typeof input);
    }

    const [canvas, context] = createCanvasAndContext(bitmap.width, bitmap.height, options);
    context.drawImage(bitmap, 0, 0);

    const imgData = context.getImageData(0, 0, canvas.width, canvas.height, {
      colorSpace: 'srgb'
    });

    return { data: imgData.data, width: imgData.width, height: imgData.height };
  } finally {
    resources.closeAll();
  }
}
