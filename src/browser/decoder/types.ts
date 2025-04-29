import type { PixelData, PixeliftOptions } from 'pixelift';

export interface DecoderStrategy {
  id: string;
  isSupported: (type: string) => Promise<boolean>;
  decode: (blob: Blob, options: PixeliftOptions) => Promise<PixelData>;
}
