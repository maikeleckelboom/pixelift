import type * as SharpNS from 'sharp';
import { createError } from '../../shared/error';

let sharpPromise: Promise<typeof SharpNS> | null = null;

const SHARP_IS_MISSING_ERROR_MESSAGE = [
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
] as const;

export async function getSharp(): Promise<typeof SharpNS> {
  if (!sharpPromise) {
    sharpPromise = import('sharp').catch((importError) => {
      sharpPromise = null;
      throw createError.dependencyMissing(
        'sharp',
        SHARP_IS_MISSING_ERROR_MESSAGE.join('\n'),
        importError
      );
    });
  }
  return sharpPromise;
}
