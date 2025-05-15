import type { ServerOptions, ServerInput } from './server';
import type { BrowserOptions, BrowserInput } from './browser';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface CommonDecoderOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
