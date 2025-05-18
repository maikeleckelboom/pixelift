import type { BrowserOptions, OffscreenCanvasDecoderOptions } from './types';

export function isOffscreenCanvasDecoder(
  options?: BrowserOptions
): options is OffscreenCanvasDecoderOptions {
  return options?.decoder === 'offscreenCanvas';
}

export function isArrayBuffer(data: BufferSource): data is ArrayBuffer {
  return data instanceof ArrayBuffer;
}
