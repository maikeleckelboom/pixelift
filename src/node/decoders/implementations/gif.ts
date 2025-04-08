import type { Decoder } from '../types.ts';
import { PixeliftError } from '../../../core';
import { safeImport } from '../../../module.ts';
import type { GIFOptions, PixelData } from '../../../types.ts';

export class GifDecoder implements Decoder {
  async decode(buffer: Buffer, options: GIFOptions = {}): Promise<PixelData> {
    const decoder = await safeImport<typeof import('omggif')>('omggif');

    if (!decoder) {
      throw new PixeliftError('Failed to load GIF decoder');
    }

    const gif = new decoder.GifReader(buffer);

    if (gif.numFrames() === 0) {
      throw new PixeliftError('GIF has no frames');
    }

    const { width, height } = gif;
    const imageData = new Uint8ClampedArray(width * height * 4);

    const frameNum = options.frame ?? 0;

    gif.decodeAndBlitFrameBGRA(frameNum, imageData);

    const view = new DataView(imageData.buffer);
    for (let i = 0; i < imageData.length; i += 4) {
      const temp = view.getUint32(i, true);
      view.setUint32(
        i,
        (temp & 0xff00ff00) | ((temp & 0xff) << 16) | ((temp >> 16) & 0xff),
        true,
      );
    }

    return {
      data: new Uint8ClampedArray(imageData.buffer),
      width,
      height,
    };
  }
}