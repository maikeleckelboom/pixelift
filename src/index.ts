import { isBrowser } from './shared/env';
import { createError } from './shared/error';
import { browserConfig, serverConfig } from './shared/config';
import type { PixelData, PixeliftInput, PixeliftOptions } from './types';
import type { ServerInput, ServerOptions } from './server';
import type { BrowserInput, BrowserOptions } from './browser';

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
