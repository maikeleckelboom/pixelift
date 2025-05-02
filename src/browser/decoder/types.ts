import type { PixelData } from 'pixelift';
import type { PixeliftBrowserOptions } from '../types';

export interface DecoderStrategy {
  id: string;
  isSupported: (type: string) => Promise<boolean>;
  decode: (blob: Blob, options: PixeliftBrowserOptions) => Promise<PixelData>;
}
