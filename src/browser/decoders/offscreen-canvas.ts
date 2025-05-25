import { isImageBitmapSource } from '@/shared/guards.ts';
import { defineDecoder } from '@/plugin/registry.ts';

export const offscreenCanvasDecoder = defineDecoder<ImageBitmapSource>({
  name: 'offscreen-canvas',
  priority: 10,
  metadata: {
    version: '1.0.0',
    supportedEnvs: ['browser', 'web-worker']
  },

  async canHandle(input) {
    return isImageBitmapSource(input);
  },

  async decode(source) {
    const img = await createImageBitmap(source);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error(
        'Failed to get 2D context from OffscreenCanvas.\n' +
          'Ensure your environment supports it.'
      );
    }

    ctx.drawImage(img, 0, 0);

    const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

    return { data, width, height };
  }
});
