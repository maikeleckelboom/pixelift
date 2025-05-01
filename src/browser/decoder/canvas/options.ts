export function canvasRenderingOptions(): Pick<
  CanvasRenderingContext2DSettings,
  'alpha' | 'colorSpace'
> {
  return { alpha: true, colorSpace: 'srgb' };
}

export function imageBitmapOptions(): ImageBitmapOptions {
  return {
    resizeQuality: 'pixelated',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}
