import type { Decoder } from '../types.ts';
import type { BufferLike, PixelData } from '../../../types.ts';

export class JpegDecoder implements Decoder {
  async decode(buffer: BufferLike): Promise<PixelData> {
    const jpeg = await import('jpeg-js');
    const decoded = jpeg.decode(buffer);
    const { data, width, height } = decoded;
    return { data: new Uint8ClampedArray(data.buffer), width, height };
  }
}