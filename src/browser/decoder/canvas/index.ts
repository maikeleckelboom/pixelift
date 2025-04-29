import type { PixeliftBrowserInput } from 'pixelift/browser';
import { isStringOrURL } from '../../../shared/validation';
import { isImageBitmapSource } from '../../validation';
import type { PixelData, PixeliftOptions } from 'pixelift';

function canvasRenderingOptions(): Pick<
  CanvasRenderingContext2DSettings,
  'alpha' | 'colorSpace'
> {
  return { alpha: true, colorSpace: 'srgb' };
}

function imageBitmapOptions(options: PixeliftOptions = {}): ImageBitmapOptions {
  return {
    resizeWidth: options.width ?? undefined,
    resizeHeight: options.height ?? undefined,
    resizeQuality: 'pixelated',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}

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

async function createBitmapFromBlob(
  blob: Blob,
  options: PixeliftOptions = {}
): Promise<ImageBitmap> {
  const objectURL = URL.createObjectURL(blob);
  try {
    const imageElement = await loadImageElement(objectURL);
    const width = options.width ?? imageElement.width;
    const height = options.height ?? imageElement.height;

    assertDimensions(width, height);

    const ctx = getCanvasContext(width, height);
    ctx.drawImage(imageElement, 0, 0, width, height);

    return await createImageBitmap(ctx.canvas, imageBitmapOptions(options));
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

async function ensureBitmap(blob: Blob, options: PixeliftOptions): Promise<ImageBitmap> {
  return blob.type === 'image/svg+xml'
    ? createBitmapFromBlob(blob, options)
    : createImageBitmap(blob, imageBitmapOptions(options));
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
  options: PixeliftOptions = {}
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

function getImageData(context: OffscreenCanvasRenderingContext2D): ImageData {
  return context.getImageData(0, 0, context.canvas.width, context.canvas.height, {
    colorSpace: 'srgb'
  });
}

export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const imageBitmap = await createImageFromSource(imageSource, options);
  const width = options.width ?? imageBitmap.width;
  const height = options.height ?? imageBitmap.height;
  assertDimensions(width, height);

  const context = getCanvasContext(width, height);
  context.drawImage(imageBitmap, 0, 0, width, height);
  const imageData = getImageData(context);

  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  };
}
