import type { PixelData, PixeliftServerInput, PixeliftServerOptions } from '../types';
import { getBuffer } from '../buffer';
import { getSharp } from './sharp';

export async function decode(
  input: PixeliftServerInput,
  { signal }: PixeliftServerOptions = {}
): Promise<PixelData> {
  const buffer = await getBuffer(input);

  if (signal?.aborted) {
    throw new Error('Aborted');
  }

  const sharp = await getSharp().then((mod) => mod.default);

  const { data, info } = await sharp(buffer)
    .toColorspace('srgb')
    .ensureAlpha()
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height
  };
}
