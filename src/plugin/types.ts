import type { PixelData, PixeliftInput, PixeliftOptions } from '@/types';

export interface PixelDecoderMetadata {
  version?: string;
  runtimes?: ('browser' | 'node' | 'worker' | 'edge')[];
  types?: string[];
  description?: string;
}

export interface PixelDecoder {
  name: string;
  priority?: number;
  metadata?: PixelDecoderMetadata;

  canHandle(input: unknown, options?: PixeliftOptions): Promise<boolean>;

  decode(input: PixeliftInput, options?: PixeliftOptions): Promise<PixelData>;
}
