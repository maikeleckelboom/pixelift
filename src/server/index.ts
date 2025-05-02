import type { PixelData } from '../types';
import type { PixeliftServerInput, PixeliftServerOptions } from './types';

/**
 * Server-side entry point for the Pixelift library.
 *
 * @param {PixeliftServerInput} input - The input data to be processed by the Pixelift decoder.
 * @param {PixeliftServerOptions?} [options] - Optional configuration settings for the decoding process.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
  input: PixeliftServerInput,
  options: PixeliftServerOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder');
  return await decoder.decode(input, options);
}

export type { PixelData, PixeliftServerInput, PixeliftServerOptions } from './types';

export type { PixeliftOptions } from '../types';

export { unpackPixels, packPixels } from '../shared/conversion';
