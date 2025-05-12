import type { BrowserOptions } from '../../types';

/**
 * Common options for createImageBitmap.
 * These options are used to create a new ImageBitmap.
 */
export const IMAGE_BITMAP_OPTIONS: ImageBitmapOptions = {
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
  imageOrientation: 'none',
  resizeQuality: 'low'
} as const;

export function imageBitmapOptions(options?: BrowserOptions): ImageBitmapOptions {
  return {
    ...IMAGE_BITMAP_OPTIONS,
    resizeWidth: options?.width,
    resizeHeight: options?.height
  };
}

/**
 * Options for OffscreenCanvasRenderingContext2D.
 * These options are used to create a new OffscreenCanvasRenderingContext2D.
 */
export const CANVAS_2D_OPTIONS = {
  colorSpace: 'srgb',
  alpha: true,
  willReadFrequently: true
} as const;

export function convertToBlobOptions(options?: BrowserOptions): ImageEncodeOptions {
  return {
    type: options?.type,
    quality: options?.quality
  };
}
