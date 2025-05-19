/**
 * Returns the HTTP URL for the test fixture asset for browser tests.
 */
export function getFixtureAssetUrl(format: string, importMetaUrl: string): URL {
  return new URL(`/test/fixtures/assets/pixelift.${format}`, importMetaUrl);
}

/**
 * Constructs a relative file path for a test fixture asset from the project root.
 * @param format The file format/extension (e.g., "png", "svg").
 * @returns A string representing the relative path to the asset.
 */
export function getFixtureAssetPath(format: string): string {
  return `./test/fixtures/assets/pixelift.${format}`;
}

/**
 * Fetches a test asset as a Blob. (Browser-side utility)
 * @param format - The format of the asset (e.g., "png").
 * @returns Promise<Blob> of the test asset.
 */
export async function fetchTestAssetBlob(format: string): Promise<Blob> {
  const url = getFixtureAssetUrl(format, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.statusText}`);
  }
  return response.blob();
}
