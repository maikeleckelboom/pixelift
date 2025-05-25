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
  /**
   * Validates whether the input is acceptable for the environment.
   * @param input - The input to validate.
   * @returns A promise is resolving to `true` if valid, `false` otherwise.
   */
  validate: (input: unknown) => Promise<boolean>;

  /**
   * Loads the environment-specific decoder.
   * @returns A promise resolving to the decoder instance.
   */
  load: () => Promise<Decoder<I, O>>;

  /**
   * List of human-readable input type names for error messaging.
   */
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

// Cache decoder promises to optimize performance
let browserDecoderPromise: Promise<Decoder<BrowserInput, BrowserOptions>> | null = null;
let serverDecoderPromise: Promise<Decoder<ServerInput, ServerOptions>> | null = null;

/**
 * Processes pixel data from an input source, adapting to the runtime environment (browser or server).
 *
 * @param input - The data to process, validated against environment-specific types.
 * @param options - Optional settings to customize decoding behavior.
 * @returns A promise resolving to the processed pixel data.
 * @throws {TypeError} If the input type is invalid for the current environment.
 *
 * @example
 * // Browser usage
 * const pixelData = await pixelift('https://example.com/image.png');
 *
 * @example
 * // Server usage
 * const pixelData = await pixelift('/path/to/image.png');
 */
export async function pixelift(
  input: PixeliftInput,
  options?: PixeliftOptions
): Promise<PixelData> {
  if (isBrowser()) {
    if (!(await browserConfig.validate(input))) {
      throw new TypeError(
        `Invalid input type for browser environment. Expected one of: ${browserConfig.expectedInputTypes.join(', ')}. Received: ${typeof input}`
      );
    }
    browserDecoderPromise ??= browserConfig.load();
    const decoder = await browserDecoderPromise;
    return decoder.decode(input as BrowserInput, options as BrowserOptions);
  } else {
    if (!(await serverConfig.validate(input))) {
      throw new TypeError(
        `Invalid input type for server environment. Expected one of: ${serverConfig.expectedInputTypes.join(', ')}. Received: ${typeof input}`
      );
    }
    serverDecoderPromise ??= serverConfig.load();
    const decoder = await serverDecoderPromise;
    return decoder.decode(input as ServerInput, options as ServerOptions);
  }
}
