import { isBrowser } from './shared/env';
import { createError } from './shared/error';
import type { DecoderOptions, PixelData, PixeliftInput, PixeliftOptions } from './types';
import type { ServerInput, ServerOptions } from './server';
import type { BrowserInput, BrowserOptions } from './browser';
import { validateBrowserInput, validateServerInput } from './shared/validation';

interface Decoder<Input extends PixeliftInput, Options extends DecoderOptions> {
  decode: (input: Input, options?: Options) => Promise<PixelData>;
}

export interface EnvironmentConfig<I extends PixeliftInput, O extends PixeliftOptions> {
  validate: (input: unknown) => input is I;
  importDecoder: () => Promise<Decoder<I, O>>;
  expected: string;
}

export const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
  validate: validateBrowserInput,
  expected:
    'string, URL, Blob, SVGElement, HTMLImageElement, HTMLVideoElement or VideoFrame',
  importDecoder: () => import('./browser/decoder')
};

export const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: validateServerInput,
  expected: 'string, URL, Buffer or BufferSource',
  importDecoder: () => import('./server/decoder')
};

export async function pixelift(
  input: BrowserInput,
  options?: BrowserOptions
): Promise<PixelData>;
export async function pixelift(
  input: ServerInput,
  options?: ServerOptions
): Promise<PixelData>;
export async function pixelift(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  const config = isBrowser() ? browserConfig : serverConfig;

  if (!config.validate(input)) {
    throw createError.invalidInput(config.expected, typeof input);
  }

  try {
    const decoder = await config.importDecoder();
    return decoder.decode(input as never, options as never);
  } catch (error) {
    throw createError.rethrow(error);
  }
}

export { argbFromRgbaBytes, rgbaBytesFromArgb } from './shared/conversion';

export { type ErrorCode, PixeliftError } from './shared/error';

export type { PixeliftInput, PixeliftOptions, PixelData } from './types';
