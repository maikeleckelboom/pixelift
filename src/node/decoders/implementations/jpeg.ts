import type { Decoder, PixelData } from '../types.ts';

export class JpegDecoder implements Decoder {
  async decode(buffer: Buffer): Promise<PixelData> {
    const jpeg = await import('jpeg-js');
    const decoded = jpeg.decode(buffer);
    const { data, width, height } = decoded;
    return { data: new Uint8ClampedArray(data.buffer), width, height };
  }
}