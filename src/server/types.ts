import type { DecoderOptions } from '../types';
import type { SharpOptions } from 'sharp';

export interface ServerOptions extends DecoderOptions, SharpOptions {
  decoder?: 'sharp';
}

export type ServerInput = string | URL | Buffer | BufferSource;
