import type { PixelData, Pixelift } from './types.ts';
import { isNode } from './core/env.ts';
import { DecoderRegistry } from './node/decoders/registry.ts';
import { SharpFactory } from './node/decoders/factories/sharp.ts';

export async function pixelift(...args: Parameters<Pixelift>): Promise<PixelData> {
  if (isNode()) {
    const { pixelift: nodeImpl } = await import('./node');
    return nodeImpl(...(args as Parameters<typeof nodeImpl>));
  } else {
    const { pixelift: browserImpl } = await import('./browser');
    return browserImpl(...(args as Parameters<typeof browserImpl>));
  }
}

export { DecoderRegistry, SharpFactory };

export { packPixels, unpackPixels } from './core/conversion.ts';
