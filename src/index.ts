import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import { resolveDecoder } from './plugin/registry';

export async function pixelift(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  const decoder = await resolveDecoder(input);
  return decoder.decode(input, options);
}

// Re-export for plugin authors
export { registerDecoder, getDecoders } from './plugin/registry';
export type { PixelDecoder } from './plugin/types';
