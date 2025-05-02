import type * as SharpNS from 'sharp'; // Use namespace import for type

let sharpPromise: Promise<typeof SharpNS> | null = null;

/**
 * Lazily imports and caches the Sharp module namespace object.
 * Provides helpful installation guidance if 'sharp' is not found.
 *
 * @returns A promise resolving to the Sharp module namespace object.
 */
export async function getSharp(): Promise<typeof SharpNS> {
  if (!sharpPromise) {
    sharpPromise = import('sharp').catch((error: unknown) => {
      // Base message
      let userMessage =
        '❌ Failed to load the required `sharp` package for server-side image processing.';

      const installHint =
        '💡 You can install it using one of the following commands:\n' +
        '  - `npm install sharp`\n' +
        '  - `yarn add sharp`\n' +
        '  - `bun add sharp`';

      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND'
      ) {
        userMessage = [
          '⚠️ Pixelift server features depend on the `sharp` package.',
          '',
          'It looks like `sharp` is not installed or could not be found.',
          '',
          'This can happen if it was skipped during the installation of Pixelift (it’s an optional dependency).',
          '',
          installHint
        ].join('\n');
      } else if (error instanceof Error) {
        userMessage += `\n\n${installHint}\n\n🔍 Error details: ${error.message}`;
      } else {
        userMessage += `\n\n${installHint}\n\n⚠️ Unexpected error: ${String(error)}`;
      }

      throw new Error(userMessage, { cause: error });
    });
  }

  return sharpPromise;
}
