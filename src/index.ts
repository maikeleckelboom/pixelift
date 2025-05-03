import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import { isServer } from './shared/env';
import { validateBrowserInput, validateServerInput } from './shared/validation';
import type { ServerInput, ServerOptions } from './server/types';
import type { BrowserInput, BrowserOptions } from './browser/types';

/**
 * Browser-side image processing with pixel data extraction
 * @param input Image URL, Blob, File, or ImageBitmapSource
 * @param options Browser-specific processing options
 */
export async function pixelift(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData>;
/**
 * Server-side image processing with pixel data extraction
 * @param input File path, Buffer, or ArrayBuffer
 * @param options Server-specific processing options
 */
export async function pixelift(
  input: ServerInput,
  options?: ServerOptions
): Promise<PixelData>;
export async function pixelift(
  input: PixeliftInput,
  options: PixeliftOptions = {}
): Promise<PixelData> {
  if (isServer()) {
    try {
      if (validateServerInput(input)) {
        const decoder = await import('./server/decoder');
        return decoder.decode(input, <ServerOptions>options);
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
      return decoder.decode(input, <BrowserOptions>options);
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
