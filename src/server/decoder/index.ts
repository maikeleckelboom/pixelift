import type { PixelData, PixeliftServerInput, PixeliftServerOptions } from '../types';
import { getBuffer } from '../buffer';
import { getSharp } from './sharp';

export async function decode(
  input: PixeliftServerInput,
  options: PixeliftServerOptions = {}
): Promise<PixelData> {
  const buffer = await getBuffer(input);
  const sharpModule = await getSharp();

  let pipeline = sharpModule(buffer).toColorspace('srgb').ensureAlpha();

  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, {
      fit: 'fill',
      kernel: 'nearest'
    });
  }

  // Explicit 8-bit RGBA raw output
  const { data, info } = await pipeline
    .raw({ depth: 'uchar' })
    .toBuffer({ resolveWithObject: true });

  return {
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height
  };
}
