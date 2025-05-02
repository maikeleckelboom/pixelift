import type { PixeliftServerInput, PixeliftServerOptions } from './server';
import type { PixeliftBrowserOptions, PixeliftBrowserInput } from './browser/types';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface PixeliftSharedOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type PixeliftInput = PixeliftBrowserInput | PixeliftServerInput;

export type PixeliftOptions = PixeliftBrowserOptions | PixeliftServerOptions;
