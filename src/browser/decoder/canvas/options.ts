import type { BrowserOptions } from '../../types';

export const DEFAULT_IMAGE_SMOOTHING_SETTINGS = {
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high'
} as const;

export function imageBitmapOptions(
  options?: BrowserOptions<'offscreenCanvas' | 'webCodecs'>
): ImageBitmapOptions {
  return {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'from-image',
    ...(options?.options || {})
  };
}

export function offscreenCanvasOptions(
  options?: BrowserOptions<'offscreenCanvas'>
): CanvasRenderingContext2DSettings {
  return {
    colorSpace: 'srgb',
    alpha: true,
    willReadFrequently: true,
    ...(options?.options || {})
  };
}
