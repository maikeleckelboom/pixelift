import type { PixelDecoder } from '../types.ts';
import type { PixeliftInput } from '@/types.ts';

const decoders: PixelDecoder[] = [];

export function registerDecoder(decoder: PixelDecoder): void {
  if (!decoders.find((d) => d.name === decoder.name)) {
    decoders.push(decoder);
  }
}

export function getDecoders(): PixelDecoder[] {
  return [...decoders];
}

function sortByPriority(decoders: PixelDecoder[]): PixelDecoder[] {
  return decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export async function resolveDecoder(input: PixeliftInput): Promise<PixelDecoder> {
  for (const decoder of sortByPriority(decoders)) {
    if (await decoder.canHandle(input)) {
      return decoder;
    }
  }

  throw new Error(`No suitable decoder found for input type: ${typeof input}`);
}
