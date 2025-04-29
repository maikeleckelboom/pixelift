import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';
import { PixeliftError } from '../shared/errors.ts';
import { isStringOrURL } from '../shared/validation.ts';
import type { PixelData } from '../types.ts';
import { isImageBitmapSource } from './validation.ts';

/**
 * Options for `canvas.getContext('2d)` to approximate `sharp().raw()`
 */
function canvasRenderingOptions(): Pick<
  CanvasRenderingContext2DSettings,
  'alpha' | 'colorSpace'
> {
  return {
    alpha: true,
    colorSpace: 'srgb'
  };
}

/**
 * Options for `createImageBitmap` to approximate `sharp().raw()`
 */
function imageBitmapOptions(options: PixeliftBrowserOptions = {}): ImageBitmapOptions {
  return {
    resizeWidth: options.width ?? undefined,
    resizeHeight: options.height ?? undefined,
    resizeQuality: 'pixelated',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}

function createOffscreenRenderingContext(
  bitmap: ImageBitmap,
  options: PixeliftBrowserOptions = {}
): OffscreenCanvasRenderingContext2D {
  const width = options.width ?? bitmap.width;
  const height = options.height ?? bitmap.height;

  if (width <= 0 || height <= 0) {
    throw PixeliftError.decodeFailed(
      `Invalid canvas dimensions (width: ${width}, height: ${height})`
    );
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', canvasRenderingOptions());
  if (!ctx) {
    throw PixeliftError.decodeFailed('Failed to create canvas rendering context');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(bitmap, 0, 0, width, height);

  return ctx;
}

/**
 * Load an HTMLImageElement from a URL, respecting CORS
 */
function loadImageFromURL(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = (): void => resolve(img);
    img.onerror = (): void =>
      reject(
        PixeliftError.fileReadFailed(
          `Failed to load image from URL. Check CORS or URL validity.`
        )
      );
    img.src = url;
  });
}

/**
 * Handles SVG by raster-sizing onto a canvas then bitmap
 */
async function createImageBitmapFromBlob(
  blob: Blob,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  const objectURL = URL.createObjectURL(blob);
  try {
    const img = await loadImageFromURL(objectURL);
    const width = options.width ?? img.width;
    const height = options.height ?? img.height;

    if (width <= 0 || height <= 0) {
      throw PixeliftError.decodeFailed(
        `Invalid SVG dimensions (width: ${img.width}, height: ${img.height})`
      );
    }

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', canvasRenderingOptions());
    if (!ctx) {
      throw PixeliftError.decodeFailed('Failed to create 2D context for SVG processing');
    }
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(img, 0, 0, width, height);

    return await createImageBitmap(canvas, imageBitmapOptions(options));
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}

/**
 * Fetch and decode an image to ImageBitmap, handling SVG specially
 */
async function fetchAndCreateImageBitmap(
  source: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<ImageBitmap> {
  if (isStringOrURL(source)) {
    const url = new URL(source.toString(), location.origin).toString();
    const res = await fetch(url, { mode: 'cors', headers: options.headers });
    if (!res.ok) {
      throw PixeliftError.requestFailed(`Image fetch failed (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    if (blob.type === 'image/svg+xml' || url.endsWith('.svg')) {
      return createImageBitmapFromBlob(blob, options);
    }
    return createImageBitmap(blob, imageBitmapOptions(options));
  }

  if (source instanceof Blob) {
    return createImageBitmap(source, imageBitmapOptions(options));
  }

  if (isImageBitmapSource(source)) {
    return createImageBitmap(source);
  }

  throw PixeliftError.decodeFailed('Unsupported image source type for canvas decoder');
}

/**
 * Reads straight RGBA pixels from the canvas
 */
function getImageDataFromCanvas(context: OffscreenCanvasRenderingContext2D): ImageData {
  return context.getImageData(0, 0, context.canvas.width, context.canvas.height, {
    colorSpace: 'srgb'
  });
}

/**
 * Public fallback decode function: returns raw PixelData via Canvas
 */
export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const bitmap = await fetchAndCreateImageBitmap(imageSource, options);
  const context = createOffscreenRenderingContext(bitmap, options);
  const imageData = getImageDataFromCanvas(context);
  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  };
}
