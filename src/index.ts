import { validateBrowserInput, validateServerInput } from './shared/validation';
import { isServer } from './shared/env';
import { createError } from './shared/error';
import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import type { ServerInput, ServerOptions } from './server/types';
import type { BrowserInput, BrowserOptions } from './browser/types';
import type { Decoder } from './browser/decoder/types';

interface EnvironmentConfig<In, Opts> {
  validate: (input: unknown) => input is In;
  importDecoder: () => Promise<Decoder<Opts>>;
  errorMessage: string;
}

const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
  validate: validateBrowserInput,
  importDecoder: () => import('./browser/decoder') as Promise<Decoder<BrowserOptions>>,
  errorMessage: 'Invalid input type for browser-side decoding.'
};

const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: validateServerInput,
  importDecoder: () => import('./server/decoder') as Promise<Decoder<ServerOptions>>,
  errorMessage: 'Invalid input type for server-side decoding.'
};

/**
 * Main Pixelift decoding function – runs in Node or browser.
 */
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
  options: PixeliftOptions = {}
): Promise<PixelData> {
  const isServerEnvironment = isServer();

  const config = isServerEnvironment ? serverConfig : browserConfig;

  if (!config.validate(input)) {
    throw createError.invalidInput(config.errorMessage, typeof input);
  }

  try {
    const decoder = await config.importDecoder();
    return decoder.decode(input as never, options as never);
  } catch (error) {
    throw createError.decodingFailed(
      'Pixelift decoding failed',
      config.errorMessage,
      error
    );
  }
}

export { unpackPixels, packPixels } from './shared/conversion';

export type { PixeliftInput, PixeliftOptions, PixelData } from './types';
