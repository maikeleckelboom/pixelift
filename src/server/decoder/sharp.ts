import type * as SharpNS from 'sharp';
import { createError } from '../../shared/error'; // Use namespace import for type

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
    } catch (error: unknown) {
      throw createError.dependencyMissing('sharp', error);
    }
  }

  return sharpPromise;
}
