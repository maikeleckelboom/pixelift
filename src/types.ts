import type { BrowserInput, BrowserOptions } from '@/browser';
import type { ServerInput, ServerOptions } from './server';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface CommonDecoderOptions {
  signal?: AbortSignal;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
