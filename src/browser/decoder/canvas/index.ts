import { imageBitmapOptions } from './options';
import { createCanvasAndContext } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import type { PixelData } from '../../../types';
import type {
  DecodedImageData,
  PixelSource,
  OffscreenCanvasDecoderOptions,
  WorkerTransportData,
  BrowserInput
} from '../../types';
import { isWorker } from '../../../shared/env';
import {
  isDecodedInput,
  isEncodedInput,
  isMediaElement,
  isRawData
} from '../../../shared/guards';

import { createPixelData } from '../../../shared/factory';
import { withAutoClose } from '../../utils/auto-close';
import { rasterizeBlob } from '../../blob/rasterize';

async function loadBitmapFromBlob(
  blob: Blob,
  options: OffscreenCanvasDecoderOptions | undefined
): Promise<ImageBitmap> {
  const bitmapOptions = imageBitmapOptions(options);
  try {
    return await createImageBitmap(blob, bitmapOptions);
  } catch (error) {
    if (isWorker()) {
      throw createError.decodingFailed('Blob', 'createImageBitmap failed in worker', error);
    }
    return rasterizeBlob(blob, bitmapOptions);
  }
}

async function convertToBlobAndLoadBitmap(
  input: WorkerTransportData,
  options: OffscreenCanvasDecoderOptions | undefined
): Promise<ImageBitmap> {
  const blob = await toBlob(input, options);
  return loadBitmapFromBlob(blob, options);
}

async function createBitmapFromEncodedImageSource(
  input: PixelSource,
  options: OffscreenCanvasDecoderOptions | undefined
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);

  if (isMediaElement(input)) {
    if (
      input instanceof HTMLVideoElement &&
      input.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      throw createError.runtimeError('Video element not ready for frame capture');
    }
    if (input instanceof HTMLImageElement && !input.complete) {
      throw createError.runtimeError('Image element not fully loaded');
    }
    return await createImageBitmap(input, opts);
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    const serializedString = new XMLSerializer().serializeToString(input);
    const blob = new Blob([serializedString], { type: 'image/svg+xml' });
    return loadBitmapFromBlob(blob, options);
  }

  if (isRawData(input)) {
    return convertToBlobAndLoadBitmap(input, options);
  }

  if (input instanceof Response) {
    if (!input.body) {
      throw createError.runtimeError('Response has no body');
    }
    return convertToBlobAndLoadBitmap(input.body, options);
  }

  if (input instanceof ReadableStream) {
    return convertToBlobAndLoadBitmap(input, options);
  }

  throw createError.invalidInput(
    'Unsupported or unhandled PixelSource subtype',
    typeof input
  );
}

async function createBitmapFromDecodedInput(
  input: DecodedImageData,
  options: OffscreenCanvasDecoderOptions | undefined
): Promise<ImageBitmap> {
  const bitmapOptions = imageBitmapOptions(options);

  if (input instanceof OffscreenCanvas) {
    return await createImageBitmap(input, bitmapOptions);
  }

  if (input instanceof ImageData) {
    return createImageBitmap(input, bitmapOptions);
  }

  if (input instanceof ImageBitmap) {
    return input;
  }
  if (input instanceof HTMLCanvasElement) {
    return createImageBitmap(input, bitmapOptions);
  }

  if (input instanceof VideoFrame) {
    return withAutoClose(input, (frame) => createImageBitmap(frame, bitmapOptions));
  }

  return createImageBitmap(input, bitmapOptions);
}

async function bitmapFromInput(
  input: BrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined
): Promise<ImageBitmap> {
  if (isDecodedInput(input)) {
    return createBitmapFromDecodedInput(input, options);
  }

  if (isEncodedInput(input)) {
    return createBitmapFromEncodedImageSource(input, options);
  }

  throw createError.invalidInput(
    'Unsupported or unhandled BrowserInput subtype',
    typeof input
  );
}

export async function decode(
  input: BrowserInput,
  options?: OffscreenCanvasDecoderOptions
): Promise<PixelData> {
  const imageBitmap = await bitmapFromInput(input, options);
  return withAutoClose(imageBitmap, async (bitmap) => {
    const [canvas, context] = createCanvasAndContext(bitmap.width, bitmap.height, options);
    context.drawImage(bitmap, 0, 0);
    const { data, width, height } = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
      { colorSpace: options?.options?.colorSpace ?? 'srgb' }
    );
    return createPixelData(data, width, height);
  });
}
