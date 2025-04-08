import type { Decoder } from '../types.ts';
import type { PixelData } from '../../../types.ts';

export class PngDecoder implements Decoder {
  async decode(buffer: Buffer<ArrayBufferLike>): Promise<PixelData> {
    const { PNG } = await import('pngjs');
    return new Promise((resolve, reject) => {
      const png = PNG.sync.read(buffer);
      const { data, width, height } = png;
      resolve({
        data: new Uint8ClampedArray(data.buffer),
        width,
        height,
      });
    });
  }
}