import type { ServerOptions, ServerInput } from './server';
import type { BrowserOptions, BrowserInput } from './browser';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface DecoderOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type PixeliftInput = BrowserInput | ServerInput; // Uses correct original names

export type PixeliftOptions = BrowserOptions | ServerOptions; // Correct union
