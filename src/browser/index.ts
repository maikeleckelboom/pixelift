import type { PixelData } from '../types';
import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types';

/**
 * Browser-side entry point for the Pixelift library.
 *
 * @param {PixeliftBrowserInput} input - The input source to be processed, which can include various types of image data.
 * @param {PixeliftBrowserOptions} [options] - Optional configuration options to customize the processing behavior.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
  input: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder');
  return await decoder.decode(input, options);
}

export type { PixelData, PixeliftBrowserInput } from './types';

export type { PixeliftOptions } from '../types';

export { unpackPixels, packPixels } from '../shared/conversion';
