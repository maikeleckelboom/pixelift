import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import { resolveDecoder } from './plugin/registry';
import { autoloadDecoders } from './plugin/autoload';

// 💥 💥 💥 💥 💥 💥
autoloadDecoders().catch((error) => {
  console.warn('⚠️ Failed to autoload decoders to global registry.', { error });
});

export async function pixelift(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  const decoder = await resolveDecoder(input);
  return decoder.decode(input, options);
}

export { registerDecoder, getDecoders } from './plugin/registry';
export type { PixelDecoder } from './plugin/types';
