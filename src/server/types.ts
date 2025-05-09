import type { DecoderOptions } from '../types';

export interface ServerOptions extends DecoderOptions {
  decoder?: 'sharp';
}

export type ServerInput = string | URL | Buffer | BufferSource;
