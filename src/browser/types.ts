import type { PixeliftSharedOptions } from '../types';

export type PixeliftBrowserInput = string | URL | File | ImageBitmapSource;

export type { PixelData } from '../types';

export interface PixeliftBrowserOptions extends PixeliftSharedOptions {
  strategy?: 'webCodecs' | 'offscreenCanvas';
  debug?: boolean;
}
