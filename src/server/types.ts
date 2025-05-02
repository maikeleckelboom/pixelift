import type { PixeliftSharedOptions } from '../types';

export type PixeliftServerInput = string | URL | File | Buffer | BufferSource;

export type { PixelData } from '../types';

export type ServerDecoder = 'sharp';

export interface PixeliftServerOptions extends PixeliftSharedOptions {
  decoder?: ServerDecoder;
}
