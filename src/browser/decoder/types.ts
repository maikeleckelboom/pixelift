import type { PixelData } from '../../types';
import type { BrowserOptions } from '../types';

export interface DecoderOptions {
  signal?: AbortSignal;
}

export interface Decoder<Input, Options extends DecoderOptions = BrowserOptions> {
  decode: (input: Input, options?: Options) => Promise<PixelData>;
}

export interface DecoderStrategy extends Decoder<Blob> {
  id: string;
  isSupported: (type: string) => Promise<boolean>;
}
