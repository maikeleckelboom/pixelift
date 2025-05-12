import type * as SharpNS from 'sharp';
import { createError } from '../../shared/error';

let sharpPromise: Promise<typeof SharpNS> | null = null;

/**
 * Lazily imports and caches the Sharp module namespace object.
 * Provides helpful installation guidance if 'sharp' is not found.
 *
 * @returns A promise resolving to the Sharp module namespace object.
 */
export async function getSharp(): Promise<typeof SharpNS> {
  if (!sharpPromise) {
    try {
      sharpPromise = import('sharp');
    } catch (importError) {
      sharpPromise = null;
      const errorMessageLines = [
        '❌ Failed to load the required `sharp` package for server-side image processing.',
        '',
        '💡 To fix this, install `sharp` with one of the following commands:',
        '   - `npm install sharp`',
        '   - `yarn add sharp`',
        '   - `bun add sharp`',
        '',
        '⚠️ Pixelift server features depend on `sharp`.',
        '   It looks like it was not installed or could not be found.',
        '   This may happen if it was skipped during Pixelift installation (it’s optional).'
      ];
      throw createError.dependencyMissing(
        'sharp',
        errorMessageLines.join('\n'),
        importError
      );
    }
  }

  return sharpPromise;
}
