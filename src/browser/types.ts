import type { CommonDecoderOptions } from '../types.ts';

export type BrowserInput =
  | string
  | URL
  | Blob
  | ReadableStream
  | ArrayBuffer
  | ArrayBufferView
  | SVGElement
  | HTMLImageElement
  | HTMLVideoElement;

export interface BrowserOptions extends CommonDecoderOptions {
  decoder?: 'canvas';
}
