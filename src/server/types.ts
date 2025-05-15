import type { CommonDecoderOptions } from '../types';
import type { SharpOptions } from 'sharp';

export type ServerInput = string | URL | Buffer | BufferSource;

export interface ServerOptions extends CommonDecoderOptions, SharpOptions {
  decoder?: 'sharp';
}
