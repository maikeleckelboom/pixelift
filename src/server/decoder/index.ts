import type { ServerInput, ServerOptions } from '../types';
import type { PixelData } from '../../types';
import { getBuffer } from '../buffer';
import { getSharp } from './sharp';
import { createError } from '../../shared/error';

export async function decode(
  input: ServerInput,
  { signal }: ServerOptions = {}
): Promise<PixelData> {
  const buffer = await getBuffer(input);

  if (signal?.aborted) {
    throw createError.aborted();
  }

  const sharpModule = await getSharp();

  const sharp = sharpModule.default;

  if (typeof sharp !== 'function') {
    throw createError.dependencyMissing('sharp');
  }

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
