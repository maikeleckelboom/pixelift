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
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  crop?: CropOptions;
}

export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
