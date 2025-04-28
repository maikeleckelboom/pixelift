import type { PixeliftOptions } from '../types.ts';

export type BufferLike = Buffer | BufferSource;

export type PixeliftServerInput = string | BufferLike;

export interface PixeliftServerOptions extends PixeliftOptions {}
