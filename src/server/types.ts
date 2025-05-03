import type { PixeliftSharedOptions } from '../types';

export type PixeliftServerInput = string | URL | File | Buffer | BufferSource;

export type { PixelData } from '../types';

export interface PixeliftServerOptions extends PixeliftSharedOptions {
  decoder?: 'sharp';
}
