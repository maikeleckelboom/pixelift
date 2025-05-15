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
  expected:
    'string, URL, Blob, SVGElement, HTMLImageElement, HTMLVideoElement or VideoFrame',
  importDecoder: () => import('../browser/decoder')
};

export const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: validateServerInput,
  expected: 'string, URL, Buffer or BufferSource',
  importDecoder: () => import('../server/decoder')
};
