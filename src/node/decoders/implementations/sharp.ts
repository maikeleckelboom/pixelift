import type { Decoder } from '../types.ts';
import type { SharpInput } from 'sharp';
import type { PixelData } from '../../../types.ts';

export class SharpDecoder implements Decoder {
  async decode(buffer: SharpInput): Promise<PixelData> {
    const { default: sharp } = await import('sharp');
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    return {
      data: new Uint8ClampedArray(data.buffer),
      width: info.width,
      height: info.height,
    };
  }
}