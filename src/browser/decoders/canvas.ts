import type { PixelDecoder } from '@/types.ts';

export const canvasDecoder: PixelDecoder<Blob> = {
  name: 'canvas',

  async canHandle(input) {
    return (
      input instanceof Blob ||
      (typeof HTMLImageElement !== 'undefined' && input instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement !== 'undefined' && input instanceof HTMLCanvasElement) ||
      (typeof ImageBitmap !== 'undefined' && input instanceof ImageBitmap)
    );
  },

  async decode(input: ImageBitmapSource) {
    const img = await createImageBitmap(input);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw Error(
        'Failed to get 2D context from OffscreenCanvas.\n' +
          'Ensure your environment supports it.'
      );
    }
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);

    return {
      data,
      width: img.width,
      height: img.height
    };
  }
};
