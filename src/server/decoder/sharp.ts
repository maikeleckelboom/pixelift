let sharpPromise: Promise<typeof import('sharp')> | null = null;

/**
 * Lazily imports and caches the Sharp module for image processing
 * @returns A promise resolving to the Sharp module
 */
export async function getSharp(): Promise<typeof import('sharp')> {
  if (!sharpPromise) {
    sharpPromise = import('sharp')
      .then((module) => module.default)
      .catch((error) => {
        throw new Error(
          [
            'Sharp is required for server-side processing.',
            'To automatically install it, run:',
            'npm install pixelift/server',
            'Or manually install with:',
            'npm install sharp'
          ].join('\n'),
          { cause: error }
        );
      });
  }
  return sharpPromise;
}
