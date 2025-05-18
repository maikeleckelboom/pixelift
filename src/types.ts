import type { ServerInput, ServerOptions } from './server';
import type { BrowserInput, BrowserOptions } from './browser';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace?: PredefinedColorSpace;
}

export interface CommonDecoderOptions {
  /** Custom headers for any HTTP fetch used internally. */
  headers?: HeadersInit;
  /** AbortSignal to cancel the decode/fetch. */
  signal?: AbortSignal;
  /**
   * How to handle credentials on fetch calls.
   * @default 'same-origin'
   */
  credentials?: RequestCredentials;
  /**
   * The `mode` property of the Request interface.
   * @default 'cors'
   */
  mode?: RequestMode;
}

export type PixeliftInput = BrowserInput | ServerInput;

export type PixeliftOptions = BrowserOptions | ServerOptions;
