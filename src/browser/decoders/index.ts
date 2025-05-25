import type { BrowserInput, BrowserOptions } from '@/browser';
import type { PixelData } from '@/types';
import { getDecoders } from '@/plugin/registry';

/**
 * Decodes an input using available decoders, trying them in priority order.
 *
 * @param input - The input to decode
 * @param options - Optional decoding options
 * @returns Promise resolving to decoded pixel data
 * @throws Error if no suitable decoder is found or all decoders fail
 */
export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const allDecoders = getDecoders();

  const canHandlePromises = allDecoders.map(async (decoder) => {
    try {
      const canHandle = await Promise.resolve(decoder.canHandle(input));
      return {
        decoder,
        canHandle
      };
    } catch (error) {
      console.warn(`Error checking if decoder ${decoder.name} can handle input:`, error);
      return {
        decoder,
        canHandle: false
      };
    }
  });

  const results = await Promise.all(canHandlePromises);
  const compatibleDecoders = results
    .filter((result) => result.canHandle)
    .map((result) => result.decoder);

  if (compatibleDecoders.length === 0) {
    throw new Error(`No suitable decoder found for input type: ${typeof input}`);
  }

  compatibleDecoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  let lastError: Error | null = null;

  for (const decoder of compatibleDecoders) {
    try {
      if (await decoder.canHandle(input)) {
        const preparedInput = decoder.prepareForDecode
          ? await decoder.prepareForDecode(input, options)
          : input;

        return await decoder.decode(preparedInput, options);
      }
    } catch (error) {
      console.warn(`Decoder ${decoder.name} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error('All compatible decoders failed to process the input');
}
