import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import { isServer } from './shared/env';
import { validateBrowserInput, validateServerInput } from './shared/validation';
import type { PixeliftServerInput, PixeliftServerOptions } from './server/types';
import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './browser/types';

// Browser-specific overload
/**
 * Browser-side image processing with pixel data extraction
 * @param input Image URL, Blob, File, or ImageBitmapSource
 * @param options Browser-specific processing options
 */
export async function pixelift(
  input: PixeliftBrowserInput,
  options?: PixeliftBrowserOptions
): Promise<PixelData>;

// Server-specific overload
/**
 * Server-side image processing with pixel data extraction
 * @param input File path, Buffer, or ArrayBuffer
 * @param options Server-specific processing options
 */
export async function pixelift(
  input: PixeliftServerInput,
  options?: PixeliftServerOptions
): Promise<PixelData>;

// Implementation signature
export async function pixelift(
  input: PixeliftInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  if (isServer()) {
    try {
      if (validateServerInput(input)) {
        const decoder = await import('./server/decoder');
        return decoder.decode(input, options);
      }
    } catch (error) {
      throw new TypeError('Invalid input type for server environment.', {
        cause: error
      });
    }
  }

  if (validateBrowserInput(input)) {
    try {
      const decoder = await import('./browser/decoder');
      return decoder.decode(input, options);
    } catch (error) {
      throw new TypeError('Invalid input type for browser environment.', {
        cause: error
      });
    }
  }

  throw new TypeError('Invalid input type for browser-side decoding.');
}

export { unpackPixels, packPixels } from './shared/conversion';

export type { PixeliftInput, PixeliftOptions, PixelData } from './types';
