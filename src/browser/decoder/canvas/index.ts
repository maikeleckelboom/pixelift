import { isStringOrURL } from '../../../shared/validation';
import { isImageBitmapSource } from '../../validation';
import { canvasRenderingOptions, imageBitmapOptions } from './options';
import type {
  PixelData,
  PixeliftBrowserInput,
  PixeliftBrowserOptions
} from '../../types';

function getCanvasContext(
  width: number,
  height: number
): OffscreenCanvasRenderingContext2D {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', canvasRenderingOptions());
  if (!ctx) throw new Error('Failed to create canvas context');
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low';
  return ctx;
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = (): void => resolve(img);
    img.onerror = (): void => reject(new Error('Failed to load image from URL'));
    img.src = url;
  });
}

function assertDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    throw new TypeError('Image dimensions must be positive values');
  }
}

async function createBitmapFromSVGBlob(
  blob: Blob,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  const objectURL = URL.createObjectURL(blob);
  try {
    const imageElement = await loadImageElement(objectURL);
    const viewBox = imageElement.getAttribute('viewBox');

    let width = options.width || imageElement.width;
    let height = options.height || imageElement.height;

    if (viewBox) {
      const [, , w, h] = viewBox.split(' ').map(Number);
      width = options.width || w || imageElement.width;
      height = options.height || h || imageElement.height;
    }

    assertDimensions(width, height);

    const ctx = getCanvasContext(width, height);
    ctx.drawImage(imageElement, 0, 0, width, height);

    return await createImageBitmap(ctx.canvas, imageBitmapOptions());
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

async function ensureBitmap(
  blob: Blob,
  options: PixeliftBrowserOptions
): Promise<ImageBitmap> {
  return blob.type === 'image/svg+xml'
    ? createBitmapFromSVGBlob(blob, options)
    : createImageBitmap(blob, imageBitmapOptions());
}

async function fetchBlob(url: string, headers?: HeadersInit): Promise<Blob> {
  try {
    const res = await fetch(url, { mode: 'cors', headers });
    return await res.blob();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Network error: Couldn't fetch image. ${message}`, { cause: error });
  }
}

async function createImageFromSource(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    try {
      const blob = await fetchBlob(url, options.headers);
      return ensureBitmap(blob, options);
    } catch (error: unknown) {
      throw new Error(`Failed to load image from URL: ${url}`, { cause: error });
    }
  }

  if (source instanceof Blob) {
    return ensureBitmap(source, options);
  }

  if (isImageBitmapSource(source)) {
    return createImageBitmap(source);
  }

  throw new TypeError(
    'Invalid image source. Expected URL, string, Blob, or ImageBitmapSource'
  );
}

export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const imageBitmap = await createImageFromSource(imageSource, options);

  // If options.width/height were in imageBitmapOptions, imageBitmap.width/height
  // should already reflect the desired size if createImageBitmap succeeded in resizing.
  const width = options.width ?? imageBitmap.width;
  const height = options.height ?? imageBitmap.height;

  assertDimensions(width, height);

  // Create the final canvas at the determined dimensions
  const context = getCanvasContext(width, height);

  // Draw the imageBitmap onto the canvas
  context.drawImage(imageBitmap, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height, { colorSpace: 'srgb' });

  return {
    data,
    width,
    height
  };
}
