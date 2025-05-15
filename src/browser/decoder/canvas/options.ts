import type { BrowserOptions } from '../../types';

export function imageBitmapOptions(_options?: BrowserOptions): ImageBitmapOptions {
  return {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'from-image'
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
