import type { BrowserInput, BrowserOptions } from '@/browser';
import type { PixelData } from '@/types';
import { getDecoders } from '@/plugin/registry';
import { detectRuntime } from '@/shared/env.ts';

export async function decode(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData> {
  const runtime = detectRuntime();

  const decoders = getDecoders().filter(
    (d) => !d.metadata?.runtimes || d.metadata.runtimes.includes(runtime)
  );

  if (decoders.length === 0) {
    throw new Error(`No decoders registered for current runtime "${runtime}"`);
  }

  const canHandleResults = await Promise.all(
    decoders.map(async (decoder) => {
      try {
        const canHandle = await decoder.canHandle(input, options);
        return { decoder, canHandle };
      } catch (error) {
        console.warn(`canHandle error in decoder "${decoder.name}":`, error);
        return { decoder, canHandle: false };
      }
    })
  );

  const compatibleDecoders = canHandleResults
    .filter(({ canHandle }) => canHandle)
    .map(({ decoder }) => decoder);

  if (compatibleDecoders.length === 0) {
    throw new Error(`No suitable decoder found for input type: ${typeof input}`);
  }

  compatibleDecoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  let lastError: Error | null = null;
  for (const decoder of compatibleDecoders) {
    try {
      const preparedInput = decoder.prepareForDecode
        ? await decoder.prepareForDecode(input, options)
        : input;

      return await decoder.decode(preparedInput, options);
    } catch (error) {
      console.warn(`Decoder "${decoder.name}" failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error('All compatible decoders failed to process the input');
}
