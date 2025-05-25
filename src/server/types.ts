import type { CommonDecoderOptions } from '../types.ts';
import type { Readable } from 'node:stream';

export type ServerInput =
  | string
  | URL
  | Buffer
  | ArrayBufferView
  | ArrayBuffer
  | Readable
  | ReadableStream;

export interface ServerOptions extends CommonDecoderOptions {
  decoder?: 'sharp';
}

export type ServerPreparedInput = Exclude<ServerInput, string | URL>;
