import { getDecoders } from '@/plugin/registry.ts';
import type { PixelDecoder } from '@/plugin/types.ts';
import * as path from 'node:path';

function matchExtension(decoder: PixelDecoder, ext: string) {
  return decoder.metadata?.supportedMimes?.includes(ext.toLowerCase());
}

export async function resolveDecoderForFile(file: File | string) {
  const ext =
    typeof file === 'string' ? path.extname(file) : (file.name.split('.').pop() ?? '');

  const decoders = getDecoders().filter((d) => matchExtension(d, ext));

  if (decoders.length === 0) {
    throw new Error(`No decoders found for file extension: ${ext}`);
  }

  decoders.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return decoders[0];
}

export function isTransferable(value: any): value is Transferable {
  return (
    value instanceof ArrayBuffer ||
    value instanceof MessagePort ||
    value instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas)
  );
}

export function toTransferable(value: any): Transferable | Transferable[] | null {
  if (isTransferable(value)) {
    return value;
  } else if (Array.isArray(value) && value.every(isTransferable)) {
    return value;
  }
  return null;
}
