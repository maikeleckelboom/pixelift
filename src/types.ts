import type { PixeliftServerInput } from './server';

import type { PixeliftBrowserInput } from './browser';

export interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type PixeliftInput = PixeliftBrowserInput | PixeliftServerInput;

export interface PixeliftOptions {
  width?: number;
  height?: number;
}
