import type { DecoderOptions } from '../types';

export type ServerInput = string | URL | File | Buffer | BufferSource;

export type { PixelData } from '../types';

export interface ServerOptions extends DecoderOptions {
  decoder?: 'sharp';
}
