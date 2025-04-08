import type { PixelData } from '../../types.ts';

export interface Decoder {
  decode(buffer: Uint8Array | Uint8ClampedArray | Buffer, options?: Record<string, unknown>): Promise<PixelData>;
}

export interface DecoderFactory {
  readonly name: string;
  readonly formats: string[];
  readonly priority: number; // Higher = better
  readonly dependencies?: string[]; // Package dependencies
  create(): Promise<Decoder>;
}
