let sharpPromise: Promise<typeof import('sharp')> | null = null;

export async function getSharp(): Promise<typeof import('sharp')> {
  if (!sharpPromise) {
    try {
      sharpPromise = import('sharp').then((mod) => mod.default);
    } catch (cause: unknown) {
      throw new Error(
        'The "sharp" dependency is required for server-side image processing. ' +
          'To enable this feature on the server, please install it with:\n' +
          '`npm install sharp`\n' +
          'If server-side image processing is not needed, you can opt out of this feature.',
        { cause }
      );
    }
  }
  return sharpPromise;
}
