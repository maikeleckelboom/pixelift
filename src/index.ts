import { validateBrowserInput, validateServerInput } from './shared/validation';
import { isServer } from './shared/env';
import { createError } from './shared/error';
import {
  PIXELIFT_BROWSER_DECODERS,
  PIXELIFT_SERVER_DECODERS,
  type PixeliftDecoder
} from './shared/constants';
import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import type { ServerInput, ServerOptions } from './server/types';
import type { BrowserInput, BrowserOptions } from './browser/types';
import type { Decoder } from './browser/decoder/types';

interface EnvironmentConfig<I extends PixeliftInput, O extends PixeliftOptions> {
  validate: (input: unknown) => input is I;
  importDecoder: () => Promise<Decoder<I, O>>;
  errorMessage: string;
}

const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
  validate: validateBrowserInput,
  importDecoder: () => import('./browser/decoder'),
  errorMessage: 'Invalid input type for browser-side decoding.'
};

const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: validateServerInput,
  importDecoder: () => import('./server/decoder'),
  errorMessage: 'Invalid input type for server-side decoding.'
};

/**
 * Processes pixel-based input data using a specific decoder and returns the resulting pixel data.
 *
 * @param {PixeliftInput} input - The pixel input data to be processed.
 * @param {PixeliftOptions} [options] - Optional configuration parameters for the decoding process.
 * @return {Promise<PixelData>} A promise that resolves to the processed pixel data.
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
  options?: PixeliftOptions
): Promise<PixelData> {
  const isNode = isServer();
  const config = isNode ? serverConfig : browserConfig;

  if (!config.validate(input)) {
    throw createError.invalidInput(config.errorMessage, typeof input);
  }

  if (options?.decoder && !validateDecoderOption(options.decoder, isNode)) {
    throw createError.decoderUnsupported(options.decoder);
  }

  try {
    const decoder = await config.importDecoder();
    return decoder.decode(input as never, options as never);
  } catch (error) {
    throw createError.rethrow(error);
  }
}

function validateDecoderOption(
  decoder: string | undefined,
  isServer: boolean
): decoder is PixeliftDecoder {
  if (!decoder) return true;

  const decoderList = Array.from(
    isServer ? PIXELIFT_SERVER_DECODERS : PIXELIFT_BROWSER_DECODERS
  );
  return decoderList.includes(decoder as PixeliftDecoder);
}

export { argbFromRgbaBytes, rgbaBytesFromArgb } from './shared/conversion';

export type { PixeliftInput, PixeliftOptions, PixelData } from './types';

export { ErrorCode, PixeliftError } from './shared/error';
