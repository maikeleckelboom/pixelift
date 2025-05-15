import { imageBitmapOptions } from './options';
import { createCanvasAndContext } from './utils';
import { toBlob } from '../../blob';
import { createError } from '../../../shared/error';
import type { PixelData } from '../../../types';
import type {
  BrowserInput,
  DecodedBrowserInput,
  EncodedBrowserInput,
  OffscreenCanvasDecoderOptions,
  RawWorkerInput
} from '../../types';
import { isWorker } from '../../../shared/env';
import {
  isDecodedInput,
  isEncodedInput,
  isMediaElement,
  isRawData
} from '../../../shared/guards';
import { ResourceManager } from '../resources';

async function loadBitmapOnMainThread(
  blob: Blob,
  opts: ImageBitmapOptions,
  resourceManager: ResourceManager
): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    const bitmap = await createImageBitmap(img, opts);
    resourceManager.trackBitmap(bitmap);
    return bitmap;
  } catch (error) {
    throw createError.decodingFailed(
      'Blob (ImageElement fallback)',
      'Failed to decode blob via ImageElement',
      error
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadBitmapFromBlob(
  blob: Blob,
  options: OffscreenCanvasDecoderOptions | undefined,
  resourceManager: ResourceManager
): Promise<ImageBitmap> {
  const bitmapOptions = imageBitmapOptions(options);
  try {
    const bitmap = await createImageBitmap(blob, bitmapOptions);
    resourceManager.trackBitmap(bitmap);
    return bitmap;
  } catch (error) {
    if (isWorker()) {
      throw createError.decodingFailed('Blob', 'createImageBitmap failed in worker', error);
    }
    return loadBitmapOnMainThread(blob, bitmapOptions, resourceManager);
  }
}

async function convertToBlobAndLoad(
  input: RawWorkerInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resourceManager: ResourceManager
): Promise<ImageBitmap> {
  const blob = await toBlob(input, options);
  return loadBitmapFromBlob(blob, options, resourceManager);
}

async function createBitmapFromEncodedInput(
  input: EncodedBrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resourceManager: ResourceManager
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);

  if (isMediaElement(input)) {
    if (
      input instanceof HTMLVideoElement &&
      input.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      throw createError.runtimeError('Video element not ready for frame capture');
    }
    const bitmap = await createImageBitmap(input, opts);
    resourceManager.trackBitmap(bitmap);
    return bitmap;
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    const blob = new Blob([input.outerHTML], { type: 'image/svg+xml' });
    return loadBitmapFromBlob(blob, options, resourceManager);
  }

  if (isRawData(input)) {
    return convertToBlobAndLoad(input, options, resourceManager);
  }

  if (input instanceof Response) {
    if (!input.body) {
      throw createError.runtimeError('Response has no body');
    }
    return convertToBlobAndLoad(input.body, options, resourceManager);
  }

  if (input instanceof ReadableStream) {
    return convertToBlobAndLoad(input, options, resourceManager);
  }

  throw createError.invalidInput(
    'Unsupported or unhandled EncodedBrowserInput subtype',
    typeof input
  );
}

async function createBitmapFromDecodedInput(
  input: DecodedBrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);
  try {
    const bitmap = await createImageBitmap(input, opts);
    resources.trackBitmap(bitmap);
    return bitmap;
  } catch (error) {
    throw createError.decodingFailed(
      input.constructor.name,
      `createImageBitmap failed for ${input.constructor.name}`,
      error
    );
  } finally {
    if (input instanceof VideoFrame) {
      input.close();
    }
  }
}

async function toBitmap(
  input: BrowserInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  if (isEncodedInput(input)) {
    return createBitmapFromEncodedInput(input, options, resources);
  }

  if (isDecodedInput(input)) {
    return createBitmapFromDecodedInput(input, options, resources);
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
  const resources = new ResourceManager();
  try {
    const bitmap = await toBitmap(input, options, resources);
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
