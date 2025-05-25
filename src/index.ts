import type {
  CommonDecoderOptions,
  PixelData,
  PixeliftInput,
  PixeliftOptions
} from '@/types';
import type { BrowserInput, BrowserOptions } from './browser';
import type { ServerInput, ServerOptions } from '@/server';
import { isBrowser } from '@/shared/env';

/**
 * Interface representing a generic decoder that processes input data and outputs decoded pixel data.
 *
 * @template I - The type of input data, extending PixeliftInput.
 * @template O - The type of decoder options, extending CommonDecoderOptions.
 */
interface Decoder<I extends PixeliftInput, O extends CommonDecoderOptions> {
  decode: (input: I, options?: O) => Promise<PixelData>;
}

/**
 * Defines the configuration for an environment-specific pixel processing pipeline.
 *
 * @template I - The expected input type for the environment.
 * @template O - The option type for the decoder.
 */
export interface EnvironmentConfig<I extends PixeliftInput, O extends PixeliftOptions> {
  validate: (input: unknown) => Promise<boolean>;
  load: () => Promise<Decoder<I, O>>;
  expectedInputTypes: string[];
}

/**
 * Configuration for browser environment pixel processing.
 */
export const browserConfig: EnvironmentConfig<BrowserInput, BrowserOptions> = {
  validate: async (input: unknown): Promise<boolean> => {
    if (typeof input === 'string') {
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    }
    return (
      input instanceof URL ||
      input instanceof Blob ||
      input instanceof ReadableStream ||
      input instanceof ArrayBuffer ||
      ArrayBuffer.isView(input) ||
      input instanceof SVGElement ||
      input instanceof HTMLImageElement ||
      input instanceof HTMLVideoElement
    );
  },
  load: () => import('./browser/decoder'),
  expectedInputTypes: [
    'string (valid URL)',
    'URL',
    'Blob',
    'ReadableStream',
    'ArrayBuffer',
    'ArrayBufferView',
    'SVGElement',
    'HTMLImageElement',
    'HTMLVideoElement'
  ]
};

/**
 * Configuration for server environment pixel processing.
 */
export const serverConfig: EnvironmentConfig<ServerInput, ServerOptions> = {
  validate: async (input) =>
    typeof input === 'string' ||
    input instanceof URL ||
    input instanceof Buffer ||
    input instanceof ArrayBuffer ||
    ArrayBuffer.isView(input) ||
    (await import('@/server/utils').then((u) => u.isNodeReadable(input))) ||
    (await import('@/server/utils').then((u) => u.isNodeBuffer(input))),
  load: () => import('./server/decoder'),
  expectedInputTypes: [
    'string (URL or file path)',
    'URL',
    'Buffer',
    'ArrayBuffer',
    'ArrayBufferView',
    'Readable',
    'ReadableStream'
  ]
};

let browserDecoderPromise: Promise<Decoder<BrowserInput, BrowserOptions>> | null = null;
let serverDecoderPromise: Promise<Decoder<ServerInput, ServerOptions>> | null = null;

export async function pixelift(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  const isB = isBrowser();
  const config = isB ? browserConfig : serverConfig;

  // Validate
  if (!(await config.validate(input))) {
    throw new TypeError(
      `Invalid input type for ${isB ? 'browser' : 'server'} environment. ` +
        `Expected one of: ${config.expectedInputTypes.join(', ')}. ` +
        `Received: ${typeof input}`
    );
  }

  // Load
  const decoderPromise = isB
    ? (browserDecoderPromise ??= browserConfig.load())
    : (serverDecoderPromise ??= serverConfig.load());

  const decoder = await decoderPromise;

  // Decode
  return decoder.decode(input as never, options as never);
}
