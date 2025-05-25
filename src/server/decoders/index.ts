import type { ServerInput, ServerOptions } from '@/server';
import type { PixelData } from '@/types';

export async function decode(
  input: ServerInput,
  options?: ServerOptions
): Promise<PixelData> {
  return {
    data: new Uint8ClampedArray(),
    width: 0,
    height: 0
  };
}
