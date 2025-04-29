import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import { isServer } from './shared/env';
import { validateBrowserInput, validateServerInput } from './shared/validation';

/**
 * Main entry point for the Pixelift library.
 * Processes images in both browser and server environments.
 *
 * @param input - Source image (URL, file path, Buffer, Blob, etc.)
 * @param options - Processing options (width, height, etc.)
 * @returns Promise resolving to pixel data
 * @throws PixeliftError if processing fails
 *
 * @example
 * ```ts
 * // Basic usage
 * const { data, width, height } = await pixelift('image.jpg');
 *
 * // With options
 * const result = await pixelift(imageBlob, { width: 300, height: 200 });
 * ```
 */
export async function pixelift(
  input: PixeliftInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  if (isServer()) {
    if (validateServerInput(input)) {
      const decoder = await import('./server/decoder');
      return decoder.decode(input, options);
    }
    throw new TypeError('Invalid input type for server environment.');
  }

  if (validateBrowserInput(input)) {
    const decoder = await import('./browser/decoder');
    return decoder.decode(input, options);
  }

  throw new TypeError('Invalid input type for browser-side decoding.');
}

export { unpackPixels, packPixels } from './shared/conversion';

export type { PixeliftInput, PixeliftOptions, PixelData } from './types';
