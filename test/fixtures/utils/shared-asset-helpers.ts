/**
 * Constructs a relative file path for a test fixture asset from the project root.
 * @param format The file format/extension (e.g., "png", "svg").
 * @returns A string representing the relative path to the asset.
 */
export function getFixtureAssetPath(format: string): string {
  return `./test/fixtures/assets/pixelift.${format}`;
}
