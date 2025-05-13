import type { BrowserOptions } from '../../types';

export function imageBitmapOptions(options?: BrowserOptions): ImageBitmapOptions {
  return {
    resizeQuality: options?.resizeQuality ?? 'low',
    resizeWidth: options?.width,
    resizeHeight: options?.height,
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}

export function canvasContextOptions(_?: BrowserOptions): CanvasRenderingContext2DSettings {
  return {
    colorSpace: 'srgb',
    alpha: true,
    willReadFrequently: true
  };
}

export function convertToBlobOptions(options?: BrowserOptions): ImageEncodeOptions {
  return {
    type: options?.type,
    quality: options?.quality
  };
}
