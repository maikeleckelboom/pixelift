import type { PixelData } from '../types';
import type { BrowserInput, BrowserOptions } from './types';

/**
 * Server-side entry point for the Pixelift library.
 *
 * @param {BrowserInput} input - The input data to be processed by the Pixelift decoders.
 * @param {BrowserOptions?} [options] - Optional configuration settings for the decoding process.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
 */
export async function pixelift(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const decoder = await import('./decoders');
  return await decoder.decode(input, options);
}

export type { BrowserInput, BrowserOptions } from './types';
