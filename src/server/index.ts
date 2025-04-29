import type { PixelData, PixeliftOptions } from '../types';
import type { PixeliftServerInput } from './types';

/**
 * Server-side entry point for the Pixelift library.
 *
 * @param {PixeliftServerInput} input - The input data to be processed by the Pixelift decoder.
 * @param {PixeliftServerOptions?} [options] - Optional configuration settings for the decoding process.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
  input: PixeliftServerInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder');
  return await decoder.decode(input, options);
}

export type * from './types';

export { unpackPixels, packPixels } from '../shared/conversion';
