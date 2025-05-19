import type { CommonDecoderOptions } from '../types';
import type { Readable } from 'node:stream';

export type ServerInput = string | URL | Buffer | BufferSource | Readable | ReadableStream;

export interface ServerOptions extends CommonDecoderOptions {
  decoder?: 'sharp';
}
