import type { PixeliftSharedOptions } from '../types';

export type PixeliftBrowserInput = string | URL | File | ImageBitmapSource;

export type { PixelData } from '../types';

export type BrowserDecodeStrategy = 'webCodecs' | 'offscreenCanvas' | 'webgl';

export interface PixeliftBrowserOptions extends PixeliftSharedOptions {
  strategy?: BrowserDecodeStrategy;
}
