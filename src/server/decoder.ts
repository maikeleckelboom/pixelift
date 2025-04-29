import type { PixelData } from '../types.ts';
import { getBuffer } from './buffer.ts';
import { PixeliftError } from '../shared/errors.ts';
import type { PixeliftServerInput, PixeliftServerOptions } from './types.ts';

let sharpPromise: Promise<typeof import('sharp')> | null = null;

async function getSharp(): Promise<typeof import('sharp')> {
  if (!sharpPromise) {
    try {
      sharpPromise = import('sharp').then((mod) => mod.default);
    } catch (cause) {
      throw new Error(
        'The "sharp" dependency is required for server-side image processing. ' +
          'To enable this feature on the server, please install it with:\n' +
          '`npm install sharp`\n' +
          'If server-side image processing is not needed, you can opt out of this feature.\n' +
          `\nOriginal error: ${(cause as Error).message}`,
        { cause }
      );
    }
  }
  return sharpPromise;
}

export async function decode(
  input: PixeliftServerInput,
  options: PixeliftServerOptions = {}
): Promise<PixelData> {
  try {
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

    // Match the browser Uint8ClampedArray behavior
    const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);

    return {
      data: clamped,
      width: info.width,
      height: info.height
    };
  } catch (cause) {
    throw PixeliftError.decodeFailed(`Server error: failed to process image.`, { cause });
  }
}

export type { PixeliftServerInput, PixeliftServerOptions } from './types.ts';
