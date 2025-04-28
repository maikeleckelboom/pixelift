import type { PixelData } from '../types.ts';
import type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';

export async function pixelift(
  input: PixeliftBrowserInput,
  options: PixeliftBrowserOptions = {}
): Promise<PixelData> {
  const decoder = await import('./decoder.ts');
  return await decoder.decode(input, options);
}

export type { PixeliftBrowserInput, PixeliftBrowserOptions } from './types.ts';