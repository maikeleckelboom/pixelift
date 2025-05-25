import type { CommonDecoderOptions } from '../types';

export type BrowserInput =
  | string
  | URL
  | Blob
  | Response
  | ReadableStream
  | ArrayBuffer
  | ArrayBufferView
  | SVGElement
  | ImageBitmapSource;

export interface BrowserOptions extends CommonDecoderOptions {
  decoder?: 'offscreen-canvas';
}

export type BrowserPreparedInput = Exclude<
  BrowserInput,
  string | URL | SVGElement | HTMLImageElement | HTMLVideoElement
>;
