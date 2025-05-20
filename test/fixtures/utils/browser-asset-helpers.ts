import { getFixtureAssetPath } from './shared-asset-helpers';

/**
 * Returns the HTTP URL for the test fixture asset for browser tests.
 */
export function getFixtureAssetUrl(
  format: string,
  importMetaUrl: string = window.location.origin
): URL {
  return new URL(getFixtureAssetPath(format), importMetaUrl);
}

/**
 * Fetches a test asset as a Blob. (Browser-side utility)
 * @param format - The format of the asset (e.g., "png").
 * @returns Promise<Blob> of the test asset.
 */
export async function fetchTestAssetBlob(format: string): Promise<Blob> {
  const url = getFixtureAssetUrl(format);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.statusText}`);
  }
  return response.blob();
}
