import type { BrowserOptions } from '../types';
import { createArrayBuffer } from '../blob';

export function blobFromArrayBuffer(data: BufferSource, options?: BrowserOptions): Blob {
  const buffer = createArrayBuffer(data);
  return new Blob([buffer], { type: options?.type });
}
