import type { BrowserInput, BrowserOptions } from '@/browser';
import type { ServerInput, ServerOptions } from '@/server';
import type { StreamToBlobOptions } from '@/shared/stream-to-blob.ts';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface CommonDecoderOptions extends StreamToBlobOptions {
  decoder?: string;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
