import { validateBrowserInput, validateServerInput } from './validation';
import type { BrowserInput, BrowserOptions } from '../browser';
import type { ServerInput, ServerOptions } from '../server';
import type { PixeliftInput, PixeliftOptions } from '../types';
import type { Decoder } from '../browser/decoder/types';

export interface EnvironmentConfig<I extends PixeliftInput, O extends PixeliftOptions> {
  validate: (input: unknown) => input is I;
  importDecoder: () => Promise<Decoder<I, O>>;
  expected: string;
}

export const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
  validate: validateBrowserInput,
  importDecoder: () => {
    console.log('🧪 🌐 Loading browser decoder (debug)');
    return import('../browser/decoder');
  },
  expected:
    'string, URL, Blob, File, ImageData, ArrayBuffer, ArrayBufferView, ReadableStream<Uint8Array>, HTMLOrSVGImageElement, HTMLVideoElement, HTMLCanvasElement, ImageBitmap, OffscreenCanvas or VideoFrame'
};

export const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: validateServerInput,
  importDecoder: () => {
    console.log('🧪 🖥️ Loading server decoder (debug)');
    return import('../server/decoder');
  },
  expected: 'string, URL, Buffer or BufferSource'
};
