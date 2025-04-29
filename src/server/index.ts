import type { PixelData } from '../types.ts';
import type { PixeliftServerInput, PixeliftServerOptions } from './types.ts';

export async function pixelift(
  input: PixeliftServerInput,
  options: PixeliftServerOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder.ts');
  return await decoder.decode(input, options);
}

export type { PixeliftServerInput, PixeliftServerOptions } from './types.ts';

export { unpackPixels, packPixels } from '../shared/conversion.ts';
