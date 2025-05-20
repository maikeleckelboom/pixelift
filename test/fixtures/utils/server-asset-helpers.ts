import { readFile } from 'node:fs/promises';
import { getFixtureAssetPath } from './shared-asset-helpers';

/**
 * Fetches a test asset as a Buffer. (Node-side utility)
 * @param format - The format of the asset (e.g., "png").
 * @returns Promise<Buffer> of the test asset.
 */
export async function fetchTestAssetBuffer(format: string): Promise<Buffer> {
  const url = getFixtureAssetPath(format);
  return readFile(url);
}
