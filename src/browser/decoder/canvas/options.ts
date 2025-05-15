import type { BrowserOptions, OffscreenCanvasDecoderOptions } from '../../types';

export const DEFAULT_IMAGE_SMOOTHING_SETTINGS = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
} as const;

export function imageBitmapOptions(options?: BrowserOptions): ImageBitmapOptions {
  return {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'from-image',
    ...(options?.options || {})
  };
}

export function offscreenCanvasOptions(
  options?: OffscreenCanvasDecoderOptions
): CanvasRenderingContext2DSettings {
  return {
    colorSpace: 'srgb',
    alpha: true,
    willReadFrequently: true,
    ...(options?.options || {})
  };
}
