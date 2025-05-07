/**
 * Common options for createImageBitmap.
 * These options are used to create a new ImageBitmap.
 */
export const BITMAP_OPTIONS = {
  premultiplyAlpha: 'none',
  colorSpaceConversion: 'none',
  imageOrientation: 'none'
} as const;

/**
 * Options for OffscreenCanvasRenderingContext2D.
 * These options are used to create a new OffscreenCanvasRenderingContext2D.
 */
export const CANVAS_OPTIONS = {
  colorSpace: 'srgb',
  alpha: true,
  willReadFrequently: true
} as const;
