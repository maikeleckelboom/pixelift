import type { DecoderOptions } from '../types';

export interface BrowserOptions extends DecoderOptions {
  decoder?: 'webCodecs' | 'offscreenCanvas';
}

export type BrowserInput = string | URL | File | ImageBitmapSource;

export type { PixelData } from '../types';
