import { importSharp } from './sharp-loader';
import type { PixelDecoder } from '@/types';

export const sharpDecoder: PixelDecoder<Buffer> = {
  name: 'sharp',

  async canHandle(input) {
    return input instanceof Buffer;
  },

  async decode(input, options) {
    const sharp = await importSharp().then((m) => m.default);
    const { data, info } = await sharp(input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      data: new Uint8ClampedArray(data),
      width: info.width,
      height: info.height
    };
  }
};
