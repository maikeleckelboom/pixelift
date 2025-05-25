import type { PixeliftInput } from '@/types.ts';

type NormalizedInput = BufferSource | Blob | ReadableStream;

export function normalizeInput(input: PixeliftInput): NormalizedInput {
  if (input instanceof Blob) {
    return input;
  } else if (input instanceof ReadableStream) {
    return input;
  } else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return input;
  } else if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  } else {
    throw new TypeError('Unsupported input type');
  }
}
