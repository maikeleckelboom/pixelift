import type { DecoderOptions } from '../types';

type ImageDecoderOptions = ImageEncodeOptions & ImageDecodeOptions;

export interface BrowserOptions extends DecoderOptions, ImageDecoderOptions {
  decoder?: 'offscreenCanvas' | 'webCodecs';
  width?: number;
  height?: number;
  targetTime?: number;
}

export type BrowserInput = string | URL | Blob | ImageData | CanvasImageSource;
