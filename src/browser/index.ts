import type { PixelData } from '../types';
import type { BrowserOptions, BrowserInput } from './types';

/**
 * Browser-side entry point for the Pixelift library.
 *
 * @param {BrowserInput} input - The input source to be processed, which can include various types of image data.
 * @param {BrowserOptions} [options] - Optional configuration options to customize the processing behavior.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
  input: BrowserInput,
  options: BrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder');
  return await decoder.decode(input, options);
}

export type { BrowserOptions, BrowserInput };
