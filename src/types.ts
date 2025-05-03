import type { ServerOptions, ServerInput } from './server/types';
import type { BrowserOptions, BrowserInput } from './browser/types';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface DecoderOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
