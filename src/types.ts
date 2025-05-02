import type { PixeliftServerInput, PixeliftServerOptions } from './server';
import type { PixeliftBrowserInput } from './browser';
import type { PixeliftBrowserOptions } from './browser/types';

export type PixeliftInput = PixeliftBrowserInput | PixeliftServerInput;

export interface PixeliftSharedOptions {
  width?: number;
  height?: number;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export type PixeliftOptions = PixeliftBrowserOptions & PixeliftServerOptions;

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}
