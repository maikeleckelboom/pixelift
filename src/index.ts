import type { PixelData, Pixelift } from './types.ts';
import { isNode } from './core/env.ts';

// DecoderRegistry.registerFactory(JpegFactory);
// DecoderRegistry.registerFactory(PngFactory);
// DecoderRegistry.registerFactory(SharpFactory);
// DecoderRegistry.registerFactory(GifFactory);

let pixeliftImpl: Pixelift | undefined;


export async function pixelift(...args: Parameters<Pixelift>): Promise<PixelData> {
  if (isNode()) {
    const { pixelift: pixeliftNode } = await import('./node');
    pixeliftImpl = pixeliftNode as Pixelift
  } else {
    const { pixelift: pixeliftBrowser } = await import('./browser');
    pixeliftImpl = pixeliftBrowser as Pixelift;
  }
  return pixeliftImpl(...args);
}