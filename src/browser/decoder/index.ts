import { createError } from '../../shared/error';
import type { PixelData } from '../../types';
import type { BrowserInput, BrowserOptions } from '../types';
import { guessInputMimeType } from '../../shared/file-type';
import * as WebCodecsDecoder from './webcodecs';

const canvasDecoderPromise: Promise<typeof import('./canvas')> = import('./canvas');

const supportPromiseCache: Map<string, Promise<boolean>> = new Map();

function isWebCodecsSupported(mime: string): Promise<boolean> {
  if (!supportPromiseCache.has(mime)) {
    const promise = WebCodecsDecoder.isSupported(mime).catch((err) => {
      supportPromiseCache.delete(mime);
      throw err;
    });
    supportPromiseCache.set(mime, promise);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return supportPromiseCache.get(mime)!;
}

type DecoderOption = 'auto' | 'webCodecs' | 'offscreenCanvas';

/**
 * Extended options to carry MIME type into strategies
 */
interface DecodeOptions extends BrowserOptions {
  readonly type: string;
  readonly onDecodeStart?: (type: string, decoder: DecoderOption) => void;
  readonly onDecodeEnd?: (
    type: string,
    decoder: DecoderOption,
    duration: number,
    error?: Error
  ) => void;
}

type DecoderStrategy = (input: BrowserInput, options: DecodeOptions) => Promise<PixelData>;

const strategies: Record<DecoderOption, DecoderStrategy> = {
  async webCodecs(input, options) {
    const { type, onDecodeStart, onDecodeEnd } = options;
    onDecodeStart?.(type, 'webCodecs');
    const startTime = performance.now();

    try {
      const result = await WebCodecsDecoder.decode(input, options);
      onDecodeEnd?.(type, 'webCodecs', performance.now() - startTime);
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      onDecodeEnd?.(type, 'webCodecs', performance.now() - startTime, err);
      return strategies.offscreenCanvas(input, options);
    }
  },

  async offscreenCanvas(input, options) {
    const { type, onDecodeStart, onDecodeEnd } = options;
    onDecodeStart?.(type, 'offscreenCanvas');
    const startTime = performance.now();
    const module = await canvasDecoderPromise;
    try {
      const result = await module.decode(input, options);
      onDecodeEnd?.(type, 'offscreenCanvas', performance.now() - startTime);
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      onDecodeEnd?.(type, 'offscreenCanvas', performance.now() - startTime, err);
      throw err;
    }
  },

  async auto(input, opts) {
    try {
      const supported = await isWebCodecsSupported(opts.type);
      if (supported) {
        return strategies.webCodecs(input, opts);
      }
    } catch {
      // → support check failed, fallback to Canvas
    }
    return strategies.offscreenCanvas(input, opts);
  }
};

export async function decode(
  input: BrowserInput,
  options: BrowserOptions = {}
): Promise<PixelData> {
  const type = options.type ?? guessInputMimeType(input);

  if (typeof type !== 'string' || type.trim() === '') {
    throw createError.invalidInput(
      'Unsupported input type for decoder',
      input?.constructor?.name ?? typeof input
    );
  }

  const decoderOption = options.decoder ?? 'auto';

  if (!['auto', 'webCodecs', 'offscreenCanvas'].includes(decoderOption)) {
    throw createError.invalidOption(
      Object.keys(strategies).join(', '),
      decoderOption,
      'decoder'
    );
  }

  return strategies[decoderOption](input, { ...options, type });
}
