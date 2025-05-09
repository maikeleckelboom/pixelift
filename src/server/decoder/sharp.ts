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
    } catch {
      throw createError.dependencyMissing(
        'sharp',
        [
          '❌ Failed to load the required `sharp` package for server-side image processing.',
          '💡 You can install it using one of the following commands:\n' +
            ' - `npm install sharp`\n' +
            ' - `yarn add sharp`\n' +
            ' - `bun add sharp`',
          [
            '⚠️ Pixelift server features depend on the `sharp` package.',
            'It looks like `sharp` is not installed or could not be found.',
            'This can happen if it was skipped during the installation of Pixelift (it’s an optional dependency).'
          ].join('\n')
        ].join('\n')
      );
    }
  }

  return sharpPromise;
}
