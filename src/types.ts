import type { BrowserInput, BrowserOptions } from '@/browser';
import type { ServerInput, ServerOptions } from './server';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface CommonDecoderOptions {
  signal?: AbortSignal;
  type?: string; // MIME type for the input
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;

export interface PixelDecoder<Input = unknown, Options = unknown> {
  name: string;
  priority?: number; // Higher = more preferred
  canHandle(input: unknown): Promise<boolean> | boolean;

  decode(input: Input, options?: Options): Promise<PixelData>;
}
