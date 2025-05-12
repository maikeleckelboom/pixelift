import { isServer } from './shared/env';
import { createError } from './shared/error';
import { browserConfig, serverConfig } from './shared/config';
import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import type { ServerInput, ServerOptions } from './server';
import type { BrowserInput, BrowserOptions } from './browser';

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
  const config = isServer() ? serverConfig : browserConfig;

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
