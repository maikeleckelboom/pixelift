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
// Use the corrected guards
import {
  isDecodedInput,
  isEncodedInput,
  isMediaElement,
  isRawData
} from '../../../shared/validation';
import { ResourceManager } from '../resources';

async function loadBitmapOnMainThread(
  blob: Blob,
  opts: ImageBitmapOptions,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    const bitmap = await createImageBitmap(img, opts);
    resources.trackBitmap(bitmap);
    return bitmap;
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

async function loadBitmapFromBlob(
  blob: Blob,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);

  try {
    const bitmap = await createImageBitmap(blob, opts);
    resources.trackBitmap(bitmap);
    return bitmap;
  } catch (err) {
    if (isWorker()) {
      throw createError.decodingFailed('Blob', 'createImageBitmap failed in worker', err);
    }
    return loadBitmapOnMainThread(blob, opts, resources);
  }
}

async function convertToBlobAndLoad(
  // These are the types that createBitmapFromEncodedInput will pass
  input: RawWorkerInput,
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const blob = await toBlob(input, options); // toBlob must handle these input types
  return loadBitmapFromBlob(blob, options, resources);
}

async function createBitmapFromEncodedInput(
  input: EncodedBrowserInput, // RawWorkerInput | DOMSource
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);

  // DOMSource part of EncodedBrowserInput
  if (isMediaElement(input)) {
    // Handles HTMLImageElement, HTMLVideoElement, HTMLCanvasElement
    if (
      input instanceof HTMLVideoElement &&
      input.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      throw createError.runtimeError('Video element not ready for frame capture');
    }
    const bitmap = await createImageBitmap(input, opts);
    resources.trackBitmap(bitmap);
    return bitmap;
  }

  if (typeof SVGElement !== 'undefined' && input instanceof SVGElement) {
    // SVGElement is DOMSource
    const svgString = new XMLSerializer().serializeToString(input);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    return loadBitmapFromBlob(blob, options, resources);
  }

  // RawWorkerInput part of EncodedBrowserInput
  if (isRawData(input)) {
    // Handles string, URL, Blob, BufferSource
    return convertToBlobAndLoad(input, options, resources);
  }

  if (input instanceof Response) {
    // Response is RawWorkerInput
    if (!input.body) {
      throw createError.runtimeError('Response has no body');
    }
    return convertToBlobAndLoad(input.body, options, resources);
  }

  if (input instanceof ReadableStream) {
    // ReadableStream is RawWorkerInput
    return convertToBlobAndLoad(input, options, resources);
  }

  // This should be unreachable if isEncodedInput is correct and all EncodedBrowserInput variants are handled.
  throw createError.invalidInput(
    'Unsupported or unhandled EncodedBrowserInput subtype',
    typeof input
  );
}

async function createBitmapFromDecodedInput(
  input: DecodedBrowserInput, // ImageBitmap | ImageData | VideoFrame | OffscreenCanvas
  options: OffscreenCanvasDecoderOptions | undefined,
  resources: ResourceManager
): Promise<ImageBitmap> {
  const opts = imageBitmapOptions(options);
  try {
    // If input is ImageBitmap and opts are effectively no-op, could return input directly.
    // However, createImageBitmap(input, opts) consistently applies options.
    // For OffscreenCanvas, createImageBitmap(input, opts) is also the standard way to get a snapshot with options.
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
  // Use the corrected type guards
  if (isEncodedInput(input)) {
    return createBitmapFromEncodedInput(input, options, resources);
  }
  if (isDecodedInput(input)) {
    return createBitmapFromDecodedInput(input, options, resources);
  }
  // If BrowserInput can be something other than Encoded or Decoded, this throw is needed.
  // Based on BrowserInput = EncodedInput | DecodedInput, this should be unreachable.
  throw createError.invalidInput(
    'Input is neither Encoded nor Decoded BrowserInput',
    typeof input
  );
}

export async function decode(
  input: BrowserInput,
  options?: OffscreenCanvasDecoderOptions // This implies your options utilities can handle this
): Promise<PixelData> {
  const resources = new ResourceManager();
  try {
    const bitmap = await toBitmap(input, options, resources);
    // createCanvasAndContext needs to safely handle 'options' (OffscreenCanvasDecoderOptions)
    const [canvas, context] = createCanvasAndContext(bitmap.width, bitmap.height, options);
    context.drawImage(bitmap, 0, 0);

    const imgData = context.getImageData(0, 0, canvas.width, canvas.height, {
      colorSpace: 'srgb' // Explicitly sRGB as per function comment
    });

    return { data: imgData.data, width: imgData.width, height: imgData.height };
  } finally {
    resources.closeAll();
  }
}
