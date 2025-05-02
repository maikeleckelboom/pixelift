export function canvasRenderingOptions(): Pick<
  CanvasRenderingContext2DSettings,
  'alpha' | 'colorSpace'
> {
  return { alpha: true, colorSpace: 'srgb' };
}

export function imageBitmapOptions(): ImageBitmapOptions {
  return {
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
    imageOrientation: 'none'
  };
}
