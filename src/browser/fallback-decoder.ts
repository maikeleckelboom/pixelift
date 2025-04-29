import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';
import { PixeliftError } from '../shared/errors.ts';
import { isImageBitmapSource, isStringOrURL } from '../shared/validation.ts';
import type { PixelData } from '../types.ts';

/**
 * Canvas context creation options
 */
function canvasContextOptions(
  _: PixeliftBrowserOptions = {}
): CanvasRenderingContext2DSettings {
  return {
    alpha: true,
    colorSpace: 'srgb'
  };
}

/**
 * Options for createImageBitmap to approximate `sharp().raw()`
 */
function imageBitmapOptions(options: PixeliftBrowserOptions = {}): ImageBitmapOptions {
  return {
    resizeWidth: options.width,
    resizeHeight: options.height,
    resizeQuality: 'pixelated',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}

// async function fetchAndDecodeImage(
//   source: string | URL,
//   options: PixeliftBrowserOptions = {}
// ): Promise<ImageBitmap> {
//   const url = source.toString();
//   const response = await fetch(new URL(url, location.origin).toString(), { mode: 'cors' });
//
//   if (!response.ok) {
//     throw PixeliftError.requestFailed(`Image fetch failed (HTTP ${response.status})`);
//   }
//
//   // Check content type before processing
//   const contentType = response.headers.get('content-type');
//   if (contentType && contentType.startsWith('text/html')) {
//     const debugURL = new URL(url, location.origin).toString();
//     throw PixeliftError.decodeFailed(
//       `Invalid content type: ${contentType} for URL: ${debugURL}. ` +
//       `Expected an image but received HTML content from ${debugURL}. This usually indicates:\n` +
//       `1. The URL points to a webpage instead of an image file\n` +
//       `2. The server returned an error page (e.g., 404, 403, 500)\n` +
//       `3. Authentication is required or cookies are missing\n` +
//       `4. The URL protocol is incorrect (Try https:// instead of http://)\n` +
//       `Tip: Open the URL in a browser to see what content is actually being returned`
//     );
//   }
//
//   if (contentType && !contentType.startsWith('image/') && !url.endsWith('.svg')) {
//     throw PixeliftError.decodeFailed(
//       `Invalid content type for image processing. ` +
//       `Expected an image but received content of type: ${contentType} from ${url}.\n` +
//       `Ensure the URL points directly to an image file (jpg, png, gif, etc.)`
//     );
//   }
//
//   const imageBlob = await response.blob();
//
//   try {
//     if (imageBlob.type === 'image/svg+xml' || url.endsWith('.svg')) {
//       return await createImageBitmapFromBlob(imageBlob, options);
//     }
//
//     return await createImageBitmap(imageBlob, imageBitmapOptions(options));
//   } catch (error) {
//     throw PixeliftError.decodeFailed(`Failed to decode ${imageBlob.type || 'unknown'} image`, {
//       cause: error as Error
//     });
//   }
// }

function createRenderingContext(
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
  const ctx = canvas.getContext('2d', canvasContextOptions(options));
  if (!ctx) {
    throw PixeliftError.decodeFailed('Failed to create canvas rendering context');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(bitmap, 0, 0, width, height);
  return ctx;
}

/**
 * Reads straight RGBA pixels from the canvas
 */
function getImageDataFromCanvas(context: OffscreenCanvasRenderingContext2D): ImageData {
  const { width, height } = context.canvas;
  return context.getImageData(0, 0, width, height, { colorSpace: 'srgb' });
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
    const ctx = canvas.getContext('2d', canvasContextOptions(options));
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
    const res = await fetch(url, { mode: 'cors' });
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
 * Public fallback decode function: returns raw PixelData via Canvas
 */
export async function decode(
  imageSource: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const bitmap = await fetchAndCreateImageBitmap(imageSource, options);
  const ctx = createRenderingContext(bitmap, options);
  const imageData = getImageDataFromCanvas(ctx);
  return {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  };
}
